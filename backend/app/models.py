from sqlalchemy import func

from ..extensions import db

from datetime import datetime


class Ingredient(db.Model):
    __tablename__ = 'ingredient'

    id = db.Column(db.BigInteger, primary_key=True)
    name = db.Column(db.Text, unique=True, nullable=False)
    default_unit = db.Column(db.Text)

    def __repr__(self):
        return f'<Ingredient {self.name}>'


class Recipe(db.Model):
    __tablename__ = 'recipe'

    id = db.Column(db.BigInteger, primary_key=True)
    author_id = db.Column(db.BigInteger, db.ForeignKey('users.id'))
    title = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.Text)
    cuisine = db.Column(db.Text)
    meal_type = db.Column(db.Text)
    is_vegan = db.Column(db.Boolean, default=False)
    is_vegetarian = db.Column(db.Boolean, default=False)
    num_ingredients = db.Column(db.Integer)
    image_url = db.Column(db.Text)
    directions = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.now)

    author = db.relationship('User', backref='recipes')
    ingredients = db.relationship('RecipeIngredient', back_populates='recipe', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Recipe {self.title}>'


class RecipeIngredient(db.Model):
    __tablename__ = 'recipe_ingredients'

    recipe_id = db.Column(db.BigInteger, db.ForeignKey('recipe.id', ondelete='CASCADE'), primary_key=True)
    ingredient_id = db.Column(db.BigInteger, db.ForeignKey('ingredient.id'), primary_key=True)
    quantity = db.Column(db.Float)
    unit = db.Column(db.Text)

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
        db.UniqueConstraint('user_id', 'plan_date', 'meal_type'),
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
    unit = db.Column(db.Text)
    is_purchased = db.Column(db.Boolean, default=False)
    source_type = db.Column(db.Text)
    source_id = db.Column(db.BigInteger)
    created_at = db.Column(db.DateTime, default=datetime.now)

    user = db.relationship('User', backref='shopping_lists')
    ingredient = db.relationship('Ingredient', backref='shopping_lists')

    def __repr__(self):
        return f'<ShoppingList user_id={self.user_id} ingredient_id={self.ingredient_id}>'


class Favorite(db.Model):
    __tablename__ = 'favorites'

    id = db.Column(db.BigInteger, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    recipe_id = db.Column(db.BigInteger, db.ForeignKey('recipe.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'recipe_id'),
    )

    user = db.relationship('User', backref='favorites')
    recipe = db.relationship('Recipe', backref='favorites')

    def __repr__(self):
        return f'<Favorite user_id={self.user_id} recipe_id={self.recipe_id}>'


class RecipeCollection(db.Model):
    __tablename__ = 'recipe_collections'
    
    id = db.Column(db.BigInteger, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.now)
    is_public = db.Column(db.Boolean, default=False)
    
    user = db.relationship('User', backref='collections')
    items = db.relationship('CollectionItem', backref='collection', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<RecipeCollection {self.name}>'


class CollectionItem(db.Model):
    __tablename__ = 'collection_items'
    
    collection_id = db.Column(db.BigInteger, db.ForeignKey('recipe_collections.id', ondelete='CASCADE'), primary_key=True)
    recipe_id = db.Column(db.BigInteger, db.ForeignKey('recipe.id', ondelete='CASCADE'), primary_key=True)
    added_at = db.Column(db.DateTime, default=datetime.now)
    
    recipe = db.relationship('Recipe')

    def __repr__(self):
        return f'<CollectionItem collection={self.collection_id} recipe={self.recipe_id}>'


class FridgeItem(db.Model):
    __tablename__ = 'fridge_items'

    id = db.Column(db.BigInteger, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    ingredient_id = db.Column(db.BigInteger, db.ForeignKey('ingredient.id'), nullable=False)
    quantity = db.Column(db.Float)
    unit = db.Column(db.Text)
    added_at = db.Column(db.DateTime, default=datetime.now)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'ingredient_id'),
    )

    user = db.relationship('User', backref='fridge_items')
    ingredient = db.relationship('Ingredient', backref='fridge_items')

    def __repr__(self):
        return f'<FridgeItem user_id={self.user_id} ingredient={self.ingredient_id}>'


class Rating(db.Model):
    __tablename__ = 'ratings'

    id = db.Column(db.BigInteger, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    recipe_id = db.Column(db.BigInteger, db.ForeignKey('recipe.id', ondelete='CASCADE'), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, onupdate=datetime.now)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'recipe_id'),
        db.CheckConstraint('score >= 1 AND score <= 5'),
    )

    user = db.relationship('User', backref='ratings')
    recipe = db.relationship('Recipe', backref='ratings')

    def __repr__(self):
        return f'<Rating user_id={self.user_id} recipe_id={self.recipe_id} score={self.score}>'


class RecipeCollection(db.Model):
    __tablename__ = 'recipe_collections'

    id = db.Column(db.BigInteger, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    is_public = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, onupdate=datetime.now)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'name'),
    )

    user = db.relationship('User', backref='recipe_collections')
    items = db.relationship('CollectionItem', back_populates='collection', cascade='all, delete-orphan', lazy='dynamic')

    def __repr__(self):
        return f'<RecipeCollection {self.name} (user_id={self.user_id})>'

    def to_dict(self, include_recipes=False):
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_public': self.is_public,
            'recipe_count': self.items.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if include_recipes:
            data['recipes'] = [
                item.to_dict() for item in self.items.order_by(
                    CollectionItem.added_at.desc()
                ).all()
            ]

        return data


class CollectionItem(db.Model):
    __tablename__ = 'collection_items'

    collection_id = db.Column(db.BigInteger, db.ForeignKey('recipe_collections.id', ondelete='CASCADE'), primary_key=True)
    recipe_id = db.Column(db.BigInteger, db.ForeignKey('recipe.id', ondelete='CASCADE'), primary_key=True)
    added_at = db.Column(db.DateTime, default=datetime.now)

    collection = db.relationship('RecipeCollection', back_populates='items')
    recipe = db.relationship('Recipe', backref='collection_items')

    def __repr__(self):
        return f'<CollectionItem collection_id={self.collection_id} recipe_id={self.recipe_id}>'

    def to_dict(self):
        avg_rating = db.session.query(func.avg(Rating.score)).filter(
            Rating.recipe_id == self.recipe_id
        ).scalar()

        return {
            'recipe_id': self.recipe_id,
            'recipe_title': self.recipe.title,
            'recipe_description': self.recipe.description,
            'recipe_image_url': self.recipe.image_url,
            'recipe_cuisine': self.recipe.cuisine,
            'recipe_category': self.recipe.category,
            'average_rating': round(avg_rating, 1) if avg_rating else None,
            'added_at': self.added_at.isoformat() if self.added_at else None
        }
