from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.app.models import FridgeItem, Ingredient
from backend.app.auth.models import User

fridge_bp = Blueprint('fridge_bp', __name__, url_prefix='/api/fridge')

@fridge_bp.route('/', methods=['GET'])
@jwt_required()
def get_fridge_items():
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user:
        return jsonify({"msg": "User not found"}), 404

    items = FridgeItem.query.filter_by(user_id=user.id).all()

    results = []
    for item in items:
        results.append({
            "id": item.id,
            "ingredient_id": item.ingredient_id,
            "name": item.ingredient.name, 
            "unit": item.unit
        })

    return jsonify(results), 200

@fridge_bp.route('/', methods=['POST'])
@jwt_required()
def add_fridge_item():
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user:
        return jsonify({"msg": "User not found"}), 404

    data = request.get_json()
    name = data.get('ingredient_name')
    quantity = data.get('quantity')
    unit = data.get('unit')

    if not all([name, quantity]):
        return jsonify({"msg": "Ingredient name and quantity are required"}), 400

    ingredient = Ingredient.query.filter(Ingredient.name.ilike(name)).first()

    if not ingredient:
        ingredient = Ingredient(name=name.lower(), default_unit=unit)
        db.session.add(ingredient)
        db.session.commit()

    fridge_item = FridgeItem.query.filter_by(
        user_id=user.id,
        ingredient_id=ingredient.id
    ).first()

    if fridge_item:
        fridge_item.quantity = quantity
        fridge_item.unit = unit 
        action = "updated"
    else:
        fridge_item = FridgeItem(
            user_id=user.id,
            ingredient_id=ingredient.id,
            quantity=quantity,
            unit=unit
        )
        db.session.add(fridge_item)
        action = "created"

    db.session.commit()

    return jsonify({
        "msg": f"Fridge item {action}",
        "id": fridge_item.id,
        "ingredient": ingredient.name
    }), 200

@fridge_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_fridge_item(id):
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    item = FridgeItem.query.filter_by(id=id, user_id=user.id).first()

    if not item:
        return jsonify({"msg": "Item not found"}), 404

    db.session.delete(item)
    db.session.commit()

    return jsonify({"msg": "Item removed from fridge"}), 200