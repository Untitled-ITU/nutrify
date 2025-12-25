from flask_openapi3 import OpenAPI, Info
from flask_cors import CORS

from backend.config import Config
from backend.extensions import jwt, db, mail, babel

from .auth.routes import auth_bp
from .admin.routes import admin_bp
from .recipe.routes import recipe_bp
from .fridge.routes import fridge_bp
from .planning.routes import planning_bp
from .shopping.routes import shopping_bp
from .chef.routes import chef_bp
from .chef.public_routes import public_chef_bp  # Kept from HEAD
from .rating.routes import rating_bp
from .ingredient.routes import ingredient_bp    # Kept from your changes
from .admin_views import init_admin

def create_app(config=None):
    if config is None:
        from backend.config import Config
        config = Config

    info = Info(
        title="Nutrify API", version="1.0.0",
        description="Backend API for Nutrify application"
    )

    jwt_scheme = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
    }
    security_schemes = {"jwt": jwt_scheme}

    enable_docs = getattr(config, "ENABLE_DOCS", False)
    
    app = OpenAPI(
        __name__, info=info, doc_ui=enable_docs,
        security_schemes=security_schemes,
    )

    CORS(app, 
         resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}}, 
         supports_credentials=True,
         allow_headers="*",    
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    app.config.from_object(config)

    jwt.init_app(app)
    db.init_app(app)
    mail.init_app(app)
    babel.init_app(app)

    app.register_api(auth_bp)
    app.register_api(admin_bp)
    app.register_api(recipe_bp)
    app.register_api(rating_bp)
    app.register_api(planning_bp)
    app.register_api(shopping_bp)
    app.register_api(fridge_bp)
    app.register_api(chef_bp)
    app.register_api(public_chef_bp) # Registered Public Chef
    app.register_api(ingredient_bp)  # Registered Ingredient

    if not app.config.get('TESTING', False):
        init_admin(app)

    return app