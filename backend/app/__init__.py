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

from flask import Flask, render_template
from flask_cors import CORS


def create_app():
    app = Flask(__name__,  template_folder='../templates')
    app.config.from_object(Config)

    jwt.init_app(app)
    db.init_app(app)
    mail.init_app(app)

    CORS(app, resources={
        r"/api/*": {"origins": "*"}
    })

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)

    app.register_blueprint(recipe_bp)
    app.register_blueprint(rating_bp)
    app.register_blueprint(planning_bp)
    app.register_blueprint(shopping_bp)
    app.register_blueprint(fridge_bp)
    app.register_blueprint(chef_bp)

    @app.route("/")
    def index():
        return render_template("index.html")

    return app
