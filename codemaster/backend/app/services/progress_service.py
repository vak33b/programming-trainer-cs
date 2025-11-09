from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.progress import Progress

class ProgressService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def ensure_progress(self, user_id: int, course_id: int) -> Progress:
        res = await self.db.execute(
            select(Progress).where(Progress.user_id == user_id, Progress.course_id == course_id)
        )
        prog = res.scalar_one_or_none()
        if prog is None:
            prog = Progress(user_id=user_id, course_id=course_id)
            self.db.add(prog)
            await self.db.flush()
        return prog
