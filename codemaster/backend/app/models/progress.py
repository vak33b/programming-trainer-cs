from __future__ import annotations

from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    ForeignKey,
    UniqueConstraint,
    Integer,
    Float,
    DateTime,
    Boolean,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Progress(Base):
    __tablename__ = "progress"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), primary_key=True)

    lessons_completed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    tasks_completed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    score_avg: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # <-- вот ЭТОЙ связи как раз не хватало:
    user: Mapped["User"] = relationship(
        "User",
        back_populates="progress",
    )


class LessonCompletion(Base):
    __tablename__ = "lesson_completions"
    __table_args__ = (
        UniqueConstraint("user_id", "lesson_id", name="uq_lesson_completion"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), nullable=False)
    completed_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
    completed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user: Mapped["User"] = relationship(
        "User",
        back_populates="lesson_completions",
    )
    # связь с Lesson нам особо не нужна для логики, но можно добавить:
    # lesson: Mapped["Lesson"] = relationship("Lesson")


class TaskCompletion(Base):
    __tablename__ = "task_completions"
    __table_args__ = (
        UniqueConstraint("user_id", "task_id", name="uq_task_completion"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"), nullable=False)
    completed_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    selected_option_id: Mapped[Optional[int]] = mapped_column(ForeignKey("task_options.id"), nullable=True)

    user: Mapped["User"] = relationship(
        "User",
        back_populates="task_completions",
    )
    # связь с Task аналогично опциональна:
    # task: Mapped["Task"] = relationship("Task")
