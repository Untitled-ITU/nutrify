from flask import Blueprint, request, jsonify
from ...extensions import db
from ..auth.models import User
from ..decorators import admin_required

admin_bp = Blueprint('admin_bp', __name__, url_prefix='/api/admin')
