from __future__ import annotations

from typing import List, Optional

from sqlalchemy import Integer, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    course: Mapped["Course"] = relationship(
        "Course",
        back_populates="lessons",
    )

    tasks: Mapped[List["Task"]] = relationship(
        "Task",
        back_populates="lesson",
        cascade="all, delete-orphan",
    )