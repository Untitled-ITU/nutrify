import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text
from datetime import date
from backend.app.auth.models import User, VerificationCode
from backend.app.models import (
    Ingredient, Recipe, RecipeIngredient, MealPlan, ShoppingList,
    Favorite, FridgeItem, Rating, RecipeCollection, CollectionItem
)


class TestUserModel:
    def test_user_creation(self, db_session):
        user = User(email="test@example.com", username="testuser", role="consumer")
        user.set_password("password123")
        db_session.add(user)
        db_session.commit()

        assert user.id is not None
        assert user.email == "test@example.com"
        assert user.check_password("password123")

    def test_user_email_unique(self, db_session):
        user1 = User(email="same@example.com", username="user1", role="consumer")
        user1.set_password("pass123")
        db_session.add(user1)
        db_session.commit()

        user2 = User(email="same@example.com", username="user2", role="consumer")
        user2.set_password("pass456")
        db_session.add(user2)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_user_email_not_nullable(self, db_session):
        user = User(username="nomail", role="consumer")
        user.set_password("pass123")
        db_session.add(user)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_user_username_not_nullable(self, db_session):
        user = User(email="test@example.com", role="consumer")
        user.set_password("pass123")
        db_session.add(user)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_user_check_password_wrong(self, db_session):
        user = User(email="pwtest@example.com", username="pwuser", role="consumer")
        user.set_password("correctpassword")
        db_session.add(user)
        db_session.commit()

        assert user.check_password("wrongpassword") is False

    def test_user_set_password_changes_hash(self, db_session):
        user = User(email="hashtest@example.com", username="hashuser", role="consumer")
        user.set_password("password1")
        hash1 = user.password_hash

        user.set_password("password2")
        hash2 = user.password_hash

        assert hash1 != hash2

    def test_user_default_role(self, db_session):
        user = User(email="role@example.com", username="roleuser")
        user.set_password("pass123")
        db_session.add(user)
        db_session.commit()

        assert user.role == "consumer"

    def test_user_created_at_auto(self, db_session):
        user = User(email="time@example.com", username="timeuser", role="consumer")
        user.set_password("pass123")
        db_session.add(user)
        db_session.commit()

        assert user.created_at is not None


class TestIngredientModel:
    def test_ingredient_creation(self, db_session):
        ingredient = Ingredient(name="Tomato", default_unit="piece")
        db_session.add(ingredient)
        db_session.commit()

        assert ingredient.id is not None
        assert ingredient.name == "Tomato"

    def test_ingredient_name_unique(self, db_session):
        ing1 = Ingredient(name="Salt", default_unit="teaspoon")
        db_session.add(ing1)
        db_session.commit()

        ing2 = Ingredient(name="Salt", default_unit="tablespoon")
        db_session.add(ing2)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_ingredient_name_not_nullable(self, db_session):
        ingredient = Ingredient(default_unit="piece")
        db_session.add(ingredient)

        with pytest.raises(IntegrityError):
            db_session.commit()


class TestRecipeModel:
    @pytest.fixture
    def author(self, db_session):
        user = User(email="author@test.com", username="author", role="chef")
        user.set_password("pass123")
        db_session.add(user)
        db_session.commit()
        return user

    def test_recipe_creation(self, db_session, author):
        recipe = Recipe(
            author_id=author.id,
            title="Test Recipe",
            description="A test recipe"
        )
        db_session.add(recipe)
        db_session.commit()

        assert recipe.id is not None
        assert recipe.author == author

    def test_recipe_title_not_nullable(self, db_session, author):
        recipe = Recipe(author_id=author.id)
        db_session.add(recipe)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_recipe_boolean_defaults(self, db_session, author):
        recipe = Recipe(author_id=author.id, title="Vegan Test")
        db_session.add(recipe)
        db_session.commit()

        assert recipe.is_vegan is False
        assert recipe.is_vegetarian is False

    def test_recipe_relationship_to_author(self, db_session, author):
        recipe = Recipe(author_id=author.id, title="Related Recipe")
        db_session.add(recipe)
        db_session.commit()

        assert recipe.author.email == "author@test.com"
        assert recipe in author.recipes


class TestFridgeItemModel:
    @pytest.fixture
    def user_and_ingredient(self, db_session):
        user = User(email="fridge@test.com", username="fridgeuser", role="consumer")
        user.set_password("pass123")
        ingredient = Ingredient(name="Apple", default_unit="piece")
        db_session.add_all([user, ingredient])
        db_session.commit()
        return user, ingredient

    def test_fridge_item_creation(self, db_session, user_and_ingredient):
        user, ingredient = user_and_ingredient
        item = FridgeItem(user_id=user.id, ingredient_id=ingredient.id, quantity=5)
        db_session.add(item)
        db_session.commit()

        assert item.id is not None

    def test_fridge_item_unique_constraint(self, db_session, user_and_ingredient):
        user, ingredient = user_and_ingredient

        item1 = FridgeItem(user_id=user.id, ingredient_id=ingredient.id, quantity=5)
        db_session.add(item1)
        db_session.commit()

        item2 = FridgeItem(user_id=user.id, ingredient_id=ingredient.id, quantity=10)
        db_session.add(item2)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_fridge_item_cascade_delete_user(self, db_session, user_and_ingredient):
        user, ingredient = user_and_ingredient
        item = FridgeItem(user_id=user.id, ingredient_id=ingredient.id, quantity=5)
        db_session.add(item)
        db_session.commit()

        item_id = item.id
        user_id = user.id

        db_session.execute(text("DELETE FROM users WHERE id = :id"), {"id": user_id})
        db_session.commit()

        assert db_session.get(FridgeItem, item_id) is None

    def test_fridge_item_added_at_auto(self, db_session, user_and_ingredient):
        user, ingredient = user_and_ingredient
        item = FridgeItem(user_id=user.id, ingredient_id=ingredient.id, quantity=5)
        db_session.add(item)
        db_session.commit()

        assert item.added_at is not None

    def test_fridge_item_relationship(self, db_session, user_and_ingredient):
        user, ingredient = user_and_ingredient
        item = FridgeItem(user_id=user.id, ingredient_id=ingredient.id, quantity=3)
        db_session.add(item)
        db_session.commit()

        assert item.user.email == "fridge@test.com"
        assert item.ingredient.name == "Apple"
        assert item in user.fridge_items


class TestMealPlanModel:
    @pytest.fixture
    def user_and_recipe(self, db_session):
        user = User(email="planner@test.com", username="planner", role="consumer")
        user.set_password("pass123")
        recipe = Recipe(title="Meal Recipe")
        db_session.add_all([user, recipe])
        db_session.commit()
        return user, recipe

    def test_meal_plan_unique_constraint(self, db_session, user_and_recipe):
        user, recipe = user_and_recipe

        plan1 = MealPlan(
            user_id=user.id, recipe_id=recipe.id,
            plan_date=date(2025, 1, 1), meal_type="breakfast"
        )
        db_session.add(plan1)
        db_session.commit()

        plan2 = MealPlan(
            user_id=user.id, recipe_id=recipe.id,
            plan_date=date(2025, 1, 1), meal_type="breakfast"
        )
        db_session.add(plan2)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_meal_plan_different_meal_types_same_day(self, db_session, user_and_recipe):
        user, recipe = user_and_recipe

        plan1 = MealPlan(
            user_id=user.id, recipe_id=recipe.id,
            plan_date=date(2025, 1, 1), meal_type="breakfast"
        )
        plan2 = MealPlan(
            user_id=user.id, recipe_id=recipe.id,
            plan_date=date(2025, 1, 1), meal_type="lunch"
        )
        db_session.add_all([plan1, plan2])
        db_session.commit()

        assert plan1.id is not None
        assert plan2.id is not None

    def test_meal_plan_cascade_delete_user(self, db_session, user_and_recipe):
        user, recipe = user_and_recipe
        plan = MealPlan(
            user_id=user.id, recipe_id=recipe.id,
            plan_date=date(2025, 1, 1), meal_type="dinner"
        )
        db_session.add(plan)
        db_session.commit()

        plan_id = plan.id
        user_id = user.id

        db_session.execute(text("DELETE FROM users WHERE id = :id"), {"id": user_id})
        db_session.commit()

        assert db_session.get(MealPlan, plan_id) is None

    def test_meal_plan_relationships(self, db_session, user_and_recipe):
        user, recipe = user_and_recipe
        plan = MealPlan(
            user_id=user.id, recipe_id=recipe.id,
            plan_date=date(2025, 2, 1), meal_type="snack"
        )
        db_session.add(plan)
        db_session.commit()

        assert plan.user.email == "planner@test.com"
        assert plan.recipe.title == "Meal Recipe"
        assert plan in user.meal_plans


class TestFavoriteModel:
    @pytest.fixture
    def user_and_recipe(self, db_session):
        user = User(email="faver@test.com", username="faver", role="consumer")
        user.set_password("pass123")
        recipe = Recipe(title="Fav Recipe")
        db_session.add_all([user, recipe])
        db_session.commit()
        return user, recipe

    def test_favorite_unique_constraint(self, db_session, user_and_recipe):
        user, recipe = user_and_recipe

        fav1 = Favorite(user_id=user.id, recipe_id=recipe.id)
        db_session.add(fav1)
        db_session.commit()

        fav2 = Favorite(user_id=user.id, recipe_id=recipe.id)
        db_session.add(fav2)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_favorite_cascade_delete_recipe(self, db_session, user_and_recipe):
        user, recipe = user_and_recipe
        fav = Favorite(user_id=user.id, recipe_id=recipe.id)
        db_session.add(fav)
        db_session.commit()

        fav_id = fav.id
        recipe_id = recipe.id

        db_session.execute(text("DELETE FROM recipe WHERE id = :id"), {"id": recipe_id})
        db_session.commit()

        assert db_session.get(Favorite, fav_id) is None

    def test_favorite_relationships(self, db_session, user_and_recipe):
        user, recipe = user_and_recipe
        fav = Favorite(user_id=user.id, recipe_id=recipe.id)
        db_session.add(fav)
        db_session.commit()

        assert fav.user.email == "faver@test.com"
        assert fav.recipe.title == "Fav Recipe"
        assert fav in user.favorites
        assert fav in recipe.favorites


class TestRatingModel:
    @pytest.fixture
    def user_and_recipe(self, db_session):
        user = User(email="rater@test.com", username="rater", role="consumer")
        user.set_password("pass123")
        recipe = Recipe(title="Rate Recipe")
        db_session.add_all([user, recipe])
        db_session.commit()
        return user, recipe

    def test_rating_unique_constraint(self, db_session, user_and_recipe):
        user, recipe = user_and_recipe

        rating1 = Rating(user_id=user.id, recipe_id=recipe.id, score=5)
        db_session.add(rating1)
        db_session.commit()

        rating2 = Rating(user_id=user.id, recipe_id=recipe.id, score=3)
        db_session.add(rating2)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_rating_score_not_nullable(self, db_session, user_and_recipe):
        user, recipe = user_and_recipe
        rating = Rating(user_id=user.id, recipe_id=recipe.id)
        db_session.add(rating)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_rating_relationship(self, db_session, user_and_recipe):
        user, recipe = user_and_recipe
        rating = Rating(user_id=user.id, recipe_id=recipe.id, score=5, comment="Great!")
        db_session.add(rating)
        db_session.commit()

        assert rating.user.email == "rater@test.com"
        assert rating.recipe.title == "Rate Recipe"
        assert rating in user.ratings
        assert rating in recipe.ratings

    def test_rating_update_comment(self, db_session, user_and_recipe):
        user, recipe = user_and_recipe
        rating = Rating(user_id=user.id, recipe_id=recipe.id, score=3)
        db_session.add(rating)
        db_session.commit()

        rating.comment = "Updated comment"
        rating.score = 4
        db_session.commit()

        assert rating.comment == "Updated comment"
        assert rating.score == 4

    def test_rating_score_check_constraint(self, db_session, user_and_recipe):
        user, recipe = user_and_recipe
        rating = Rating(user_id=user.id, recipe_id=recipe.id, score=0)
        db_session.add(rating)

        with pytest.raises(IntegrityError):
            db_session.commit()


class TestRecipeCollectionModel:
    @pytest.fixture
    def user(self, db_session):
        user = User(email="collector@test.com", username="collector", role="consumer")
        user.set_password("pass123")
        db_session.add(user)
        db_session.commit()
        return user

    def test_collection_name_unique_per_user(self, db_session, user):
        coll1 = RecipeCollection(user_id=user.id, name="Favorites")
        db_session.add(coll1)
        db_session.commit()

        coll2 = RecipeCollection(user_id=user.id, name="Favorites")
        db_session.add(coll2)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_collection_cascade_delete_items(self, db_session, user):
        recipe = Recipe(title="Collection Recipe")
        collection = RecipeCollection(user_id=user.id, name="My Collection")
        db_session.add_all([recipe, collection])
        db_session.commit()

        item = CollectionItem(collection_id=collection.id, recipe_id=recipe.id)
        db_session.add(item)
        db_session.commit()

        db_session.delete(collection)
        db_session.commit()

        remaining = CollectionItem.query.filter_by(recipe_id=recipe.id).first()
        assert remaining is None


class TestRecipeIngredientModel:
    def test_recipe_ingredient_cascade_delete(self, db_session):
        user = User(email="chef@test.com", username="chef", role="chef")
        user.set_password("pass123")
        ingredient = Ingredient(name="Onion", default_unit="piece")
        recipe = Recipe(title="Onion Soup", author_id=None)
        db_session.add_all([user, ingredient, recipe])
        db_session.commit()

        ri = RecipeIngredient(
            recipe_id=recipe.id,
            ingredient_id=ingredient.id,
            quantity=2,
            unit="piece"
        )
        db_session.add(ri)
        db_session.commit()

        db_session.delete(recipe)
        db_session.commit()

        remaining = RecipeIngredient.query.filter_by(ingredient_id=ingredient.id).first()
        assert remaining is None

    def test_recipe_ingredient_composite_key(self, db_session):
        ingredient = Ingredient(name="Garlic", default_unit="piece")
        recipe = Recipe(title="Garlic Bread")
        db_session.add_all([ingredient, recipe])
        db_session.commit()

        ri = RecipeIngredient(
            recipe_id=recipe.id,
            ingredient_id=ingredient.id,
            quantity=3
        )
        db_session.add(ri)
        db_session.commit()

        found = RecipeIngredient.query.filter_by(
            recipe_id=recipe.id,
            ingredient_id=ingredient.id
        ).first()
        assert found.quantity == 3

    def test_recipe_ingredient_relationships(self, db_session):
        ingredient = Ingredient(name="Butter", default_unit="tablespoon")
        recipe = Recipe(title="Buttered Toast")
        db_session.add_all([ingredient, recipe])
        db_session.commit()

        ri = RecipeIngredient(
            recipe_id=recipe.id,
            ingredient_id=ingredient.id,
            quantity=2,
            unit="tablespoon"
        )
        db_session.add(ri)
        db_session.commit()

        assert ri.recipe.title == "Buttered Toast"
        assert ri.ingredient.name == "Butter"
        assert ri in recipe.ingredients


class TestCollectionItemModel:
    @pytest.fixture
    def user_collection_recipe(self, db_session):
        user = User(email="collector2@test.com", username="collector2", role="consumer")
        user.set_password("pass123")
        recipe = Recipe(title="Collection Test Recipe")
        collection = RecipeCollection(user_id=None, name="Test Collection")
        db_session.add_all([user, recipe])
        db_session.commit()
        collection.user_id = user.id
        db_session.add(collection)
        db_session.commit()
        return user, collection, recipe

    def test_collection_item_creation(self, db_session, user_collection_recipe):
        user, collection, recipe = user_collection_recipe
        item = CollectionItem(collection_id=collection.id, recipe_id=recipe.id)
        db_session.add(item)
        db_session.commit()

        assert item.added_at is not None

    def test_collection_item_composite_key(self, db_session, user_collection_recipe):
        user, collection, recipe = user_collection_recipe
        item = CollectionItem(collection_id=collection.id, recipe_id=recipe.id)
        db_session.add(item)
        db_session.commit()

        item2 = CollectionItem(collection_id=collection.id, recipe_id=recipe.id)
        db_session.add(item2)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_collection_item_relationships(self, db_session, user_collection_recipe):
        user, collection, recipe = user_collection_recipe
        item = CollectionItem(collection_id=collection.id, recipe_id=recipe.id)
        db_session.add(item)
        db_session.commit()

        assert item.collection.name == "Test Collection"
        assert item.recipe.title == "Collection Test Recipe"

    def test_collection_item_to_dict(self, db_session, user_collection_recipe):
        user, collection, recipe = user_collection_recipe
        item = CollectionItem(collection_id=collection.id, recipe_id=recipe.id)
        db_session.add(item)
        db_session.commit()

        data = item.to_dict()
        assert data['recipe_id'] == recipe.id
        assert data['recipe_title'] == "Collection Test Recipe"
        assert 'added_at' in data


class TestVerificationCodeModel:
    def test_verification_code_creation(self, db_session):
        from datetime import datetime, timezone, timedelta

        code = VerificationCode(
            email="verify@test.com",
            code="123456",
            purpose="registration",
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)
        )
        db_session.add(code)
        db_session.commit()

        assert code.id is not None
        assert code.code == "123456"

    def test_verification_code_email_not_nullable(self, db_session):
        from datetime import datetime, timezone, timedelta

        code = VerificationCode(
            code="123456",
            purpose="registration",
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)
        )
        db_session.add(code)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_verification_code_is_valid(self, db_session):
        from datetime import datetime, timezone, timedelta

        valid_code = VerificationCode(
            email="valid@test.com",
            code="123456",
            purpose="registration",
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)
        )
        db_session.add(valid_code)
        db_session.commit()

        assert valid_code.is_valid() is True

    def test_verification_code_expired(self, db_session):
        from datetime import datetime, timezone, timedelta

        expired_code = VerificationCode(
            email="expired@test.com",
            code="654321",
            purpose="registration",
            expires_at=datetime.now(timezone.utc) - timedelta(minutes=10)
        )
        db_session.add(expired_code)
        db_session.commit()

        assert expired_code.is_valid() is False

    def test_verification_code_used(self, db_session):
        from datetime import datetime, timezone, timedelta

        used_code = VerificationCode(
            email="used@test.com",
            code="111111",
            purpose="registration",
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
            used=True
        )
        db_session.add(used_code)
        db_session.commit()

        assert used_code.is_valid() is False

    def test_generate_code_length(self, db_session):
        code = VerificationCode.generate_code()
        assert len(code) == 6
        assert code.isdigit()


class TestShoppingListModel:
    @pytest.fixture
    def user_and_ingredient(self, db_session):
        user = User(email="shopper@test.com", username="shopper", role="consumer")
        user.set_password("pass123")
        ingredient = Ingredient(name="Milk", default_unit="cup")
        db_session.add_all([user, ingredient])
        db_session.commit()
        return user, ingredient

    def test_shopping_list_creation(self, db_session, user_and_ingredient):
        user, ingredient = user_and_ingredient
        item = ShoppingList(
            user_id=user.id,
            ingredient_id=ingredient.id,
            amount="2",
            unit="cup"
        )
        db_session.add(item)
        db_session.commit()

        assert item.id is not None
        assert item.is_purchased is False

    def test_shopping_list_user_not_nullable(self, db_session, user_and_ingredient):
        user, ingredient = user_and_ingredient
        item = ShoppingList(ingredient_id=ingredient.id, amount="1")
        db_session.add(item)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_shopping_list_cascade_delete_user(self, db_session, user_and_ingredient):
        user, ingredient = user_and_ingredient
        item = ShoppingList(
            user_id=user.id,
            ingredient_id=ingredient.id,
            amount="3"
        )
        db_session.add(item)
        db_session.commit()

        item_id = item.id
        user_id = user.id

        db_session.execute(text("DELETE FROM users WHERE id = :id"), {"id": user_id})
        db_session.commit()

        assert db_session.get(ShoppingList, item_id) is None

    def test_shopping_list_toggle_purchased(self, db_session, user_and_ingredient):
        user, ingredient = user_and_ingredient
        item = ShoppingList(
            user_id=user.id,
            ingredient_id=ingredient.id,
            amount="1"
        )
        db_session.add(item)
        db_session.commit()

        assert item.is_purchased is False

        item.is_purchased = True
        db_session.commit()

        assert item.is_purchased is True

    def test_shopping_list_source_type(self, db_session, user_and_ingredient):
        user, ingredient = user_and_ingredient

        item = ShoppingList(
            user_id=user.id,
            ingredient_id=ingredient.id,
            amount="1",
            source_type="recipe",
            source_id=123
        )
        db_session.add(item)
        db_session.commit()

        assert item.source_type == "recipe"
        assert item.source_id == 123
