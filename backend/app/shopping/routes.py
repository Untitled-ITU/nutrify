from datetime import datetime, timedelta

from flask_openapi3 import APIBlueprint, Tag
from flask_jwt_extended import get_jwt_identity

from extensions import db
from ..auth.models import User
from ..auth.schemas import UnauthorizedResponse
from ..decorators import login_required
from ..models import ShoppingList, Ingredient, Recipe, MealPlan, FridgeItem
from ..utils.unit_converter import format_quantity_with_conversions, get_unit_group, convert_unit
from .schemas import (
    RecipeIdPath, ItemIdPath,
    ShoppingListResponse, AddItemBody, AddItemResponse, MessageResponse,
    BulkDeleteBody, BulkDeleteResponse, TransferResponse, CompareResponse,
    FromRecipeResponse, FromMealPlanBody, FromMealPlanResponse,
    ToggleResponse, UpdateItemBody, ClearListQuery
)


shopping_tag = Tag(name="Shopping List", description="Shopping list management")
shopping_bp = APIBlueprint(
    'shopping', __name__, url_prefix='/api/shopping-list',
    abp_tags=[shopping_tag], abp_security=[{"jwt": []}],
    abp_responses={"401": UnauthorizedResponse}
)


@shopping_bp.get('', responses={"200": ShoppingListResponse, "404": MessageResponse})
@login_required
def get_shopping_list():
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    items = ShoppingList.query.filter_by(user_id=user.id).order_by(
        ShoppingList.is_purchased.asc(),
        ShoppingList.created_at.desc()
    ).all()

    purchased_count = sum(1 for item in items if item.is_purchased)

    result_items = []
    for item in items:
        unit = item.unit or (item.ingredient.default_unit if item.ingredient else None)
        formatted = format_quantity_with_conversions(item.amount, unit, include_conversions=True)

        result_items.append({
            'id': item.id,
            'ingredient': {
                'id': item.ingredient.id,
                'name': item.ingredient.name
            } if item.ingredient else None,
            'amount': formatted['quantity'],
            'unit': formatted['unit'],
            'alternatives': formatted['alternatives'],
            'is_purchased': item.is_purchased,
            'source_type': item.source_type,
            'source_id': item.source_id,
            'created_at': item.created_at.isoformat() if item.created_at else None
        })

    return {
        'items': result_items,
        'total_items': len(items),
        'purchased_count': purchased_count
    }, 200


@shopping_bp.post('/items',
    responses={"200": AddItemResponse, "201": AddItemResponse, "400": MessageResponse, "404": MessageResponse})
@login_required
def add_item(body: AddItemBody):
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    if not body.ingredient_id and not body.ingredient_name:
        return {'msg': 'ingredient_id or ingredient_name is required'}, 400

    ingredient = None
    if body.ingredient_id:
        ingredient = db.session.get(Ingredient, body.ingredient_id)
    elif body.ingredient_name:
        ingredient = Ingredient.query.filter(
            Ingredient.name.ilike(body.ingredient_name.strip())
        ).first()

    if not ingredient:
        return {'msg': 'Ingredient not found'}, 404

    existing = ShoppingList.query.filter_by(
        user_id=user.id,
        ingredient_id=ingredient.id
    ).first()

    if existing:
        existing.amount = body.amount
        existing.is_purchased = False
        db.session.commit()
        return {
            'msg': 'Item updated in shopping list',
            'item_id': existing.id
        }, 200

    item = ShoppingList(
        user_id=user.id,
        ingredient_id=ingredient.id,
        amount=body.amount,
        source_type='manual'
    )
    db.session.add(item)
    db.session.commit()

    return {
        'msg': 'Item added to shopping list',
        'item_id': item.id
    }, 201


@shopping_bp.post('/from-recipe/<int:recipe_id>',
    responses={"201": FromRecipeResponse, "404": MessageResponse})
@login_required
def add_from_recipe(path: RecipeIdPath):
    recipe_id = path.recipe_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    recipe = db.session.get(Recipe, recipe_id)
    if not recipe:
        return {'msg': 'Recipe not found'}, 404

    added_count = 0
    updated_count = 0

    for ri in recipe.ingredients:
        existing = ShoppingList.query.filter_by(
            user_id=user.id,
            ingredient_id=ri.ingredient_id
        ).first()

        if existing:
            updated_count += 1
        else:
            item = ShoppingList(
                user_id=user.id,
                ingredient_id=ri.ingredient_id,
                amount=ri.quantity,
                unit=ri.unit,
                source_type='recipe',
                source_id=recipe_id
            )
            db.session.add(item)
            added_count += 1

    db.session.commit()

    return {
        'msg': f'Shopping list updated from recipe "{recipe.title}"',
        'added_count': added_count,
        'updated_count': updated_count
    }, 201


@shopping_bp.post('/from-meal-plan',
    responses={"201": FromMealPlanResponse, "404": MessageResponse})
@login_required
def add_from_meal_plan(body: FromMealPlanBody):
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    if body.start_date:
        start_date = datetime.fromisoformat(body.start_date.replace('Z', '+00:00')).date()
    else:
        today = datetime.now().date()
        start_date = today - timedelta(days=today.weekday())

    if body.end_date:
        end_date = datetime.fromisoformat(body.end_date.replace('Z', '+00:00')).date()
    else:
        end_date = start_date + timedelta(days=6)

    meal_plans = MealPlan.query.filter(
        MealPlan.user_id == user.id,
        MealPlan.plan_date >= start_date,
        MealPlan.plan_date <= end_date,
        MealPlan.recipe_id.isnot(None)
    ).all()

    added_count = 0

    for meal_plan in meal_plans:
        recipe = meal_plan.recipe
        if recipe:
            for ri in recipe.ingredients:
                existing = ShoppingList.query.filter_by(
                    user_id=user.id,
                    ingredient_id=ri.ingredient_id
                ).first()

                if not existing:
                    item = ShoppingList(
                        user_id=user.id,
                        ingredient_id=ri.ingredient_id,
                        amount=ri.quantity,
                        unit=ri.unit,
                        source_type='meal_plan',
                        source_id=meal_plan.id
                    )
                    db.session.add(item)
                    added_count += 1

    db.session.commit()

    return {
        'msg': f'Shopping list generated from meal plan ({start_date} to {end_date})',
        'added_count': added_count,
        'meal_plans_processed': len(meal_plans)
    }, 201


@shopping_bp.put('/items/<int:item_id>/toggle',
    responses={"200": ToggleResponse, "404": MessageResponse})
@login_required
def toggle_purchased(path: ItemIdPath):
    item_id = path.item_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    item = ShoppingList.query.filter_by(id=item_id, user_id=user.id).first()
    if not item:
        return {'msg': 'Item not found'}, 404

    item.is_purchased = not item.is_purchased
    db.session.commit()

    return {
        'msg': 'Item status updated',
        'is_purchased': item.is_purchased
    }, 200


@shopping_bp.put('/items/<int:item_id>',
    responses={"200": MessageResponse, "404": MessageResponse})
@login_required
def update_item(path: ItemIdPath, body: UpdateItemBody):
    item_id = path.item_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    item = ShoppingList.query.filter_by(id=item_id, user_id=user.id).first()
    if not item:
        return {'msg': 'Item not found'}, 404

    if body.amount is not None:
        item.amount = body.amount
    if body.is_purchased is not None:
        item.is_purchased = body.is_purchased

    db.session.commit()

    return {'msg': 'Item updated'}, 200


@shopping_bp.delete('/items/<int:item_id>',
    responses={"200": MessageResponse, "404": MessageResponse})
@login_required
def delete_item(path: ItemIdPath):
    item_id = path.item_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    item = ShoppingList.query.filter_by(id=item_id, user_id=user.id).first()
    if not item:
        return {'msg': 'Item not found'}, 404

    db.session.delete(item)
    db.session.commit()

    return {'msg': 'Item removed from shopping list'}, 200


@shopping_bp.post('/items/bulk-delete',
    responses={"200": BulkDeleteResponse, "404": MessageResponse})
@login_required
def bulk_delete_items(body: BulkDeleteBody):
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    deleted_count = ShoppingList.query.filter(
        ShoppingList.user_id == user.id,
        ShoppingList.id.in_(body.item_ids)
    ).delete(synchronize_session=False)

    db.session.commit()

    return {
        'msg': f'{deleted_count} items removed from shopping list',
        'deleted_count': deleted_count
    }, 200


@shopping_bp.post('/transfer-to-fridge',
    responses={"200": TransferResponse, "404": MessageResponse})
@login_required
def transfer_to_fridge():
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    purchased_items = ShoppingList.query.filter_by(
        user_id=user.id,
        is_purchased=True
    ).all()

    if not purchased_items:
        return {
            'msg': 'No purchased items to transfer',
            'transferred_count': 0,
            'updated_count': 0,
            'total_processed': 0
        }, 200

    transferred_count = 0
    updated_count = 0

    for shop_item in purchased_items:
        if not shop_item.ingredient_id:
            continue

        fridge_item = FridgeItem.query.filter_by(
            user_id=user.id,
            ingredient_id=shop_item.ingredient_id
        ).first()

        shop_unit = shop_item.unit or (
            shop_item.ingredient.default_unit if shop_item.ingredient else None
        )

        if fridge_item:
            try:
                amount = float(shop_item.amount) if shop_item.amount else 0

                if shop_unit and fridge_item.unit:
                    shop_group = get_unit_group(shop_unit)
                    fridge_group = get_unit_group(fridge_item.unit)

                    if shop_group and fridge_group and shop_group == fridge_group:
                        converted_amount = convert_unit(amount, shop_unit, fridge_item.unit)
                        if converted_amount:
                            amount = converted_amount

                fridge_item.quantity = (fridge_item.quantity or 0) + amount
                updated_count += 1
            except (ValueError, TypeError):
                fridge_item.quantity = (fridge_item.quantity or 0) + (
                    float(shop_item.amount) if shop_item.amount else 0
                )
                updated_count += 1
        else:
            try:
                amount = float(shop_item.amount) if shop_item.amount else None
            except ValueError:
                amount = None

            new_fridge_item = FridgeItem(
                user_id=user.id,
                ingredient_id=shop_item.ingredient_id,
                quantity=amount,
                unit=shop_unit
            )
            db.session.add(new_fridge_item)
            transferred_count += 1

        db.session.delete(shop_item)

    db.session.commit()

    return {
        'msg': 'Purchased items transferred to fridge',
        'transferred_count': transferred_count,
        'updated_count': updated_count,
        'total_processed': transferred_count + updated_count
    }, 200


@shopping_bp.delete('/clear', responses={"200": MessageResponse, "404": MessageResponse})
@login_required
def clear_list(query: ClearListQuery):
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    purchased_only = query.purchased_only

    query_obj = ShoppingList.query.filter_by(user_id=user.id)
    if purchased_only:
        query_obj = query_obj.filter_by(is_purchased=True)

    count = query_obj.delete()
    db.session.commit()

    return {
        'msg': f'{count} items removed from shopping list'
    }, 200


@shopping_bp.post('/compare-fridge',
    responses={"200": CompareResponse, "404": MessageResponse})
@login_required
def compare_with_fridge():
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    shopping_items = ShoppingList.query.filter_by(
        user_id=user.id,
        is_purchased=False
    ).all()

    fridge_items = {
        item.ingredient_id: item
        for item in FridgeItem.query.filter_by(user_id=user.id).all()
    }

    comparison = []
    for shop_item in shopping_items:
        fridge_item = fridge_items.get(shop_item.ingredient_id)

        comparison.append({
            'id': shop_item.id,
            'ingredient': {
                'id': shop_item.ingredient.id,
                'name': shop_item.ingredient.name
            } if shop_item.ingredient else None,
            'needed_amount': shop_item.amount,
            'in_fridge': fridge_item.quantity if fridge_item else None,
            'available_in_fridge': fridge_item is not None,
            'is_purchased': shop_item.is_purchased
        })

    return {
        'comparison': comparison,
        'total_items': len(comparison),
        'items_in_fridge': sum(1 for c in comparison if c['available_in_fridge'])
    }, 200
