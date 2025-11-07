from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt, jwt_required

from extensions import jwt,db
from auth.models import User

auth_bp = Blueprint('auth_bp', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or "username" not in data or "password" not in data:
        return jsonify({"msg": "Username and password are required"}), 400

    username = data.get("username")
    password = data.get("password")

    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        user_role = {"role": user.role}
        access_token = create_access_token(
            identity=user.username,
            additional_claims=user_role
        )
        return jsonify(access_token=access_token)
    else:
        return jsonify({"msg": "Bad username or password"}), 401

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or "username" not in data or "password" not in data:
        return jsonify({"msg": "Username and password are required"}), 400

    username = data.get("username")
    password = data.get("password")
    role = data.get("role", "user")

    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "Username already exists"}), 409

    new_user = User(username=username, role=role)
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"msg": f"User '{username}' registered successfully"}), 201

@auth_bp.route('/chef-only', methods=['GET'])
@jwt_required() 
def chef_only_data():
    current_user_identity = get_jwt()
    current_user_role = current_user_identity.get("role")

    if current_user_role == "chef":
        return jsonify(message="Merhaba Şef!")
    else:
        return jsonify(message="Bu alanı görmeye yetkiniz yok!"), 403