from pydantic import BaseModel, Field
from typing import Optional


class RecipeIdPath(BaseModel):
    recipe_id: int


class ItemIdPath(BaseModel):
    item_id: int


class IngredientInfo(BaseModel):
    id: int
    name: str


class AlternativeUnit(BaseModel):
    quantity: float
    unit: str


class ShoppingListItem(BaseModel):
    id: int
    ingredient: Optional[IngredientInfo]
    amount: float
    unit: str
    alternatives: list[AlternativeUnit] = []
    is_purchased: bool
    source_type: Optional[str]
    source_id: Optional[int]
    created_at: Optional[str]


class ShoppingListResponse(BaseModel):
    items: list[ShoppingListItem]
    total_items: int
    purchased_count: int


class AddItemBody(BaseModel):
    ingredient_id: Optional[int] = None
    ingredient_name: Optional[str] = None
    amount: Optional[str] = None


class FromMealPlanBody(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class FromRecipeResponse(BaseModel):
    msg: str
    added_count: int
    updated_count: int


class FromMealPlanResponse(BaseModel):
    msg: str
    added_count: int
    meal_plans_processed: int


class ToggleResponse(BaseModel):
    msg: str
    is_purchased: bool


class UpdateItemBody(BaseModel):
    amount: Optional[float] = None
    is_purchased: Optional[bool] = None


class AddItemResponse(BaseModel):
    msg: str
    item_id: int


class MessageResponse(BaseModel):
    msg: str


class BulkDeleteBody(BaseModel):
    item_ids: list[int] = Field(min_items=1)


class BulkDeleteResponse(BaseModel):
    msg: str
    deleted_count: int


class TransferResponse(BaseModel):
    msg: str
    transferred_count: int
    updated_count: int
    total_processed: int


class CompareIngredient(BaseModel):
    id: int
    ingredient: Optional[IngredientInfo]
    needed_amount: Optional[float]
    in_fridge: Optional[float]
    available_in_fridge: bool
    is_purchased: bool


class CompareResponse(BaseModel):
    comparison: list[CompareIngredient]
    total_items: int
    items_in_fridge: int


class ClearListQuery(BaseModel):
    purchased_only: Optional[bool] = False
