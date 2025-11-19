from __future__ import annotations
from pydantic import BaseModel


class ProgressOut(BaseModel):
    user_id: int
    course_id: int
    lessons_completed: int
    tasks_completed: int
    score_avg: float

    class Config:
        from_attributes = True


class CompleteLessonRequest(BaseModel):
    # сейчас пустой — просто факт завершения урока
    pass


class CompleteTaskRequest(BaseModel):
    score: float | None = None
