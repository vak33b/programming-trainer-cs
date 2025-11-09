from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.progress import ProgressOut
from app.services.progress_service import ProgressService

router = APIRouter(prefix="/progress", tags=["progress"])

@router.get("/{user_id}/{course_id}", response_model=ProgressOut)
async def get_progress(user_id: int, course_id: int, db: AsyncSession = Depends(get_db)):
    service = ProgressService(db)
    prog = await service.ensure_progress(user_id, course_id)
    await db.commit()
    return prog
