from pydantic import BaseModel

class ProgressOut(BaseModel):
    user_id: int
    course_id: int
    lessons_completed: int
    tasks_completed: int
    score_avg: float
    class Config:
        from_attributes = True
