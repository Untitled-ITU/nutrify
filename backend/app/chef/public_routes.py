from flask_openapi3 import APIBlueprint, Tag
from sqlalchemy import func

from extensions import db
from ..auth.models import User
from ..models import Recipe, Rating, ChefProfile
from ..utils.storage import build_image_url
from .schemas import (
    ChefPublicProfileResponse,
    ChefRecipesResponse,
    MessageResponse,
    ChefIdPath,
)

public_tag = Tag(name="Public", description="Public endpoints (no auth)")

# IMPORTANT: blueprint name must be UNIQUE in the whole app
public_chef_bp = APIBlueprint(
    "public_chef",
    __name__,
    url_prefix="/api/public",
    abp_tags=[public_tag],
)

@public_chef_bp.get(
    "/chefs/<int:chef_id>",
    responses={"200": ChefPublicProfileResponse, "404": MessageResponse},
)
def get_public_chef_profile(path: ChefIdPath):
    chef_id = path.chef_id

    chef_user = db.session.get(User, chef_id)
    if not chef_user or chef_user.role not in ("chef", "admin"):
        return {"msg": "Chef not found"}, 404

    profile = ChefProfile.query.filter_by(user_id=chef_id).first()
    avatar_url = build_image_url(profile.avatar_name) if (profile and profile.avatar_name) else None

    # stats
    total_recipes = Recipe.query.filter_by(author_id=chef_id).count()

    total_ratings = db.session.query(Rating).join(Recipe).filter(
        Recipe.author_id == chef_id
    ).count()

    avg_rating = db.session.query(func.avg(Rating.score)).join(Recipe).filter(
        Recipe.author_id == chef_id
    ).scalar()

    categories = db.session.query(
        Recipe.category,
        func.count(Recipe.id)
    ).filter(
        Recipe.author_id == chef_id
    ).group_by(Recipe.category).all()

    stats = {
        "total_recipes": total_recipes,
        "total_ratings": total_ratings,
        "average_rating": round(avg_rating, 1) if avg_rating else None,
        "recipes_by_category": {cat: count for cat, count in categories if cat},
    }

    # recipes list (summary)
    recipes_list = Recipe.query.filter_by(author_id=chef_id).order_by(Recipe.created_at.desc()).all()
    recipes = []
    for recipe in recipes_list:
        r_avg = db.session.query(func.avg(Rating.score)).filter(Rating.recipe_id == recipe.id).scalar()
        r_cnt = Rating.query.filter_by(recipe_id=recipe.id).count()

        recipes.append({
            "id": recipe.id,
            "title": recipe.title,
            "description": recipe.description,
            "image_url": build_image_url(recipe.image_name),
            "category": recipe.category,
            "cuisine": recipe.cuisine,
            "num_ingredients": recipe.num_ingredients,
            "average_rating": round(r_avg, 1) if r_avg else None,
            "rating_count": r_cnt,
            "created_at": recipe.created_at.isoformat() if recipe.created_at else None,
        })

    return {
        "chef_id": chef_user.id,
        "username": chef_user.username,
        "bio": profile.bio if profile else None,
        "website": profile.website if profile else None,
        "location": profile.location if profile else None,
        "avatar_url": avatar_url,
        "stats": stats,
        "recipes": recipes,
    }, 200


@public_chef_bp.get(
    "/chefs/<int:chef_id>/recipes",
    responses={"200": ChefRecipesResponse, "404": MessageResponse},
)
def get_public_chef_recipes(path: ChefIdPath):
    chef_id = path.chef_id

    chef_user = db.session.get(User, chef_id)
    if not chef_user or chef_user.role not in ("chef", "admin"):
        return {"msg": "Chef not found"}, 404

    recipes_list = Recipe.query.filter_by(author_id=chef_id).order_by(Recipe.created_at.desc()).all()
    recipes = []
    for recipe in recipes_list:
        r_avg = db.session.query(func.avg(Rating.score)).filter(Rating.recipe_id == recipe.id).scalar()
        r_cnt = Rating.query.filter_by(recipe_id=recipe.id).count()

        recipes.append({
            "id": recipe.id,
            "title": recipe.title,
            "description": recipe.description,
            "image_url": build_image_url(recipe.image_name),
            "category": recipe.category,
            "cuisine": recipe.cuisine,
            "num_ingredients": recipe.num_ingredients,
            "average_rating": round(r_avg, 1) if r_avg else None,
            "rating_count": r_cnt,
            "created_at": recipe.created_at.isoformat() if recipe.created_at else None,
        })

    return {"recipes": recipes}, 200
