from pydantic import BaseModel
from typing import List, Optional

class TaskOptionOut(BaseModel):
    id: int
    text: str
    is_correct: bool
    class Config:
        from_attributes = True

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
    options: List[TaskOptionOut] = []
    selected_option_id: Optional[int] = None  # Выбранный вариант ответа пользователя
    is_completed: bool = False  # Выполнена ли задача
    class Config:
        from_attributes = True

class SubmitAnswerRequest(BaseModel):
    option_id: int

class SubmitAnswerResponse(BaseModel):
    is_correct: bool
    message: str
