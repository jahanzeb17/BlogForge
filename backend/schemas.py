from typing import Optional, List
from pydantic import BaseModel


class RegisterRequest(BaseModel):
    username: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str


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