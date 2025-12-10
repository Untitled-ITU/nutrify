from .auth.models import User

from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from functools import wraps


def admin_required(fn):
    @wraps(fn)
    def decorator(*args, **kwargs):
        verify_jwt_in_request()

        current_user_email = get_jwt_identity()
        user = User.query.filter_by(email=current_user_email).first()

        if user and user.role == 'admin':
            return fn(*args, **kwargs)
        else:
            return jsonify(msg="Admins only! You don't have permission."), 403
    return decorator


def chef_required(fn):
    @wraps(fn)
    def decorator(*args, **kwargs):
        verify_jwt_in_request()

        current_user_email = get_jwt_identity()
        user = User.query.filter_by(email=current_user_email).first()

        if user and user.role in ['chef', 'admin']:
            return fn(*args, **kwargs)
        else:
            return jsonify(msg="Chef or Admin access required."), 403
    return decorator


def login_required(fn):
    @wraps(fn)
    def decorator(*args, **kwargs):
        verify_jwt_in_request()
        return fn(*args, **kwargs)
    return decorator
