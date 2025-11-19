from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.course import Course

from app.db.database import get_db
from app.core.security import get_current_student, get_current_user, get_current_teacher
from app.models.user import User
from app.models.lesson import Lesson
from app.models.task import Task
from app.models.progress import Progress, LessonCompletion, TaskCompletion
from app.schemas.progress import (
    ProgressOut,
    CompleteLessonRequest,
    CompleteTaskRequest,
    CourseWithProgressOut, 
)

router = APIRouter(prefix="/progress", tags=["progress"])


async def _get_or_create_progress(
    db: AsyncSession, user_id: int, course_id: int
) -> Progress:
    res = await db.execute(
        select(Progress).where(
            Progress.user_id == user_id,
            Progress.course_id == course_id,
        )
    )
    progress = res.scalar_one_or_none()
    if progress is None:
        progress = Progress(
            user_id=user_id,
            course_id=course_id,
            lessons_completed=0,
            tasks_completed=0,
            score_avg=0.0,
        )
        db.add(progress)
        await db.flush()  # без commit, чтобы можно было дальше обновлять
    return progress


@router.post(
    "/lessons/{lesson_id}/complete",
    response_model=ProgressOut,
    status_code=status.HTTP_200_OK,
)
async def complete_lesson(
    lesson_id: int,
    _body: CompleteLessonRequest | None = None,
    db: AsyncSession = Depends(get_db),
    student: User = Depends(get_current_student),
):
    # 1) найдём урок
    res = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = res.scalar_one_or_none()
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # 2) проверим, не отмечен ли он уже
    res = await db.execute(
        select(LessonCompletion).where(
            LessonCompletion.user_id == student.id,
            LessonCompletion.lesson_id == lesson_id,
        )
    )
    completion = res.scalar_one_or_none()
    if completion is None:
        completion = LessonCompletion(user_id=student.id, lesson_id=lesson_id)
        db.add(completion)

    # 3) пересчитаем количество завершённых уроков по курсу
    res = await db.execute(
        select(func.count(LessonCompletion.id))
        .join(Lesson, Lesson.id == LessonCompletion.lesson_id)
        .where(
            LessonCompletion.user_id == student.id,
            Lesson.course_id == lesson.course_id,
        )
    )
    lessons_completed = res.scalar_one() or 0

    # 4) узнаем, сколько задач выполнено по этому курсу (для целостности)
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

    # 5) и средний балл по задачам
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

    progress = await _get_or_create_progress(db, student.id, lesson.course_id)
    progress.lessons_completed = lessons_completed
    progress.tasks_completed = tasks_completed
    progress.score_avg = score_avg

    await db.commit()
    await db.refresh(progress)
    return progress


@router.post(
    "/tasks/{task_id}/complete",
    response_model=ProgressOut,
    status_code=status.HTTP_200_OK,
)
async def complete_task(
    task_id: int,
    body: CompleteTaskRequest,
    db: AsyncSession = Depends(get_db),
    student: User = Depends(get_current_student),
):
    # 1) найдём задачу и её урок/курс
    res = await db.execute(select(Task).where(Task.id == task_id))
    task = res.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    res = await db.execute(select(Lesson).where(Lesson.id == task.lesson_id))
    lesson = res.scalar_one_or_none()
    if lesson is None:
        raise HTTPException(
            status_code=500, detail="Lesson for this task not found"
        )

    # 2) проверим, не отмечена ли задача уже
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
            score=body.score,
        )
        db.add(completion)
    else:
        # обновим оценку, если пришла новая
        if body.score is not None:
            completion.score = body.score

    # 3) пересчёты аналогично complete_lesson
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

    progress = await _get_or_create_progress(db, student.id, lesson.course_id)
    progress.lessons_completed = lessons_completed
    progress.tasks_completed = tasks_completed
    progress.score_avg = score_avg

    await db.commit()
    await db.refresh(progress)
    return progress


@router.get("/me/{course_id}", response_model=ProgressOut)
async def get_my_progress(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    res = await db.execute(
        select(Progress).where(
            Progress.user_id == user.id,
            Progress.course_id == course_id,
        )
    )
    progress = res.scalar_one_or_none()
    if progress is None:
        # если ещё нет записей, создадим пустой прогресс
        progress = Progress(
            user_id=user.id,
            course_id=course_id,
            lessons_completed=0,
            tasks_completed=0,
            score_avg=0.0,
        )
        db.add(progress)
        await db.commit()
        await db.refresh(progress)
    return progress

@router.get(
    "/users/{user_id}/courses/{course_id}",
    response_model=ProgressOut,
)
async def get_user_course_progress(
    user_id: int,
    course_id: int,
    db: AsyncSession = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    # 1) проверяем, что курс вообще существует и принадлежит этому преподу
    res = await db.execute(
        select(Course).where(
            Course.id == course_id,
            Course.owner_id == teacher.id,
        )
    )
    course = res.scalar_one_or_none()
    if course is None:
        # либо курса нет, либо он не этого препода
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this course",
        )

    # 2) ищем прогресс по курсу
    res = await db.execute(
        select(Progress).where(
            Progress.user_id == user_id,
            Progress.course_id == course_id,
        )
    )
    progress = res.scalar_one_or_none()

    if progress is None:
        progress = Progress(
            user_id=user_id,
            course_id=course_id,
            lessons_completed=0,
            tasks_completed=0,
            score_avg=0.0,
        )
        db.add(progress)
        await db.commit()
        await db.refresh(progress)

    return progress


@router.get(
    "/users/{user_id}",
    response_model=list[ProgressOut],
)
async def get_user_progress_all_courses(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    teacher: User = Depends(get_current_teacher),
):
    """
    Преподаватель смотрит прогресс студента по ВСЕМ *своим* курсам.
    """
    res = await db.execute(
        select(Progress)
        .join(Course, Course.id == Progress.course_id)
        .where(
            Progress.user_id == user_id,
            Course.owner_id == teacher.id,
        )
    )
    items = res.scalars().all()
    return items

@router.get(
    "/my-courses",
    response_model=list[CourseWithProgressOut],
)
async def get_my_courses_with_progress(
    db: AsyncSession = Depends(get_db),
    student: User = Depends(get_current_student),
):


    # берём все записи progress для этого студента + соответствующие курсы
    res = await db.execute(
        select(Progress, Course)
        .join(Course, Course.id == Progress.course_id)
        .where(Progress.user_id == student.id)
    )
    rows = res.all()

    result: list[CourseWithProgressOut] = []
    for progress, course in rows:
        result.append(
            CourseWithProgressOut(
                course_id=course.id,
                course_title=course.title,
                course_description=course.description,
                lessons_completed=progress.lessons_completed,
                tasks_completed=progress.tasks_completed,
                score_avg=progress.score_avg,
            )
        )

    return result

