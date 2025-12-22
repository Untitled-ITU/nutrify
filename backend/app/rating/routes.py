from flask_openapi3 import APIBlueprint, Tag
from flask_jwt_extended import get_jwt_identity

from ...extensions import db
from ..auth.models import User
from ..decorators import login_required
from ..models import Recipe, Rating
from .schemas import (
    RecipeIdPath, RatingIdPath,
    AddRatingBody, UpdateRatingBody, RatingResponse, MessageResponse,
    UserRatingsResponse, RecipeRatingsResponse
)


rating_tag = Tag(name="Ratings", description="Recipe rating and review management")
rating_bp = APIBlueprint(
    'ratings', __name__, url_prefix='/api',
    abp_tags=[rating_tag], abp_security=[{"jwt": []}]
)


@rating_bp.get('/recipes/<int:recipe_id>/ratings',
    responses={"200": RecipeRatingsResponse, "404": MessageResponse})
@login_required
def get_recipe_ratings(path: RecipeIdPath):
    recipe_id = path.recipe_id
    recipe = db.session.get(Recipe, recipe_id)
    if not recipe:
        return {'msg': 'Recipe not found'}, 404

    query = Rating.query.filter_by(recipe_id=recipe_id).order_by(
        Rating.created_at.desc()
    )
    ratings = query.all()

    all_ratings = Rating.query.filter_by(recipe_id=recipe_id).all()
    avg_score = None
    if all_ratings:
        avg_score = round(sum(r.score for r in all_ratings) / len(all_ratings), 1)

    return {
        'recipe_id': recipe_id,
        'recipe_title': recipe.title,
        'ratings': [{
            'id': r.id,
            'user_id': r.user.id,
            'username': r.user.username,
            'score': r.score,
            'comment': r.comment,
            'created_at': r.created_at.isoformat() if r.created_at else None
        } for r in ratings],
        'average_rating': avg_score,
        'total_ratings': len(all_ratings)
    }, 200


@rating_bp.post('/recipes/<int:recipe_id>/ratings',
    responses={"201": RatingResponse, "404": MessageResponse, "409": MessageResponse})
@login_required
def add_rating(path: RecipeIdPath, body: AddRatingBody):
    recipe_id = path.recipe_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    recipe = db.session.get(Recipe, recipe_id)
    if not recipe:
        return {'msg': 'Recipe not found'}, 404

    existing = Rating.query.filter_by(
        user_id=user.id,
        recipe_id=recipe_id
    ).first()

    if existing:
        return {'msg': 'You have already rated this recipe. Use PUT to update.'}, 409

    rating = Rating(
        user_id=user.id,
        recipe_id=body.recipe_id,
        score=body.score,
        comment=body.comment
    )
    db.session.add(rating)
    db.session.commit()

    return {
        'msg': 'Rating added successfully',
        'rating_id': rating.id
    }, 201


@rating_bp.put('/ratings/<int:rating_id>',
    responses={"200": RatingResponse, "403": MessageResponse, "404": MessageResponse})
@login_required
def update_rating(path: RatingIdPath, body: UpdateRatingBody):
    rating_id = path.rating_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    rating = db.session.get(Rating, rating_id)
    if not rating:
        return {'msg': 'Rating not found'}, 404

    if rating.user_id != user.id:
        return {'msg': 'You can only update your own ratings'}, 403

    if body.score is not None:
        rating.score = body.score
    if body.comment is not None:
        rating.comment = body.comment

    db.session.commit()

    return {
        'msg': 'Rating updated successfully',
        'rating_id': rating.id
    }, 200


@rating_bp.delete('/ratings/<int:rating_id>',
    responses={"200": MessageResponse, "403": MessageResponse, "404": MessageResponse})
@login_required
def delete_rating(path: RatingIdPath):
    rating_id = path.rating_id
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    rating = db.session.get(Rating, rating_id)
    if not rating:
        return {'msg': 'Rating not found'}, 404

    if rating.user_id != user.id and user.role != 'admin':
        return {'msg': 'You can only delete your own ratings'}, 403

    db.session.delete(rating)
    db.session.commit()

    return {'msg': 'Rating deleted successfully'}, 200


@rating_bp.get('/user/ratings', responses={"200": UserRatingsResponse, "404": MessageResponse})
@login_required
def get_user_ratings():
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()

    if not user:
        return {'msg': 'User not found'}, 404

    ratings = Rating.query.filter_by(user_id=user.id).order_by(
        Rating.created_at.desc()
    ).all()

    return {
        'ratings': [{
            'id': r.id,
            'recipe_id': r.recipe.id,
            'recipe_title': r.recipe.title,
            'score': r.score,
            'comment': r.comment,
            'created_at': r.created_at.isoformat() if r.created_at else None
        } for r in ratings],
        'total': len(ratings)
    }, 200
