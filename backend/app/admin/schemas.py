from typing import Literal
from pydantic import BaseModel, Field


class UserIdPath(BaseModel):
    user_id: int


class AdminResetPasswordBody(BaseModel):
    new_password: str = Field(min_length=6)


class UserSummary(BaseModel):
    id: int
    email: str
    username: str
    role: Literal['consumer', 'chef', 'admin']


class UsersListResponse(BaseModel):
    users: list[UserSummary]


class ChangeRoleBody(BaseModel):
    role: Literal['consumer', 'chef', 'admin']


class MessageResponse(BaseModel):
    msg: str
