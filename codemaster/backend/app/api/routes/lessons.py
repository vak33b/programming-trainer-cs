from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models.lesson import Lesson
from app.models.course import Course
from app.schemas.lesson import LessonCreate, LessonOut

router = APIRouter(prefix="/lessons", tags=["lessons"])

@router.post("/", response_model=LessonOut)
async def create_lesson(payload: LessonCreate, db: AsyncSession = Depends(get_db)):
    course = await db.get(Course, payload.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    lesson = Lesson(course_id=payload.course_id, title=payload.title, content=payload.content)
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return lesson
