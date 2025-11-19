# app/schemas/teacher.py
from typing import Optional
from pydantic import BaseModel


# ---------- Курсы ----------

class TeacherCourseBase(BaseModel):
    title: str
    description: Optional[str] = None


class TeacherCourseCreate(TeacherCourseBase):
    pass


class TeacherCourseOut(TeacherCourseBase):
    id: int

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


class TeacherTaskCreate(TeacherTaskBase):
    pass


class TeacherTaskOut(TeacherTaskBase):
    id: int
    lesson_id: int

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
