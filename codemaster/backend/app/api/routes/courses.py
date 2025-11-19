from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.models.course import Course
from app.schemas.course import CourseCreate, CourseOut
from app.core.security import get_current_teacher
from app.models.user import User  # типизировать не обязательно, но можно

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("/", response_model=list[CourseOut])
async def list_courses(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Course))
    return res.scalars().all()


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
