from flask_openapi3 import APIBlueprint, Tag
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import func

from ...extensions import db
from ..auth.models import User
from ..decorators import chef_required
from ..models import Recipe, Ingredient, RecipeIngredient, Rating
from ..utils.unit_converter import format_quantity_with_conversions
from .schemas import (
    RecipeIdPath,
    ChefRecipesResponse, CreateRecipeBody, RecipeResponse,
    RecipeDetail, UpdateRecipeBody, MessageResponse, ChefStatsResponse
)


chef_tag = Tag(name="Chef", description="Chef recipe management")
chef_bp = APIBlueprint(
    'chef', __name__, url_prefix='/api/chef',
    abp_tags=[chef_tag], abp_security=[{"jwt": []}]
)


@chef_bp.get('/recipes', responses={"200": ChefRecipesResponse, "404": MessageResponse})
@chef_required
def get_chef_recipes():
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    query = Recipe.query.filter_by(author_id=user.id).order_by(
        Recipe.created_at.desc()
    )
    recipes_list = query.all()

    recipes = []
    for recipe in recipes_list:
        avg_rating = db.session.query(func.avg(Rating.score)).filter(
            Rating.recipe_id == recipe.id
        ).scalar()

        rating_count = Rating.query.filter_by(recipe_id=recipe.id).count()

        recipes.append({
            'id': recipe.id,
            'title': recipe.title,
            'description': recipe.description,
            'category': recipe.category,
            'cuisine': recipe.cuisine,
            'num_ingredients': recipe.num_ingredients,
            'average_rating': round(avg_rating, 1) if avg_rating else None,
            'rating_count': rating_count,
            'created_at': recipe.created_at.isoformat() if recipe.created_at else None
        })

    return {'recipes': recipes}, 200


@chef_bp.post('/recipes', responses={"201": RecipeResponse, "404": MessageResponse})
@chef_required
def create_recipe(body: CreateRecipeBody):
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    recipe = Recipe(
        author_id=user.id,
        title=body.title,
        description=body.description,
        category=body.category,
        cuisine=body.cuisine,
        meal_type=body.meal_type,
        is_vegan=body.is_vegan,
        is_vegetarian=body.is_vegetarian,
        directions=body.directions
    )

    for ing_data in body.ingredients:
        ingredient = None
        if ing_data.ingredient_id:
            ingredient = Ingredient.query.get(ing_data.ingredient_id)
        elif ing_data.name:
            ingredient = Ingredient.query.filter(
                Ingredient.name.ilike(ing_data.name.strip())
            ).first()

        if ingredient:
            recipe_ingredient = RecipeIngredient(
                recipe=recipe,
                ingredient=ingredient,
                quantity=float(ing_data.quantity) if ing_data.quantity else None,
                unit=ing_data.unit
            )
            db.session.add(recipe_ingredient)

    db.session.add(recipe)
    db.session.commit()

    return {
        'msg': 'Recipe created successfully',
        'recipe_id': recipe.id
    }, 201


@chef_bp.get('/recipes/<int:recipe_id>',
    responses={"200": RecipeDetail, "403": MessageResponse, "404": MessageResponse})
@chef_required
def get_recipe_for_edit(path: RecipeIdPath):
    recipe_id = path.recipe_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return {'msg': 'Recipe not found'}, 404

    if recipe.author_id != user.id and user.role != 'admin':
        return {'msg': 'You can only edit your own recipes'}, 403

    ingredients = []
    for ri in recipe.ingredients:
        formatted = format_quantity_with_conversions(ri.quantity, ri.unit, include_conversions=True)
        ingredients.append({
            'ingredient_id': ri.ingredient.id,
            'name': ri.ingredient.name,
            'quantity': formatted['quantity'],
            'unit': formatted['unit'],
            'alternatives': formatted['alternatives']
        })

    return {
        'id': recipe.id,
        'title': recipe.title,
        'description': recipe.description,
        'category': recipe.category,
        'cuisine': recipe.cuisine,
        'meal_type': recipe.meal_type,
        'is_vegan': recipe.is_vegan,
        'is_vegetarian': recipe.is_vegetarian,
        'directions': recipe.directions,
        'ingredients': ingredients,
        'created_at': recipe.created_at.isoformat() if recipe.created_at else None
    }, 200


@chef_bp.put('/recipes/<int:recipe_id>',
    responses={"200": MessageResponse, "403": MessageResponse, "404": MessageResponse})
@chef_required
def update_recipe(path: RecipeIdPath, body: UpdateRecipeBody):
    recipe_id = path.recipe_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return {'msg': 'Recipe not found'}, 404

    if recipe.author_id != user.id and user.role != 'admin':
        return {'msg': 'You can only edit your own recipes'}, 403

    if body.title is not None:
        recipe.title = body.title
    if body.description is not None:
        recipe.description = body.description
    if body.category is not None:
        recipe.category = body.category
    if body.cuisine is not None:
        recipe.cuisine = body.cuisine
    if body.meal_type is not None:
        recipe.meal_type = body.meal_type
    if body.is_vegan is not None:
        recipe.is_vegan = body.is_vegan
    if body.is_vegetarian is not None:
        recipe.is_vegetarian = body.is_vegetarian
    if body.directions is not None:
        recipe.directions = body.directions

    if body.ingredients is not None:
        RecipeIngredient.query.filter_by(recipe_id=recipe.id).delete()

        for ing_data in body.ingredients:
            ingredient_id = ing_data.get('ingredient_id')
            ingredient_name = ing_data.get('name')
            quantity = ing_data.get('quantity')

            ingredient = None
            if ingredient_id:
                ingredient = Ingredient.query.get(ingredient_id)
            elif ingredient_name:
                ingredient = Ingredient.query.filter(
                    Ingredient.name.ilike(ingredient_name.strip())
                ).first()

            if ingredient:
                recipe_ingredient = RecipeIngredient(
                    recipe_id=recipe.id,
                    ingredient_id=ingredient.id,
                    quantity=float(quantity) if quantity else None,
                    unit=ing_data.get('unit')
                )
                db.session.add(recipe_ingredient)

    db.session.commit()

    return {'msg': 'Recipe updated successfully'}, 200


@chef_bp.delete('/recipes/<int:recipe_id>',
    responses={"200": MessageResponse, "403": MessageResponse, "404": MessageResponse})
@chef_required
def delete_recipe(path: RecipeIdPath):
    recipe_id = path.recipe_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return {'msg': 'Recipe not found'}, 404

    if recipe.author_id != user.id and user.role != 'admin':
        return {'msg': 'You can only delete your own recipes'}, 403

    db.session.delete(recipe)
    db.session.commit()

    return {'msg': 'Recipe deleted successfully'}, 200


@chef_bp.get('/stats', responses={"200": ChefStatsResponse, "404": MessageResponse})
@chef_required
def get_chef_stats():
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    total_recipes = Recipe.query.filter_by(author_id=user.id).count()

    total_ratings = db.session.query(Rating).join(Recipe).filter(
        Recipe.author_id == user.id
    ).count()

    avg_rating = db.session.query(func.avg(Rating.score)).join(Recipe).filter(
        Recipe.author_id == user.id
    ).scalar()

    categories = db.session.query(
        Recipe.category,
        func.count(Recipe.id)
    ).filter(
        Recipe.author_id == user.id
    ).group_by(Recipe.category).all()

    return {
        'total_recipes': total_recipes,
        'total_ratings': total_ratings,
        'average_rating': round(avg_rating, 1) if avg_rating else None,
        'recipes_by_category': {
            cat: count for cat, count in categories if cat
        }
    }, 200
