from __future__ import annotations

from typing import Optional, List

from sqlalchemy import String, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_teacher: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Курсы, которые принадлежит этому преподу
    owner_courses: Mapped[List["Course"]] = relationship(
        "Course",
        back_populates="owner",
        cascade="all, delete-orphan",
    )

    # как мы уже делали:
    progress: Mapped[List["Progress"]] = relationship(
        "Progress",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    lesson_completions: Mapped[List["LessonCompletion"]] = relationship(
        "LessonCompletion",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    task_completions: Mapped[List["TaskCompletion"]] = relationship(
        "TaskCompletion",
        back_populates="user",
        cascade="all, delete-orphan",
    )
