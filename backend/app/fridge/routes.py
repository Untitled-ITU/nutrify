from flask import Blueprint


fridge_bp = Blueprint('fridge_bp', __name__, url_prefix='/api/fridge')
