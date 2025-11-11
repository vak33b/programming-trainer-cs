from __future__ import annotations

import asyncio
from logging.config import fileConfig
from pathlib import Path

from alembic import context

# --- Делаем импорт приложения доступным ---
BASE_DIR = Path(__file__).resolve().parents[1]  # .../backend
import sys
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# --- Импортируем настройки и базу ---
from app.core.config import get_settings
from app.db.database import Base
# ВАЖНО: импорт моделей, чтобы они попали в metadata
from app import models  # noqa: F401

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

# Alembic Config object
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Берём URL из настроек (pydantic-settings читает .env)
settings = get_settings()
DATABASE_URL = settings.DATABASE_URL

# Чтобы alembic знал URL (хотя мы и будем сами создавать engine)
config.set_main_option("sqlalchemy.url", DATABASE_URL)

# Цель автогенерации — metadata наших моделей
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Офлайн-режим (генерация SQL без подключения)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Общий запуск миграций (онлайн/офлайн)."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Онлайн-режим c asyncpg."""
    connectable: AsyncEngine = create_async_engine(
        DATABASE_URL,
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
