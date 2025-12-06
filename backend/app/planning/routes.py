from flask import Blueprint
from ...extensions import db
from ..models import MealPlan, ShoppingList

planning_bp = Blueprint('planning_bp', __name__, url_prefix='/api/planning')

