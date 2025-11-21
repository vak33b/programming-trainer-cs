# app/schemas/teacher.py
from typing import Optional, List
from pydantic import BaseModel, field_validator


# ---------- Курсы ----------

class TeacherCourseBase(BaseModel):
    title: str
    description: Optional[str] = None


class TeacherCourseCreate(TeacherCourseBase):
    pass


class TeacherCourseOut(TeacherCourseBase):
    id: int
    students_count: int = 0  # Количество студентов, приступивших к курсу

    class Config:
        orm_mode = True


# ---------- Уроки ----------

class TeacherLessonBase(BaseModel):
    title: str
    content: Optional[str] = None


class TeacherLessonCreate(TeacherLessonBase):
    pass


class TeacherLessonOut(TeacherLessonBase):
    id: int
    course_id: int

    class Config:
        orm_mode = True


# ---------- Задания (тестовые) ----------

class TeacherTaskBase(BaseModel):
    title: str
    body: Optional[str] = None
    has_autocheck: bool = False


class TaskOptionCreate(BaseModel):
    text: str
    is_correct: bool = False


class TaskOptionOut(BaseModel):
    id: int
    text: str
    is_correct: bool

    class Config:
        orm_mode = True


class TeacherTaskCreate(BaseModel):
    title: str
    body: Optional[str] = None
    options: List[TaskOptionCreate]

    @field_validator("options")
    @classmethod
    def validate_options(cls, v):
        if len(v) != 4:
            raise ValueError("Должно быть ровно 4 варианта ответа")
        correct_count = sum(1 for o in v if o.is_correct)
        if correct_count != 1:
            raise ValueError("Должен быть ровно один правильный вариант")
        return v


class TeacherTaskOut(BaseModel):
    id: int
    lesson_id: int
    title: str
    body: Optional[str]
    has_autocheck: bool
    options: List[TaskOptionOut]

    class Config:
        orm_mode = True



# ---------- Прогресс студентов ----------

class StudentProgressOut(BaseModel):
    user_id: int
    email: str
    full_name: Optional[str]
    courses_count: int
    lessons_completed: int
    tasks_completed: int
    score_avg: Optional[float]
