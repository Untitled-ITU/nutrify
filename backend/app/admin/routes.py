from flask_openapi3 import APIBlueprint, Tag

from extensions import db
from ..auth.models import User
from ..auth.schemas import UnauthorizedResponse
from ..decorators import admin_required
from .schemas import (
    UserIdPath, AdminResetPasswordBody, UsersListResponse,
    ChangeRoleBody, MessageResponse
)


admin_tag = Tag(name="Admin", description="Admin-only user management endpoints")
admin_bp = APIBlueprint(
    'admin_bp', __name__, url_prefix='/api/admin',
    abp_security=[{"jwt": []}],
    abp_responses={"401": UnauthorizedResponse}
)


@admin_bp.put('/users/<int:user_id>/reset-password', tags=[admin_tag],
    responses={"200": MessageResponse, "404": MessageResponse})
@admin_required
def reset_user_password(path: UserIdPath, body: AdminResetPasswordBody):
    user_to_reset = db.session.get(User, path.user_id)

    if not user_to_reset:
        return {"msg": "User not found"}, 404

    user_to_reset.set_password(body.new_password)
    db.session.commit()

    return {"msg": f"Password for user {user_to_reset.email} has been reset successfully"}, 200


@admin_bp.get('/users', tags=[admin_tag], responses={"200": UsersListResponse})
@admin_required
def get_all_users():
    users = User.query.all()

    users_list = [
        {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "role": user.role
        }
        for user in users
    ]

    return {"users": users_list}, 200


@admin_bp.put('/users/<int:user_id>/change-role', tags=[admin_tag],
    responses={"200": MessageResponse, "404": MessageResponse})
@admin_required
def change_user_role(path: UserIdPath, body: ChangeRoleBody):
    user = db.session.get(User, path.user_id)
    if not user:
        return {"msg": "User not found"}, 404

    if user.role == body.role:
        return {"msg": f"User already has the '{body.role}' role"}, 200

    user.role = body.role
    db.session.commit()

    return {"msg": f"User {user.email} role updated to {body.role}"}, 200


@admin_bp.delete('/users/<int:user_id>', tags=[admin_tag],
    responses={"200": MessageResponse, "403": MessageResponse, "404": MessageResponse})
@admin_required
def delete_user(path: UserIdPath):
    user = db.session.get(User, path.user_id)
    if not user:
        return {"msg": "User not found"}, 404

    if user.role == 'admin':
        return {"msg": "Cannot delete admin account"}, 403

    db.session.delete(user)
    db.session.commit()

    return {"msg": f"User {user.email} has been deleted"}, 200
