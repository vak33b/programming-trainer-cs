from __future__ import annotations

from typing import Optional

from sqlalchemy import Integer, String, Text, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), nullable=False)

    title: Mapped[str] = mapped_column(String, nullable=False)
    body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    has_autocheck: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ВАЖНО: здесь, судя по ошибке, стоит back_populates="tasks"
    lesson: Mapped["Lesson"] = relationship(
        "Lesson",
        back_populates="tasks",
    )
