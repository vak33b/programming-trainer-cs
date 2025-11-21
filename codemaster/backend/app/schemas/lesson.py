from pydantic import BaseModel

class LessonCreate(BaseModel):
    course_id: int
    title: str
    content: str | None = None

class LessonOut(BaseModel):
    id: int
    course_id: int
    title: str
    content: str | None = None
    is_completed: bool = False  # Завершен ли урок студентом
    class Config:
        from_attributes = True
