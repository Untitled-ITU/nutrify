from pydantic import BaseModel, Field
from typing import Optional


class MealIdPath(BaseModel):
    meal_id: int


class RecipeInfo(BaseModel):
    id: int
    title: str


class MealInfo(BaseModel):
    id: int
    recipe: Optional[RecipeInfo]


class DayMeals(BaseModel):
    breakfast: Optional[MealInfo]
    lunch: Optional[MealInfo]
    dinner: Optional[MealInfo]
    snack: Optional[MealInfo]


class WeekDay(BaseModel):
    date: str
    day_name: str
    meals: DayMeals


class WeeklyPlanResponse(BaseModel):
    week_start: str
    week_end: str
    days: list[WeekDay]


class AddMealBody(BaseModel):
    plan_date: str
    meal_type: str = Field(pattern="^(breakfast|lunch|dinner|snack)$")
    recipe_id: Optional[int] = None


class MealResponse(BaseModel):
    msg: str
    meal_plan_id: int


class UpdateMealBody(BaseModel):
    recipe_id: Optional[int] = None
    plan_date: Optional[str] = None
    meal_type: Optional[str] = Field(None, pattern="^(breakfast|lunch|dinner|snack)$")


class MessageResponse(BaseModel):
    msg: str


class IngredientQuantity(BaseModel):
    quantity: float
    unit: str


class MissingIngredient(BaseModel):
    ingredient_id: int
    name: str
    needed_total: Optional[float]
    needed_unit: Optional[str]
    needed_breakdown: list[IngredientQuantity]
    in_fridge: Optional[float]
    fridge_unit: Optional[str]
    is_available: bool
    is_sufficient: bool


class NeededIngredientsResponse(BaseModel):
    week_start: str
    week_end: str
    missing_ingredients: list[MissingIngredient]
    total_ingredients: int
    available_count: int
    unavailable_count: int


class MealData(BaseModel):
    plan_date: str
    meal_type: str = Field(pattern="^(breakfast|lunch|dinner|snack)$")
    recipe_id: Optional[int] = None


class BulkImportBody(BaseModel):
    meals: list[MealData] = Field(min_length=1)


class BulkImportResponse(BaseModel):
    msg: str
    added: int
    updated: int
    errors: list[str] = []


class ClearWeekResponse(BaseModel):
    msg: str
    deleted_count: int
    week_start: str
    week_end: str


class PlanningStatsResponse(BaseModel):
    total_plans: int
    plans_with_recipes: int
    current_week_plans: int
    week_start: str
    week_end: str
    meal_type_distribution: dict[str, int]


class WeeklyPlanQuery(BaseModel):
    start_date: Optional[str] = None


class MissingIngredientsQuery(BaseModel):
    start_date: Optional[str] = None


class ClearWeekQuery(BaseModel):
    start_date: Optional[str] = None
