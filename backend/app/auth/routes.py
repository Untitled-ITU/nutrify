from datetime import datetime, timezone, timedelta

from flask_openapi3 import APIBlueprint, Tag
from flask_jwt_extended import create_access_token, get_jwt_identity
from werkzeug.security import generate_password_hash

from ...extensions import db
from ..decorators import login_required
from .email_service import send_verification_email, send_reset_code_email
from .models import User, VerificationCode
from .schemas import (
    LoginBody, LoginResponse, RegisterBody, RegisterResponse,
    VerifyRegistrationBody, MessageResponse, ProfileResponse,
    UpdateProfileBody, ChangePasswordBody, ForgotPasswordBody,
    ForgotPasswordResponse, ResetPasswordBody
)


auth_tag = Tag(name="Authentication", description="User authentication and registration")
auth_bp = APIBlueprint('auth', __name__, url_prefix='/api/auth', abp_tags=[auth_tag])


@auth_bp.post('/login', responses={"200": LoginResponse, "401": MessageResponse})
def login(body: LoginBody):
    user = User.query.filter_by(email=body.email).first()

    if user and user.check_password(body.password):
        access_token = create_access_token(
            identity=user.email,
            additional_claims={"role": user.role, "username": user.username}
        )
        return {"access_token": access_token}, 200
    else:
        return {"msg": "Bad email or password"}, 401


@auth_bp.post('/register',
    responses={"200": RegisterResponse, "409": MessageResponse, "500": MessageResponse})
def register(body: RegisterBody):
    if User.query.filter_by(email=body.email).first():
        return {"msg": "Email already registered"}, 409

    code = VerificationCode.generate_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    VerificationCode.query.filter_by(email=body.email, purpose='registration', used=False).delete()

    verification = VerificationCode(
        email=body.email,
        code=code,
        purpose='registration',
        expires_at=expires_at,
        pending_username=body.username,
        pending_password_hash=generate_password_hash(body.password),
        pending_role=body.role
    )

    db.session.add(verification)
    db.session.commit()

    if send_verification_email(body.email, code):
        return {
            "msg": "Verification code sent to your email",
            "email": body.email
        }, 200
    else:
        return {"msg": "Failed to send verification email. Please try again."}, 500


@auth_bp.post('/verify-registration', responses={"201": MessageResponse, "400": MessageResponse})
def verify_registration(body: VerifyRegistrationBody):
    verification = VerificationCode.query.filter_by(
        email=body.email,
        code=body.code,
        purpose='registration',
        used=False
    ).first()

    if not verification:
        return {"msg": "Invalid or expired verification code"}, 400

    if not verification.is_valid():
        return {"msg": "Verification code has expired"}, 400

    new_user = User(
        email=body.email,
        username=verification.pending_username,
        role=verification.pending_role
    )
    new_user.password_hash = verification.pending_password_hash
    verification.used = True

    db.session.add(new_user)
    db.session.commit()

    return {"msg": f"User '{body.email}' registered successfully"}, 201


@auth_bp.get('/profile',
    responses={"200": ProfileResponse, "404": MessageResponse}, security=[{"jwt": []}])
@login_required
def get_profile():
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user:
        return {"msg": "User not found"}, 404

    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "role": user.role
    }, 200


@auth_bp.put('/profile',
    responses={"200": MessageResponse, "404": MessageResponse}, security=[{"jwt": []}])
@login_required
def update_profile(body: UpdateProfileBody):
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user:
        return {"msg": "User not found"}, 404

    if body.username:
        if body.username == user.username:
            return {"msg": "This is already your username"}, 200
        user.username = body.username

    db.session.commit()

    return {"msg": "Profile updated successfully"}, 200


@auth_bp.post('/change-password',
    responses={"200": MessageResponse, "400": MessageResponse, "401": MessageResponse, "404": MessageResponse},
    security=[{"jwt": []}])
@login_required
def change_password(body: ChangePasswordBody):
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user:
        return {"msg": "User not found"}, 404

    if body.current_password == body.new_password:
        return {"msg": "New password must be different from current password"}, 400

    if not user.check_password(body.current_password):
        return {"msg": "Incorrect current password"}, 401

    user.set_password(body.new_password)
    db.session.commit()

    return {"msg": "Password updated successfully"}, 200


@auth_bp.post('/forgot-password', responses={"200": ForgotPasswordResponse, "404": MessageResponse})
def forgot_password(body: ForgotPasswordBody):
    user = User.query.filter_by(email=body.email).first()
    if not user:
        return {"msg": "Email not found"}, 404

    code = VerificationCode.generate_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    VerificationCode.query.filter_by(
        email=body.email, purpose='password_reset', used=False
    ).delete()

    verification = VerificationCode(
        email=body.email,
        code=code,
        purpose='password_reset',
        expires_at=expires_at
    )

    db.session.add(verification)
    db.session.commit()

    send_reset_code_email(body.email, code)

    return {
        "msg": "Verification code sent to your email",
        "email": body.email
    }, 200


@auth_bp.post('/reset-password',
    responses={"200": MessageResponse, "400": MessageResponse, "404": MessageResponse})
def reset_password(body: ResetPasswordBody):
    verification = VerificationCode.query.filter_by(
        email=body.email,
        code=body.code,
        purpose='password_reset',
        used=False
    ).first()

    if not verification:
        return {"msg": "Invalid or expired verification code"}, 400

    if not verification.is_valid():
        return {"msg": "Verification code has expired"}, 400

    user = User.query.filter_by(email=body.email).first()
    if not user:
        return {"msg": "User not found"}, 404

    if user.check_password(body.new_password):
        return {"msg": "New password must be different from current password"}, 400

    user.set_password(body.new_password)
    verification.used = True

    db.session.commit()

    return {"msg": "Password reset successfully"}, 200
