from flask import Blueprint, request, jsonify
from ...extensions import db
from ..auth.models import User
from ..decorators import admin_required

admin_bp = Blueprint('admin_bp', __name__, url_prefix='/api/admin')

@admin_bp.route('/users/<int:user_id>/reset-password', methods=['PUT'])
@admin_required()
def reset_user_password(user_id):
    user_to_reset = User.query.get(user_id)
    
    if not user_to_reset:
        return jsonify({"msg": "User not found"}), 404

    data = request.get_json()
    new_password = data.get('new_password')

    if not new_password:
        return jsonify({"msg": "New password is required"}), 400

    user_to_reset.set_password(new_password)
    db.session.commit()

    return jsonify({"msg": f"Password for user {user_to_reset.email} has been reset successfully"}), 200

@admin_bp.route('/users', methods=['GET'])
@admin_required()
def get_all_users():
    users = User.query.all()
    
    users_list = []
    for user in users:
        users_list.append({
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role
        })
    
    return jsonify(users_list), 200

@admin_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@admin_required()
def change_user_role(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    data = request.get_json()
    new_role = data.get('role')
    
    if new_role not in ['user', 'chef', 'admin']:
        return jsonify({"msg": "Invalid role"}), 400
        
    user.role = new_role
    db.session.commit()
    
    return jsonify({"msg": f"User {user.email} role updated to {new_role}"}), 200