from pydantic import BaseModel, Field
from typing import Optional


class ItemIdPath(BaseModel):
    item_id: int = Field(..., description="The ID of the fridge item")

class FridgeSearchQuery(BaseModel):
    q: str = Field(..., description="Search query for filtering fridge items")


class AddFridgeItemBody(BaseModel):
    ingredient_id: Optional[int] = None
    ingredient_name: Optional[str] = None
    quantity: float
    unit: Optional[str] = None
    description: Optional[str] = None

class UpdateFridgeItemBody(BaseModel):
    quantity: Optional[float] = None
    unit: Optional[str] = None
    description: Optional[str] = None

class BatchAddBody(BaseModel):
    items: list[AddFridgeItemBody]


class FridgeItemSchema(BaseModel):
    id: int
    name: str
    default_unit: Optional[str] = None

class FridgeItemResponseData(BaseModel):
    id: int
    ingredient: FridgeItemSchema
    quantity: float
    unit: str
    description: Optional[str] = None
    alternatives: Optional[dict] = None
    added_at: Optional[str] = None

class FridgeItemResponse(BaseModel):
    msg: str
    item: FridgeItemResponseData

class FridgeListResponse(BaseModel):
    items: list[FridgeItemResponseData]
    total: int

class BatchAddResponse(BaseModel):
    msg: str
    added: int
    updated: int
    errors: list[str]

class FridgeStatsResponse(BaseModel):
    total_items: int
    recently_added: list[dict]

class MessageResponse(BaseModel):
    msg: str