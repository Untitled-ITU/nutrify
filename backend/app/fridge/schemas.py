from pydantic import BaseModel, Field
from typing import Optional


class ItemIdPath(BaseModel):
    item_id: int


class IngredientInfo(BaseModel):
    id: int
    name: str
    default_unit: Optional[str]


class AlternativeUnit(BaseModel):
    quantity: float
    unit: str


class FridgeItemDetail(BaseModel):
    id: int
    ingredient: IngredientInfo
    quantity: float
    unit: str
    alternatives: list[AlternativeUnit] = []
    added_at: Optional[str]


class FridgeListResponse(BaseModel):
    items: list[FridgeItemDetail]
    total: int


class AddFridgeItemBody(BaseModel):
    ingredient_id: Optional[int] = None
    ingredient_name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None


class FridgeItemResponse(BaseModel):
    msg: str
    item: FridgeItemDetail


class UpdateFridgeItemBody(BaseModel):
    quantity: Optional[float] = None
    unit: Optional[str] = None


class MessageResponse(BaseModel):
    msg: str


class BatchAddItem(BaseModel):
    ingredient_id: Optional[int] = None
    ingredient_name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None


class BatchAddBody(BaseModel):
    items: list[BatchAddItem] = Field(min_items=1)


class BatchAddResponse(BaseModel):
    msg: str
    added: int
    updated: int
    errors: list[str] = []


class FridgeStatsResponse(BaseModel):
    total_items: int
    recently_added: list[dict]
