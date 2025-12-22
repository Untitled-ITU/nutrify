from backend.app.models import (
    Recipe, Ingredient, RecipeIngredient,
    RecipeCollection, CollectionItem, Favorite
)
from backend.app.auth.models import User


class TestListRecipes:
    def test_list_recipes(self, client, consumer_headers):
        response = client.get('/api/recipes', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["recipes"] == []

    def test_list_recipes_unauthorized(self, client):
        response = client.get('/api/recipes')
        assert response.status_code == 401

    def test_list_recipes_filters(self, client, db_session, consumer_headers, chef_user):
        chef = chef_user
        r1 = Recipe(title="Vegan Salad", is_vegan=True, author_id=chef.id)
        r2 = Recipe(title="Meat Burger", is_vegan=False, author_id=chef.id)
        db_session.add_all([r1, r2])
        db_session.commit()

        response = client.get('/api/recipes?is_vegan=true', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert len(data["recipes"]) == 1
        assert data["recipes"][0]["title"] == "Vegan Salad"

    def test_list_recipes_success(self, client, db_session, consumer_headers, chef_user):
        chef = chef_user
        recipe = Recipe(title="Test Recipe List", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        response = client.get('/api/recipes', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        titles = [r["title"] for r in data["recipes"]]
        assert "Test Recipe List" in titles

    def test_list_recipes_filters_extended(self, client, db_session, consumer_headers, chef_user):
        chef = chef_user
        r1 = Recipe(title="Italian Pizza", cuisine="Italian", category="Main", author_id=chef.id)
        r2 = Recipe(title="French Toast", cuisine="French", category="Breakfast", author_id=chef.id)
        r3 = Recipe(title="Pasta Carbonara", description="Italian pasta", author_id=chef.id)
        r4 = Recipe(title="Tomato Soup", description="Soup", author_id=chef.id)

        i1 = Ingredient(name="Tomato", default_unit="kg")
        db_session.add_all([r1, r2, r3, r4, i1])
        db_session.commit()

        ri = RecipeIngredient(recipe_id=r1.id, ingredient_id=i1.id, quantity=1, unit="kg")
        db_session.add(ri)
        db_session.commit()

        res = client.get('/api/recipes?q=Pasta', headers=consumer_headers)
        assert res.status_code == 200
        d = res.get_json()
        assert len(d["recipes"]) == 1
        assert d["recipes"][0]["title"] == "Pasta Carbonara"

        res = client.get('/api/recipes?cuisine=Italian', headers=consumer_headers)
        assert res.status_code == 200
        d = res.get_json()
        assert len(d["recipes"]) == 1
        assert d["recipes"][0]["title"] == "Italian Pizza"

        res = client.get('/api/recipes?category=Breakfast', headers=consumer_headers)
        assert res.status_code == 200
        d = res.get_json()
        assert len(d["recipes"]) == 1
        assert d["recipes"][0]["title"] == "French Toast"

        res = client.get('/api/recipes?ingredients=Tomato', headers=consumer_headers)
        assert res.status_code == 200
        d = res.get_json()
        assert len(d["recipes"]) == 1
        assert d["recipes"][0]["title"] == "Italian Pizza"

    def test_list_recipes_sorting(self, client, db_session, consumer_headers, chef_user):
        chef = chef_user
        r1 = Recipe(title="B Recipe", author_id=chef.id)
        r2 = Recipe(title="A Recipe", author_id=chef.id)
        db_session.add_all([r1, r2])
        db_session.commit()

        res = client.get('/api/recipes?sort_by=title&sort_order=asc', headers=consumer_headers)
        assert res.status_code == 200
        d = res.get_json()
        titles = [r["title"] for r in d["recipes"]]
        idx_a = titles.index("A Recipe")
        idx_b = titles.index("B Recipe")
        assert idx_a < idx_b


class TestGetRecipe:
    def test_get_recipe_not_found(self, client, consumer_headers):
        response = client.get('/api/recipes/99999', headers=consumer_headers)
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Recipe not found"

    def test_get_recipe_success(self, client, db_session, consumer_headers, chef_user):
        chef = chef_user
        recipe = Recipe(title="Detail Recipe", author_id=chef.id, description="Desc")
        db_session.add(recipe)
        db_session.commit()

        response = client.get(f'/api/recipes/{recipe.id}', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["title"] == "Detail Recipe"
        assert data["description"] == "Desc"

    def test_get_recipe_unauthorized(self, client):
        response = client.get('/api/recipes/1')
        assert response.status_code == 401


class TestGetFilters:
    def test_get_filters(self, client, consumer_headers):
        response = client.get('/api/recipes/filters', headers=consumer_headers)
        assert response.status_code == 200

    def test_get_filters_unauthorized(self, client):
        response = client.get('/api/recipes/filters')
        assert response.status_code == 401


class TestSearchIngredients:
    def test_search_ingredients_empty(self, client, consumer_headers):
        response = client.get('/api/recipes/ingredients/search?q=xyz123', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["ingredients"] == []

    def test_search_ingredients_success(self, client, db_session, consumer_headers):
        i1 = Ingredient(name="Tomato", default_unit="kg")
        i2 = Ingredient(name="Potato", default_unit="kg")
        i3 = Ingredient(name="Onion", default_unit="kg")
        db_session.add_all([i1, i2, i3])
        db_session.commit()

        response = client.get('/api/recipes/ingredients/search?q=to', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert len(data["ingredients"]) == 2
        names = [i["name"] for i in data["ingredients"]]
        assert "Tomato" in names
        assert "Potato" in names
        assert "Onion" not in names


class TestFavorites:
    def test_get_favorites_empty(self, client, consumer_headers):
        response = client.get('/api/recipes/favorites', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["favorites"] == []

    def test_add_favorite_success(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        recipe = Recipe(title="Fav Meal", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        response = client.post('/api/recipes/favorites', headers=consumer_headers, json={
            "recipe_id": recipe.id
        })
        assert response.status_code == 201
        data = response.get_json()
        assert data["msg"] == "Recipe added to favorites"

        fav = Favorite.query.filter_by(user_id=user.id, recipe_id=recipe.id).first()
        assert fav is not None

    def test_add_favorite_duplicate(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        recipe = Recipe(title="Fav Meal Dup", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        fav = Favorite(user_id=user.id, recipe_id=recipe.id)
        db_session.add(fav)
        db_session.commit()

        response = client.post('/api/recipes/favorites', headers=consumer_headers, json={
            "recipe_id": recipe.id
        })
        assert response.status_code == 409
        data = response.get_json()
        assert data["msg"] == "Recipe already in favorites"

    def test_get_favorites_success(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        recipe = Recipe(title="My Fav Recipe", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        fav = Favorite(user_id=user.id, recipe_id=recipe.id)
        db_session.add(fav)
        db_session.commit()

        response = client.get('/api/recipes/favorites', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert len(data["favorites"]) == 1
        assert data["favorites"][0]["id"] == recipe.id

    def test_add_favorite_not_found(self, client, consumer_headers):
        response = client.post('/api/recipes/favorites', headers=consumer_headers, json={
            "recipe_id": 99999
        })
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Recipe not found"

    def test_remove_favorite_success(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        recipe = Recipe(title="Remove Fav", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        fav = Favorite(user_id=user.id, recipe_id=recipe.id)
        db_session.add(fav)
        db_session.commit()

        response = client.delete(f'/api/recipes/favorites/{recipe.id}', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "Recipe removed from favorites"

        fav = Favorite.query.filter_by(user_id=user.id, recipe_id=recipe.id).first()
        assert fav is None

    def test_remove_favorite_not_found(self, client, consumer_headers):
        response = client.delete('/api/recipes/favorites/99999', headers=consumer_headers)
        assert response.status_code == 404


class TestCollections:
    def test_list_collections_success(self, client, db_session, consumer_headers):
        user = User.query.filter_by(role='consumer').first()
        c1 = RecipeCollection(name="C1", user_id=user.id, is_public=True)
        c2 = RecipeCollection(name="C2", user_id=user.id, is_public=False)
        db_session.add_all([c1, c2])
        db_session.commit()

        response = client.get('/api/recipes/collections', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert len(data["collections"]) == 2
        names = [c["name"] for c in data["collections"]]
        assert "C1" in names and "C2" in names

    def test_get_collection_not_found(self, client, consumer_headers):
        response = client.get('/api/recipes/collections/99999', headers=consumer_headers)
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Collection not found"

    def test_get_collection_success(self, client, db_session, consumer_headers):
        user = User.query.filter_by(role='consumer').first()
        coll = RecipeCollection(name="Detail Coll", user_id=user.id)
        db_session.add(coll)
        db_session.commit()

        response = client.get(f'/api/recipes/collections/{coll.id}', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["name"] == "Detail Coll"

    def test_create_collection_success(self, client, db_session, consumer_headers):
        user = User.query.filter_by(role='consumer').first()
        response = client.post('/api/recipes/collections', headers=consumer_headers, json={
            "name": "New Coll",
            "description": "Desc",
            "is_public": True
        })
        assert response.status_code == 201
        data = response.get_json()
        assert data["collection"]["name"] == "New Coll"

        coll = RecipeCollection.query.filter_by(user_id=user.id, name="New Coll").first()
        assert coll.description == "Desc"
        assert coll.is_public is True

    def test_create_collection_duplicate(self, client, db_session, consumer_headers):
        user = User.query.filter_by(role='consumer').first()
        coll = RecipeCollection(name="Dup Coll", user_id=user.id)
        db_session.add(coll)
        db_session.commit()

        response = client.post('/api/recipes/collections', headers=consumer_headers, json={
            "name": "Dup Coll"
        })
        assert response.status_code == 409
        data = response.get_json()
        assert data["msg"] == "Collection with this name already exists"

    def test_update_collection_success(self, client, db_session, consumer_headers):
        user = User.query.filter_by(role='consumer').first()
        coll = RecipeCollection(name="Update Me", user_id=user.id)
        db_session.add(coll)
        db_session.commit()

        response = client.put(f'/api/recipes/collections/{coll.id}', headers=consumer_headers, json={
            "name": "Updated Name",
            "is_public": False
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "Collection updated successfully"

        updated_coll = db_session.get(RecipeCollection, coll.id)
        assert updated_coll.name == "Updated Name"
        assert updated_coll.is_public is False

    def test_update_collection_duplicate(self, client, db_session, consumer_headers):
        user = User.query.filter_by(role='consumer').first()
        c1 = RecipeCollection(name="Coll 1", user_id=user.id)
        c2 = RecipeCollection(name="Coll 2", user_id=user.id)
        db_session.add_all([c1, c2])
        db_session.commit()

        response = client.put(f'/api/recipes/collections/{c1.id}', headers=consumer_headers, json={
            "name": "Coll 2"
        })
        assert response.status_code == 409
        data = response.get_json()
        assert data["msg"] == "Collection with this name already exists"

    def test_delete_collection_success(self, client, db_session, consumer_headers):
        user = User.query.filter_by(role='consumer').first()
        coll = RecipeCollection(name="Delete Me", user_id=user.id)
        db_session.add(coll)
        db_session.commit()
        coll_id = coll.id

        response = client.delete(f'/api/recipes/collections/{coll_id}', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "Collection deleted successfully"

        deleted_coll = db_session.get(RecipeCollection, coll_id)
        assert deleted_coll is None

    def test_delete_collection_not_found(self, client, consumer_headers):
        response = client.delete('/api/recipes/collections/99999', headers=consumer_headers)
        assert response.status_code == 404

    def test_add_recipe_to_collection_success(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        recipe = Recipe(title="Coll Recipe", author_id=chef.id)
        coll = RecipeCollection(name="Recipe Coll", user_id=user.id)
        db_session.add_all([recipe, coll])
        db_session.commit()

        response = client.post(
            f'/api/recipes/collections/{coll.id}/recipes', headers=consumer_headers,
            json={
                "recipe_id": recipe.id
            }
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data["msg"] == "Recipe added to collection successfully"

        cr = CollectionItem.query.filter_by(collection_id=coll.id, recipe_id=recipe.id).first()
        assert cr is not None

    def test_remove_recipe_from_collection_success(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        recipe = Recipe(title="Remove Coll Recipe", author_id=chef.id)
        coll = RecipeCollection(name="Remove Recipe Coll", user_id=user.id)
        db_session.add_all([recipe, coll])
        db_session.commit()

        cr = CollectionItem(collection_id=coll.id, recipe_id=recipe.id)
        db_session.add(cr)
        db_session.commit()

        response = client.delete(
            f'/api/recipes/collections/{coll.id}/recipes/{recipe.id}',
            headers=consumer_headers
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "Recipe removed from collection successfully"

        cr_deleted = CollectionItem.query.filter_by(collection_id=coll.id, recipe_id=recipe.id).first()
        assert cr_deleted is None

    def test_get_recipe_collections_success(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        recipe = Recipe(title="RC Recipe", author_id=chef.id)
        c1 = RecipeCollection(name="RC Coll 1", user_id=user.id)
        c2 = RecipeCollection(name="RC Coll 2", user_id=user.id)
        c3 = RecipeCollection(name="RC Coll 3", user_id=user.id)
        db_session.add_all([recipe, c1, c2, c3])
        db_session.commit()

        cr1 = CollectionItem(collection_id=c1.id, recipe_id=recipe.id)
        cr3 = CollectionItem(collection_id=c3.id, recipe_id=recipe.id)
        db_session.add_all([cr1, cr3])
        db_session.commit()

        response = client.get(f'/api/recipes/{recipe.id}/collections', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["recipe_id"] == recipe.id

        assert len(data["collections"]) == 2

        c1_data = next((c for c in data["collections"] if c["collection_id"] == c1.id), None)
        assert c1_data is not None
        assert c1_data["collection_name"] == c1.name

        c3_data = next((c for c in data["collections"] if c["collection_id"] == c3.id), None)
        assert c3_data is not None
        assert c3_data["collection_name"] == c3.name

        c2_data = next((c for c in data["collections"] if c["collection_id"] == c2.id), None)
        assert c2_data is None

    def test_bulk_add_recipes_to_collection_success(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        r1 = Recipe(title="Bulk R1", author_id=chef.id)
        r2 = Recipe(title="Bulk R2", author_id=chef.id)
        coll = RecipeCollection(name="Bulk Coll", user_id=user.id)
        db_session.add_all([r1, r2, coll])
        db_session.commit()

        response = client.post(
            f'/api/recipes/collections/{coll.id}/recipes/bulk', headers=consumer_headers,
            json={
                "recipe_ids": [r1.id, r2.id]
            }
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "Bulk add completed"
        assert data["added"] == 2

        items = CollectionItem.query.filter_by(collection_id=coll.id).all()
        assert len(items) == 2
        item_ids = [i.recipe_id for i in items]
        assert r1.id in item_ids and r2.id in item_ids
