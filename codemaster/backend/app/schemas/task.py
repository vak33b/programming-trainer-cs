from pydantic import BaseModel

class TaskCreate(BaseModel):
    lesson_id: int
    title: str
    body: str | None = None
    has_autocheck: bool = False

class TaskOut(BaseModel):
    id: int
    lesson_id: int
    title: str
    body: str | None = None
    has_autocheck: bool
    class Config:
        from_attributes = True
