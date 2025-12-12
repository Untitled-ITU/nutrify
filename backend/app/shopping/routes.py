from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
from backend.extensions import db
from backend.app.models import ShoppingList, MealPlan, FridgeItem, Ingredient
from backend.app.auth.models import User

shopping_bp = Blueprint('shopping_bp', __name__, url_prefix='/api/shopping')

@shopping_bp.route('/', methods=['GET'])
@jwt_required()
def get_shopping_list():
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    items = ShoppingList.query.filter_by(user_id=user.id, is_purchased=False).all()

    results = []
    for item in items:
        results.append({
            "id": item.id,
            "ingredient_name": item.ingredient.name,
            "amount": item.amount,
            "is_purchased": item.is_purchased
        })

    return jsonify(results), 200

@shopping_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_shopping_list():
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    data = request.get_json() or {}
    
    if 'start_date' in data:
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
    else:
        start_date = date.today()
        
    if 'end_date' in data:
        end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
    else:
        end_date = start_date + timedelta(days=7)

    plans = MealPlan.query.filter(
        MealPlan.user_id == user.id,
        MealPlan.plan_date >= start_date,
        MealPlan.plan_date <= end_date
    ).all()

    if not plans:
        return jsonify({"msg": "No meal plans found for this date range"}), 400

    required_ingredients = {} 

    for plan in plans:
        if not plan.recipe: continue
        for ri in plan.recipe.ingredients:
            ing_id = ri.ingredient_id
            
            if ing_id not in required_ingredients:
                required_ingredients[ing_id] = {
                    "quantity": 0.0,
                    "unit": ri.unit
                }
            
            required_ingredients[ing_id]["quantity"] += ri.quantity

    new_items_count = 0
    
    for ing_id, req_data in required_ingredients.items():
        req_qty = req_data["quantity"]
        req_unit = req_data["unit"]

        fridge_item = FridgeItem.query.filter_by(user_id=user.id, ingredient_id=ing_id).first()

        to_buy_qty = req_qty

        if fridge_item:
            if fridge_item.unit == req_unit:
                if fridge_item.quantity >= req_qty:
                    to_buy_qty = 0
                else:
                    to_buy_qty = req_qty - fridge_item.quantity
            else:
                to_buy_qty = req_qty
        
        if to_buy_qty > 0:
            existing_shop_item = ShoppingList.query.filter_by(
                user_id=user.id, 
                ingredient_id=ing_id,
                is_purchased=False
            ).first()

            amount_str = f"{to_buy_qty:.1f} {req_unit}"

            if existing_shop_item:
                existing_shop_item.amount = amount_str 
            else:
                new_item = ShoppingList(
                    user_id=user.id,
                    ingredient_id=ing_id,
                    amount=amount_str
                )
                db.session.add(new_item)
                new_items_count += 1

    db.session.commit()

    return jsonify({
        "msg": "Shopping list generated successfully",
        "items_added_or_updated": new_items_count
    }), 200

@shopping_bp.route('/<int:id>', methods=['PATCH'])
@jwt_required()
def toggle_purchased(id):
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    item = ShoppingList.query.filter_by(id=id, user_id=user.id).first()
    if not item:
        return jsonify({"msg": "Item not found"}), 404

    item.is_purchased = not item.is_purchased 
    db.session.commit()

    return jsonify({"msg": "Item status updated", "is_purchased": item.is_purchased}), 200

@shopping_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_shopping_item(id):
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    item = ShoppingList.query.filter_by(id=id, user_id=user.id).first()
    if not item:
        return jsonify({"msg": "Item not found"}), 404

    db.session.delete(item)
    db.session.commit()

    return jsonify({"msg": "Item removed from shopping list"}), 200