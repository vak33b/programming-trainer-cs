from __future__ import annotations
import asyncio
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from app.core.config import get_settings

settings = get_settings()

class Base(DeclarativeBase):
    pass

engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,  # проверяем соединение перед использованием
)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session

async def wait_for_db(max_attempts: int = 20, delay: float = 1.0) -> None:
    """
    Ждём, пока БД реально станет доступной.
    """
    last_exc: Exception | None = None
    for _ in range(max_attempts):
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            return
        except Exception as e:
            last_exc = e
            await asyncio.sleep(delay)
    # если так и не удалось — пробрасываем последнюю ошибку
    raise last_exc if last_exc else RuntimeError("Database not reachable")
