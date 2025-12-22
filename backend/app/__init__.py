from ..config import Config
from ..extensions import jwt, db, mail
from .auth.routes import auth_bp
from .admin.routes import admin_bp
from .recipe.routes import recipe_bp
from .fridge.routes import fridge_bp
from .planning.routes import planning_bp
from .shopping.routes import shopping_bp
from .chef.routes import chef_bp
from .rating.routes import rating_bp

from flask_openapi3 import OpenAPI, Info
from flask_cors import CORS


def create_app(config=None):
    if config is None:
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
    app.config.from_object(config)

    jwt.init_app(app)
    db.init_app(app)
    mail.init_app(app)

    CORS(app, resources={"/api/*": {"origins": "*"}})

    app.register_api(auth_bp)
    app.register_api(admin_bp)
    app.register_api(recipe_bp)
    app.register_api(rating_bp)
    app.register_api(planning_bp)
    app.register_api(shopping_bp)
    app.register_api(fridge_bp)
    app.register_api(chef_bp)

    return app
