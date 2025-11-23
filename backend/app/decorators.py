from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from .auth.models import User

def admin_required():
    def wrapper(fn):
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
    return wrapper