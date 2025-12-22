from flask_openapi3 import APIBlueprint, Tag
from flask_jwt_extended import get_jwt_identity

from ..auth.models import User
from ..auth.schemas import UnauthorizedResponse
from ..decorators import login_required
from ..models import Ingredient, Recipe
from .services import (
    get_recipe_list,
    get_recipe_detail,
    add_to_favorites,
    remove_from_favorites,
    get_user_favorites,
    get_available_filters,
    get_user_collections,
    get_collection_detail,
    create_collection,
    update_collection,
    delete_collection,
    add_recipe_to_collection,
    bulk_add_recipes_to_collection,
    remove_recipe_from_collection,
    get_recipe_collections
)
from .schemas import (
    RecipeIdPath, CollectionIdPath, CollectionRecipePath,
    RecipeListResponse, RecipeDetail, MessageResponse,
    FavoriteAddBody, FavoriteAddResponse, FavoritesListResponse,
    IngredientSearchResponse, FilterOptions, CollectionCreateBody,
    CollectionUpdateBody, CollectionCreateResponse, AddRecipeToCollectionBody,
    BulkAddRecipesBody, BulkAddResponse, CollectionList, CollectionDetail,
    RecipeCollectionsResponse, RecipeListQuery, IngredientSearchQuery, CollectionListQuery
)


recipe_tag = Tag(name="Recipes", description="Recipe browsing and management")
recipe_bp = APIBlueprint(
    'recipes', __name__, url_prefix='/api/recipes',
    abp_tags=[recipe_tag], abp_security=[{"jwt": []}],
    abp_responses={"401": UnauthorizedResponse}
)


@recipe_bp.get('', responses={"200": RecipeListResponse})
@login_required
def list_recipes(query: RecipeListQuery):
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    search_query = query.q
    ingredients_str = query.ingredients
    ingredients = ingredients_str.split(',') if ingredients_str else None
    category = query.category
    cuisine = query.cuisine
    is_vegan = query.is_vegan
    is_vegetarian = query.is_vegetarian
    meal_type = query.meal_type
    sort_by = query.sort_by
    sort_order = query.sort_order

    result = get_recipe_list(
        search_query=search_query,
        ingredients=ingredients,
        category=category,
        cuisine=cuisine,
        is_vegan=is_vegan,
        is_vegetarian=is_vegetarian,
        meal_type=meal_type,
        sort_by=sort_by,
        sort_order=sort_order,
        user_id=user.id if user else None
    )

    return result, 200


@recipe_bp.get('/<int:recipe_id>', responses={"200": RecipeDetail, "404": MessageResponse})
@login_required
def get_recipe(path: RecipeIdPath):
    recipe_id = path.recipe_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    recipe = get_recipe_detail(recipe_id, user.id if user else None)

    if not recipe:
        return {'msg': 'Recipe not found'}, 404

    return recipe, 200


@recipe_bp.get('/filters', responses={"200": FilterOptions})
@login_required
def get_filters():
    filters = get_available_filters()
    return filters, 200


@recipe_bp.get('/ingredients/search', responses={"200": IngredientSearchResponse})
@login_required
def search_ingredients(query: IngredientSearchQuery):
    q = query.q or ''
    limit = query.limit or 10

    if len(q) < 2:
        return {'ingredients': []}, 200

    ingredients = Ingredient.query.filter(
        Ingredient.name.ilike(f'%{q}%')
    ).limit(limit).all()

    return {
        'ingredients': [{
            'id': ing.id,
            'name': ing.name,
            'default_unit': ing.default_unit
        } for ing in ingredients]
    }, 200


@recipe_bp.get('/favorites', responses={"200": FavoritesListResponse, "404": MessageResponse})
@login_required
def get_favorites():
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    result = get_user_favorites(user.id)
    return {'favorites': result['recipes']}, 200


@recipe_bp.post('/favorites',
    responses={"201": FavoriteAddResponse, "404": MessageResponse, "409": MessageResponse})
@login_required
def add_favorite(body: FavoriteAddBody):
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    result, status = add_to_favorites(user.id, body.recipe_id)
    return result, status


@recipe_bp.delete('/favorites/<int:recipe_id>',
    responses={"200": MessageResponse, "404": MessageResponse})
@login_required
def remove_favorite(path: RecipeIdPath):
    recipe_id = path.recipe_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    result, status = remove_from_favorites(user.id, recipe_id)
    return result, status


@recipe_bp.get('/collections', responses={"200": CollectionList, "404": MessageResponse})
@login_required
def list_collections(query: CollectionListQuery):
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    include_recipes = query.include_recipes
    result = get_user_collections(user.id, include_recipes=include_recipes)
    return result, 200


@recipe_bp.get('/collections/<collection_id>',
    responses={"200": CollectionDetail, "404": MessageResponse})
@login_required
def get_collection(path: CollectionIdPath):
    collection_id = path.collection_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    result = get_collection_detail(collection_id, user.id)

    if not result:
        return {'msg': 'Collection not found'}, 404

    return result, 200


@recipe_bp.post('/collections',
    responses={"201": CollectionCreateResponse, "404": MessageResponse, "409": MessageResponse})
@login_required
def create_new_collection(body: CollectionCreateBody):
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    result, status = create_collection(user.id, body.name, body.description, body.is_public)
    return result, status


@recipe_bp.put('/collections/<int:collection_id>',
    responses={"201": MessageResponse, "404": MessageResponse, "409": MessageResponse})
@login_required
def update_collection_endpoint(path: CollectionIdPath, body: CollectionUpdateBody):
    collection_id = path.collection_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    result, status = update_collection(
        collection_id, user.id, body.name, body.description, body.is_public
    )
    return result, status


@recipe_bp.delete('/collections/<int:collection_id>',
    responses={"200": MessageResponse, "404": MessageResponse})
@login_required
def delete_collection_endpoint(path: CollectionIdPath):
    collection_id = path.collection_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    result, status = delete_collection(collection_id, user.id)
    return result, status


@recipe_bp.post('/collections/<int:collection_id>/recipes',
    responses={"201": MessageResponse, "404": MessageResponse, "409": MessageResponse})
@login_required
def add_recipe_to_collection_endpoint(path: CollectionIdPath, body: AddRecipeToCollectionBody):
    collection_id = path.collection_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    result, status = add_recipe_to_collection(collection_id, body.recipe_id, user.id)
    return result, status


@recipe_bp.post('/collections/<int:collection_id>/recipes/bulk',
    responses={"200": BulkAddResponse, "404": MessageResponse})
@login_required
def bulk_add_recipes_to_collection_endpoint(path: CollectionIdPath, body: BulkAddRecipesBody):
    collection_id = path.collection_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    result, status = bulk_add_recipes_to_collection(collection_id, body.recipe_ids, user.id)
    return result, status


@recipe_bp.delete('/collections/<int:collection_id>/recipes/<int:recipe_id>',
    responses={"200": MessageResponse, "404": MessageResponse})
@login_required
def remove_recipe_from_collection_endpoint(path: CollectionRecipePath):
    collection_id = path.collection_id
    recipe_id = path.recipe_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    result, status = remove_recipe_from_collection(collection_id, recipe_id, user.id)
    return result, status


@recipe_bp.get('/<int:recipe_id>/collections',
    responses={"200": RecipeCollectionsResponse, "404": MessageResponse})
@login_required
def get_recipe_collections_endpoint(path: RecipeIdPath):
    recipe_id = path.recipe_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return {'msg': 'Recipe not found'}, 404

    result = get_recipe_collections(recipe_id, user.id)
    result['recipe_id'] = recipe_id
    result['recipe_title'] = recipe.title
    return result, 200
