from flask import Blueprint
from ...extensions import db
from ..models import Recipe, Ingredient

recipe_bp = Blueprint('recipe_bp', __name__, url_prefix='/api/recipes')

