# CodeMaster Backend (PostgreSQL)

## Быстрый запуск для локальной разработки
1) Создайте виртуальное окружение и установите зависимости:
```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```
2) Подготовьте PostgreSQL (пример):
```sql
CREATE DATABASE codemaster;
CREATE USER codemaster_user WITH PASSWORD 'changeme';
GRANT ALL PRIVILEGES ON DATABASE codemaster TO codemaster_user;
```
3) Создайте файл `.env` в `codemaster/backend` (можно копировать из `.env.example`) и укажите строку подключения:
```
DATABASE_URL=postgresql+asyncpg://codemaster_user:changeme@localhost:5432/codemaster
SECRET_KEY=your-secret
ACCESS_TOKEN_EXPIRE_MINUTES=60
APP_NAME=Codemaster
```
4) Запустите API:
```bash
uvicorn app.main:app --reload --port 8000
```

## Миграции (Alembic)
- Инициализация (если понадобится): `alembic init alembic`
- Создать ревизию: `alembic revision -m "message"`
- Применить миграции: `alembic upgrade head`
- Откат: `alembic downgrade -1`

## Проверка
- Health-check: `curl http://localhost:8000/health` → `{"status":"ok"}`
- Swagger UI: `http://localhost:8000/docs`
