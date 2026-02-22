FROM python:3.13-slim

WORKDIR /app

# Установить системные зависимости (если нужно)
RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

# Установить poetry фиксированной версии
RUN pip install --no-cache-dir "poetry==2.1.3"

# Настройки poetry (устанавливать в системное окружение)
RUN poetry config virtualenvs.create false

COPY pyproject.toml poetry.lock* ./
RUN poetry install --only main --no-interaction --no-ansi

COPY . .

COPY .env.production .env

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]

