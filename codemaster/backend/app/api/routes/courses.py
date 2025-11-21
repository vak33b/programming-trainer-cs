from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.models.course import Course
from app.models.progress import Progress
from app.schemas.course import CourseCreate, CourseOut
from app.core.security import get_current_teacher, get_current_user_optional
from app.models.user import User  # типизировать не обязательно, но можно

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("/", response_model=list[CourseOut])
async def list_courses(
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """
    Список всех курсов.
    Для авторизованных студентов показывает, записан ли студент на курс.
    """
    res = await db.execute(select(Course).order_by(Course.id))
    courses = res.scalars().all()
    
    # Если пользователь авторизован, проверяем, на какие курсы он записан
    enrolled_course_ids = set()
    if current_user:
        progress_res = await db.execute(
            select(Progress.course_id).where(Progress.user_id == current_user.id)
        )
        enrolled_course_ids = {row[0] for row in progress_res.all()}
    
    return [
        CourseOut(
            id=course.id,
            title=course.title,
            description=course.description,
            is_enrolled=course.id in enrolled_course_ids,
        )
        for course in courses
    ]


@router.post("/", response_model=CourseOut, status_code=status.HTTP_201_CREATED)
async def create_course(
    payload: CourseCreate,
    db: AsyncSession = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    # проверка на дубликат названия
    res = await db.execute(select(Course).where(Course.title == payload.title))
    existing = res.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course title already exists",
        )

    course = Course(
        title=payload.title,
        description=payload.description,
        owner_id=teacher.id,        # <- ВЛАДЕЛЕЦ КУРСА
    )
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course
