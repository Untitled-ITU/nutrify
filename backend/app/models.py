from ..extensions import db

from datetime import datetime, timezone


class Ingredient(db.Model):
    __tablename__ = 'ingredient'

    id = db.Column(db.BigInteger, primary_key=True)
    name = db.Column(db.Text, unique=True, nullable=False)

    def __repr__(self):
        return f'<Ingredient {self.name}>'


class Recipe(db.Model):
    __tablename__ = 'recipe'

    id = db.Column(db.BigInteger, primary_key=True)
    author_id = db.Column(db.BigInteger, db.ForeignKey('users.id'))
    recipe_title = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.Text)
    subcategory = db.Column(db.Text)
    directions = db.Column(db.Text)
    num_ingredients = db.Column(db.Integer)
    num_steps = db.Column(db.Integer)
    cuisine = db.Column(db.Text)
    prep_time = db.Column(db.Integer)
    cooking_time = db.Column(db.Integer)
    difficulty = db.Column(db.Text)
    image_url = db.Column(db.Text)
    calories = db.Column(db.Integer)
    protein = db.Column(db.Integer)
    carbohydrates = db.Column(db.Integer)
    original_ingredients = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    author = db.relationship('User', backref='recipes')
    ingredients = db.relationship('RecipeIngredient', back_populates='recipe', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Recipe {self.recipe_title}>'


class RecipeIngredient(db.Model):
    __tablename__ = 'recipe_ingredients'

    recipe_id = db.Column(db.BigInteger, db.ForeignKey('recipe.id', ondelete='CASCADE'), primary_key=True)
    ingredient_id = db.Column(db.BigInteger, db.ForeignKey('ingredient.id'), primary_key=True)
    quantity = db.Column(db.Text)

    recipe = db.relationship('Recipe', back_populates='ingredients')
    ingredient = db.relationship('Ingredient', backref='recipe_ingredients')

    def __repr__(self):
        return f'<RecipeIngredient recipe_id={self.recipe_id} ingredient_id={self.ingredient_id}>'


class MealPlan(db.Model):
    __tablename__ = 'meal_plans'

    id = db.Column(db.BigInteger, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    recipe_id = db.Column(db.BigInteger, db.ForeignKey('recipe.id'))
    plan_date = db.Column(db.Date, nullable=False)
    meal_type = db.Column(db.Text, nullable=False)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'plan_date', 'meal_type', name='unique_user_meal_plan'),
    )

    user = db.relationship('User', backref='meal_plans')
    recipe = db.relationship('Recipe', backref='meal_plans')

    def __repr__(self):
        return f'<MealPlan user_id={self.user_id} date={self.plan_date} type={self.meal_type}>'


class ShoppingList(db.Model):
    __tablename__ = 'shopping_list'

    id = db.Column(db.BigInteger, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    ingredient_id = db.Column(db.BigInteger, db.ForeignKey('ingredient.id'))
    amount = db.Column(db.Text)
    is_purchased = db.Column(db.Boolean, default=False)

    user = db.relationship('User', backref='shopping_lists')
    ingredient = db.relationship('Ingredient', backref='shopping_lists')

    def __repr__(self):
        return f'<ShoppingList user_id={self.user_id} ingredient_id={self.ingredient_id}>'
