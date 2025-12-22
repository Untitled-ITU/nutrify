from datetime import datetime, timedelta

from flask_openapi3 import APIBlueprint, Tag
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import func

from ...extensions import db
from ..auth.models import User
from ..auth.schemas import UnauthorizedResponse
from ..decorators import login_required
from ..models import MealPlan, Recipe, FridgeItem
from ..utils.unit_converter import get_unit_group, convert_unit, get_primary_unit
from .schemas import (
    MealIdPath, WeeklyPlanResponse, AddMealBody, MealResponse, UpdateMealBody,
    MessageResponse, NeededIngredientsResponse, BulkImportBody,
    BulkImportResponse, PlanningStatsResponse, ClearWeekResponse,
    WeeklyPlanQuery, MissingIngredientsQuery, ClearWeekQuery
)


planning_tag = Tag(name="Meal Planning", description="Weekly meal planning and management")
planning_bp = APIBlueprint(
    'planning', __name__, url_prefix='/api/planning',
    abp_tags=[planning_tag], abp_security=[{"jwt": []}],
    abp_responses={"401": UnauthorizedResponse}
)


@planning_bp.get('/weekly',
    responses={"200": WeeklyPlanResponse, "400": MessageResponse, "404": MessageResponse})
@login_required
def get_weekly_plan(query: WeeklyPlanQuery):
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    start_date_str = query.start_date

    if start_date_str:
        try:
            start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00')).date()
        except ValueError:
            return {'msg': 'Invalid start_date format. Use ISO format.'}, 400
    else:
        today = datetime.now().date()
        start_date = today - timedelta(days=today.weekday())

    end_date = start_date + timedelta(days=6)

    meal_plans = MealPlan.query.filter(
        MealPlan.user_id == user.id,
        MealPlan.plan_date >= start_date,
        MealPlan.plan_date <= end_date
    ).all()

    plans_by_date = {}
    for mp in meal_plans:
        date_str = mp.plan_date.isoformat()
        if date_str not in plans_by_date:
            plans_by_date[date_str] = {}

        recipe_data = None
        if mp.recipe:
            recipe_data = {
                'id': mp.recipe.id,
                'title': mp.recipe.title
            }

        plans_by_date[date_str][mp.meal_type] = {
            'id': mp.id,
            'recipe': recipe_data
        }

    day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    days = []
    for i in range(7):
        current_date = start_date + timedelta(days=i)
        date_str = current_date.isoformat()

        meals = plans_by_date.get(date_str, {})

        days.append({
            'date': date_str,
            'day_name': day_names[i],
            'meals': {
                'breakfast': meals.get('breakfast'),
                'lunch': meals.get('lunch'),
                'dinner': meals.get('dinner'),
                'snack': meals.get('snack')
            }
        })

    return {
        'week_start': start_date.isoformat(),
        'week_end': end_date.isoformat(),
        'days': days
    }, 200


@planning_bp.post('/meals',
    responses={"200": MealResponse, "201": MealResponse, "400": MessageResponse, "404": MessageResponse})
@login_required
def add_meal(body: AddMealBody):
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    try:
        plan_date = datetime.fromisoformat(body.plan_date.replace('Z', '+00:00')).date()
    except ValueError:
        return {'msg': 'Invalid plan_date format. Use ISO format.'}, 400

    if body.recipe_id:
        recipe = db.session.get(Recipe, body.recipe_id)
        if not recipe:
            return {'msg': 'Recipe not found'}, 404

    existing = MealPlan.query.filter_by(
        user_id=user.id,
        plan_date=plan_date,
        meal_type=body.meal_type
    ).first()

    if existing:
        existing.recipe_id = body.recipe_id
        db.session.commit()
        return {
            'msg': 'Meal plan updated',
            'meal_plan_id': existing.id
        }, 200

    meal_plan = MealPlan(
        user_id=user.id,
        plan_date=plan_date,
        meal_type=body.meal_type,
        recipe_id=body.recipe_id
    )
    db.session.add(meal_plan)
    db.session.commit()

    return {
        'msg': 'Meal added to plan',
        'meal_plan_id': meal_plan.id
    }, 201


@planning_bp.put('/meals/<int:meal_id>',
    responses={"200": MessageResponse, "400": MessageResponse, "404": MessageResponse})
@login_required
def update_meal(path: MealIdPath, body: UpdateMealBody):
    meal_id = path.meal_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    meal_plan = MealPlan.query.filter_by(id=meal_id, user_id=user.id).first()
    if not meal_plan:
        return {'msg': 'Meal plan not found'}, 404

    if body.recipe_id is not None:
        if body.recipe_id:
            recipe = db.session.get(Recipe, body.recipe_id)
            if not recipe:
                return {'msg': 'Recipe not found'}, 404
        meal_plan.recipe_id = body.recipe_id

    if body.plan_date is not None:
        try:
            meal_plan.plan_date = datetime.fromisoformat(
                body.plan_date.replace('Z', '+00:00')
            ).date()
        except ValueError:
            return {'msg': 'Invalid plan_date format'}, 400

    if body.meal_type is not None:
        meal_plan.meal_type = body.meal_type

    db.session.commit()

    return {'msg': 'Meal plan updated'}, 200


@planning_bp.delete('/meals/<int:meal_id>',
    responses={"200": MessageResponse, "404": MessageResponse})
@login_required
def delete_meal(path: MealIdPath):
    meal_id = path.meal_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    meal_plan = MealPlan.query.filter_by(id=meal_id, user_id=user.id).first()
    if not meal_plan:
        return {'msg': 'Meal plan not found'}, 404

    db.session.delete(meal_plan)
    db.session.commit()

    return {'msg': 'Meal removed from plan'}, 200


@planning_bp.get('/missing-ingredients',
    responses={"200": NeededIngredientsResponse, "400": MessageResponse, "404": MessageResponse})
@login_required
def get_missing_ingredients(query: MissingIngredientsQuery):
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    start_date_str = query.start_date

    if start_date_str:
        try:
            start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00')).date()
        except ValueError:
            return {'msg': 'Invalid start_date format. Use ISO format.'}, 400
    else:
        today = datetime.now().date()
        start_date = today - timedelta(days=today.weekday())

    end_date = start_date + timedelta(days=6)

    meal_plans = MealPlan.query.filter(
        MealPlan.user_id == user.id,
        MealPlan.plan_date >= start_date,
        MealPlan.plan_date <= end_date,
        MealPlan.recipe_id.isnot(None)
    ).all()

    needed_ingredients = {}

    for mp in meal_plans:
        if mp.recipe:
            for ri in mp.recipe.ingredients:
                ing_id = ri.ingredient_id
                if ing_id not in needed_ingredients:
                    needed_ingredients[ing_id] = {
                        'name': ri.ingredient.name,
                        'quantities': {},
                        'unit': ri.unit
                    }

                unit = ri.unit or 'piece'
                qty = ri.quantity or 0

                if unit not in needed_ingredients[ing_id]['quantities']:
                    needed_ingredients[ing_id]['quantities'][unit] = 0

                try:
                    needed_ingredients[ing_id]['quantities'][unit] += float(qty)
                except (ValueError, TypeError):
                    pass

    fridge_items_dict = {
        item.ingredient_id: {'quantity': item.quantity, 'unit': item.unit}
        for item in FridgeItem.query.filter_by(user_id=user.id).all()
    }

    missing = []
    for ing_id, data in needed_ingredients.items():
        fridge_data = fridge_items_dict.get(ing_id)

        primary_unit = None
        total_needed = 0
        quantities_by_unit = []

        for unit, qty in data['quantities'].items():
            if qty > 0:
                unit_group = get_unit_group(unit)
                if unit_group:
                    primary = get_primary_unit(unit)
                    converted = convert_unit(qty, unit, primary)
                    if converted:
                        total_needed += converted
                        primary_unit = primary
                    else:
                        total_needed += qty
                        primary_unit = unit
                else:
                    total_needed += qty
                    primary_unit = unit

                quantities_by_unit.append({
                    'quantity': round(qty, 2),
                    'unit': unit
                })

        fridge_quantity = None
        is_sufficient = False

        if fridge_data:
            fridge_qty = fridge_data['quantity'] or 0
            fridge_unit = fridge_data['unit']

            if primary_unit and fridge_unit:
                converted_fridge = convert_unit(fridge_qty, fridge_unit, primary_unit)
                if converted_fridge:
                    fridge_quantity = round(converted_fridge, 2)
                    is_sufficient = converted_fridge >= total_needed
                else:
                    fridge_quantity = fridge_qty
            else:
                fridge_quantity = fridge_qty

        missing.append({
            'ingredient_id': ing_id,
            'name': data['name'],
            'needed_total': round(total_needed, 2) if total_needed else None,
            'needed_unit': primary_unit,
            'needed_breakdown': quantities_by_unit,
            'in_fridge': fridge_quantity,
            'fridge_unit': fridge_data['unit'] if fridge_data else None,
            'is_available': fridge_data is not None,
            'is_sufficient': is_sufficient
        })

    missing.sort(key=lambda x: (x['is_sufficient'], x['is_available'], x['name']))

    return {
        'week_start': start_date.isoformat(),
        'week_end': end_date.isoformat(),
        'missing_ingredients': missing,
        'total_ingredients': len(missing),
        'available_count': sum(1 for m in missing if m['is_available']),
        'unavailable_count': sum(1 for m in missing if not m['is_available'])
    }, 200


@planning_bp.post('/bulk-import', responses={"200": BulkImportResponse, "404": MessageResponse})
@login_required
def bulk_import_meals(body: BulkImportBody):
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    added_count = 0
    updated_count = 0
    errors = []

    for meal_data in body.meals:
        try:
            plan_date = datetime.fromisoformat(meal_data.plan_date.replace('Z', '+00:00')).date()
        except ValueError:
            errors.append(f'Invalid date format: {meal_data.plan_date}')
            continue

        if meal_data.recipe_id:
            recipe = db.session.get(Recipe, meal_data.recipe_id)
            if not recipe:
                errors.append(f'Recipe not found: {meal_data.recipe_id}')
                continue

        existing = MealPlan.query.filter_by(
            user_id=user.id,
            plan_date=plan_date,
            meal_type=meal_data.meal_type
        ).first()

        if existing:
            existing.recipe_id = meal_data.recipe_id
            updated_count += 1
        else:
            meal_plan = MealPlan(
                user_id=user.id,
                plan_date=plan_date,
                meal_type=meal_data.meal_type,
                recipe_id=meal_data.recipe_id
            )
            db.session.add(meal_plan)
            added_count += 1

    db.session.commit()

    return {
        'msg': 'Bulk import completed',
        'added': added_count,
        'updated': updated_count,
        'errors': errors
    }, 200


@planning_bp.delete('/clear-week',
    responses={"200": ClearWeekResponse, "400": MessageResponse, "404": MessageResponse})
@login_required
def clear_week(query: ClearWeekQuery):
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    start_date_str = query.start_date

    if start_date_str:
        try:
            start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00')).date()
        except ValueError:
            return {'msg': 'Invalid start_date format. Use ISO format.'}, 400
    else:
        today = datetime.now().date()
        start_date = today - timedelta(days=today.weekday())

    end_date = start_date + timedelta(days=6)

    count = MealPlan.query.filter(
        MealPlan.user_id == user.id,
        MealPlan.plan_date >= start_date,
        MealPlan.plan_date <= end_date
    ).delete()

    db.session.commit()

    return {
        'msg': f'Cleared {count} meal plans',
        'deleted_count': count,
        'week_start': start_date.isoformat(),
        'week_end': end_date.isoformat()
    }, 200


@planning_bp.get('/stats', responses={"200": PlanningStatsResponse, "404": MessageResponse})
@login_required
def get_planning_stats():
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    total_plans = MealPlan.query.filter_by(user_id=user.id).count()

    plans_with_recipes = MealPlan.query.filter(
        MealPlan.user_id == user.id,
        MealPlan.recipe_id.isnot(None)
    ).count()

    today = datetime.now().date()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    current_week_plans = MealPlan.query.filter(
        MealPlan.user_id == user.id,
        MealPlan.plan_date >= week_start,
        MealPlan.plan_date <= week_end
    ).count()

    meal_type_counts = db.session.query(
        MealPlan.meal_type,
        func.count(MealPlan.id)
    ).filter(
        MealPlan.user_id == user.id
    ).group_by(MealPlan.meal_type).all()

    meal_type_distribution = {meal_type: count for meal_type, count in meal_type_counts}

    return {
        'total_plans': total_plans,
        'plans_with_recipes': plans_with_recipes,
        'current_week_plans': current_week_plans,
        'week_start': week_start.isoformat(),
        'week_end': week_end.isoformat(),
        'meal_type_distribution': meal_type_distribution
    }, 200
