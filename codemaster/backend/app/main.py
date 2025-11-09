from __future__ import annotations
from fastapi import FastAPI
from app.core.config import get_settings
from app.api.routes import auth, courses, lessons, tasks, progress  # что у тебя подключено
from app.db.init_db import init_models
from app.db.database import wait_for_db

app = FastAPI(title=get_settings().APP_NAME)

@app.on_event("startup")
async def on_startup():
    # 1) ждём доступности подключения
    await wait_for_db(max_attempts=30, delay=1.0)
    # 2) создаём таблицы (если их ещё нет)
    await init_models()

@app.get("/health")
async def health():
    return {"status": "ok"}

# роутеры ниже
app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(lessons.router)
app.include_router(tasks.router)
app.include_router(progress.router)
