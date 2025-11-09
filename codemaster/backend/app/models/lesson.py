from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Text, ForeignKey
from app.db.database import Base

class Lesson(Base):
    __tablename__ = "lessons"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str | None] = mapped_column(Text)

    course = relationship("Course", back_populates="lessons")
    tasks = relationship("Task", back_populates="lesson", cascade="all, delete-orphan")
