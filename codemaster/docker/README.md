# Docker запуск Codemaster

## Что лежит в `docker/`
- `docker-compose.yml` — сборка и запуск фронта и бэка одной командой.
- `backend.Dockerfile` — образ FastAPI (Uvicorn, Python 3.11-slim).
- `frontend.Dockerfile` — образ React (Vite билд, затем serve).

## Перед стартом
- Нужны Docker Engine / Docker Desktop.
- `.env` в `codemaster/backend` не обязателен: значения заданы в compose (SQLite). Для другой БД меняйте `DATABASE_URL`.

## Быстрый запуск
1. Перейдите в `codemaster/docker`.
2. Соберите и запустите:
   ```bash
   docker compose up --build
   ```
3. Фронт: http://localhost:5173  
   Бэк:   http://localhost:8000

### Проверка работы
- Логи: `docker compose logs -f backend` или без `-f` для всего стека.
- Health: `curl http://localhost:8000/health` должно вернуть `{"status":"ok"}`.
- Во фронте откройте DevTools → Network и убедитесь, что `/auth/login` и `/auth/me` дают 200.

## Переменные окружения бэкенда
- `SECRET_KEY` — секрет JWT (замените `changeme`).
- `DATABASE_URL` — по умолчанию `sqlite+aiosqlite:///./codemaster.db` (лежит в volume).
- `ACCESS_TOKEN_EXPIRE_MINUTES` — время жизни токена.

Можно задать через `.env` рядом с compose:
```env
SECRET_KEY=your-secret
DATABASE_URL=sqlite+aiosqlite:///./codemaster.db
ACCESS_TOKEN_EXPIRE_MINUTES=120
```
Compose сам подхватит `.env` в этой папке.

## База данных: создание и строки подключения
- **SQLite (по умолчанию)**: ничего создавать не нужно. Файл `codemaster.db` появится в volume `backend-db` при первом старте. Строка подключения уже стоит: `sqlite+aiosqlite:///./codemaster.db`.
- **PostgreSQL (пример)**: поднимите свой postgres и укажите строку в `DATABASE_URL`, например  
  `postgresql+asyncpg://user:password@postgres-host:5432/codemaster`  
  БД и пользователя создайте заранее (через `psql` или GUI). После смены строки подключений пересоберите/перезапустите контейнеры (`docker compose up --build`).

## Полезные команды
- Пересобрать после изменений кода: `docker compose up --build --force-recreate`
- Остановить контейнеры: `docker compose down`
- Остановить и удалить volume (сбросить БД): `docker compose down -v`

## Как устроено
- `frontend` зависит от `backend` (depends_on), порты мапятся: 5173:5173 и 8000:8000.
- Внутри сети compose фронт ходит на `http://backend:8000`. В браузере адрес API настроен на `http://localhost:8000` (`src/api/client.js`).
- SQLite хранится в volume `backend-db`, данные переживают перезапуск контейнеров.
