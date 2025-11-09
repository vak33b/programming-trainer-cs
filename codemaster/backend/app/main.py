from fastapi import FastAPI
from app.core.config import get_settings
from app.api.routes import auth, courses, lessons, tasks, progress
from app.db.init_db import init_models

app = FastAPI(title=get_settings().APP_NAME)

@app.on_event("startup")
async def on_startup():
    await init_models()

@app.get("/health")
async def health():
    return {"status": "ok"}

app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(lessons.router)
app.include_router(tasks.router)
app.include_router(progress.router)
