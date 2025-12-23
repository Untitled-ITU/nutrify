from backend.app.auth.models import User


class TestGetAllUsers:
    def test_get_users_as_admin(self, client, admin_headers, consumer_user, chef_user):
        response = client.get('/api/admin/users', headers=admin_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert len(data["users"]) == 3

    def test_get_users_as_consumer_forbidden(self, client, consumer_headers):
        response = client.get('/api/admin/users', headers=consumer_headers)
        assert response.status_code == 403
        data = response.get_json()
        assert data["msg"] == "Admins only! You don't have permission."

    def test_get_users_as_chef_forbidden(self, client, chef_headers):
        response = client.get('/api/admin/users', headers=chef_headers)
        assert response.status_code == 403
        data = response.get_json()
        assert data["msg"] == "Admins only! You don't have permission."

    def test_get_users_unauthorized(self, client):
        response = client.get('/api/admin/users')
        assert response.status_code == 401


class TestResetUserPassword:
    def test_reset_password_as_admin(self, client, admin_headers, consumer_user):
        response = client.put(
            f'/api/admin/users/{consumer_user.id}/reset-password',
            headers=admin_headers,
            json={"new_password": "newpass123"}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "reset successfully" in data["msg"]

    def test_reset_password_user_not_found(self, client, admin_headers):
        response = client.put(
            '/api/admin/users/99999/reset-password',
            headers=admin_headers,
            json={"new_password": "newpass123"}
        )
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "User not found"


class TestChangeUserRole:
    def test_change_role_as_admin(self, client, admin_headers, consumer_user):
        response = client.put(
            f'/api/admin/users/{consumer_user.id}/change-role',
            headers=admin_headers,
            json={"role": "chef"}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "updated to chef" in data["msg"]

    def test_change_role_same_role(self, client, admin_headers, consumer_user):
        response = client.put(
            f'/api/admin/users/{consumer_user.id}/change-role',
            headers=admin_headers,
            json={"role": "consumer"}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "already has" in data["msg"]

    def test_change_role_user_not_found(self, client, admin_headers):
        response = client.put(
            '/api/admin/users/99999/change-role',
            headers=admin_headers,
            json={"role": "chef"}
        )
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "User not found"

    def test_change_role_as_consumer_forbidden(self, client, consumer_headers, chef_user):
        response = client.put(
            f'/api/admin/users/{chef_user.id}/change-role',
            headers=consumer_headers,
            json={"role": "admin"}
        )
        assert response.status_code == 403
        data = response.get_json()
        assert data["msg"] == "Admins only! You don't have permission."

    def test_change_role_as_chef_forbidden(self, client, chef_headers, consumer_user):
        response = client.put(
            f'/api/admin/users/{consumer_user.id}/change-role',
            headers=chef_headers,
            json={"role": "admin"}
        )
        assert response.status_code == 403
        data = response.get_json()
        assert data["msg"] == "Admins only! You don't have permission."

    def test_change_role_as_unauthorized(self, client, consumer_user):
        response = client.put(
            f'/api/admin/users/{consumer_user.id}/change-role',
            json={"role": "chef"}
        )
        assert response.status_code == 401


class TestDeleteUser:
    def test_delete_user_as_admin(self, client, db_session, admin_headers):
        user_to_delete = User(
            email="todelete@test.com",
            username="todelete",
            role="consumer"
        )
        user_to_delete.set_password("password123")
        db_session.add(user_to_delete)
        db_session.commit()
        db_session.refresh(user_to_delete)
        user_id = user_to_delete.id

        response = client.delete(
            f'/api/admin/users/{user_id}',
            headers=admin_headers
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "has been deleted" in data["msg"]

    def test_delete_user_not_found(self, client, admin_headers):
        response = client.delete(
            '/api/admin/users/99999',
            headers=admin_headers
        )
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "User not found"

    def test_delete_admin_forbidden(self, client, db_session, admin_headers):
        another_admin = User(
            email="admin2@test.com",
            username="admin2",
            role="admin"
        )
        another_admin.set_password("password123")
        db_session.add(another_admin)
        db_session.commit()
        db_session.refresh(another_admin)

        response = client.delete(
            f'/api/admin/users/{another_admin.id}',
            headers=admin_headers
        )
        assert response.status_code == 403
        data = response.get_json()
        assert data["msg"] == "Cannot delete admin account"
