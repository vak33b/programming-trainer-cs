from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models.lesson import Lesson
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskOut

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.post("/", response_model=TaskOut)
async def create_task(payload: TaskCreate, db: AsyncSession = Depends(get_db)):
    lesson = await db.get(Lesson, payload.lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    task = Task(lesson_id=payload.lesson_id, title=payload.title, body=payload.body, has_autocheck=payload.has_autocheck)
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task
