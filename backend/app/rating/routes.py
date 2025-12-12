from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import Rating, Recipe, db
from ..auth.models import User

rating_bp = Blueprint('rating_bp', __name__, url_prefix='/api/ratings')

@rating_bp.route('/', methods=['POST'])
@jwt_required()
def add_rating():
    """
    Add or Update a Rating (Review)
    Body: { recipe_id, score, comment }
    """
    user_identity = get_jwt_identity()
    user = User.query.filter_by(email=user_identity).first()
    data = request.get_json()

    recipe_id = data.get('recipe_id')
    score = data.get('score')
    comment = data.get('comment', '')

    if not recipe_id or not score:
        return jsonify({"msg": "Missing recipe_id or score"}), 400
    
    # Validate score
    try:
        score = int(score)
        if score < 1 or score > 5:
            return jsonify({"msg": "Score must be between 1 and 5"}), 400
    except ValueError:
        return jsonify({"msg": "Invalid score format"}), 400

    # check recipe exists
    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({"msg": "Recipe not found"}), 404

    # Check if existing rating
    rating = Rating.query.filter_by(user_id=user.id, recipe_id=recipe_id).first()
    
    if rating:
        # Update existing
        rating.score = score
        rating.comment = comment
        db.session.commit()
        return jsonify({"msg": "Rating updated", "id": rating.id}), 200
    else:
        # Create new
        new_rating = Rating(user_id=user.id, recipe_id=recipe_id, score=score, comment=comment)
        db.session.add(new_rating)
        db.session.commit()
        return jsonify({"msg": "Rating added", "id": new_rating.id}), 201

@rating_bp.route('/<int:recipe_id>', methods=['GET'])
def get_ratings(recipe_id):
    """
    Get all ratings for a recipe
    """
    ratings = Rating.query.filter_by(recipe_id=recipe_id).all()
    
    results = []
    total_score = 0
    for r in ratings:
        results.append({
            "user": r.user.username,
            "score": r.score,
            "comment": r.comment,
            "date": r.created_at
        })
        total_score += r.score
    
    avg = 0
    if len(ratings) > 0:
        avg = round(total_score / len(ratings), 1)

    return jsonify({
        "ratings": results,
        "average": avg,
        "count": len(ratings)
    }), 200

@rating_bp.route('/<int:recipe_id>', methods=['DELETE'])
@jwt_required()
def delete_rating(recipe_id):
    """
    Delete user's rating for a recipe
    """
    user_identity = get_jwt_identity()
    user = User.query.filter_by(email=user_identity).first()

    rating = Rating.query.filter_by(user_id=user.id, recipe_id=recipe_id).first()
    
    if not rating:
        return jsonify({"msg": "Rating not found"}), 404
        
    db.session.delete(rating)
    db.session.commit()
    
    return jsonify({"msg": "Rating deleted"}), 200
