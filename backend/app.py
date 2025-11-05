from flask import Flask, render_template, request

import json
import os

from auth.routes import auth_bp
from extensions import jwt
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

app.config["JWT_SECRET_KEY"] = "super-secret-key"  # Github Secrets kullanılacak.
jwt.init_app(app)

app.register_blueprint(auth_bp)
print("Auth blueprint registered.")


@app.route("/")
def index():
    return render_template("index.html", meals=None)


@app.route("/meals", methods=["POST"])
def api_meals():
    # Currently all meals are loaded from a local file and then filtered.
    # This will be replaced with a direct API call that accepts filtering parameters
    # and returns only the matching meals.
    meals = get_meals()

    name = request.form.get("name").strip().lower()
    country = request.form.get("country").strip().lower()
    mtype = request.form.get("type").strip().lower()

    ingredients_str = request.form.get("ingredients").strip().lower()
    ingredients = []
    if ingredients_str:
        for i in ingredients_str.split(","):
            if i.strip():
                ingredients.append(i.strip())

    def match_filter(meal):
        if name and name not in meal["name"].lower():
            return False
        if country and country != meal["country"].lower():
            return False
        if mtype and mtype != meal["type"].lower():
            return False

        if ingredients:
            meal_ingredients = set()
            for i in meal["ingredients"]:
                meal_ingredients.add(i.lower())
            if not set(ingredients).issubset(meal_ingredients):
                return False
        return True

    # When using an API, local filtering will be skipped.
    filtered = list(filter(match_filter, meals))
    return render_template("index.html", meals=filtered)


@app.route("/meal/<id>")
def meal_detail(id):
    # This will be replaced with a direct API call to fetch a meal.
    meal = get_meal_by_id(id)
    return render_template("meal.html", meal=meal)


def get_meal_by_id(meal_id):
    # This will be replaced with a direct API call to fetch a meal.
    meals = get_meals()

    for m in meals:
        if m["id"] == meal_id:
            return m


def get_meals():
    # This will be replaced with a direct API call to fetch meals.
    try:
        return fetch_meals_from_api()
    except NotImplementedError:
        with open(os.path.join(os.path.dirname(__file__), "data", "meals.json")) as f:
            meals = json.load(f)
        return meals


def fetch_meals_from_api(name = "", country = "", mtype = "", ingredients = None, **kwargs):
    raise NotImplementedError("Not Implemented")


if __name__ == "__main__":
    app.run(debug=True)
