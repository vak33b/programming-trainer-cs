# app/api/routes/teacher.py
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models import User, Course, Lesson, Task, TaskOption, Progress
from app.core.security import get_current_user  # см. ниже комментарий
from app.schemas.teacher import (
    TeacherCourseCreate,
    TeacherCourseOut,
    TeacherLessonCreate,
    TeacherLessonOut,
    TeacherTaskCreate,
    TeacherTaskOut,
    StudentProgressOut,
    TaskOptionOut,
)

router = APIRouter(prefix="/teacher", tags=["teacher"])


# ----- утилита: проверка, что пользователь преподаватель -----

async def require_teacher(current_user: User = Depends(get_current_user)) -> User:
    # предполагаем, что в модели User есть булево поле is_teacher
    if not getattr(current_user, "is_teacher", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ только для преподавателей",
        )
    return current_user


# ---------- 1. Прогресс студентов по курсам преподавателя ----------

@router.get(
    "/students-progress",
    response_model=List[StudentProgressOut],
)
async def get_students_progress(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    """
    Сводка по студентам для всех курсов текущего преподавателя.
    """
    stmt = (
        select(
            User.id.label("user_id"),
            User.email,
            User.full_name,
            func.count(func.distinct(Course.id)).label("courses_count"),
            func.coalesce(func.sum(Progress.lessons_completed), 0).label(
                "lessons_completed"
            ),
            func.coalesce(func.sum(Progress.tasks_completed), 0).label(
                "tasks_completed"
            ),
            func.avg(Progress.score_avg).label("score_avg"),
        )
        .join(Progress, Progress.user_id == User.id)
        .join(Course, Course.id == Progress.course_id)
        .where(Course.owner_id == current_user.id)
        .group_by(User.id, User.email, User.full_name)
    )

    res = await db.execute(stmt)
    rows = res.all()

    return [
        StudentProgressOut(
            user_id=row.user_id,
            email=row.email,
            full_name=row.full_name,
            courses_count=row.courses_count,
            lessons_completed=row.lessons_completed or 0,
            tasks_completed=row.tasks_completed or 0,
            score_avg=float(row.score_avg) if row.score_avg is not None else None,
        )
        for row in rows
    ]


# ---------- 2. Курсы преподавателя ----------

@router.get(
    "/courses",
    response_model=List[TeacherCourseOut],
)
async def get_my_courses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    # Получаем курсы преподавателя с подсчетом количества студентов
    stmt = (
        select(
            Course.id,
            Course.title,
            Course.description,
            func.count(func.distinct(Progress.user_id)).label("students_count"),
        )
        .outerjoin(Progress, Progress.course_id == Course.id)
        .where(Course.owner_id == current_user.id)
        .group_by(Course.id, Course.title, Course.description)
    )
    res = await db.execute(stmt)
    rows = res.all()
    
    return [
        TeacherCourseOut(
            id=row.id,
            title=row.title,
            description=row.description,
            students_count=row.students_count or 0,
        )
        for row in rows
    ]


@router.post(
    "/courses",
    response_model=TeacherCourseOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_course(
    payload: TeacherCourseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    course = Course(
        title=payload.title,
        description=payload.description,
        owner_id=current_user.id,
    )
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


@router.get(
    "/courses/{course_id}",
    response_model=TeacherCourseOut,
)
async def get_course(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    stmt = select(Course).where(
        Course.id == course_id,
        Course.owner_id == current_user.id,
    )
    res = await db.execute(stmt)
    course = res.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Курс не найден")
    return course


# ---------- 3. Уроки курса ----------

@router.get(
    "/courses/{course_id}/lessons",
    response_model=List[TeacherLessonOut],
)
async def get_course_lessons(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    # проверяем, что курс принадлежит преподавателю
    stmt_course = select(Course).where(
        Course.id == course_id,
        Course.owner_id == current_user.id,
    )
    res_course = await db.execute(stmt_course)
    course = res_course.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Курс не найден")

    stmt = select(Lesson).where(Lesson.course_id == course_id)
    res = await db.execute(stmt)
    lessons = res.scalars().all()
    return lessons


@router.post(
    "/courses/{course_id}/lessons",
    response_model=TeacherLessonOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_lesson(
    course_id: int,
    payload: TeacherLessonCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    # проверяем, что курс принадлежит преподавателю
    stmt_course = select(Course).where(
        Course.id == course_id,
        Course.owner_id == current_user.id,
    )
    res_course = await db.execute(stmt_course)
    course = res_course.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Курс не найден")

    lesson = Lesson(
        course_id=course_id,
        title=payload.title,
        content=payload.content,
    )
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return lesson


# ---------- 4. Тестовые задания (tasks) урока ----------

@router.get(
    "/lessons/{lesson_id}/tasks",
    response_model=List[TeacherTaskOut],
)
async def get_lesson_tasks(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    # проверяем, что урок принадлежит курсу преподавателя
    stmt_lesson = (
        select(Lesson)
        .join(Course, Lesson.course_id == Course.id)
        .where(
            Lesson.id == lesson_id,
            Course.owner_id == current_user.id,
        )
    )
    res_lesson = await db.execute(stmt_lesson)
    lesson = res_lesson.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Урок не найден")

    stmt = select(Task).where(Task.lesson_id == lesson_id).options(selectinload(Task.options))
    res = await db.execute(stmt)
    tasks = res.scalars().all()
    return tasks


@router.post(
    "/lessons/{lesson_id}/tasks",
    response_model=TeacherTaskOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_task(
    lesson_id: int,
    payload: TeacherTaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    # проверяем, что урок принадлежит курсу преподавателя
    stmt_lesson = (
        select(Lesson)
        .join(Course, Lesson.course_id == Course.id)
        .where(
            Lesson.id == lesson_id,
            Course.owner_id == current_user.id,
        )
    )
    res_lesson = await db.execute(stmt_lesson)
    lesson = res_lesson.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Урок не найден")

    # Если есть варианты ответов, автоматически включаем автопроверку
    has_autocheck = len(payload.options) > 0

    task = Task(
        lesson_id=lesson_id,
        title=payload.title,
        body=payload.body,
        has_autocheck=has_autocheck,
    )
    db.add(task)
    await db.flush()  # Получаем id задачи для создания options
    
    # Создаем варианты ответов
    for option_data in payload.options:
        option = TaskOption(
            task_id=task.id,
            text=option_data.text,
            is_correct=option_data.is_correct,
        )
        db.add(option)
    
    await db.commit()
    await db.refresh(task)
    
    # Загружаем options для возврата
    await db.refresh(task, ["options"])
    return task
