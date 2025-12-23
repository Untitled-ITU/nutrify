from ..config import Config
from ..extensions import jwt, db, mail, babel
from .auth.routes import auth_bp
from .admin.routes import admin_bp
from .recipe.routes import recipe_bp
from .fridge.routes import fridge_bp
from .planning.routes import planning_bp
from .shopping.routes import shopping_bp
from .chef.routes import chef_bp
from .rating.routes import rating_bp
from .admin_views import init_admin

from flask_openapi3 import OpenAPI, Info
from flask_cors import CORS


def create_app():
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

    enable_docs = Config.ENABLE_DOCS
    app = OpenAPI(
        __name__, info=info, template_folder='../templates',
        security_schemes=security_schemes, doc_ui=enable_docs
    )
    app.config.from_object(Config)

    jwt.init_app(app)
    db.init_app(app)
    mail.init_app(app)
    babel.init_app(app)

    CORS(app, resources={"/api/*": {"origins": "*"}})

    app.register_api(auth_bp)
    app.register_api(admin_bp)
    app.register_api(recipe_bp)
    app.register_api(rating_bp)
    app.register_api(planning_bp)
    app.register_api(shopping_bp)
    app.register_api(fridge_bp)
    app.register_api(chef_bp)

    init_admin(app)

    return app
