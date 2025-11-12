from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt, jwt_required, get_jwt_identity

from ...extensions import jwt,db
from .models import User

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
            additional_claims={"role": user.role, "name": user.name}
        )
        return jsonify(access_token=access_token)
    else:
        return jsonify({"msg": "Bad email or password"}), 401
    

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or "email" not in data or "password" not in data or "name" not in data:
        return jsonify({"msg": "Email, password, and name are required"}), 400

    email=data.get("email")
    password = data.get("password")
    name = data.get("name")
    role = data.get("role", "user")

    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "Email already registered"}), 409

    new_user = User(email=email, name=name, role=role)
    new_user.set_password(password)

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
        name=user.name,
        role=user.role
    ), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first_or_404()
    data = request.get_json()

    if 'name' in data:
        user.name = data.get('name')

    db.session.commit()

    return jsonify({"msg": "Profile updated successfully"}), 200