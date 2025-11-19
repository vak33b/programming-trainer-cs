from __future__ import annotations

from typing import List, Optional

from sqlalchemy import Integer, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # НОВОЕ: владелец курса (преподаватель)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    owner: Mapped["User"] = relationship(
        "User",
        back_populates="owner_courses",
    )

    # если у тебя были связи lesson'ов — оставь:
    # lessons: Mapped[List["Lesson"]] = relationship("Lesson", back_populates="course")
