from dotenv import load_dotenv

import os
from datetime import timedelta
from urllib.parse import quote_plus


base_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(base_dir, '.env')

load_dotenv(dotenv_path=dotenv_path)


class Config:
    DB_USER = quote_plus(os.getenv("DB_USER", "postgres"))
    DB_PASSWORD = quote_plus(os.getenv("DB_PASSWORD", ""))
    DB_NAME = os.getenv("DB_NAME", "nutrify_db")
    CLOUD_SQL_CONNECTION_NAME = os.getenv("CLOUD_SQL_CONNECTION_NAME", "")

    if os.getenv("K_SERVICE"):
        SQLALCHEMY_DATABASE_URI = f"postgresql+pg8000://{DB_USER}:{DB_PASSWORD}@/{DB_NAME}?unix_sock=/cloudsql/{CLOUD_SQL_CONNECTION_NAME}/.s.PGSQL.5432"
    else:
        SQLALCHEMY_DATABASE_URI = os.getenv(
            "DATABASE_URL",
            f"postgresql://{DB_USER}:{DB_PASSWORD}@127.0.0.1:5433/{DB_NAME}"
        )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 5,
        'pool_recycle': 300,
        'pool_pre_ping': True,
        'max_overflow': 2
    }

    SECRET_KEY = os.environ["SECRET_KEY"]
    JWT_SECRET_KEY = os.environ["JWT_SECRET_KEY"]
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)

    MAIL_SERVER = os.environ["MAIL_SERVER"]
    MAIL_PORT = int(os.environ["MAIL_PORT"])
    MAIL_USE_TLS = os.environ["MAIL_USE_TLS"].lower() in ['true', '1']
    MAIL_USE_SSL = os.environ["MAIL_USE_SSL"].lower() in ['true', '1']
    MAIL_USERNAME = os.environ["MAIL_USERNAME"]
    MAIL_PASSWORD = os.environ["MAIL_PASSWORD"]
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_DEFAULT_SENDER", os.environ["MAIL_USERNAME"])

    ENABLE_DOCS = os.environ["ENABLE_DOCS"].lower() in ['true', '1']
    ADMIN_URL = os.environ["ADMIN_URL"]
    FIREBASE_STORAGE_BASE_URL = os.environ["FIREBASE_STORAGE_BASE_URL"]
