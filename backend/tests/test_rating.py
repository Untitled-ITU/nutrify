from backend.app.models import Recipe, Rating
from backend.app.auth.models import User


class TestGetRecipeRatings:
    def test_get_recipe_ratings_not_found(self, client, consumer_headers):
        response = client.get('/api/recipes/99999/ratings', headers=consumer_headers)
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Recipe not found"

    def test_get_recipe_ratings_unauthorized(self, client):
        response = client.get('/api/recipes/1/ratings')
        assert response.status_code == 401

    def test_get_recipe_ratings_success(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        recipe = Recipe(title="Rated Recipe", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        rating1 = Rating(user_id=user.id, recipe_id=recipe.id, score=5, comment="Great!")
        rating2 = Rating(user_id=chef.id, recipe_id=recipe.id, score=3, comment="Okay")
        db_session.add_all([rating1, rating2])
        db_session.commit()

        response = client.get(f'/api/recipes/{recipe.id}/ratings', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["recipe_title"] == "Rated Recipe"
        assert data["total_ratings"] == 2
        assert data["average_rating"] == 4
        assert len(data["ratings"]) == 2


class TestAddRating:
    def test_add_rating_recipe_not_found(self, client, consumer_headers):
        response = client.post('/api/recipes/99999/ratings', headers=consumer_headers, json={
            "recipe_id": 99999,
            "score": 5,
            "comment": "Great recipe!"
        })
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Recipe not found"

    def test_add_rating_success(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        recipe = Recipe(title="New Rated Recipe", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        response = client.post(f'/api/recipes/{recipe.id}/ratings', headers=consumer_headers, json={
            "recipe_id": recipe.id,
            "score": 5,
            "comment": "Amazing!"
        })
        assert response.status_code == 201
        data = response.get_json()
        assert data["msg"] == "Rating added successfully"
        rating_id = data["rating_id"]

        rating = db_session.get(Rating, rating_id)
        assert rating.score == 5
        assert rating.comment == "Amazing!"
        assert rating.user_id == user.id

    def test_add_rating_duplicate(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        recipe = Recipe(title="Duplicate Test", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        rating = Rating(user_id=user.id, recipe_id=recipe.id, score=4)
        db_session.add(rating)
        db_session.commit()

        response = client.post(f'/api/recipes/{recipe.id}/ratings', headers=consumer_headers, json={
            "recipe_id": recipe.id,
            "score": 5,
            "comment": "Another one"
        })
        assert response.status_code == 409
        data = response.get_json()
        assert "already rated" in data["msg"]


class TestUpdateRating:
    def test_update_rating_not_found(self, client, consumer_headers):
        response = client.put('/api/ratings/99999', headers=consumer_headers, json={
            "score": 4
        })
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Rating not found"

    def test_update_rating_success(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        recipe = Recipe(title="Update Rating Test", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        rating = Rating(user_id=user.id, recipe_id=recipe.id, score=3, comment="Meh")
        db_session.add(rating)
        db_session.commit()
        rating_id = rating.id

        response = client.put(f'/api/ratings/{rating_id}', headers=consumer_headers, json={
            "score": 5,
            "comment": "Changed my mind"
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "Rating updated successfully"

        updated_rating = db_session.get(Rating, rating_id)
        assert updated_rating.score == 5
        assert updated_rating.comment == "Changed my mind"

    def test_update_rating_forbidden(self, client, db_session, consumer_headers, chef_user):
        chef = chef_user
        recipe = Recipe(title="Other's Rating", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        rating = Rating(user_id=chef.id, recipe_id=recipe.id, score=5, comment="Mine")
        db_session.add(rating)
        db_session.commit()

        response = client.put(f'/api/ratings/{rating.id}', headers=consumer_headers, json={
            "score": 1
        })
        assert response.status_code == 403
        data = response.get_json()
        assert data["msg"] == "You can only update your own ratings"


class TestDeleteRating:
    def test_delete_rating_not_found(self, client, consumer_headers):
        response = client.delete('/api/ratings/99999', headers=consumer_headers)
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Rating not found"

    def test_delete_rating_success(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        recipe = Recipe(title="Delete Rating Test", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        rating = Rating(user_id=user.id, recipe_id=recipe.id, score=2, comment="Bad")
        db_session.add(rating)
        db_session.commit()
        rating_id = rating.id

        response = client.delete(f'/api/ratings/{rating_id}', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "Rating deleted successfully"

        deleted_rating = db_session.get(Rating, rating_id)
        assert deleted_rating is None

    def test_delete_rating_forbidden(self, client, db_session, consumer_headers, chef_user):
        chef = chef_user
        recipe = Recipe(title="Other's Rating", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        rating = Rating(user_id=chef.id, recipe_id=recipe.id, score=5, comment="Mine")
        db_session.add(rating)
        db_session.commit()

        response = client.delete(f'/api/ratings/{rating.id}', headers=consumer_headers)
        assert response.status_code == 403
        data = response.get_json()
        assert data["msg"] == "You can only delete your own ratings"


class TestGetUserRatings:
    def test_get_user_ratings_empty(self, client, consumer_headers):
        response = client.get('/api/user/ratings', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["ratings"] == []
        assert data["total"] == 0

    def test_get_user_ratings_unauthorized(self, client):
        response = client.get('/api/user/ratings')
        assert response.status_code == 401

    def test_get_user_ratings_success(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user

        recipe1 = Recipe(title="My Rated 1", author_id=chef.id)
        recipe2 = Recipe(title="My Rated 2", author_id=chef.id)
        db_session.add_all([recipe1, recipe2])
        db_session.commit()

        rating1 = Rating(user_id=user.id, recipe_id=recipe1.id, score=5)
        rating2 = Rating(user_id=user.id, recipe_id=recipe2.id, score=4)
        db_session.add_all([rating1, rating2])
        db_session.commit()

        response = client.get('/api/user/ratings', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] == 2
        assert len(data["ratings"]) == 2
        assert any(r["recipe_title"] == "My Rated 1" for r in data["ratings"])
