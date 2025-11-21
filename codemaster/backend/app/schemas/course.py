from pydantic import BaseModel

class CourseCreate(BaseModel):
    title: str
    description: str | None = None

class CourseOut(BaseModel):
    id: int
    title: str
    description: str | None = None
    is_enrolled: bool = False  # Записан ли студент на курс
    class Config:
        from_attributes = True
