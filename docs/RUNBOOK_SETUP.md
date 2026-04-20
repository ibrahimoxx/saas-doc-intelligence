# DocPilot AI — Runbook: Local Development Setup

> Step-by-step guide to set up the development environment.

## Prerequisites

| Tool | Required Version | Check Command |
|------|-----------------|---------------|
| Python | 3.11+ (3.13.3 installed) | `python --version` |
| Node.js | 18+ (v22.21.1 installed) | `node --version` |
| Docker | Latest | `docker --version` |
| PostgreSQL | 14+ | `psql --version` |
| Redis | 6+ | `redis-cli --version` |
| Git | Latest | `git --version` |

## 1. Clone Repository

```bash
git clone git@github.com:<username>/saas-doc-intelligence.git
cd saas-doc-intelligence
```

## 2. Database Setup

### Option A: Using Docker (recommended)
```bash
docker compose up -d postgres redis
```

### Option B: Local PostgreSQL + Redis
```bash
# PostgreSQL: ensure service is running
# Create database:
psql -U postgres -c "CREATE DATABASE docpilot_dev;"
psql -U postgres -c "CREATE EXTENSION IF NOT EXISTS vector;" -d docpilot_dev

# Redis: ensure service is running
redis-cli ping  # should return PONG
```

## 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements/dev.txt

# Copy env file
copy .env.example .env
# Edit .env with your local values

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Seed dev data
python scripts/seed_dev.py

# Run server
python manage.py runserver
```

Backend available at: `http://localhost:8000`

## 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy env file
copy .env.local.example .env.local
# Edit .env.local with your local values

# Run dev server
npm run dev
```

Frontend available at: `http://localhost:3000`

## 5. Celery Worker (when needed)

```bash
cd backend
venv\Scripts\activate

# Start worker
celery -A workers.celery_app worker --loglevel=info

# Start beat scheduler (if needed)
celery -A workers.celery_app beat --loglevel=info
```

## 6. Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5433/docpilot_dev

# Redis
REDIS_URL=redis://localhost:6379/0

# Django
SECRET_KEY=your-dev-secret-key-change-in-prod
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000

# JWT
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=30
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# Storage (local in dev)
STORAGE_BACKEND=local
STORAGE_LOCAL_PATH=./media/documents

# OpenAI (when needed)
OPENAI_API_KEY=sk-...

# Sentry (optional in dev)
SENTRY_DSN=
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SENTRY_DSN=
```

## 7. Verification Checklist

- [ ] `python manage.py runserver` → no errors
- [ ] `npm run dev` → no errors
- [ ] `curl http://localhost:8000/api/v1/health/` → `{ "status": "ok" }`
- [ ] `curl http://localhost:3000` → page loads
- [ ] PostgreSQL accessible with pgvector
- [ ] Redis accessible (`redis-cli ping` → `PONG`)

## Common Issues

### pgvector not found
```bash
# Install pgvector (Docker handles this automatically)
# For local PostgreSQL on Windows, see: https://github.com/pgvector/pgvector#windows
```

### Python 3.13 compatibility issues
```bash
# If Celery or other packages fail on 3.13, use Python 3.11/3.12
pyenv install 3.12.0  # if using pyenv
```
