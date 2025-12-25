from flask_openapi3 import APIBlueprint, Tag
from flask_jwt_extended import get_jwt_identity

from backend.extensions import db
from ..auth.models import User
from ..auth.schemas import UnauthorizedResponse
from ..decorators import login_required
from ..models import FridgeItem, Ingredient
from ..utils.unit_converter import format_quantity_with_conversions
from .schemas import (
    ItemIdPath, FridgeListResponse, AddFridgeItemBody, FridgeItemResponse,
    UpdateFridgeItemBody, MessageResponse, BatchAddBody, BatchAddResponse,
    FridgeStatsResponse, FridgeSearchQuery
)


fridge_tag = Tag(name="Fridge", description="Fridge inventory management")
fridge_bp = APIBlueprint(
    'fridge', __name__, url_prefix='/api/fridge',
    abp_tags=[fridge_tag], abp_security=[{"jwt": []}],
    abp_responses={"401": UnauthorizedResponse}
)


@fridge_bp.get('/items', responses={"200": FridgeListResponse, "404": MessageResponse})
@login_required
def get_fridge_items():
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    items = FridgeItem.query.filter_by(user_id=user.id).order_by(
        FridgeItem.added_at.desc()
    ).all()

    result_items = []
    for item in items:
        formatted = format_quantity_with_conversions(
            item.quantity, item.unit, include_conversions=True
        )
        result_items.append({
            'id': item.id,
            'ingredient': {
                'id': item.ingredient.id,
                'name': item.ingredient.name,
                'default_unit': item.ingredient.default_unit
            },
            'quantity': formatted['quantity'],
            'unit': formatted['unit'],
            'description': item.description,
            'alternatives': formatted['alternatives'],
            'added_at': item.added_at.isoformat() if item.added_at else None
        })

    return {
        'items': result_items,
        'total': len(items)
    }, 200


@fridge_bp.post('/items',
    responses={"201": FridgeItemResponse, "404": MessageResponse, "409": MessageResponse})
@login_required
def add_fridge_item(body: AddFridgeItemBody):
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    ingredient = None

    if body.ingredient_id:
        ingredient = db.session.get(Ingredient, body.ingredient_id)
    
    elif body.ingredient_name:
        clean_name = body.ingredient_name.strip().title()
        
        ingredient = Ingredient.query.filter(
            Ingredient.name.ilike(clean_name)
        ).first()

        if not ingredient:
            ingredient = Ingredient(name=clean_name, default_unit=body.unit or 'pcs')
            db.session.add(ingredient)
            db.session.commit()
    
    if not ingredient:
        return {'msg': 'Ingredient invalid'}, 400

    existing = FridgeItem.query.filter_by(
        user_id=user.id,
        ingredient_id=ingredient.id
    ).first()

    if existing:
        return {'msg': 'Ingredient already in fridge. Use PUT to update or delete old one.'}, 409

    fridge_item = FridgeItem(
        user_id=user.id,
        ingredient_id=ingredient.id,
        quantity=body.quantity,
        unit=body.unit or ingredient.default_unit,
        description=body.description
    )
    db.session.add(fridge_item)
    db.session.commit()

    formatted = format_quantity_with_conversions(
        fridge_item.quantity,
        fridge_item.unit,
        include_conversions=True
    )

    return {
        'msg': 'Item added to fridge',
        'item': {
            'id': fridge_item.id,
            'ingredient': {
                'id': ingredient.id,
                'name': ingredient.name,
                'default_unit': ingredient.default_unit
            },
            'quantity': formatted['quantity'],
            'unit': formatted['unit'],
            'description': fridge_item.description,
            'alternatives': formatted['alternatives'],
            'added_at': fridge_item.added_at.isoformat() if fridge_item.added_at else None
        }
    }, 201


@fridge_bp.put('/<int:item_id>', responses={"200": FridgeItemResponse, "404": MessageResponse})
@login_required
def update_fridge_item(path: ItemIdPath, body: UpdateFridgeItemBody):
    item_id = path.item_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    item = FridgeItem.query.filter_by(id=item_id, user_id=user.id).first()
    if not item:
        return {'msg': 'Item not found'}, 404

    if body.quantity is not None:
        item.quantity = body.quantity
    if body.unit is not None:
        item.unit = body.unit
    if body.description is not None:
        item.description = body.description

    db.session.commit()

    formatted = format_quantity_with_conversions(
        item.quantity,
        item.unit,
        include_conversions=True
    )

    return {
        'msg': 'Item updated',
        'item': {
            'id': item.id,
            'ingredient': {
                'id': item.ingredient.id,
                'name': item.ingredient.name,
                'default_unit': item.ingredient.default_unit
            },
            'quantity': formatted['quantity'],
            'unit': formatted['unit'],
            'alternatives': formatted['alternatives'],
            'added_at': item.added_at.isoformat() if item.added_at else None
        }
    }, 200


@fridge_bp.delete('/<int:item_id>', responses={"200": MessageResponse, "404": MessageResponse})
@login_required
def delete_fridge_item(path: ItemIdPath):
    item_id = path.item_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    item = FridgeItem.query.filter_by(id=item_id, user_id=user.id).first()
    if not item:
        return {'msg': 'Item not found'}, 404

    db.session.delete(item)
    db.session.commit()

    return {'msg': 'Item removed from fridge'}, 200


@fridge_bp.get('/search',
    responses={"200": FridgeListResponse, "400": MessageResponse, "404": MessageResponse})
@login_required
def search_fridge(query: FridgeSearchQuery):
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    q = query.q

    items = FridgeItem.query.join(Ingredient).filter(
        FridgeItem.user_id == user.id,
        Ingredient.name.ilike(f'%{q}%')
    ).all()

    result_items = []
    for item in items:
        formatted = format_quantity_with_conversions(
            item.quantity, item.unit, include_conversions=True
        )
        result_items.append({
            'id': item.id,
            'ingredient': {
                'id': item.ingredient.id,
                'name': item.ingredient.name,
                'default_unit': item.ingredient.default_unit
            },
            'quantity': formatted['quantity'],
            'unit': formatted['unit'],
            'alternatives': formatted['alternatives'],
            'added_at': item.added_at.isoformat() if item.added_at else None
        })

    return {
        'items': result_items,
        'total': len(result_items)
    }, 200


@fridge_bp.post('/batch', responses={"200": BatchAddResponse, "404": MessageResponse})
@login_required
def batch_add_items(body: BatchAddBody):
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    added_count = 0
    updated_count = 0
    errors = []

    for item_data in body.items:
        ingredient = None
        if item_data.ingredient_id:
            ingredient = db.session.get(Ingredient, item_data.ingredient_id)
        
        elif item_data.ingredient_name:
            clean_name = item_data.ingredient_name.strip().title()
            ingredient = Ingredient.query.filter(
                Ingredient.name.ilike(clean_name)
            ).first()
            
            if not ingredient:
                ingredient = Ingredient(name=clean_name, default_unit=item_data.unit or 'pcs')
                db.session.add(ingredient)
                db.session.commit()

        if not ingredient:
            errors.append(f"Could not process: {item_data.ingredient_name}")
            continue

        existing = FridgeItem.query.filter_by(
            user_id=user.id,
            ingredient_id=ingredient.id
        ).first()

        if existing:
            existing.quantity = (existing.quantity or 0) + (item_data.quantity or 0)
            updated_count += 1
        else:
            new_item = FridgeItem(
                user_id=user.id,
                ingredient_id=ingredient.id,
                quantity=item_data.quantity,
                unit=item_data.unit
            )
            db.session.add(new_item)
            added_count += 1

    db.session.commit()

    return {
        'msg': 'Batch add completed',
        'added': added_count,
        'updated': updated_count,
        'errors': errors
    }, 200


@fridge_bp.delete('/clear', responses={"200": MessageResponse, "404": MessageResponse})
@login_required
def clear_fridge():
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    count = FridgeItem.query.filter_by(user_id=user.id).delete()
    db.session.commit()

    return {'msg': f'Cleared {count} items from fridge'}, 200


@fridge_bp.get('/stats', responses={"200": FridgeStatsResponse, "404": MessageResponse})
@login_required
def get_fridge_stats():
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    total_items = FridgeItem.query.filter_by(user_id=user.id).count()
    recent_items = FridgeItem.query.filter_by(user_id=user.id).order_by(
        FridgeItem.added_at.desc()
    ).limit(5).all()

    return {
        'total_items': total_items,
        'recently_added': [{
            'id': item.id,
            'ingredient_name': item.ingredient.name,
            'added_at': item.added_at.isoformat() if item.added_at else None
        } for item in recent_items]
    }, 200