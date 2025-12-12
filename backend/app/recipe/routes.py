from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import func
from ..models import Recipe, RecipeCollection, CollectionItem, db
from ..auth.models import User

recipe_bp = Blueprint('recipe', __name__, url_prefix='/api/recipe')

# --- PUBLIC ENDPOINTS ---

@recipe_bp.route('/', methods=['GET'])
def get_recipes():
    """
    Search and Filter Recipes (UC-4)
    Query Params: cuisine, meal_type, is_vegan, is_vegetarian, search (title)
    """
    query = Recipe.query

    # Filters
    cuisine = request.args.get('cuisine')
    if cuisine:
        query = query.filter(Recipe.cuisine.ilike(f'%{cuisine}%'))

    meal_type = request.args.get('meal_type')
    if meal_type:
        query = query.filter(Recipe.meal_type.ilike(f'%{meal_type}%'))

    if request.args.get('is_vegan') == 'true':
        query = query.filter_by(is_vegan=True)

    if request.args.get('is_vegetarian') == 'true':
        query = query.filter_by(is_vegetarian=True)

    search_term = request.args.get('search')
    if search_term:
        query = query.filter(Recipe.title.ilike(f'%{search_term}%'))

    # Pagination (Simple)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    recipes = query.paginate(page=page, per_page=per_page, error_out=False)
    
    results = []
    for r in recipes.items:
        results.append({
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "image_url": r.image_url,
            "cuisine": r.cuisine,
            "meal_type": r.meal_type
        })

    return jsonify({
        "recipes": results,
        "total": recipes.total,
        "pages": recipes.pages,
        "current_page": recipes.page
    }), 200

@recipe_bp.route('/<int:id>', methods=['GET'])
def get_recipe_detail(id):
    """
    Get Full Recipe Details (UC-5)
    """
    recipe = Recipe.query.get_or_404(id)
    
    # Format Ingredients
    ingredients_list = []
    for ri in recipe.ingredients:
        ingredients_list.append({
            "name": ri.ingredient.name,
            "quantity": ri.quantity,
            "unit": ri.unit
        })

    return jsonify({
        "id": recipe.id,
        "title": recipe.title,
        "description": recipe.description,
        "directions": recipe.directions,
        "ingredients": ingredients_list,
        "author": recipe.author.username if recipe.author else "Nutrify",
        "cuisine": recipe.cuisine,
        "meal_type": recipe.meal_type,
        "is_vegan": recipe.is_vegan,
        "is_vegetarian": recipe.is_vegetarian
    }), 200

@recipe_bp.route('/random', methods=['GET'])
def get_random_recipe():
    """
    Get a single random recipe for Homepage Hero (Frontend Placeholder)
    """
    recipe = Recipe.query.order_by(func.random()).first()
    if not recipe:
        return jsonify({"msg": "No recipes found"}), 404
        
    return jsonify({
        "id": recipe.id,
        "title": recipe.title,
        "description": recipe.description,
        "image_url": recipe.image_url
    }), 200

# --- AUTHENTICATED ENDPOINTS (COLLECTIONS & FAVORITES) ---

@recipe_bp.route('/favorites', methods=['GET'])
@jwt_required()
def get_favorites():
    """
    Get User's Favorites (UC-6)
    Authentication: Required
    """
    user_identity = get_jwt_identity()
    user = User.query.filter_by(email=user_identity).first()
    
    fav_collection = RecipeCollection.query.filter_by(user_id=user.id, name="Favorites").first()
    
    if not fav_collection or not fav_collection.items:
        return jsonify({"favorites": []}), 200
        
    results = []
    for item in fav_collection.items:
        # item.recipe is accessible due to relationship
        results.append({
            "id": item.recipe.id,
            "title": item.recipe.title,
            "image_url": item.recipe.image_url,
            "cuisine": item.recipe.cuisine,
            "added_at": item.added_at
        })

    return jsonify({"favorites": results}), 200

@recipe_bp.route('/favorites/<int:recipe_id>', methods=['POST'])
@jwt_required()
def add_favorite(recipe_id):
    """
    Add to 'Favorites' Collection (UC-6)
    Authentication: Required
    """
    user_identity = get_jwt_identity()
    user = User.query.filter_by(email=user_identity).first()
    
    # Check if 'Favorites' collection exists, if not create it
    fav_collection = RecipeCollection.query.filter_by(user_id=user.id, name="Favorites").first()
    if not fav_collection:
        fav_collection = RecipeCollection(user_id=user.id, name="Favorites", description="My favorite recipes")
        db.session.add(fav_collection)
        db.session.flush() # Get ID
        
    # Check if already in favorites
    existing = CollectionItem.query.filter_by(collection_id=fav_collection.id, recipe_id=recipe_id).first()
    if existing:
        return jsonify({"msg": "Recipe already in favorites"}), 400
        
    new_item = CollectionItem(collection_id=fav_collection.id, recipe_id=recipe_id)
    db.session.add(new_item)
    db.session.commit()
    
    return jsonify({"msg": "Recipe added to favorites"}), 201

@recipe_bp.route('/favorites/<int:recipe_id>', methods=['DELETE'])
@jwt_required()
def remove_favorite(recipe_id):
    """
    Remove from 'Favorites' Collection
    """
    user_identity = get_jwt_identity()
    user = User.query.filter_by(email=user_identity).first()
    
    fav_collection = RecipeCollection.query.filter_by(user_id=user.id, name="Favorites").first()
    if not fav_collection:
         return jsonify({"msg": "Favorites list not found"}), 404
         
    item = CollectionItem.query.filter_by(collection_id=fav_collection.id, recipe_id=recipe_id).first()
    if not item:
        return jsonify({"msg": "Recipe not in favorites"}), 404
        
    db.session.delete(item)
    db.session.commit()
    
    return jsonify({"msg": "Recipe removed from favorites"}), 200

@recipe_bp.route('/collections', methods=['POST'])
@jwt_required()
def create_collection():
    """
    Create a Custom Collection (e.g. 'Summer Party')
    """
    user_identity = get_jwt_identity()
    user = User.query.filter_by(email=user_identity).first()
    data = request.get_json()
    
    if not data.get('name'):
        return jsonify({"msg": "Collection name is required"}), 400
        
    new_col = RecipeCollection(
        user_id=user.id,
        name=data['name'],
        description=data.get('description', ''),
        is_public=data.get('is_public', False)
    )
    db.session.add(new_col)
    db.session.commit()
    
    return jsonify({"id": new_col.id, "msg": "Collection created"}), 201
