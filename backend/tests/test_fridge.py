from backend.app.models import Ingredient, FridgeItem


class TestGetFridgeItems:
    def test_get_fridge_items_empty(self, client, consumer_headers):
        response = client.get('/api/fridge', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["items"] == []
        assert data["total"] == 0

    def test_get_fridge_items_success(self, client, db_session, consumer_headers):
        ingredient = Ingredient(name="TestGetItems Apple", default_unit="piece")
        db_session.add(ingredient)
        db_session.commit()

        client.post('/api/fridge', headers=consumer_headers, json={
            "ingredient_id": ingredient.id,
            "quantity": 5,
            "unit": "piece"
        })

        response = client.get('/api/fridge', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] == 1
        assert len(data["items"]) == 1

    def test_get_fridge_items_unauthorized(self, client):
        response = client.get('/api/fridge')
        assert response.status_code == 401


class TestAddFridgeItem:
    def test_add_fridge_item_by_id(self, client, db_session, consumer_headers):
        ingredient = Ingredient.query.first()
        if not ingredient:
            ingredient = Ingredient(name="Test Tomato", default_unit="piece")
            db_session.add(ingredient)
            db_session.commit()

        response = client.post('/api/fridge', headers=consumer_headers, json={
            "ingredient_id": ingredient.id,
            "quantity": 5,
            "unit": "piece"
        })
        assert response.status_code == 201
        data = response.get_json()
        assert data["msg"] == "Item added to fridge"
        assert "item" in data

    def test_add_fridge_item_by_name(self, client, db_session, consumer_headers):
        ingredient = Ingredient.query.filter_by(name="Salt").first()
        if not ingredient:
            ingredient = Ingredient(name="Salt", default_unit="teaspoon")
            db_session.add(ingredient)
            db_session.commit()

        response = client.post('/api/fridge', headers=consumer_headers, json={
            "ingredient_name": "Salt",
            "quantity": 2,
            "unit": "teaspoon"
        })
        assert response.status_code == 201
        data = response.get_json()
        assert data["msg"] == "Item added to fridge"

    def test_add_fridge_item_not_found(self, client, consumer_headers):
        response = client.post('/api/fridge', headers=consumer_headers, json={
            "ingredient_id": 99999,
            "quantity": 5
        })
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Ingredient not found"

    def test_add_fridge_item_unauthorized(self, client):
        response = client.post('/api/fridge')
        assert response.status_code == 422

    def test_add_fridge_item_duplicate(self, client, db_session, consumer_headers):
        ingredient = Ingredient.query.first()
        if not ingredient:
            ingredient = Ingredient(name="Test Ingredient", default_unit="piece")
            db_session.add(ingredient)
            db_session.commit()

        client.post('/api/fridge', headers=consumer_headers, json={
            "ingredient_id": ingredient.id,
            "quantity": 5,
            "unit": "piece"
        })

        response = client.post('/api/fridge', headers=consumer_headers, json={
            "ingredient_id": ingredient.id,
            "quantity": 5,
            "unit": "piece"
        })
        assert response.status_code == 409
        data = response.get_json()
        assert data["msg"] == "Ingredient already in fridge. Use PUT to update."


class TestUpdateFridgeItem:
    def test_update_fridge_item_by_id(self, client, db_session, consumer_headers):
        ingredient = Ingredient.query.first()
        if not ingredient:
            ingredient = Ingredient(name="Test Ingredient", default_unit="piece")
            db_session.add(ingredient)
            db_session.commit()

        add_response = client.post('/api/fridge', headers=consumer_headers, json={
            "ingredient_id": ingredient.id,
            "quantity": 5,
            "unit": "piece"
        })
        item_id = add_response.get_json()["item"]["id"]

        response = client.put(f'/api/fridge/{item_id}', headers=consumer_headers, json={
            "quantity": 10,
            "unit": "piece"
        })
        assert response.status_code == 200

        updated_item = db_session.get(FridgeItem, item_id)
        assert updated_item.quantity == 10

    def test_update_fridge_item_not_found(self, client, db_session, consumer_headers):
        ingredient = Ingredient.query.first()
        if not ingredient:
            ingredient = Ingredient(name="Test Ingredient", default_unit="piece")
            db_session.add(ingredient)
            db_session.commit()

        response = client.put(f'/api/fridge/{ingredient.id}', headers=consumer_headers, json={
            "quantity": 10,
            "unit": "piece"
        })
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Item not found"

    def test_update_fridge_item_wrong_user(self, client, db_session, consumer_headers, chef_headers):
        ingredient = Ingredient(name="WrongUserTest Apple", default_unit="piece")
        db_session.add(ingredient)
        db_session.commit()

        add_response = client.post('/api/fridge', headers=chef_headers, json={
            "ingredient_id": ingredient.id,
            "quantity": 5,
            "unit": "piece"
        })
        item_id = add_response.get_json()["item"]["id"]

        response = client.put(f'/api/fridge/{item_id}', headers=consumer_headers, json={
            "quantity": 10,
            "unit": "piece"
        })
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Item not found"


class TestDeleteFridgeItem:
    def test_delete_fridge_item_by_id(self, client, db_session, consumer_headers):
        ingredient = Ingredient.query.first()
        if not ingredient:
            ingredient = Ingredient(name="Test Ingredient", default_unit="piece")
            db_session.add(ingredient)
            db_session.commit()

        add_response = client.post('/api/fridge', headers=consumer_headers, json={
            "ingredient_id": ingredient.id,
            "quantity": 5,
            "unit": "piece"
        })
        item_id = add_response.get_json()["item"]["id"]

        response = client.delete(f'/api/fridge/{item_id}', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "Item removed from fridge"

        deleted_item = db_session.get(FridgeItem, item_id)
        assert deleted_item is None

    def test_delete_fridge_item_not_found(self, client, db_session, consumer_headers):
        ingredient = Ingredient.query.first()
        if not ingredient:
            ingredient = Ingredient(name="Test Ingredient", default_unit="piece")
            db_session.add(ingredient)
            db_session.commit()

        response = client.delete(f'/api/fridge/{ingredient.id}', headers=consumer_headers)
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Item not found"


class TestBatchAddItems:
    def test_batch_add_items_success(self, client, db_session, consumer_headers):
        ing1 = Ingredient(name="BatchTest Apple", default_unit="piece")
        ing2 = Ingredient(name="BatchTest Orange", default_unit="piece")
        db_session.add_all([ing1, ing2])
        db_session.commit()

        response = client.post('/api/fridge/batch', headers=consumer_headers, json={
            "items": [
                {"ingredient_id": ing1.id, "quantity": 5, "unit": "piece"},
                {"ingredient_id": ing2.id, "quantity": 3, "unit": "piece"}
            ]
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data["added"] == 2
        assert data["updated"] == 0
        assert data["errors"] == []

        item1 = FridgeItem.query.filter_by(ingredient_id=ing1.id).first()
        item2 = FridgeItem.query.filter_by(ingredient_id=ing2.id).first()
        assert item1.quantity == 5
        assert item2.quantity == 3

    def test_batch_add_items_with_errors(self, client, db_session, consumer_headers):
        ingredient = Ingredient(name="BatchTest Banana", default_unit="piece")
        db_session.add(ingredient)
        db_session.commit()

        response = client.post('/api/fridge/batch', headers=consumer_headers, json={
            "items": [
                {"ingredient_id": ingredient.id, "quantity": 2, "unit": "piece"},
                {"ingredient_id": 99999, "quantity": 5, "unit": "piece"}
            ]
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data["added"] == 1
        assert len(data["errors"]) == 1
        assert "Ingredient not found" in data["errors"]

    def test_batch_add_items_updates_existing(self, client, db_session, consumer_headers):
        ingredient = Ingredient(name="BatchTest Grape", default_unit="piece")
        db_session.add(ingredient)
        db_session.commit()

        client.post('/api/fridge', headers=consumer_headers, json={
            "ingredient_id": ingredient.id,
            "quantity": 5,
            "unit": "piece"
        })

        response = client.post('/api/fridge/batch', headers=consumer_headers, json={
            "items": [
                {"ingredient_id": ingredient.id, "quantity": 3, "unit": "piece"}
            ]
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data["added"] == 0
        assert data["updated"] == 1

        updated_item = FridgeItem.query.filter_by(ingredient_id=ingredient.id).first()
        assert updated_item.quantity == 8


class TestClearFridge:
    def test_clear_fridge_empty(self, client, consumer_headers):
        response = client.delete('/api/fridge/clear', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert "Cleared" in data["msg"]

    def test_clear_fridge_unauthorized(self, client):
        response = client.delete('/api/fridge/clear')
        assert response.status_code == 401


class TestFridgeStats:
    def test_get_fridge_stats(self, client, consumer_headers):
        response = client.get('/api/fridge/stats', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert "total_items" in data
        assert "recently_added" in data

    def test_get_fridge_stats_unauthorized(self, client):
        response = client.get('/api/fridge/stats')
        assert response.status_code == 401


class TestFridgeSearch:
    def test_search_fridge(self, client, consumer_headers):
        response = client.get('/api/fridge/search?q=tomato', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert "items" in data
        assert "total" in data

    def test_search_fridge_no_query(self, client, consumer_headers):
        response = client.get('/api/fridge/search', headers=consumer_headers)
        assert response.status_code == 422

    def test_search_fridge_finds_added_item(self, client, db_session, consumer_headers):
        ingredient = Ingredient(name="Red Apple Fresh", default_unit="piece")
        db_session.add(ingredient)
        db_session.commit()

        client.post('/api/fridge', headers=consumer_headers, json={
            "ingredient_id": ingredient.id,
            "quantity": 5,
            "unit": "piece"
        })

        response = client.get('/api/fridge/search?q=Apple', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] == 1
        names = [item["ingredient"]["name"] for item in data["items"]]
        assert any("Apple" in name for name in names)

    def test_search_fridge_multiple_items(self, client, db_session, consumer_headers):
        ing1 = Ingredient(name="Organic Banana", default_unit="piece")
        ing2 = Ingredient(name="Banana Chips", default_unit="cup")
        ing3 = Ingredient(name="Orange Juice", default_unit="cup")
        db_session.add_all([ing1, ing2, ing3])
        db_session.commit()

        for ing in [ing1, ing2, ing3]:
            client.post('/api/fridge', headers=consumer_headers, json={
                "ingredient_id": ing.id,
                "quantity": 2,
                "unit": ing.default_unit
            })

        response = client.get('/api/fridge/search?q=Banana', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] == 2
        names = [item["ingredient"]["name"] for item in data["items"]]
        assert "Organic Banana" in names
        assert "Banana Chips" in names
        assert "Orange Juice" not in names
