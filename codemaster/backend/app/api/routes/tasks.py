from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.core.security import get_current_teacher, get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.lesson import Lesson
from app.schemas.task import TaskCreate, TaskOut  # поправь имена под свои схемы

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=list[TaskOut])
async def list_tasks(
    lesson_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """
    Список задач.
    Если передан lesson_id — только для этого урока.
    """
    stmt = select(Task)
    if lesson_id is not None:
        stmt = stmt.where(Task.lesson_id == lesson_id)
    res = await db.execute(stmt.order_by(Task.id))
    return res.scalars().all()


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """
    Одна задача по id.
    """
    res = await db.execute(select(Task).where(Task.id == task_id))
    task = res.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post(
    "/",
    response_model=TaskOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_task(
    payload: TaskCreate,
    db: AsyncSession = Depends(get_db),
    _teacher: User = Depends(get_current_teacher),
):
    """
    Создание задачи (только преподаватель).
    """
    # проверим, что урок существует
    res = await db.execute(select(Lesson).where(Lesson.id == payload.lesson_id))
    lesson = res.scalar_one_or_none()
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")

    task = Task(
        lesson_id=payload.lesson_id,
        title=payload.title,
        body=payload.body,
        has_autocheck=payload.has_autocheck,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task
