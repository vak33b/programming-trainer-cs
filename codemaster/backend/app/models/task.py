from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)

    title = Column(String, nullable=False)
    body = Column(Text, nullable=True)

    has_autocheck = Column(Boolean, default=False)

    lesson = relationship("Lesson", back_populates="tasks")

    # НОВОЕ:
    options = relationship(
        "TaskOption",
        back_populates="task",
        cascade="all, delete-orphan",
    )


class TaskOption(Base):
    __tablename__ = "task_options"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)

    text = Column(String, nullable=False)
    is_correct = Column(Boolean, default=False)

    task = relationship("Task", back_populates="options")
