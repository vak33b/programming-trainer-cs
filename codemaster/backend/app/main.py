from __future__ import annotations
from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI

from app.core.config import get_settings
from app.api.routes import auth, courses, lessons, tasks, progress, teacher

from app.db.init_db import init_models
from app.db.database import wait_for_db  # если делали ожидание БД
from app.core.security import get_current_user
app = FastAPI(title=get_settings().APP_NAME)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    # опционально, если есть wait_for_db
    await wait_for_db()
    await init_models()


@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(lessons.router)
app.include_router(tasks.router)
app.include_router(progress.router)
app.include_router(teacher.router)  # НОВОЕ

