from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from backend.extensions import db
from backend.app.models import MealPlan, Recipe
from backend.app.auth.models import User

planning_bp = Blueprint('planning_bp', __name__, url_prefix='/api/planning')

@planning_bp.route('/meal-plans', methods=['GET'])
@jwt_required()
def get_meal_plans():
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    
    if not user:
        return jsonify({"msg": "User not found"}), 404

    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    query = MealPlan.query.filter_by(user_id=user.id)

    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            query = query.filter(MealPlan.plan_date >= start_date)
        except ValueError:
            return jsonify({"msg": "Invalid start_date format. Use YYYY-MM-DD"}), 400
    
    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            query = query.filter(MealPlan.plan_date <= end_date)
        except ValueError:
            return jsonify({"msg": "Invalid end_date format. Use YYYY-MM-DD"}), 400

    plans = query.order_by(MealPlan.plan_date).all()

    results = []
    for plan in plans:
        results.append({
            "id": plan.id,
            "date": plan.plan_date.isoformat(),
            "meal_type": plan.meal_type,
            "recipe": {
                "id": plan.recipe.id,
                "title": plan.recipe.title, 
                "image_url": plan.recipe.image_url,
            } if plan.recipe else None
        })

    return jsonify(results), 200


@planning_bp.route('/meal-plans', methods=['POST'])
@jwt_required()
def add_meal_plan():
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user:
        return jsonify({"msg": "User not found"}), 404

    data = request.get_json()
    recipe_id = data.get('recipe_id')
    plan_date_str = data.get('date') 
    meal_type = data.get('meal_type') 

    if not all([recipe_id, plan_date_str, meal_type]):
        return jsonify({"msg": "Missing data: recipe_id, date, and meal_type are required"}), 400

    try:
        plan_date = datetime.strptime(plan_date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"msg": "Invalid date format. Use YYYY-MM-DD"}), 400

    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({"msg": "Recipe not found"}), 404

    existing_plan = MealPlan.query.filter_by(
        user_id=user.id,
        plan_date=plan_date,
        meal_type=meal_type
    ).first()

    if existing_plan:
        existing_plan.recipe_id = recipe_id
        db.session.commit()
        return jsonify({
            "msg": "Meal plan updated successfully",
            "id": existing_plan.id,
            "action": "updated"
        }), 200
    else:
        new_plan = MealPlan(
            user_id=user.id,
            recipe_id=recipe_id,
            plan_date=plan_date,
            meal_type=meal_type
        )
        db.session.add(new_plan)
        db.session.commit()
        return jsonify({
            "msg": "Meal plan added successfully",
            "id": new_plan.id,
            "action": "created"
        }), 201


@planning_bp.route('/meal-plans/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_meal_plan(id):
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    plan = MealPlan.query.filter_by(id=id, user_id=user.id).first()

    if not plan:
        return jsonify({"msg": "Meal plan not found or access denied"}), 404

    db.session.delete(plan)
    db.session.commit()

    return jsonify({"msg": "Meal plan deleted successfully"}), 200