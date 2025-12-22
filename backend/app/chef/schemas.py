from pydantic import BaseModel, Field
from typing import Optional


class RecipeIdPath(BaseModel):
    recipe_id: int


class IngredientData(BaseModel):
    ingredient_id: Optional[int] = None
    name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None


class AlternativeUnit(BaseModel):
    quantity: float
    unit: str


class IngredientDetail(BaseModel):
    ingredient_id: int
    name: str
    quantity: float
    unit: str
    alternatives: list[AlternativeUnit] = []


class CreateRecipeBody(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    category: Optional[str] = None
    cuisine: Optional[str] = None
    meal_type: Optional[str] = None
    is_vegan: bool = False
    is_vegetarian: bool = False
    directions: Optional[str] = None
    ingredients: list[IngredientData] = []


class RecipeResponse(BaseModel):
    msg: str
    recipe_id: int


class ChefRecipeSummary(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: Optional[str]
    cuisine: Optional[str]
    num_ingredients: Optional[int]
    average_rating: Optional[float]
    rating_count: int
    created_at: Optional[str]


class ChefRecipesResponse(BaseModel):
    recipes: list[ChefRecipeSummary]


class ChefRecipeDetail(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: Optional[str]
    cuisine: Optional[str]
    meal_type: Optional[str]
    is_vegan: bool
    is_vegetarian: bool
    directions: Optional[str]
    ingredients: list[IngredientDetail]
    created_at: Optional[str]


class UpdateRecipeBody(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    category: Optional[str] = None
    cuisine: Optional[str] = None
    meal_type: Optional[str] = None
    is_vegan: Optional[bool] = None
    is_vegetarian: Optional[bool] = None
    directions: Optional[str] = None
    ingredients: Optional[list[IngredientData]] = None


class MessageResponse(BaseModel):
    msg: str


class ChefStatsResponse(BaseModel):
    total_recipes: int
    total_ratings: int
    average_rating: Optional[float]
    recipes_by_category: dict[str, int]


class ChefProfileResponse(BaseModel):
    bio: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None


class UpdateChefProfileBody(BaseModel):
    bio: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None
