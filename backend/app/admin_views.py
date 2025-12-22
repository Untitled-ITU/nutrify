from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from wtforms import PasswordField
from werkzeug.security import generate_password_hash

from ..extensions import db
from .auth.models import User, VerificationCode
from .models import (
    Recipe, Ingredient, RecipeIngredient, MealPlan,
    ShoppingList, Favorite, FridgeItem, Rating,
    RecipeCollection, CollectionItem, ChefProfile
)


class UserModelView(ModelView):
    column_list = ['id', 'username', 'email', 'role', 'created_at']
    column_searchable_list = ['username', 'email']
    column_filters = ['role', 'created_at']
    column_sortable_list = ['id', 'username', 'email', 'role', 'created_at']
    form_excluded_columns = [
        'password_hash', 'recipes', 'meal_plans', 'shopping_lists',
        'favorites', 'fridge_items', 'ratings', 'recipe_collections', 'chef_profile'
    ]
    form_extra_fields = {
        'password': PasswordField('New Password')
    }

    def on_model_change(self, form, model, is_created):
        if form.password.data:
            model.password_hash = generate_password_hash(form.password.data)


class VerificationCodeModelView(ModelView):
    column_list = ['id', 'email', 'code', 'purpose', 'expires_at', 'used', 'created_at']
    column_searchable_list = ['email', 'code']
    column_filters = ['purpose', 'used', 'expires_at']
    can_create = False


class RecipeModelView(ModelView):
    column_list = [
        'id', 'title', 'category', 'cuisine', 'meal_type',
        'is_vegan', 'is_vegetarian', 'num_ingredients', 'author', 'created_at'
    ]
    column_searchable_list = ['title', 'description']
    column_filters = ['category', 'cuisine', 'meal_type', 'is_vegan', 'is_vegetarian']
    column_sortable_list = ['id', 'title', 'category', 'cuisine', 'created_at']
    form_excluded_columns = ['meal_plans', 'favorites', 'ratings', 'collection_items']
    can_view_details = True
    column_details_list = [
        'id', 'title', 'description', 'category', 'cuisine', 'meal_type',
        'is_vegan', 'is_vegetarian', 'directions', 'ingredients', 'author', 'created_at'
    ]

    def _format_ingredients(view, context, model, name):
        ingredients = model.ingredients
        if not ingredients:
            return ''
        return ', '.join([
            f'{ri.ingredient.name} ({ri.quantity} {ri.unit})'
            for ri in ingredients if ri.ingredient
        ])

    column_formatters = {
        'ingredients': _format_ingredients
    }


class IngredientModelView(ModelView):
    column_list = ['id', 'name', 'default_unit']
    column_searchable_list = ['name']
    column_sortable_list = ['id', 'name', 'default_unit']
    form_excluded_columns = ['recipe_ingredients', 'shopping_lists', 'fridge_items']


class RecipeIngredientModelView(ModelView):
    column_list = ['recipe', 'ingredient', 'quantity', 'unit']
    column_filters = ['unit']


class MealPlanModelView(ModelView):
    column_list = ['id', 'user', 'recipe', 'plan_date', 'meal_type']
    column_filters = ['meal_type', 'plan_date']
    column_sortable_list = ['id', 'plan_date', 'meal_type']


class ShoppingListModelView(ModelView):
    column_list = ['id', 'user', 'ingredient', 'amount', 'unit', 'is_purchased', 'created_at']
    column_filters = ['is_purchased', 'source_type']
    column_sortable_list = ['id', 'amount', 'is_purchased', 'created_at']


class FavoriteModelView(ModelView):
    column_list = ['id', 'user', 'recipe', 'created_at']
    column_sortable_list = ['id', 'created_at']


class FridgeItemModelView(ModelView):
    column_list = ['id', 'user', 'ingredient', 'quantity', 'unit', 'added_at']
    column_filters = ['unit']
    column_sortable_list = ['id', 'quantity', 'added_at']


class RatingModelView(ModelView):
    column_list = ['id', 'user', 'recipe', 'score', 'comment', 'created_at']
    column_filters = ['score']
    column_sortable_list = ['id', 'score', 'created_at']


class RecipeCollectionModelView(ModelView):
    column_list = ['id', 'user', 'name', 'is_public', 'created_at', 'updated_at']
    column_searchable_list = ['name', 'description']
    column_filters = ['is_public']
    column_sortable_list = ['id', 'name', 'is_public', 'created_at']
    form_excluded_columns = ['items']


class CollectionItemModelView(ModelView):
    column_list = ['collection', 'recipe', 'added_at']
    column_sortable_list = ['added_at']


class ChefProfileModelView(ModelView):
    column_list = ['id', 'user', 'bio', 'website', 'location']
    column_searchable_list = ['bio', 'website', 'location']
    column_sortable_list = ['id']


def init_admin(app):
    admin = Admin(
        app,
        name='Nutrify Admin',
        url='/admin',
        endpoint='admin'
    )

    admin.add_view(UserModelView(User, db.session, name='Users', category='Auth'))
    admin.add_view(VerificationCodeModelView(
        VerificationCode, db.session, name='Verification Codes', category='Auth'
    ))
    admin.add_view(RecipeModelView(Recipe, db.session, name='Recipes', category='Recipes'))
    admin.add_view(IngredientModelView(Ingredient, db.session, name='Ingredients', category='Recipes'))
    admin.add_view(RecipeIngredientModelView(
        RecipeIngredient, db.session, name='Recipe Ingredients', category='Recipes'
    ))
    admin.add_view(MealPlanModelView(MealPlan, db.session, name='Meal Plans', category='Planning'))
    admin.add_view(ShoppingListModelView(
        ShoppingList, db.session, name='Shopping List', category='Planning'
    ))
    admin.add_view(FridgeItemModelView(FridgeItem, db.session, name='Fridge Items', category='Planning'))
    admin.add_view(FavoriteModelView(Favorite, db.session, name='Favorites', category='User Data'))
    admin.add_view(RatingModelView(Rating, db.session, name='Ratings', category='User Data'))
    admin.add_view(RecipeCollectionModelView(
        RecipeCollection, db.session, name='Collections', category='User Data'
    ))
    admin.add_view(CollectionItemModelView(
        CollectionItem, db.session, name='Collection Items', category='User Data'
    ))
    admin.add_view(ChefProfileModelView(ChefProfile, db.session, name='Chef Profiles', category='Auth'))

    return admin
