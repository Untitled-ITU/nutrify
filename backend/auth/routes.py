from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt, jwt_required

# Eklentiyi app.py'den değil, extensions.py dosyasından alacağız.
from extensions import jwt

# Blueprint oluşturulması
auth_bp = Blueprint('auth_bp', __name__, url_prefix='/api/auth')

# Sahte kullanıcı veritabanı
FAKE_DB_USERS = {
    "user1": {
        "password": "pass123",
        "role": "user"
    },
    "chef1": {
        "password": "chefpass",
        "role": "chef"
    }
}

# Giriş (login) rotası (3.1.2)
# @app.route değil @auth_bp.route kullanıyoruz.
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    user = FAKE_DB_USERS.get(username)

    if user and user["password"] == password:
        user_role = {"role": user["role"]}
        access_token = create_access_token(
            identity=username, 
            additional_claims=user_role
        )
        return jsonify(access_token=access_token)
    else:
        return jsonify({"msg": "Bad username or password"}), 401
    

# 3.1.1
@auth_bp.route('/register', methods=['POST'])
def register():
    # Database işlemleri burada yapılacak (şimdilik sahte)
    return jsonify({"msg": "User registration endpoint (TODO)"}), 201


# 3.1.3 Rol kontrolü
@auth_bp.route('/chef-only', methods=['GET'])
@jwt_required() 
def chef_only_data():
    current_user_identity = get_jwt()
    current_user_role = current_user_identity.get("role")

    if current_user_role == "chef":
        return jsonify(message="Merhaba Şef!")
    else:
        return jsonify(message="Bu alanı görmeye yetkiniz yok!"), 403 # 403 Forbidden