from sqlalchemy import func, or_

from ...extensions import db
from ..utils.unit_converter import format_quantity_with_conversions
from ..models import (
    Recipe, Favorite, Rating, RecipeIngredient,
    Ingredient, RecipeCollection, CollectionItem
)


def get_recipe_list(
    search_query=None, ingredients=None, exclude_ingredients=None,
    category=None, cuisine=None, is_vegan=None, is_vegetarian=None,
    meal_type=None, sort_by='created_at', sort_order='desc', user_id=None
):
    query = Recipe.query

    if search_query:
        search_pattern = f'%{search_query}%'
        query = query.filter(
            or_(
                Recipe.title.ilike(search_pattern),
                Recipe.description.ilike(search_pattern)
            )
        )

    if ingredients:
        ingredient_list = [i.strip().lower() for i in ingredients if i.strip()]
        if ingredient_list:
            for ing in ingredient_list:
                subquery = db.session.query(RecipeIngredient.recipe_id).join(
                    Ingredient, RecipeIngredient.ingredient_id == Ingredient.id
                ).filter(
                    func.lower(Ingredient.name).contains(ing)
                )
                query = query.filter(Recipe.id.in_(subquery))

    if exclude_ingredients:
        exclude_list = [i.strip().lower() for i in exclude_ingredients if i.strip()]
        if exclude_list:
            for ing in exclude_list:
                exclude_subquery = db.session.query(RecipeIngredient.recipe_id).join(
                    Ingredient, RecipeIngredient.ingredient_id == Ingredient.id
                ).filter(
                    func.lower(Ingredient.name).contains(ing)
                )
                query = query.filter(~Recipe.id.in_(exclude_subquery))

    if category:
        query = query.filter(func.lower(Recipe.category) == category.lower())

    if cuisine:
        query = query.filter(func.lower(Recipe.cuisine) == cuisine.lower())

    if is_vegan is not None:
        query = query.filter(Recipe.is_vegan == is_vegan)

    if is_vegetarian is not None:
        query = query.filter(Recipe.is_vegetarian == is_vegetarian)

    if meal_type:
        query = query.filter(func.lower(Recipe.meal_type) == meal_type.lower())

    sort_column = getattr(Recipe, sort_by, Recipe.created_at)
    if sort_order == 'asc':
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    recipes = []
    for recipe in query.all():
        recipe_data = serialize_recipe_summary(recipe, user_id)
        recipes.append(recipe_data)

    return {'recipes': recipes}


def get_recipe_detail(recipe_id, user_id=None):
    recipe = db.session.get(Recipe, recipe_id)
    if not recipe:
        return

    ingredients = []
    for ri in recipe.ingredients:
        formatted = format_quantity_with_conversions(ri.quantity, ri.unit, include_conversions=True)
        ingredients.append({
            'id': ri.ingredient.id,
            'name': ri.ingredient.name,
            'quantity': formatted['quantity'],
            'unit': formatted['unit'],
            'alternatives': formatted['alternatives']
        })

    ratings_data = get_recipe_ratings_summary(recipe_id)

    is_favorite = False
    in_collections = []
    if user_id:
        favorite = Favorite.query.filter_by(
            user_id=user_id,
            recipe_id=recipe_id
        ).first()
        is_favorite = favorite is not None

        collection_items = CollectionItem.query.join(
            RecipeCollection
        ).filter(
            RecipeCollection.user_id == user_id,
            CollectionItem.recipe_id == recipe_id
        ).all()

        for item in collection_items:
            in_collections.append({
                'id': item.collection.id,
                'name': item.collection.name
            })

    author_data = None
    if recipe.author:
        author_data = {
            'id': recipe.author.id,
            'username': recipe.author.username
        }

    return {
        'id': recipe.id,
        'title': recipe.title,
        'description': recipe.description,
        'category': recipe.category,
        'cuisine': recipe.cuisine,
        'meal_type': recipe.meal_type,
        'is_vegan': recipe.is_vegan,
        'is_vegetarian': recipe.is_vegetarian,
        'directions': recipe.directions,
        'ingredients': ingredients,
        'author': author_data,
        'ratings': ratings_data,
        'is_favorite': is_favorite,
        'in_collections': in_collections,
        'created_at': recipe.created_at.isoformat() if recipe.created_at else None
    }


def serialize_recipe_summary(recipe, user_id=None):
    is_favorite = False
    in_collections_count = 0

    if user_id:
        favorite = Favorite.query.filter_by(
            user_id=user_id,
            recipe_id=recipe.id
        ).first()
        is_favorite = favorite is not None

        in_collections_count = CollectionItem.query.join(
            RecipeCollection
        ).filter(
            RecipeCollection.user_id == user_id,
            CollectionItem.recipe_id == recipe.id
        ).count()

    avg_rating = db.session.query(func.avg(Rating.score)).filter(
        Rating.recipe_id == recipe.id
    ).scalar()

    return {
        'id': recipe.id,
        'title': recipe.title,
        'description': recipe.description,
        'category': recipe.category,
        'cuisine': recipe.cuisine,
        'meal_type': recipe.meal_type,
        'is_vegan': recipe.is_vegan,
        'is_vegetarian': recipe.is_vegetarian,
        'num_ingredients': recipe.num_ingredients,
        'average_rating': round(avg_rating, 1) if avg_rating else None,
        'is_favorite': is_favorite,
        'in_collections_count': in_collections_count
    }


def get_recipe_ratings_summary(recipe_id):
    ratings = Rating.query.filter_by(recipe_id=recipe_id).all()

    if not ratings:
        return {
            'average': None,
            'count': 0
        }

    total_score = sum(r.score for r in ratings)
    return {
        'average': round(total_score / len(ratings), 1),
        'count': len(ratings)
    }


def add_to_favorites(user_id, recipe_id):
    recipe = db.session.get(Recipe, recipe_id)
    if not recipe:
        return {'msg': 'Recipe not found'}, 404

    existing = Favorite.query.filter_by(
        user_id=user_id,
        recipe_id=recipe_id
    ).first()

    if existing:
        return {'msg': 'Recipe already in favorites'}, 409

    favorite = Favorite(user_id=user_id, recipe_id=recipe_id)
    db.session.add(favorite)
    db.session.commit()

    return {'msg': 'Recipe added to favorites', 'favorite_id': favorite.id}, 201


def remove_from_favorites(user_id, recipe_id):
    favorite = Favorite.query.filter_by(
        user_id=user_id,
        recipe_id=recipe_id
    ).first()

    if not favorite:
        return {'msg': 'Recipe not in favorites'}, 404

    db.session.delete(favorite)
    db.session.commit()

    return {'msg': 'Recipe removed from favorites'}, 200


def get_user_favorites(user_id):
    query = Recipe.query.join(
        Favorite, Recipe.id == Favorite.recipe_id
    ).filter(
        Favorite.user_id == user_id
    ).order_by(
        Favorite.created_at.desc()
    )

    recipes = []
    for recipe in query.all():
        recipe_data = serialize_recipe_summary(recipe, user_id)
        recipes.append(recipe_data)

    return {'recipes': recipes}


def get_available_filters():
    categories = db.session.query(Recipe.category).distinct().filter(
        Recipe.category.isnot(None)
    ).all()
    categories = [c[0] for c in categories if c[0]]

    cuisines = db.session.query(Recipe.cuisine).distinct().filter(
        Recipe.cuisine.isnot(None)
    ).all()
    cuisines = [c[0] for c in cuisines if c[0]]

    meal_types = db.session.query(Recipe.meal_type).distinct().filter(
        Recipe.meal_type.isnot(None)
    ).all()
    meal_types = [m[0] for m in meal_types if m[0]]

    return {
        'categories': sorted(categories),
        'cuisines': sorted(cuisines),
        'meal_types': sorted(meal_types) if meal_types else
            ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'],
        'sort_options': [
            {'value': 'created_at', 'label': 'Date Added'},
            {'value': 'title', 'label': 'Title'}
        ]
    }


def get_user_collections(user_id, include_recipes=False):
    collections = RecipeCollection.query.filter_by(user_id=user_id).order_by(
        RecipeCollection.created_at.desc()
    ).all()

    return {
        'collections': [col.to_dict(include_recipes=include_recipes) for col in collections]
    }


def get_collection_detail(collection_id, user_id):
    collection = RecipeCollection.query.filter_by(
        id=collection_id,
        user_id=user_id
    ).first()

    if not collection:
        return

    return collection.to_dict(include_recipes=True)


def create_collection(user_id, name, description=None, is_public=False):
    existing = RecipeCollection.query.filter_by(
        user_id=user_id,
        name=name
    ).first()

    if existing:
        return {'msg': 'Collection with this name already exists'}, 409

    collection = RecipeCollection(
        user_id=user_id,
        name=name,
        description=description,
        is_public=is_public
    )
    db.session.add(collection)
    db.session.commit()

    return {'msg': 'Collection created successfully', 'collection': collection.to_dict()}, 201


def update_collection(collection_id, user_id, name=None, description=None, is_public=None):
    collection = RecipeCollection.query.filter_by(
        id=collection_id,
        user_id=user_id
    ).first()

    if not collection:
        return {'msg': 'Collection not found'}, 404

    if name and name != collection.name:
        existing = RecipeCollection.query.filter_by(
            user_id=user_id,
            name=name
        ).first()
        if existing:
            return {'msg': 'Collection with this name already exists'}, 409
        collection.name = name

    if description is not None:
        collection.description = description

    if is_public is not None:
        collection.is_public = is_public

    db.session.commit()

    return {'msg': 'Collection updated successfully'}, 200


def delete_collection(collection_id, user_id):
    collection = RecipeCollection.query.filter_by(
        id=collection_id,
        user_id=user_id
    ).first()

    if not collection:
        return {'msg': 'Collection not found'}, 404

    db.session.delete(collection)
    db.session.commit()

    return {'msg': 'Collection deleted successfully'}, 200


def add_recipe_to_collection(collection_id, recipe_id, user_id):
    collection = RecipeCollection.query.filter_by(
        id=collection_id,
        user_id=user_id
    ).first()

    if not collection:
        return {'msg': 'Collection not found'}, 404

    recipe = db.session.get(Recipe, recipe_id)
    if not recipe:
        return {'msg': 'Recipe not found'}, 404

    existing = CollectionItem.query.filter_by(
        collection_id=collection_id,
        recipe_id=recipe_id
    ).first()

    if existing:
        return {'msg': 'Recipe already in this collection'}, 409

    item = CollectionItem(
        collection_id=collection_id,
        recipe_id=recipe_id
    )
    db.session.add(item)
    db.session.commit()

    return {'msg': 'Recipe added to collection successfully'}, 201


def bulk_add_recipes_to_collection(collection_id, recipe_ids, user_id):
    collection = RecipeCollection.query.filter_by(
        id=collection_id,
        user_id=user_id
    ).first()

    if not collection:
        return {'msg': 'Collection not found'}, 404

    added_count = 0
    skipped_count = 0
    errors = []

    for recipe_id in recipe_ids:
        recipe = db.session.get(Recipe, recipe_id)
        if not recipe:
            errors.append(f'Recipe {recipe_id} not found')
            continue

        existing = CollectionItem.query.filter_by(
            collection_id=collection_id,
            recipe_id=recipe_id
        ).first()

        if existing:
            skipped_count += 1
            continue

        item = CollectionItem(
            collection_id=collection_id,
            recipe_id=recipe_id
        )
        db.session.add(item)
        added_count += 1

    db.session.commit()

    return {
        'msg': 'Bulk add completed',
        'added': added_count,
        'skipped': skipped_count,
        'errors': errors
    }, 200


def remove_recipe_from_collection(collection_id, recipe_id, user_id):
    collection = RecipeCollection.query.filter_by(
        id=collection_id,
        user_id=user_id
    ).first()

    if not collection:
        return {'msg': 'Collection not found'}, 404

    item = CollectionItem.query.filter_by(
        collection_id=collection_id,
        recipe_id=recipe_id
    ).first()

    if not item:
        return {'msg': 'Recipe not in this collection'}, 404

    db.session.delete(item)
    db.session.commit()

    return {'msg': 'Recipe removed from collection successfully'}, 200


def get_recipe_collections(recipe_id, user_id):
    collection_items = CollectionItem.query.join(
        RecipeCollection
    ).filter(
        RecipeCollection.user_id == user_id,
        CollectionItem.recipe_id == recipe_id
    ).all()

    collections = []
    for item in collection_items:
        collections.append({
            'collection_id': item.collection.id,
            'collection_name': item.collection.name,
            'added_at': item.added_at.isoformat() if item.added_at else None
        })

    return {'collections': collections}
