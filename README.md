# DocPilot AI — SaaS Document Intelligence Platform

> **Plateforme SaaS multi-tenant de Document Intelligence (RAG)**  
> Réponses IA sourcées, traçables, sécurisées.

## Architecture

- **Type**: Modular Monolith (multi-tenant, secure-by-design)
- **Backend**: Django + DRF (Python)
- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Database**: PostgreSQL + pgvector
- **Queue**: Redis + Celery
- **Storage**: Cloudflare R2 (local in dev)
- **AI**: OpenAI (LLM + Embeddings)
- **Monitoring**: Sentry + structured logs

## Project Structure

```
saas-doc-intelligence/
├── backend/          # Django/DRF API + Celery workers
├── frontend/         # Next.js SaaS application
├── infra/            # Docker, Nginx, deploy scripts
└── docs/             # Architecture, runbooks, decisions
```

## Quick Start

See [docs/RUNBOOK_SETUP.md](docs/RUNBOOK_SETUP.md) for detailed setup instructions.

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+ (with pgvector)
- Redis 6+

### Development

```bash
# Start infrastructure services
docker compose up -d

# Backend
cd backend
python -m venv venv
venv\Scripts\activate     # Windows
pip install -r requirements/dev.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver

# Frontend (new terminal)
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

## Documentation

| Document | Description |
|----------|-------------|
| [PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md) | Vision, cible, MVP scope |
| [ARCHITECTURE_V1.md](docs/ARCHITECTURE_V1.md) | Architecture technique v1 |
| [ROADMAP.md](docs/ROADMAP.md) | Milestones et planning |
| [DECISIONS.md](docs/DECISIONS.md) | Decision log |
| [RUNBOOK_SETUP.md](docs/RUNBOOK_SETUP.md) | Setup local dev |

## Git Conventions

- **Branching**: `main`, `feature/<scope>`, `fix/<issue>`, `chore/<topic>`
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `chore:`, `docs:`

## License

Proprietary — All rights reserved.
