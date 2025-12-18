from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.app.models import Recipe, Ingredient, RecipeIngredient
from backend.app.auth.models import User
from datetime import datetime

chef_bp = Blueprint('chef_bp', __name__, url_prefix='/api/chef')

def is_chef(user):
    return user and user.role == 'chef'

@chef_bp.route('/', methods=['POST'])
@jwt_required()
def create_recipe():
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user or not is_chef(user):
        return jsonify({"msg": "Access denied. Chef role required."}), 403

    data = request.get_json()
    if not data:
        return jsonify({"msg": "No input data provided"}), 400

    # Basic Validation
    required_fields = ['title', 'description', 'ingredients', 'instructions']
    if not all(field in data for field in required_fields):
        return jsonify({"msg": f"Missing required fields: {', '.join(required_fields)}"}), 400

    try:
        # 1. Create Recipe
        new_recipe = Recipe(
            title=data['title'],
            description=data['description'],
            category=data.get('category'),
            cuisine=data.get('cuisine'),
            meal_type=data.get('meal_type'),
            is_vegan=data.get('is_vegan', False),
            is_vegetarian=data.get('is_vegetarian', False),
            image_url=data.get('image_url'),
            # num_ingredients will be calculated
            author_id=user.id
        )
        db.session.add(new_recipe)
        db.session.flush() # Flush to get new_recipe.id

        # 2. Process Ingredients
        ingredients_data = data['ingredients']
        for ing_data in ingredients_data:
            ing_name = ing_data.get('name').lower()
            quantity = ing_data.get('quantity')
            unit = ing_data.get('unit')

            # Find or create ingredient
            ingredient = Ingredient.query.filter_by(name=ing_name).first()
            if not ingredient:
                ingredient = Ingredient(name=ing_name, default_unit=unit)
                db.session.add(ingredient)
                db.session.flush()
            
            # Link to Recipe
            recipe_ingredient = RecipeIngredient(
                recipe_id=new_recipe.id,
                ingredient_id=ingredient.id,
                quantity=quantity,
                unit=unit
            )
            db.session.add(recipe_ingredient)

        new_recipe.num_ingredients = len(ingredients_data)

        # 3. Process Instructions
        instructions_list = data.get('instructions', [])
        if isinstance(instructions_list, list):
            new_recipe.directions = "\n".join(instructions_list)
        else:
            new_recipe.directions = str(instructions_list)

        db.session.commit()

        return jsonify({
            "msg": "Recipe created successfully", 
            "id": new_recipe.id
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error creating recipe: {e}")
        return jsonify({"msg": "Failed to create recipe"}), 500


@chef_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_recipe(id):
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user or not is_chef(user):
        return jsonify({"msg": "Access denied. Chef role required."}), 403

    recipe = Recipe.query.get(id)
    if not recipe:
        return jsonify({"msg": "Recipe not found"}), 404
    
    if recipe.author_id != user.id:
        return jsonify({"msg": "You can only edit your own recipes"}), 403

    data = request.get_json()

    # Update fields if present
    if 'title' in data: recipe.title = data['title']
    if 'description' in data: recipe.description = data['description']
    if 'category' in data: recipe.category = data['category']
    if 'cuisine' in data: recipe.cuisine = data['cuisine']
    if 'meal_type' in data: recipe.meal_type = data['meal_type']
    if 'is_vegan' in data: recipe.is_vegan = data['is_vegan']
    if 'is_vegetarian' in data: recipe.is_vegetarian = data['is_vegetarian']
    if 'image_url' in data: recipe.image_url = data['image_url']
    if 'instructions' in data:
        instructions_list = data['instructions']
        if isinstance(instructions_list, list):
            recipe.directions = "\n".join(instructions_list)
        else:
            recipe.directions = str(instructions_list)

    # Update ingredients (clear existing and re-add)
    if 'ingredients' in data:
        # Clear existing
        RecipeIngredient.query.filter_by(recipe_id=recipe.id).delete()
        
        ingredients_data = data['ingredients']
        for ing_data in ingredients_data:
            ing_name = ing_data.get('name').lower()
            quantity = ing_data.get('quantity')
            unit = ing_data.get('unit')

            ingredient = Ingredient.query.filter_by(name=ing_name).first()
            if not ingredient:
                ingredient = Ingredient(name=ing_name, default_unit=unit)
                db.session.add(ingredient)
                db.session.flush()
            
            recipe_ingredient = RecipeIngredient(
                recipe_id=recipe.id,
                ingredient_id=ingredient.id,
                quantity=quantity,
                unit=unit
            )
            db.session.add(recipe_ingredient)
        
        recipe.num_ingredients = len(ingredients_data)

    try:
        db.session.commit()
        return jsonify({"msg": "Recipe updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Failed to update recipe"}), 500


@chef_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_recipe(id):
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user or not is_chef(user):
        return jsonify({"msg": "Access denied. Chef role required."}), 403

    recipe = Recipe.query.get(id)
    if not recipe:
        return jsonify({"msg": "Recipe not found"}), 404

    if recipe.author_id != user.id:
        return jsonify({"msg": "You can only delete your own recipes"}), 403

    try:
        db.session.delete(recipe)
        db.session.commit()
        return jsonify({"msg": "Recipe deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Failed to delete recipe"}), 500
