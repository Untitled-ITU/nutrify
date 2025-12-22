from datetime import datetime, timezone, timedelta
from werkzeug.security import generate_password_hash
from backend.app.auth.models import VerificationCode


class TestLogin:
    def test_login_success(self, client, consumer_user):
        response = client.post('/api/auth/login', json={
            "email": "consumer@test.com",
            "password": "password123"
        })
        assert response.status_code == 200
        data = response.get_json()
        assert "access_token" in data

    def test_login_wrong_password(self, client, consumer_user):
        response = client.post('/api/auth/login', json={
            "email": "consumer@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        data = response.get_json()
        assert data["msg"] == "Bad email or password"

    def test_login_nonexistent_user(self, client):
        response = client.post('/api/auth/login', json={
            "email": "nonexistent@test.com",
            "password": "password123"
        })
        assert response.status_code == 401
        data = response.get_json()
        assert data["msg"] == "Bad email or password"


class TestRegister:
    def test_register_success(self, client, db_session, mocker):
        mocker.patch('backend.app.auth.routes.send_verification_email', return_value=True)

        response = client.post('/api/auth/register', json={
            "email": "newuser@test.com",
            "username": "newuser",
            "password": "password123",
            "role": "consumer"
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "Verification code sent to your email"
        assert data["email"] == "newuser@test.com"

    def test_register_duplicate_email(self, client, consumer_user):
        response = client.post('/api/auth/register', json={
            "email": "consumer@test.com",
            "username": "another",
            "password": "password123"
        })
        assert response.status_code == 409
        data = response.get_json()
        assert data["msg"] == "Email already registered"

    def test_register_invalid_role(self, client, db_session):
        response = client.post('/api/auth/register', json={
            "email": "newuser@test.com",
            "username": "newuser",
            "password": "password123",
            "role": "invalid"
        })
        assert response.status_code == 422
        data = response.get_json()
        assert data[0]["msg"] == "Input should be 'consumer', 'chef' or 'admin'"

    def test_register_invalid_password(self, client, db_session):
        response = client.post('/api/auth/register', json={
            "email": "newuser@test.com",
            "username": "newuser",
            "password": "pass",
        })
        assert response.status_code == 422
        data = response.get_json()
        assert data[0]["msg"] == "String should have at least 6 characters"

    def test_register_password_wrong_type(self, client, db_session):
        response = client.post('/api/auth/register', json={
            "email": "newuser@test.com",
            "username": "newuser",
            "password": 123,
        })
        assert response.status_code == 422
        data = response.get_json()
        assert data[0]["msg"] == "Input should be a valid string"

    def test_register_invalid_username(self, client, db_session):
        response = client.post('/api/auth/register', json={
            "email": "newuser@test.com",
            "username": "",
            "password": "password123",
        })
        assert response.status_code == 422
        data = response.get_json()
        assert data[0]["msg"] == "String should have at least 3 characters"


class TestVerifyRegistration:
    def test_verify_registration_success(self, client, db_session):
        verification = VerificationCode(
            email="verifytest@test.com",
            code="123456",
            purpose="registration",
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
            pending_username="verifyuser",
            pending_password_hash=generate_password_hash("password123"),
            pending_role="consumer"
        )
        db_session.add(verification)
        db_session.commit()

        response = client.post('/api/auth/verify-registration', json={
            "email": "verifytest@test.com",
            "code": "123456"
        })
        assert response.status_code == 201
        data = response.get_json()
        assert "registered successfully" in data["msg"]

    def test_verify_registration_invalid_code(self, client, db_session):
        response = client.post('/api/auth/verify-registration', json={
            "email": "verifytest@test.com",
            "code": "123456"
        })
        assert response.status_code == 400
        data = response.get_json()
        assert data["msg"] == "Invalid or expired verification code"


class TestProfile:
    def test_get_profile_success(self, client, consumer_headers):
        response = client.get('/api/auth/profile', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["email"] == "consumer@test.com"
        assert data["username"] == "testconsumer"
        assert data["role"] == "consumer"

    def test_get_profile_unauthorized(self, client):
        response = client.get('/api/auth/profile')
        assert response.status_code == 401

    def test_update_profile_success(self, client, consumer_headers):
        response = client.put('/api/auth/profile',
            headers=consumer_headers,
            json={"username": "updatedname"}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "Profile updated successfully"

    def test_update_profile_same_username(self, client, consumer_headers):
        response = client.put('/api/auth/profile',
            headers=consumer_headers,
            json={"username": "testconsumer"}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "This is already your username"


class TestChangePassword:
    def test_change_password_success(self, client, consumer_headers):
        response = client.post('/api/auth/change-password',
            headers=consumer_headers,
            json={
                "current_password": "password123",
                "new_password": "newpassword123"
            }
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "Password updated successfully"

    def test_change_password_wrong_current(self, client, consumer_headers):
        response = client.post('/api/auth/change-password',
            headers=consumer_headers,
            json={
                "current_password": "wrongpassword",
                "new_password": "newpassword123"
            }
        )
        assert response.status_code == 403
        data = response.get_json()
        assert data["msg"] == "Incorrect current password"

    def test_change_password_same_password(self, client, consumer_headers):
        response = client.post('/api/auth/change-password',
            headers=consumer_headers,
            json={
                "current_password": "password123",
                "new_password": "password123"
            }
        )
        assert response.status_code == 400
        data = response.get_json()
        assert data["msg"] == "New password must be different from current password"

    def test_change_password_unauthorized(self, client):
        response = client.post('/api/auth/change-password', json={
            "current_password": "password123",
            "new_password": "newpassword123"
        })
        assert response.status_code == 401


class TestForgotPassword:
    def test_forgot_password_success(self, client, consumer_user, mocker):
        mocker.patch('backend.app.auth.routes.send_reset_code_email', return_value=True)

        response = client.post('/api/auth/forgot-password', json={
            "email": "consumer@test.com"
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "Verification code sent to your email"
        assert data["email"] == "consumer@test.com"

    def test_forgot_password_nonexistent(self, client):
        response = client.post('/api/auth/forgot-password', json={
            "email": "nonexistent@test.com"
        })
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Email not found"


class TestResetPassword:
    def test_reset_password_success(self, client, db_session, consumer_user):
        from datetime import datetime, timezone, timedelta

        verification = VerificationCode(
            email="consumer@test.com",
            code="654321",
            purpose="password_reset",
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)
        )
        db_session.add(verification)
        db_session.commit()

        response = client.post('/api/auth/reset-password', json={
            "email": "consumer@test.com",
            "code": "654321",
            "new_password": "resetpassword123"
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "Password reset successfully"

    def test_reset_password_invalid_code(self, client, consumer_user):
        response = client.post('/api/auth/reset-password', json={
            "email": "consumer@test.com",
            "code": "000000",
            "new_password": "resetpassword123"
        })
        assert response.status_code == 400
        data = response.get_json()
        assert data["msg"] == "Invalid or expired verification code"
