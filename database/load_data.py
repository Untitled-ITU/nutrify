import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import create_app
from backend.app.models import (
    Recipe, Ingredient, RecipeIngredient, MealPlan,
    ShoppingList, FridgeItem, Favorite, Rating
)
from backend.extensions import db


def load_data():
    recipes_file = os.path.join(os.path.dirname(__file__), 'recipes.json')
    ingredients_file = os.path.join(os.path.dirname(__file__), 'ingredients.json')

    with open(ingredients_file, 'r', encoding='utf8') as f:
        ingredients = json.load(f)

    with open(recipes_file, 'r', encoding='utf8') as f:
        recipes_data = json.load(f)

    RecipeIngredient.query.delete()
    MealPlan.query.delete()
    Favorite.query.delete()
    Rating.query.delete()
    ShoppingList.query.delete()
    FridgeItem.query.delete()
    Recipe.query.delete()
    Ingredient.query.delete()
    db.session.commit()

    ingredient_map = {}

    for name, units in ingredients.items():
        default_unit = units[0]

        ingredient = Ingredient(
            name=name,
            default_unit=default_unit
        )
        db.session.add(ingredient)
        ingredient_map[name] = ingredient

    db.session.commit()

    for recipe_data in recipes_data:
        recipe = Recipe(
            title=recipe_data['title'],
            description=recipe_data['description'],
            category=recipe_data['category'],
            cuisine=recipe_data['cuisine'],
            meal_type=recipe_data['meal_type'],
            is_vegan=recipe_data['is_vegan'],
            is_vegetarian=recipe_data['is_vegetarian'],
            directions=recipe_data['directions'],
            num_ingredients=len(recipe_data['ingredients'])
        )
        db.session.add(recipe)
        db.session.flush()

        for ing_data in recipe_data['ingredients']:
            name = ing_data['name']

            if name not in ingredient_map:
                ingredient = Ingredient(name=name)
                db.session.add(ingredient)
                db.session.flush()
                ingredient_map[name] = ingredient
            else:
                ingredient = ingredient_map[name]

            quantity = float(ing_data['quantity'])

            recipe_ingredient = RecipeIngredient(
                recipe_id=recipe.id,
                ingredient_id=ingredient.id,
                quantity=quantity,
                unit=ing_data['unit']
            )
            db.session.add(recipe_ingredient)

    db.session.commit()


def main():
    app = create_app()

    with app.app_context():
        load_data()


if __name__ == '__main__':
    main()
