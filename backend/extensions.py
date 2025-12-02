from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail


jwt = JWTManager()
db = SQLAlchemy()
mail = Mail()
