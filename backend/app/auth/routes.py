from ...extensions import db
from .models import User, VerificationCode
from .email_service import send_verification_email, send_reset_code_email

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, get_jwt, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash

from datetime import datetime, timezone, timedelta


auth_bp = Blueprint('auth_bp', __name__, url_prefix='/api/auth')


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or "email" not in data or "password" not in data:
        return jsonify({"msg": "Email and password are required"}), 400

    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()

    if user and user.check_password(password):
        user_role = {"role": user.role}
        access_token = create_access_token(
            identity=user.email,
            additional_claims={"role": user.role, "username": user.username}
        )
        return jsonify(access_token=access_token)
    else:
        return jsonify({"msg": "Bad email or password"}), 401


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or "email" not in data or "password" not in data or "username" not in data:
        return jsonify({"msg": "Email, password, and username are required"}), 400

    email = data.get("email")
    password = data.get("password")
    username = data.get("username")
    role = data.get("role", "consumer")

    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "Email already registered"}), 409

    code = VerificationCode.generate_code()
    expiry_minutes = current_app.config.get('VERIFICATION_CODE_EXPIRY_MINUTES', 10)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expiry_minutes)

    VerificationCode.query.filter_by(email=email, purpose='registration', used=False).delete()

    verification = VerificationCode(
        email=email,
        code=code,
        purpose='registration',
        expires_at=expires_at,
        pending_username=username,
        pending_password_hash=generate_password_hash(password),
        pending_role=role
    )

    db.session.add(verification)
    db.session.commit()

    if send_verification_email(email, code):
        return jsonify({
            "msg": "Verification code sent to your email",
            "email": email
        }), 200
    else:
        return jsonify({"msg": "Failed to send verification email. Please try again."}), 500


@auth_bp.route('/verify-registration', methods=['POST'])
def verify_registration():
    data = request.get_json()
    if not data or "email" not in data or "code" not in data:
        return jsonify({"msg": "Email and verification code are required"}), 400

    email = data.get("email")
    code = data.get("code")

    verification = VerificationCode.query.filter_by(
        email=email,
        code=code,
        purpose='registration',
        used=False
    ).first()

    if not verification:
        return jsonify({"msg": "Invalid or expired verification code"}), 400

    if not verification.is_valid():
        return jsonify({"msg": "Verification code has expired"}), 400

    new_user = User(
        email=email,
        username=verification.pending_username,
        role=verification.pending_role
    )
    new_user.password_hash = verification.pending_password_hash

    verification.used = True

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"msg": f"User '{email}' registered successfully"}), 201


@auth_bp.route('/chef-only', methods=['GET'])
@jwt_required()
def chef_only_data():
    current_user_identity = get_jwt()
    current_user_role = current_user_identity.get("role")

    if current_user_role == "chef":
        return jsonify(message="Hello Chef!")
    else:
        return jsonify(message="You don't have permission to view this area!"), 403


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first_or_404()

    return jsonify(
        id=user.id,
        email=user.email,
        username=user.username,
        role=user.role
    ), 200


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first_or_404()
    data = request.get_json()

    if 'username' in data:
        new_username = data.get('username')

        if new_username == user.username:
            return jsonify({"msg": "This is already your username"}), 200

        user.username = new_username

    db.session.commit()

    return jsonify({"msg": "Profile updated successfully"}), 200


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user:
        return jsonify({"msg": "User not found"}), 404

    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not current_password or not new_password:
        return jsonify({"msg": "Current and new passwords are required"}), 400

    if current_password == new_password:
        return jsonify({"msg": "New password must be different from current password"}), 400

    if not user.check_password(current_password):
        return jsonify({"msg": "Incorrect current password"}), 401

    user.set_password(new_password)
    db.session.commit()

    return jsonify({"msg": "Password updated successfully"}), 200


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    if not data or "email" not in data:
        return jsonify({"msg": "Email is required"}), 400

    email = data.get("email")

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"msg": "Email not found"}), 404

    code = VerificationCode.generate_code()
    expiry_minutes = current_app.config.get('VERIFICATION_CODE_EXPIRY_MINUTES', 10)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expiry_minutes)

    VerificationCode.query.filter_by(email=email, purpose='password_reset', used=False).delete()

    verification = VerificationCode(
        email=email,
        code=code,
        purpose='password_reset',
        expires_at=expires_at
    )

    db.session.add(verification)
    db.session.commit()

    send_reset_code_email(email, code)

    return jsonify({
        "msg": "Verification code sent to your email",
        "email": email
    }), 200


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    if not data or "email" not in data or "code" not in data or "new_password" not in data:
        return jsonify({"msg": "Email, verification code, and new password are required"}), 400

    email = data.get("email")
    code = data.get("code")
    new_password = data.get("new_password")

    verification = VerificationCode.query.filter_by(
        email=email,
        code=code,
        purpose='password_reset',
        used=False
    ).first()

    if not verification:
        return jsonify({"msg": "Invalid or expired verification code"}), 400

    if not verification.is_valid():
        return jsonify({"msg": "Verification code has expired"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if user.check_password(new_password):
        return jsonify({"msg": "New password must be different from current password"}), 400

    user.set_password(new_password)
    verification.used = True

    db.session.commit()

    return jsonify({"msg": "Password reset successfully"}), 200
