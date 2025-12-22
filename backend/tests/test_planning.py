from datetime import datetime, timedelta
from backend.app.models import MealPlan, Recipe, Ingredient, RecipeIngredient, FridgeItem
from backend.app.auth.models import User


class TestGetWeeklyPlan:
    def test_get_weekly_plan_empty(self, client, consumer_headers):
        response = client.get('/api/planning/weekly', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert "days" in data

    def test_get_weekly_plan_unauthorized(self, client):
        response = client.get('/api/planning/weekly')
        assert response.status_code == 401

    def test_get_weekly_plan_success(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        recipe = Recipe(title="Weekly Meal", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        today = datetime.now().date()
        start_date = today - timedelta(days=today.weekday())

        meal = MealPlan(
            user_id=user.id, plan_date=start_date,
            meal_type="lunch", recipe_id=recipe.id
        )
        db_session.add(meal)
        db_session.commit()

        response = client.get(
            f'/api/planning/weekly?start_date={start_date.isoformat()}',
            headers=consumer_headers
        )
        assert response.status_code == 200
        data = response.get_json()

        days = data["days"]
        monday = next(d for d in days if d["day_name"] == "Monday")
        assert monday["meals"]["lunch"]["recipe"]["title"] == "Weekly Meal"


class TestAddMeal:
    def test_add_meal_recipe_not_found(self, client, consumer_headers):
        response = client.post('/api/planning/meals', headers=consumer_headers, json={
            "recipe_id": 99999,
            "plan_date": "2025-01-01",
            "meal_type": "lunch"
        })
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Recipe not found"

    def test_add_meal_success(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        recipe = Recipe(title="New Meal", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        plan_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')

        response = client.post('/api/planning/meals', headers=consumer_headers, json={
            "recipe_id": recipe.id,
            "plan_date": plan_date,
            "meal_type": "dinner"
        })
        assert response.status_code == 201
        data = response.get_json()
        assert data["msg"] == "Meal added to plan"
        meal_plan_id = data["meal_plan_id"]

        meal_plan = db_session.get(MealPlan, meal_plan_id)
        assert meal_plan.recipe_id == recipe.id
        assert meal_plan.meal_type == "dinner"
        assert meal_plan.user_id == user.id

    def test_add_meal_update_existing(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        recipe1 = Recipe(title="Meal 1", author_id=chef.id)
        recipe2 = Recipe(title="Meal 2", author_id=chef.id)
        db_session.add_all([recipe1, recipe2])
        db_session.commit()

        plan_date = (datetime.now() + timedelta(days=2)).date()

        meal = MealPlan(
            user_id=user.id, plan_date=plan_date,
            meal_type="lunch", recipe_id=recipe1.id
        )
        db_session.add(meal)
        db_session.commit()
        meal_id_orig = meal.id

        response = client.post('/api/planning/meals', headers=consumer_headers, json={
            "recipe_id": recipe2.id,
            "plan_date": plan_date.isoformat(),
            "meal_type": "lunch"
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "Meal plan updated"

        meal_plan = db_session.get(MealPlan, meal_id_orig)
        assert meal_plan.recipe_id == recipe2.id

    def test_add_meal_unauthorized(self, client):
        response = client.post('/api/planning/meals')
        assert response.status_code == 422

    def test_add_meal_wrong_type(self, client, db_session, consumer_headers, chef_user):
        chef = chef_user
        recipe = Recipe(title="New Meal", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        plan_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')

        response = client.post('/api/planning/meals', headers=consumer_headers, json={
            "recipe_id": recipe.id,
            "plan_date": plan_date,
            "meal_type": "invalid"
        })
        assert response.status_code == 422
        data = response.get_json()
        assert "String should match pattern" in data[0]["msg"]

    def test_add_meal_missing_type(self, client, db_session, consumer_headers, chef_user):
        chef = chef_user
        recipe = Recipe(title="New Meal", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        plan_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')

        response = client.post('/api/planning/meals', headers=consumer_headers, json={
            "recipe_id": recipe.id,
            "plan_date": plan_date,
        })
        assert response.status_code == 422
        data = response.get_json()
        assert data[0]["msg"] == "Field required"


class TestUpdateMeal:
    def test_update_meal_not_found(self, client, consumer_headers):
        response = client.put('/api/planning/meals/99999', headers=consumer_headers, json={
            "meal_type": "dinner"
        })
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Meal plan not found"

    def test_update_meal_recipe_not_found(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        recipe = Recipe(title="Old Meal", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        meal = MealPlan(
            user_id=user.id, plan_date="2025-01-01",
            meal_type="breakfast", recipe_id=recipe.id
        )
        db_session.add(meal)
        db_session.commit()
        meal_id = meal.id

        response = client.put(f'/api/planning/meals/{meal_id}', headers=consumer_headers, json={
            "recipe_id": 99999,
            "meal_type": "dinner"
        })
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Recipe not found"

    def test_update_meal_success(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        recipe = Recipe(title="Old Meal", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        meal = MealPlan(
            user_id=user.id, plan_date="2025-01-01",
            meal_type="breakfast", recipe_id=recipe.id
        )
        db_session.add(meal)
        db_session.commit()
        meal_id = meal.id

        response = client.put(f'/api/planning/meals/{meal_id}', headers=consumer_headers, json={
            "meal_type": "snack"
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "Meal plan updated"

        updated_meal = db_session.get(MealPlan, meal_id)
        assert updated_meal.meal_type == "snack"

    def test_update_meal_forbidden(self, client, db_session, consumer_headers, chef_user):
        chef = chef_user
        recipe = Recipe(title="Chef's Meal", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        meal = MealPlan(
            user_id=chef.id, plan_date="2025-01-01",
            meal_type="dinner", recipe_id=recipe.id
        )
        db_session.add(meal)
        db_session.commit()

        response = client.put(f'/api/planning/meals/{meal.id}', headers=consumer_headers, json={
            "meal_type": "lunch"
        })
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Meal plan not found"


class TestDeleteMeal:
    def test_delete_meal_not_found(self, client, consumer_headers):
        response = client.delete('/api/planning/meals/99999', headers=consumer_headers)
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Meal plan not found"

    def test_delete_meal_success(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        recipe = Recipe(title="Delete Me", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        meal = MealPlan(
            user_id=user.id, plan_date="2025-01-05",
            meal_type="lunch", recipe_id=recipe.id
        )
        db_session.add(meal)
        db_session.commit()
        meal_id = meal.id

        response = client.delete(f'/api/planning/meals/{meal_id}', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "Meal removed from plan"

        deleted_meal = db_session.get(MealPlan, meal_id)
        assert deleted_meal is None

    def test_delete_meal_forbidden(self, client, db_session, consumer_headers, chef_user):
        chef = chef_user
        recipe = Recipe(title="Chef's Meal", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        meal = MealPlan(
            user_id=chef.id, plan_date="2025-01-05",
            meal_type="dinner", recipe_id=recipe.id
        )
        db_session.add(meal)
        db_session.commit()

        response = client.delete(f'/api/planning/meals/{meal.id}', headers=consumer_headers)
        assert response.status_code == 404
        data = response.get_json()
        assert data["msg"] == "Meal plan not found"


class TestMissingIngredients:
    def test_get_missing_ingredients_empty(self, client, consumer_headers):
        response = client.get('/api/planning/missing-ingredients', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert "missing_ingredients" in data

    def test_get_missing_ingredients_success(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user

        ing_tomato = Ingredient(name="Tomato", default_unit="piece")
        ing_onion = Ingredient(name="Onion", default_unit="piece")
        db_session.add_all([ing_tomato, ing_onion])
        db_session.commit()

        recipe = Recipe(title="Salad", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        ri1 = RecipeIngredient(
            recipe_id=recipe.id, ingredient_id=ing_tomato.id,
            quantity=2, unit="piece"
        )
        ri2 = RecipeIngredient(
            recipe_id=recipe.id, ingredient_id=ing_onion.id,
            quantity=1, unit="piece"
        )
        db_session.add_all([ri1, ri2])
        db_session.commit()

        today = datetime.now().date()
        meal = MealPlan(
            user_id=user.id, plan_date=today,
            meal_type="lunch", recipe_id=recipe.id
        )
        db_session.add(meal)
        db_session.commit()

        fridge_item = FridgeItem(
            user_id=user.id, ingredient_id=ing_tomato.id,
            quantity=1, unit="piece"
        )
        db_session.add(fridge_item)
        db_session.commit()

        response = client.get(
            f'/api/planning/missing-ingredients?start_date={today.isoformat()}',
            headers=consumer_headers
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["total_ingredients"] == 2
        assert data["available_count"] == 1
        assert data["unavailable_count"] == 1

        missing = data["missing_ingredients"]
        assert len(missing) == 2

        tomato = next(m for m in missing if m["name"] == "Tomato")
        assert tomato["is_available"] is True
        assert tomato["is_sufficient"] is False
        assert tomato["needed_total"] == 2
        assert tomato["in_fridge"] == 1

        onion = next(m for m in missing if m["name"] == "Onion")
        assert onion["is_available"] is False
        assert onion["is_sufficient"] is False
        assert onion["needed_total"] == 1
        assert onion["in_fridge"] is None


class TestBulkImport:
    def test_bulk_import_meals(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        recipe1 = Recipe(title="Bulk 1", author_id=chef.id)
        recipe2 = Recipe(title="Bulk 2", author_id=chef.id)
        db_session.add_all([recipe1, recipe2])
        db_session.commit()

        response = client.post('/api/planning/bulk-import', headers=consumer_headers, json={
            "meals": [
                {
                    "plan_date": "2025-01-10",
                    "meal_type": "breakfast",
                    "recipe_id": recipe1.id
                },
                {
                    "plan_date": "2025-01-11",
                    "meal_type": "lunch",
                    "recipe_id": recipe2.id
                }
            ]
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data["msg"] == "Bulk import completed"
        assert data["added"] == 2

        meals = MealPlan.query.filter_by(user_id=user.id).all()
        assert len(meals) == 2
        assert any(m.recipe_id == recipe1.id for m in meals)

    def test_bulk_import_with_failures(self, client, db_session, consumer_headers, chef_user):
        chef = chef_user
        recipe = Recipe(title="Bulk Valid", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        response = client.post('/api/planning/bulk-import', headers=consumer_headers, json={
            "meals": [
                {
                    "plan_date": "2025-01-12",
                    "meal_type": "breakfast",
                    "recipe_id": recipe.id
                },
                {
                    "plan_date": "2025-01-12",
                    "meal_type": "lunch",
                    "recipe_id": 99999
                }
            ]
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data["added"] == 1
        assert len(data["errors"]) == 1
        assert "Recipe not found" in data["errors"][0]

    def test_bulk_import_updates_existing(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        recipe1 = Recipe(title="Old Bulk", author_id=chef.id)
        recipe2 = Recipe(title="New Bulk", author_id=chef.id)
        db_session.add_all([recipe1, recipe2])
        db_session.commit()

        plan_date = datetime.now().date()
        meal = MealPlan(
            user_id=user.id, plan_date=plan_date,
            meal_type="dinner", recipe_id=recipe1.id
        )
        db_session.add(meal)
        db_session.commit()
        meal_id = meal.id

        response = client.post('/api/planning/bulk-import', headers=consumer_headers, json={
            "meals": [
                {
                    "plan_date": "2025-01-12",
                    "meal_type": "lunch",
                    "recipe_id": 99999
                },
                {
                    "plan_date": plan_date.isoformat(),
                    "meal_type": "dinner",
                    "recipe_id": recipe2.id
                }
            ]
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data["updated"] == 1
        assert len(data["errors"]) == 1

        updated_meal = db_session.get(MealPlan, meal_id)
        assert updated_meal.recipe_id == recipe2.id


class TestClearWeek:
    def test_clear_week(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        recipe = Recipe(title="Clear Me", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        today = datetime.now().date()
        start_date = today - timedelta(days=today.weekday())

        meal = MealPlan(
            user_id=user.id, plan_date=start_date,
            meal_type="dinner", recipe_id=recipe.id
        )
        db_session.add(meal)
        db_session.commit()
        meal_id = meal.id

        response = client.delete(
            f'/api/planning/clear-week?start_date={start_date.isoformat()}',
            headers=consumer_headers
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["deleted_count"] == 1

        deleted_meal = db_session.get(MealPlan, meal_id)
        assert deleted_meal is None


class TestPlanningStats:
    def test_get_planning_stats(self, client, db_session, consumer_headers, chef_user):
        user = User.query.filter_by(role='consumer').first()
        chef = chef_user
        recipe = Recipe(title="Stats Meal", author_id=chef.id)
        db_session.add(recipe)
        db_session.commit()

        m1 = MealPlan(
            user_id=user.id, plan_date="2025-01-01",
            meal_type="breakfast", recipe_id=recipe.id
        )
        m2 = MealPlan(
            user_id=user.id, plan_date="2025-01-01",
            meal_type="lunch", recipe_id=recipe.id
        )
        db_session.add_all([m1, m2])
        db_session.commit()

        response = client.get('/api/planning/stats', headers=consumer_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["total_plans"] == 2
        assert data["plans_with_recipes"] == 2
        assert data["meal_type_distribution"]["breakfast"] == 1
        assert data["meal_type_distribution"]["lunch"] == 1

    def test_get_planning_stats_unauthorized(self, client):
        response = client.get('/api/planning/stats')
        assert response.status_code == 401
