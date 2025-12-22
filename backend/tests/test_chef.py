from backend.app.models import Recipe, Ingredient
from backend.app.auth.models import User


class TestGetChefRecipes:
    def test_get_chef_recipes_empty(self, client, chef_headers):
        response = client.get('/api/chef/recipes', headers=chef_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["recipes"] == []

    def test_get_chef_recipes_unauthorized(self, client):
        response = client.get('/api/chef/recipes')
        assert response.status_code == 401

    def test_get_chef_recipes_consumer_forbidden(self, client, consumer_headers):
        response = client.get('/api/chef/recipes', headers=consumer_headers)
        assert response.status_code == 403
        data = response.get_json()
        assert data["msg"] == "Chef or Admin access required."

    def test_get_chef_recipes_success(self, client, db_session, chef_headers):
        user = User.query.filter_by(role='chef').first()
        recipe = Recipe(title="Chef's Special", description="Delicious", author_id=user.id)
        db_session.add(recipe)
        db_session.commit()

        response = client.get('/api/chef/recipes', headers=chef_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert len(data["recipes"]) == 1
        assert data["recipes"][0]["title"] == "Chef's Special"


class TestCreateRecipe:
    def test_create_recipe_success(self, client, db_session, chef_headers):
        ingredient = Ingredient(name="Tomato", default_unit="piece")
        db_session.add(ingredient)
        db_session.commit()

        response = client.post('/api/chef/recipes', headers=chef_headers, json={
            "title": "New Chef Recipe",
            "description": "Tasty",
            "category": "Dinner",
            "cuisine": "Italian",
            "meal_type": "dinner",
            "is_vegan": False,
            "is_vegetarian": True,
            "ingredients": [{"name": "Tomato", "quantity": 2, "unit": "piece"}],
            "directions": "Cook it."
        })
        assert response.status_code == 201
        data = response.get_json()
        assert data["msg"] == "Recipe created successfully"
        recipe_id = data["recipe_id"]

        recipe = db_session.get(Recipe, recipe_id)
        assert recipe.title == "New Chef Recipe"
        assert len(recipe.ingredients) == 1
        assert recipe.ingredients[0].ingredient.name == "Tomato"


class TestGetRecipeForEdit:
    def test_get_recipe_for_edit_not_found(self, client, chef_headers):
        response = client.get('/api/chef/recipes/99999', headers=chef_headers)
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Recipe not found"

    def test_get_recipe_for_edit_unauthorized(self, client):
        response = client.get('/api/chef/recipes/1')
        assert response.status_code == 401

    def test_get_recipe_for_edit_success(self, client, db_session, chef_headers):
        user = User.query.filter_by(role='chef').first()
        recipe = Recipe(title="Edit Me", author_id=user.id)
        db_session.add(recipe)
        db_session.commit()

        response = client.get(f'/api/chef/recipes/{recipe.id}', headers=chef_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["title"] == "Edit Me"

    def test_get_recipe_for_edit_forbidden(self, client, db_session, chef_headers, consumer_user):
        other_user = User.query.filter_by(role='consumer').first()
        recipe = Recipe(title="Other's Recipe", author_id=other_user.id)
        db_session.add(recipe)
        db_session.commit()

        response = client.get(f'/api/chef/recipes/{recipe.id}', headers=chef_headers)
        assert response.status_code == 403
        data = response.get_json()
        assert data["msg"] == "You can only edit your own recipes"


class TestUpdateRecipe:
    def test_update_recipe_not_found(self, client, chef_headers):
        response = client.put('/api/chef/recipes/99999', headers=chef_headers, json={
            "title": "Updated Recipe"
        })
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Recipe not found"

    def test_update_recipe_success(self, client, db_session, chef_headers):
        user = User.query.filter_by(role='chef').first()
        recipe = Recipe(title="Old Title", author_id=user.id)
        db_session.add(recipe)
        db_session.commit()

        response = client.put(f'/api/chef/recipes/{recipe.id}', headers=chef_headers, json={
            "title": "New Title"
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "Recipe updated successfully"

        updated_recipe = db_session.get(Recipe, recipe.id)
        assert updated_recipe.title == "New Title"

    def test_update_recipe_forbidden(self, client, db_session, chef_headers, consumer_user):
        other_user = User.query.filter_by(role='consumer').first()
        recipe = Recipe(title="Other's Recipe", author_id=other_user.id)
        db_session.add(recipe)
        db_session.commit()

        response = client.put(f'/api/chef/recipes/{recipe.id}', headers=chef_headers, json={
            "title": "Hacked Title"
        })
        assert response.status_code == 403


class TestDeleteRecipe:
    def test_delete_recipe_not_found(self, client, chef_headers):
        response = client.delete('/api/chef/recipes/99999', headers=chef_headers)
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Recipe not found"

    def test_delete_recipe_success(self, client, db_session, chef_headers):
        user = User.query.filter_by(role='chef').first()
        recipe = Recipe(title="Delete Me", author_id=user.id)
        db_session.add(recipe)
        db_session.commit()
        recipe_id = recipe.id

        response = client.delete(f'/api/chef/recipes/{recipe_id}', headers=chef_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "Recipe deleted successfully"

        deleted_recipe = db_session.get(Recipe, recipe_id)
        assert deleted_recipe is None

    def test_delete_recipe_forbidden(self, client, db_session, chef_headers, consumer_user):
        other_user = User.query.filter_by(role='consumer').first()
        recipe = Recipe(title="Other's Recipe", author_id=other_user.id)
        db_session.add(recipe)
        db_session.commit()

        response = client.delete(f'/api/chef/recipes/{recipe.id}', headers=chef_headers)
        assert response.status_code == 403
        data = response.get_json()
        assert data["msg"] == "You can only delete your own recipes"


class TestGetChefStats:
    def test_get_chef_stats(self, client, chef_headers):
        response = client.get('/api/chef/stats', headers=chef_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert "total_recipes" in data
        assert "total_ratings" in data
        assert "average_rating" in data
