from pydantic import BaseModel, EmailStr

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None = None
    is_teacher: bool
    class Config:
        from_attributes = True
