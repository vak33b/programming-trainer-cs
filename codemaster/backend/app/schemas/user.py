from __future__ import annotations
from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None = None
    is_teacher: bool
    is_active: bool

    class Config:
        from_attributes = True  # Pydantic v2: маппинг из ORM
