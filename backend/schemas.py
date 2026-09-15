from typing import Optional, List

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    email: EmailStr


class CreateRunRequest(BaseModel):
    topic: str
    as_of: Optional[str] = None
    audience_pref: Optional[str] = None
    tone_pref: Optional[str] = None
    blog_kind_pref: Optional[str] = None


class ResumeRequest(BaseModel):
    action: str
    queries: Optional[List[str]] = None
    instructions: Optional[str] = None


class OAuth2TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"