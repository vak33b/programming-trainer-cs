from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.core.security import get_current_teacher, get_current_user, get_current_user_optional
from app.models.user import User
from app.models.lesson import Lesson
from app.models.course import Course
from app.models.progress import LessonCompletion
from app.schemas.lesson import LessonCreate, LessonOut  # поправь имена схем, если у тебя другие

router = APIRouter(prefix="/lessons", tags=["lessons"])


@router.get("/", response_model=list[LessonOut])
async def list_lessons(
    course_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """
    Список уроков.
    Если передан course_id — только для этого курса.
    Для авторизованных студентов показывает, завершен ли урок.
    """
    stmt = select(Lesson)
    if course_id is not None:
        stmt = stmt.where(Lesson.course_id == course_id)
    res = await db.execute(stmt.order_by(Lesson.id))
    lessons = res.scalars().all()
    
    # Если пользователь авторизован, проверяем, какие уроки завершены
    completed_lesson_ids = set()
    if current_user:
        completion_res = await db.execute(
            select(LessonCompletion.lesson_id).where(
                LessonCompletion.user_id == current_user.id
            )
        )
        completed_lesson_ids = {row[0] for row in completion_res.all()}
    
    return [
        LessonOut(
            id=lesson.id,
            course_id=lesson.course_id,
            title=lesson.title,
            content=lesson.content,
            is_completed=lesson.id in completed_lesson_ids,
        )
        for lesson in lessons
    ]


@router.get("/{lesson_id}", response_model=LessonOut)
async def get_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """
    Один урок по id.
    """
    res = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = res.scalar_one_or_none()
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@router.post(
    "/",
    response_model=LessonOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_lesson(
    payload: LessonCreate,
    db: AsyncSession = Depends(get_db),
    _teacher: User = Depends(get_current_teacher),
):
    """
    Создание урока (только преподаватель).
    """
    # проверим, что курс существует
    res = await db.execute(select(Course).where(Course.id == payload.course_id))
    course = res.scalar_one_or_none()
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    lesson = Lesson(
        course_id=payload.course_id,
        title=payload.title,
        content=payload.content,
    )
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return lesson
