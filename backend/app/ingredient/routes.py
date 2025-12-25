from flask import request, jsonify
from flask_openapi3 import APIBlueprint, Tag
from ...extensions import db
from ..models import Ingredient

tag = Tag(name="Ingredients", description="Ingredient management")
ingredient_bp = APIBlueprint("ingredient", __name__, url_prefix="/api/ingredients", abp_tags=[tag])

@ingredient_bp.get("")
def search_ingredients():
    search_term = request.args.get('search', '').strip()
    
    query = Ingredient.query
    
    if search_term:
        query = query.filter(Ingredient.name.ilike(f"%{search_term}%"))
    
    ingredients = query.limit(10).all()
    
    results = []
    for ing in ingredients:
        results.append({
            "id": ing.id,
            "name": ing.name,
            "default_unit": ing.default_unit
        })
        
    return jsonify({"items": results}), 200