from flask import redirect, url_for, request
from flask_admin import Admin, AdminIndexView, expose
from flask_admin.contrib.sqla import ModelView
from wtforms import PasswordField, SelectField
from wtforms.validators import ValidationError
from werkzeug.security import generate_password_hash
from flask_jwt_extended import decode_token, create_access_token
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

from backend.extensions import db
from .auth.models import User, VerificationCode
from .models import (
    Recipe, Ingredient, RecipeIngredient, MealPlan,
    ShoppingList, Favorite, FridgeItem, Rating,
    RecipeCollection, CollectionItem, ChefProfile
)


def get_admin_user_from_cookie():
    token = request.cookies.get('admin_token')
    if not token:
        return

    try:
        decoded = decode_token(token)
        email = decoded.get('sub')

        if email:
            user = User.query.filter_by(email=email).first()
            if user and user.role == 'admin':
                return user
    except (ExpiredSignatureError, InvalidTokenError, Exception):
        pass


class SecureModelView(ModelView):
    def is_accessible(self):
        return get_admin_user_from_cookie() is not None

    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for('admin.login'))


class SecureAdminIndexView(AdminIndexView):
    @expose('/')
    def index(self):
        if not get_admin_user_from_cookie():
            return redirect(url_for('admin.login'))
        return super().index()

    @expose('/login', methods=['GET', 'POST'])
    def login(self):
        if request.method == 'POST':
            email = request.form.get('email')
            password = request.form.get('password')

            user = User.query.filter_by(email=email).first()

            if user and user.check_password(password) and user.role == 'admin':
                access_token = create_access_token(identity=email)
                response = redirect(url_for('admin.index'))
                response.set_cookie(
                    'admin_token', access_token, httponly=True,
                    secure=False, samesite='Lax'
                )
                return response

        return '''
<!DOCTYPE html>
<html>
<head>
    <title>Admin Login - Nutrify</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .login-card {
            max-width: 400px;
            margin: 100px auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card login-card shadow-lg">
            <div class="card-header bg-dark text-white text-center">
                <h4>Nutrify Admin Panel</h4>
            </div>
            <div class="card-body">
                <form method="POST">
                    <div class="mb-3">
                        <label class="form-label">Email</label>
                        <input type="email" name="email" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Password</label>
                        <input type="password" name="password" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Login</button>
                </form>
            </div>
        </div>
    </div>
</body>
</html>
'''

    @expose('/logout')
    def logout(self):
        response = redirect(url_for('admin.login'))
        response.delete_cookie('admin_token')
        return response


class UserModelView(SecureModelView):
    column_list = ['id', 'username', 'email', 'role', 'created_at']
    column_searchable_list = ['username', 'email']
    column_filters = ['role', 'created_at']
    column_sortable_list = ['id', 'username', 'email', 'role', 'created_at']
    form_excluded_columns = [
        'password_hash', 'recipes', 'meal_plans', 'shopping_lists',
        'favorites', 'fridge_items', 'ratings', 'recipe_collections', 'chef_profile'
    ]
    form_extra_fields = {
        'password': PasswordField('New Password'),
        'role': SelectField('Role', choices=[
            ('consumer', 'Consumer'),
            ('chef', 'Chef'),
            ('admin', 'Admin')
        ])
    }

    def on_model_change(self, form, model, is_created):
        if is_created:
            if not form.password.data:
                raise ValidationError('Password is required for new users')
            if len(form.password.data) < 6:
                raise ValidationError('Password must be at least 6 characters')

        if form.password.data:
            if len(form.password.data) < 6:
                raise ValidationError('Password must be at least 6 characters')
            model.password_hash = generate_password_hash(form.password.data)

        if model.role not in ['consumer', 'chef', 'admin']:
            raise ValidationError('Role must be one of: consumer, chef, admin')


class VerificationCodeModelView(SecureModelView):
    column_list = ['id', 'email', 'code', 'purpose', 'expires_at', 'used', 'created_at']
    column_searchable_list = ['email', 'code']
    column_filters = ['purpose', 'used', 'expires_at']
    can_create = False


class RecipeModelView(SecureModelView):
    column_list = [
        'id', 'title', 'category', 'cuisine', 'meal_type',
        'is_vegan', 'is_vegetarian', 'num_ingredients', 'author', 'created_at'
    ]
    column_searchable_list = ['title', 'description']
    column_filters = ['category', 'cuisine', 'meal_type', 'is_vegan', 'is_vegetarian']
    column_sortable_list = ['id', 'title', 'category', 'cuisine', 'created_at']
    form_excluded_columns = ['meal_plans', 'favorites', 'ratings', 'collection_items', 'ingredients']
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


class IngredientModelView(SecureModelView):
    column_list = ['id', 'name', 'default_unit']
    column_searchable_list = ['name']
    column_sortable_list = ['id', 'name', 'default_unit']
    form_excluded_columns = ['recipe_ingredients', 'shopping_lists', 'fridge_items']


class RecipeIngredientModelView(SecureModelView):
    column_list = ['recipe', 'ingredient', 'quantity', 'unit']
    column_filters = ['unit']


class MealPlanModelView(SecureModelView):
    column_list = ['id', 'user', 'recipe', 'plan_date', 'meal_type']
    column_filters = ['meal_type', 'plan_date']
    column_sortable_list = ['id', 'plan_date', 'meal_type']


class ShoppingListModelView(SecureModelView):
    column_list = ['id', 'user', 'ingredient', 'amount', 'unit', 'is_purchased', 'created_at']
    column_filters = ['is_purchased', 'source_type']
    column_sortable_list = ['id', 'amount', 'is_purchased', 'created_at']


class FavoriteModelView(SecureModelView):
    column_list = ['id', 'user', 'recipe', 'created_at']
    column_sortable_list = ['id', 'created_at']


class FridgeItemModelView(SecureModelView):
    column_list = ['id', 'user', 'ingredient', 'quantity', 'unit', 'added_at']
    column_filters = ['unit']
    column_sortable_list = ['id', 'quantity', 'added_at']


class RatingModelView(SecureModelView):
    column_list = ['id', 'user', 'recipe', 'score', 'comment', 'created_at']
    column_filters = ['score']
    column_sortable_list = ['id', 'score', 'created_at']


class RecipeCollectionModelView(SecureModelView):
    column_list = ['id', 'user', 'name', 'is_public', 'created_at', 'updated_at']
    column_searchable_list = ['name', 'description']
    column_filters = ['is_public']
    column_sortable_list = ['id', 'name', 'is_public', 'created_at']
    form_excluded_columns = ['items']


class CollectionItemModelView(SecureModelView):
    column_list = ['collection', 'recipe', 'added_at']
    column_sortable_list = ['added_at']


class ChefProfileModelView(SecureModelView):
    column_list = ['id', 'user', 'bio', 'website', 'location']
    column_searchable_list = ['bio', 'website', 'location']
    column_sortable_list = ['id']


def init_admin(app):
    admin_url = app.config['ADMIN_URL'].strip()

    if not admin_url:
        app.logger.info('ADMIN_URL not set - Admin panel is DISABLED')
        return

    if not admin_url.startswith('/'):
        admin_url = '/' + admin_url

    app.logger.info(f'Admin panel enabled at: {admin_url}')

    admin = Admin(
        app,
        name='Nutrify Admin',
        url=admin_url,
        endpoint='admin',
        index_view=SecureAdminIndexView()
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
