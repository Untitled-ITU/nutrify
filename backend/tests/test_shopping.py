from datetime import date, timedelta
from backend.app.models import Ingredient, Recipe, RecipeIngredient, ShoppingList, FridgeItem, MealPlan
from backend.app.auth.models import User


class TestGetShoppingList:
    def test_get_shopping_list_success(self, client, db_session, consumer_headers):
        ingredient = Ingredient(name="ShoppingTest Onion", default_unit="piece")
        db_session.add(ingredient)
        db_session.commit()

        client.post('/api/shopping-list/items', headers=consumer_headers, json={
            "ingredient_id": ingredient.id,
            "amount": "3"
        })

        response = client.get('/api/shopping-list', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["total_items"] == 1
        assert data["purchased_count"] == 0
        assert len(data["items"]) == 1

    def test_get_shopping_list_empty(self, client, consumer_headers):
        response = client.get('/api/shopping-list', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["items"] == []
        assert data["total_items"] == 0
        assert data["purchased_count"] == 0

    def test_get_shopping_list_unauthorized(self, client):
        response = client.get('/api/shopping-list')
        assert response.status_code == 401


class TestAddItem:
    def test_add_item_by_id(self, client, db_session, consumer_headers):
        ingredient = Ingredient.query.first()
        if not ingredient:
            ingredient = Ingredient(name="Test Onion", default_unit="piece")
            db_session.add(ingredient)
            db_session.commit()

        response = client.post('/api/shopping-list/items', headers=consumer_headers, json={
            "ingredient_id": ingredient.id,
            "amount": "3"
        })
        assert response.status_code == 201
        data = response.get_json()
        assert data["msg"] == "Item added to shopping list"
        assert "item_id" in data

    def test_add_item_by_name(self, client, db_session, consumer_headers):
        ingredient = Ingredient.query.filter_by(name="Pepper").first()
        if not ingredient:
            ingredient = Ingredient(name="Pepper", default_unit="piece")
            db_session.add(ingredient)
            db_session.commit()

        response = client.post('/api/shopping-list/items', headers=consumer_headers, json={
            "ingredient_name": "Pepper",
            "amount": "2"
        })
        assert response.status_code == 201
        data = response.get_json()
        assert data["msg"] == "Item added to shopping list"

    def test_add_item_no_ingredient(self, client, consumer_headers):
        response = client.post('/api/shopping-list/items', headers=consumer_headers, json={
            "amount": "5"
        })
        assert response.status_code == 400
        data = response.get_json()
        assert data["msg"] == "ingredient_id or ingredient_name is required"

    def test_add_item_ingredient_not_found(self, client, consumer_headers):
        response = client.post('/api/shopping-list/items', headers=consumer_headers, json={
            "ingredient_id": 99999,
            "amount": "5"
        })
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Ingredient not found"

    def test_add_item_updates_existing(self, client, db_session, consumer_headers):
        ingredient = Ingredient(name="ShoppingUpdate Potato", default_unit="piece")
        db_session.add(ingredient)
        db_session.commit()

        client.post('/api/shopping-list/items', headers=consumer_headers, json={
            "ingredient_id": ingredient.id,
            "amount": "3"
        })

        response = client.post('/api/shopping-list/items', headers=consumer_headers, json={
            "ingredient_id": ingredient.id,
            "amount": "5"
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "Item updated in shopping list"


class TestUpdateItem:
    def test_update_item_success(self, client, db_session, consumer_headers):
        ingredient = Ingredient(name="UpdateTest Carrot", default_unit="piece")
        db_session.add(ingredient)
        db_session.commit()

        add_response = client.post('/api/shopping-list/items', headers=consumer_headers, json={
            "ingredient_id": ingredient.id,
            "amount": "3"
        })
        item_id = add_response.get_json()["item_id"]

        response = client.put(f'/api/shopping-list/items/{item_id}', headers=consumer_headers, json={
            "amount": "10"
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "Item updated"

        updated_item = db_session.get(ShoppingList, item_id)
        assert float(updated_item.amount) == 10

    def test_update_item_not_found(self, client, consumer_headers):
        response = client.put('/api/shopping-list/items/99999', headers=consumer_headers, json={
            "amount": "10"
        })
        assert response.status_code == 404


class TestDeleteItem:
    def test_delete_item_success(self, client, db_session, consumer_headers):
        ingredient = Ingredient(name="DeleteTest Celery", default_unit="piece")
        db_session.add(ingredient)
        db_session.commit()

        add_response = client.post('/api/shopping-list/items', headers=consumer_headers, json={
            "ingredient_id": ingredient.id,
            "amount": "2"
        })
        item_id = add_response.get_json()["item_id"]

        response = client.delete(f'/api/shopping-list/items/{item_id}', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "Item removed from shopping list"

        deleted_item = db_session.get(ShoppingList, item_id)
        assert deleted_item is None

    def test_delete_item_not_found(self, client, consumer_headers):
        response = client.delete('/api/shopping-list/items/99999', headers=consumer_headers)
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Item not found"


class TestBulkDeleteItems:
    def test_bulk_delete_items_success(self, client, db_session, consumer_headers):
        ing1 = Ingredient(name="BulkDel Apple", default_unit="piece")
        ing2 = Ingredient(name="BulkDel Orange", default_unit="piece")
        db_session.add_all([ing1, ing2])
        db_session.commit()

        add1 = client.post('/api/shopping-list/items', headers=consumer_headers, json={
            "ingredient_id": ing1.id, "amount": "2"
        })
        add2 = client.post('/api/shopping-list/items', headers=consumer_headers, json={
            "ingredient_id": ing2.id, "amount": "3"
        })
        item_ids = [add1.get_json()["item_id"], add2.get_json()["item_id"]]

        response = client.post('/api/shopping-list/items/bulk-delete', headers=consumer_headers, json={
            "item_ids": item_ids
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data["deleted_count"] == 2

        for iid in item_ids:
            assert db_session.get(ShoppingList, iid) is None

    def test_bulk_delete_items_empty(self, client, consumer_headers):
        response = client.post('/api/shopping-list/items/bulk-delete', headers=consumer_headers, json={
            "item_ids": [99998, 99999]
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data["deleted_count"] == 0


class TestAddFromRecipe:
    def test_add_from_recipe_success(self, client, db_session, consumer_headers):
        recipe = Recipe(title="Test Recipe", description="Test Recipe")
        db_session.add(recipe)
        db_session.commit()

        ingredient = Ingredient(name="FromRecipe Ingredient", default_unit="piece")
        db_session.add(ingredient)
        db_session.commit()

        recipe_ingredient = RecipeIngredient(
            recipe_id=recipe.id, ingredient_id=ingredient.id,
            quantity=1, unit="piece"
        )
        db_session.add(recipe_ingredient)
        db_session.commit()

        response = client.post(f'/api/shopping-list/from-recipe/{recipe.id}', headers=consumer_headers)
        assert response.status_code == 201
        data = response.get_json()
        assert "Test Recipe" in data["msg"]
        assert data["added_count"] == 1
        assert data["updated_count"] == 0

        shopping_item = ShoppingList.query.filter_by(ingredient_id=ingredient.id).first()
        assert shopping_item is not None

    def test_add_from_recipe_not_found(self, client, consumer_headers):
        response = client.post('/api/shopping-list/from-recipe/99999', headers=consumer_headers)
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Recipe not found"

    def test_add_from_recipe_unauthorized(self, client):
        response = client.post('/api/shopping-list/from-recipe/1')
        assert response.status_code == 401


class TestAddFromMealPlan:
    def test_add_from_meal_plan_success(self, client, db_session, consumer_headers):
        recipe = Recipe(title="MealPlanTest Recipe", description="Test")
        db_session.add(recipe)
        db_session.commit()

        ingredient = Ingredient(name="MealPlanTest Tomato", default_unit="piece")
        db_session.add(ingredient)
        db_session.commit()

        recipe_ingredient = RecipeIngredient(
            recipe_id=recipe.id, ingredient_id=ingredient.id,
            quantity=2, unit="piece"
        )
        db_session.add(recipe_ingredient)
        db_session.commit()

        today = date.today()
        start_of_week = today - timedelta(days=today.weekday())

        user = User.query.filter_by(role='consumer').first()

        meal_plan = MealPlan(
            user_id=user.id, recipe_id=recipe.id,
            plan_date=start_of_week, meal_type="lunch"
        )
        db_session.add(meal_plan)
        db_session.commit()

        response = client.post('/api/shopping-list/from-meal-plan', headers=consumer_headers, json={})
        assert response.status_code == 201
        data = response.get_json()
        assert "added_count" in data
        assert data["added_count"] == 1

        shopping_item = ShoppingList.query.filter_by(ingredient_id=ingredient.id).first()
        assert shopping_item is not None

    def test_add_from_meal_plan_empty(self, client, consumer_headers):
        response = client.post('/api/shopping-list/from-meal-plan', headers=consumer_headers, json={})
        assert response.status_code == 201
        data = response.get_json()
        assert data["added_count"] == 0


class TestTogglePurchased:
    def test_toggle_purchased_success(self, client, db_session, consumer_headers):
        ingredient = Ingredient(name="ToggleTest Apple", default_unit="piece")
        db_session.add(ingredient)
        db_session.commit()

        add_response = client.post('/api/shopping-list/items', headers=consumer_headers, json={
            "ingredient_id": ingredient.id,
            "amount": "3"
        })
        item_id = add_response.get_json()["item_id"]

        response = client.put(f'/api/shopping-list/items/{item_id}/toggle', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["is_purchased"] is True

        toggled_item = db_session.get(ShoppingList, item_id)
        assert toggled_item.is_purchased is True

    def test_toggle_purchased_not_found(self, client, consumer_headers):
        response = client.put('/api/shopping-list/items/99999/toggle', headers=consumer_headers)
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Item not found"

    def test_toggle_purchased_unauthorized(self, client):
        response = client.put('/api/shopping-list/items/1/toggle')
        assert response.status_code == 401


class TestClearList:
    def test_clear_list_success(self, client, db_session, consumer_headers):
        ingredient = Ingredient(name="ClearTest Banana", default_unit="piece")
        db_session.add(ingredient)
        db_session.commit()

        add_response = client.post('/api/shopping-list/items', headers=consumer_headers, json={
            "ingredient_id": ingredient.id,
            "amount": "3"
        })
        item_id = add_response.get_json()["item_id"]

        response = client.delete('/api/shopping-list/clear', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert "removed" in data["msg"]

        assert db_session.get(ShoppingList, item_id) is None


class TestTransferToFridge:
    def test_transfer_to_fridge_success(self, client, db_session, consumer_headers):
        ingredient = Ingredient(name="TransferTest Orange", default_unit="piece")
        db_session.add(ingredient)
        db_session.commit()

        add_response = client.post('/api/shopping-list/items', headers=consumer_headers, json={
            "ingredient_id": ingredient.id,
            "amount": "5"
        })
        item_id = add_response.get_json()["item_id"]

        client.put(f'/api/shopping-list/items/{item_id}/toggle', headers=consumer_headers)

        response = client.post('/api/shopping-list/transfer-to-fridge', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["transferred_count"] == 1

        fridge_item = FridgeItem.query.filter_by(ingredient_id=ingredient.id).first()
        assert fridge_item is not None

        shopping_item = db_session.get(ShoppingList, item_id)
        assert shopping_item is None

    def test_transfer_to_fridge_empty(self, client, consumer_headers):
        response = client.post('/api/shopping-list/transfer-to-fridge', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "No purchased items to transfer"
        assert data["transferred_count"] == 0


class TestCompareWithFridge:
    def test_compare_with_fridge_success(self, client, db_session, consumer_headers):
        ingredient = Ingredient(name="CompareTest Grape", default_unit="piece")
        db_session.add(ingredient)
        db_session.commit()

        client.post('/api/shopping-list/items', headers=consumer_headers, json={
            "ingredient_id": ingredient.id,
            "amount": "3"
        })

        response = client.post('/api/shopping-list/compare-fridge', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert "comparison" in data
        assert data["total_items"] == 1

    def test_compare_with_fridge_empty(self, client, consumer_headers):
        response = client.post('/api/shopping-list/compare-fridge', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["comparison"] == []
        assert data["total_items"] == 0
