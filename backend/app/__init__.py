from ..config import Config
from ..extensions import jwt
from .auth.routes import auth_bp

from flask import Flask, render_template
from flask_cors import CORS


def create_app():
    app = Flask(__name__,  template_folder='../templates')
    app.config.from_object(Config)

    jwt.init_app(app)

    CORS(app, resources={
        r"/api/*": {"origins": "*"}
    })

    app.register_blueprint(auth_bp)

    @app.route("/")
    def index():
        return render_template("index.html")

    return app
