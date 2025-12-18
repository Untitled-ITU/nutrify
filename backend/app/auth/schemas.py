from pydantic import BaseModel, EmailStr, Field

from typing import Optional


class LoginBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class LoginResponse(BaseModel):
    access_token: str


class RegisterBody(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6)
    role: Optional[str] = Field(default="consumer")


class RegisterResponse(BaseModel):
    msg: str
    email: str


class VerifyRegistrationBody(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)


class MessageResponse(BaseModel):
    msg: str


class ProfileResponse(BaseModel):
    id: int
    email: str
    username: str
    role: str


class UpdateProfileBody(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)


class ChangePasswordBody(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class ForgotPasswordBody(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    msg: str
    email: str


class ResetPasswordBody(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=6)
