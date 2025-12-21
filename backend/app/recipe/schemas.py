from pydantic import BaseModel, Field
from typing import Optional


class RecipeIdPath(BaseModel):
    recipe_id: int


class CollectionIdPath(BaseModel):
    collection_id: int


class CollectionRecipePath(BaseModel):
    collection_id: int
    recipe_id: int


class IngredientResponse(BaseModel):
    id: int
    name: str
    default_unit: Optional[str] = None


class IngredientSearchResponse(BaseModel):
    ingredients: list[IngredientResponse]


class AlternativeUnit(BaseModel):
    quantity: float
    unit: str


class RecipeIngredientDetail(BaseModel):
    id: int
    name: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    alternatives: list[AlternativeUnit] = []


class RecipeSummary(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: Optional[str]
    cuisine: Optional[str]
    meal_type: Optional[str]
    is_vegan: bool
    is_vegetarian: bool
    num_ingredients: Optional[int]
    average_rating: Optional[float]
    is_favorite: bool
    in_collections_count: int


class RecipeListResponse(BaseModel):
    recipes: list[RecipeSummary]


class CollectionInfo(BaseModel):
    id: int
    name: str


class RatingsInfo(BaseModel):
    average: Optional[float]
    count: int


class AuthorInfo(BaseModel):
    id: int
    username: str


class RecipeDetail(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: Optional[str]
    cuisine: Optional[str]
    meal_type: Optional[str]
    is_vegan: bool
    is_vegetarian: bool
    directions: Optional[str]
    ingredients: list[RecipeIngredientDetail]
    author: Optional[AuthorInfo]
    ratings: RatingsInfo
    is_favorite: bool
    in_collections: list[CollectionInfo]
    created_at: Optional[str]


class MessageResponse(BaseModel):
    msg: str


class FavoriteAddBody(BaseModel):
    recipe_id: int


class FavoriteAddResponse(BaseModel):
    msg: str
    favorite_id: int


class FavoritesListResponse(BaseModel):
    favorites: list[RecipeSummary]


class FilterOptions(BaseModel):
    categories: list[str]
    cuisines: list[str]
    meal_types: list[str]
    sort_options: list[dict[str, str]]


class CollectionCreateBody(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    is_public: bool = False


class CollectionUpdateBody(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_public: Optional[bool] = None


class AddRecipeToCollectionBody(BaseModel):
    recipe_id: int


class BulkAddRecipesBody(BaseModel):
    recipe_ids: list[int] = Field(min_items=1)


class BulkAddResponse(BaseModel):
    msg: str
    added: int
    skipped: int
    errors: list[str]


class CollectionRecipe(BaseModel):
    recipe_id: int
    recipe_title: str
    added_at: str


class CollectionDetail(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_public: bool
    recipe_count: int
    created_at: str
    updated_at: str
    recipes: list[CollectionRecipe] = []


class CollectionCreateResponse(BaseModel):
    msg: str
    collection: CollectionDetail


class CollectionList(BaseModel):
    collections: list[CollectionDetail]


class RecipeCollectionInfo(BaseModel):
    collection_id: int
    collection_name: str
    added_at: str


class RecipeCollectionsResponse(BaseModel):
    recipe_id: int
    recipe_title: str
    collections: list[RecipeCollectionInfo]


class RecipeListQuery(BaseModel):
    q: Optional[str] = None
    ingredients: Optional[str] = None
    exclude_ingredients: Optional[str] = None
    category: Optional[str] = None
    cuisine: Optional[str] = None
    is_vegan: Optional[bool] = None
    is_vegetarian: Optional[bool] = None
    meal_type: Optional[str] = None
    sort_by: Optional[str] = "created_at"
    sort_order: Optional[str] = "desc"


class IngredientSearchQuery(BaseModel):
    q: Optional[str] = None
    limit: Optional[int] = 10


class CollectionListQuery(BaseModel):
    include_recipes: Optional[bool] = False
