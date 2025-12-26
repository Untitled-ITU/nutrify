from pydantic import BaseModel, Field
from typing import Optional


class RecipeIdPath(BaseModel):
    recipe_id: int


class RatingIdPath(BaseModel):
    rating_id: int


class AddRatingBody(BaseModel):
    recipe_id: int
    score: int = Field(ge=1, le=5, description="Rating score between 1 and 5")
    comment: Optional[str] = None


class UpdateRatingBody(BaseModel):
    score: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None


class RatingResponse(BaseModel):
    msg: str
    rating_id: int


class MessageResponse(BaseModel):
    msg: str


class RatingInfo(BaseModel):
    id: int
    recipe_id: int
    recipe_title: str
    score: int
    comment: Optional[str]
    created_at: str


class UserRatingsResponse(BaseModel):
    ratings: list[RatingInfo]
    total: int


class RecipeRatingInfo(BaseModel):
    id: int
    user_id: int
    username: str
    score: int
    comment: Optional[str]
    created_at: str


class RecipeRatingsResponse(BaseModel):
    recipe_id: int
    recipe_title: str
    ratings: list[RecipeRatingInfo]
    average_rating: Optional[float]
    total_ratings: int
