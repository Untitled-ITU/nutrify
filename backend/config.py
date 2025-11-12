import os

from dotenv import load_dotenv

base_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(base_dir, '.env')

load_dotenv(dotenv_path=dotenv_path)

class Config:
    # Cloud SQL connection configuration
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_NAME = os.getenv("DB_NAME", "nutrify-database")
    CLOUD_SQL_CONNECTION_NAME = os.getenv("CLOUD_SQL_CONNECTION_NAME", "")
    
    # Cloud Run connects to Cloud SQL via unix socket
    # For local development, you can use postgresql:// direct connection
    if os.getenv("GAE_ENV", "").startswith("standard") or os.getenv("CLOUD_RUN_JOB"):
        # Use unix socket in Cloud Run environment
        SQLALCHEMY_DATABASE_URI = f"postgresql+pg8000://{DB_USER}:{DB_PASSWORD}@/{DB_NAME}?unix_sock=/cloudsql/{CLOUD_SQL_CONNECTION_NAME}/.s.PGSQL.5432"
    else:
        # Use direct connection or existing DATABASE_URL for local development
        SQLALCHEMY_DATABASE_URI = os.getenv(
            "DATABASE_URL",
            f"postgresql://{DB_USER}:{DB_PASSWORD}@127.0.0.1:5432/{DB_NAME}"
        )
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Connection pool settings (optimized for db-f1-micro)
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 5,
        'pool_recycle': 300,
        'pool_pre_ping': True,
        'max_overflow': 2
    }
    
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
