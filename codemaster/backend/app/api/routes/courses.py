from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.course import Course
from app.schemas.course import CourseCreate, CourseOut

router = APIRouter(prefix="/courses", tags=["courses"])

@router.get("/", response_model=list[CourseOut])
async def list_courses(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Course))
    return res.scalars().all()

@router.post("/", response_model=CourseOut)
async def create_course(payload: CourseCreate, db: AsyncSession = Depends(get_db)):
    exists = await db.execute(select(Course).where(Course.title == payload.title))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Course title already exists")
    course = Course(title=payload.title, description=payload.description)
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course
