import os
import pytest
from flask_jwt_extended import create_access_token
from dotenv import load_dotenv
from backend.app import create_app
from backend.extensions import db as _db
from backend.app.auth.models import User


base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(base_dir, '.env')

load_dotenv(dotenv_path=dotenv_path)


class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ["TEST_DATABASE_URL"]
    SECRET_KEY = "test-secret-key"
    JWT_SECRET_KEY = "test-jwt-secret-key"


@pytest.fixture(scope='session')
def app():
    _app = create_app(TestConfig)

    with _app.app_context():
        yield _app


@pytest.fixture(scope='function')
def db_session(app):
    _db.create_all()
    yield _db.session
    _db.session.remove()
    _db.drop_all()


@pytest.fixture
def client(app, db_session):
    return app.test_client()


@pytest.fixture
def consumer_user(db_session):
    user = User(email="consumer@test.com", username="testconsumer", role="consumer")
    user.set_password("password123")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def chef_user(db_session):
    user = User(email="chef@test.com", username="testchef", role="chef")
    user.set_password("password123")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_user(db_session):
    user = User(email="admin@test.com", username="testadmin", role="admin")
    user.set_password("password123")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def consumer_headers(consumer_user):
    token = create_access_token(
        identity=consumer_user.email,
        additional_claims={"role": consumer_user.role, "username": consumer_user.username}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def chef_headers(chef_user):
    token = create_access_token(
        identity=chef_user.email,
        additional_claims={"role": chef_user.role, "username": chef_user.username}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(admin_user):
    token = create_access_token(
        identity=admin_user.email,
        additional_claims={"role": admin_user.role, "username": admin_user.username}
    )
    return {"Authorization": f"Bearer {token}"}
