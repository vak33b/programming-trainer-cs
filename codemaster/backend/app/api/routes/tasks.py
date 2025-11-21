from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.core.security import get_current_teacher, get_current_user, get_current_student
from app.models.user import User
from app.models.task import Task, TaskOption
from app.models.lesson import Lesson
from app.models.progress import TaskCompletion, Progress, LessonCompletion
from app.schemas.task import TaskCreate, TaskOut, SubmitAnswerRequest, SubmitAnswerResponse
from sqlalchemy import func

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=list[TaskOut])
async def list_tasks(
    lesson_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Список задач.
    Если передан lesson_id — только для этого урока.
    Возвращает задачи с информацией о выполнении для текущего пользователя.
    """
    stmt = select(Task).options(selectinload(Task.options))
    if lesson_id is not None:
        stmt = stmt.where(Task.lesson_id == lesson_id)
    res = await db.execute(stmt.order_by(Task.id))
    tasks = res.scalars().all()
    
    # Получаем информацию о выполненных задачах для текущего пользователя
    task_ids = [task.id for task in tasks]
    completions = {}
    if task_ids:
        res = await db.execute(
            select(TaskCompletion).where(
                TaskCompletion.user_id == current_user.id,
                TaskCompletion.task_id.in_(task_ids)
            )
        )
        for completion in res.scalars().all():
            completions[completion.task_id] = completion
    
    # Формируем ответ с информацией о выполнении
    result = []
    for task in tasks:
        completion = completions.get(task.id)
        task_dict = {
            "id": task.id,
            "lesson_id": task.lesson_id,
            "title": task.title,
            "body": task.body,
            "has_autocheck": task.has_autocheck,
            "options": task.options,
            "selected_option_id": completion.selected_option_id if completion else None,
            "is_completed": completion is not None,
        }
        result.append(TaskOut(**task_dict))
    
    return result


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Одна задача по id.
    Возвращает задачу с информацией о выполнении для текущего пользователя.
    """
    res = await db.execute(select(Task).where(Task.id == task_id).options(selectinload(Task.options)))
    task = res.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Получаем информацию о выполнении для текущего пользователя
    res = await db.execute(
        select(TaskCompletion).where(
            TaskCompletion.user_id == current_user.id,
            TaskCompletion.task_id == task_id
        )
    )
    completion = res.scalar_one_or_none()
    
    task_dict = {
        "id": task.id,
        "lesson_id": task.lesson_id,
        "title": task.title,
        "body": task.body,
        "has_autocheck": task.has_autocheck,
        "options": task.options,
        "selected_option_id": completion.selected_option_id if completion else None,
        "is_completed": completion is not None,
    }
    return TaskOut(**task_dict)


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


@router.post(
    "/{task_id}/submit-answer",
    response_model=SubmitAnswerResponse,
    status_code=status.HTTP_200_OK,
)
async def submit_answer(
    task_id: int,
    body: SubmitAnswerRequest,
    db: AsyncSession = Depends(get_db),
    student: User = Depends(get_current_student),
):
    """
    Проверка ответа на задачу с автопроверкой.
    Принимает option_id выбранного варианта ответа.
    """
    # 1) Найдём задачу с вариантами ответов
    res = await db.execute(
        select(Task).where(Task.id == task_id).options(selectinload(Task.options))
    )
    task = res.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # 2) Проверим, что задача имеет автопроверку
    if not task.has_autocheck:
        raise HTTPException(
            status_code=400,
            detail="Эта задача не поддерживает автопроверку"
        )
    
    # 3) Проверим, что выбранный вариант ответа принадлежит этой задаче
    res = await db.execute(
        select(TaskOption).where(
            TaskOption.id == body.option_id,
            TaskOption.task_id == task_id
        )
    )
    selected_option = res.scalar_one_or_none()
    if selected_option is None:
        raise HTTPException(
            status_code=404,
            detail="Вариант ответа не найден или не принадлежит этой задаче"
        )
    
    # 4) Проверим, правильный ли ответ
    is_correct = selected_option.is_correct
    
    # 5) Сохраняем выбранный ответ (даже если неправильный) и отмечаем задачу как выполненную если правильный
    # Найдём урок для получения course_id
    res = await db.execute(select(Lesson).where(Lesson.id == task.lesson_id))
    lesson = res.scalar_one_or_none()
    if lesson is None:
        raise HTTPException(status_code=500, detail="Lesson for this task not found")
    
    # Проверим, не отмечена ли задача уже
    res = await db.execute(
        select(TaskCompletion).where(
            TaskCompletion.user_id == student.id,
            TaskCompletion.task_id == task_id,
        )
    )
    completion = res.scalar_one_or_none()
    if completion is None:
        completion = TaskCompletion(
            user_id=student.id,
            task_id=task_id,
            score=1.0 if is_correct else 0.0,  # Правильный ответ = 1.0, неправильный = 0.0
            selected_option_id=body.option_id,  # Сохраняем выбранный вариант ответа
        )
        db.add(completion)
    else:
        # Обновим выбранный вариант ответа и оценку
        completion.selected_option_id = body.option_id
        if is_correct:
            if completion.score is None or completion.score < 1.0:
                completion.score = 1.0
        else:
            # Если ответ неправильный, но задача уже была выполнена правильно, не меняем score
            if completion.score is None or completion.score < 1.0:
                completion.score = 0.0
    
    # Сохраняем изменения в БД
    await db.commit()
    
    # 6) Если ответ правильный, пересчитаем прогресс по курсу
    if is_correct:
        
        # Пересчитаем прогресс по курсу
        res = await db.execute(
            select(func.count(LessonCompletion.id))
            .join(Lesson, Lesson.id == LessonCompletion.lesson_id)
            .where(
                LessonCompletion.user_id == student.id,
                Lesson.course_id == lesson.course_id,
            )
        )
        lessons_completed = res.scalar_one() or 0
        
        res = await db.execute(
            select(func.count(TaskCompletion.id))
            .join(Task, Task.id == TaskCompletion.task_id)
            .join(Lesson, Lesson.id == Task.lesson_id)
            .where(
                TaskCompletion.user_id == student.id,
                Lesson.course_id == lesson.course_id,
            )
        )
        tasks_completed = res.scalar_one() or 0
        
        res = await db.execute(
            select(func.avg(TaskCompletion.score))
            .join(Task, Task.id == TaskCompletion.task_id)
            .join(Lesson, Lesson.id == Task.lesson_id)
            .where(
                TaskCompletion.user_id == student.id,
                Lesson.course_id == lesson.course_id,
                TaskCompletion.score.isnot(None),
            )
        )
        score_avg = res.scalar_one()
        score_avg = float(score_avg) if score_avg is not None else 0.0
        
        # Обновим или создадим прогресс
        res = await db.execute(
            select(Progress).where(
                Progress.user_id == student.id,
                Progress.course_id == lesson.course_id,
            )
        )
        progress = res.scalar_one_or_none()
        if progress is None:
            progress = Progress(
                user_id=student.id,
                course_id=lesson.course_id,
                lessons_completed=lessons_completed,
                tasks_completed=tasks_completed,
                score_avg=score_avg,
            )
            db.add(progress)
        else:
            progress.lessons_completed = lessons_completed
            progress.tasks_completed = tasks_completed
            progress.score_avg = score_avg
        
        await db.commit()
        return SubmitAnswerResponse(
            is_correct=True,
            message="Правильный ответ! Задача отмечена как выполненная."
        )
    else:
        # Неправильный ответ - просто возвращаем результат
        return SubmitAnswerResponse(
            is_correct=False,
            message="Неправильный ответ. Попробуйте еще раз."
        )
