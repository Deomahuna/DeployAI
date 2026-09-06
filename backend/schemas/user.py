from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    github_username: Optional[str] = None
    gitlab_username: Optional[str] = None
    avatar_url: Optional[str] = None
    email_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None

class PasswordUpdate(BaseModel):
    new_password: str

class IntegrationsOut(BaseModel):
    github: dict
    gitlab: dict

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class OtpVerify(BaseModel):
    email: EmailStr
    code: str

class OtpResend(BaseModel):
    email: EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str