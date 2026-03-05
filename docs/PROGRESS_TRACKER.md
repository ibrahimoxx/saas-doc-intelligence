# DocPilot AI — Progress Tracker (forMe)

> **Objectif** : Suivi complet de tout ce qui a été fait dans ce projet, structuré par phase.
> Mis à jour à la fin de chaque phase, tâche importante, ou message significatif.

---

## Phase 0 — Discovery + Extraction + Decision Checklist ✅

**Date** : 2026-03-05
**Statut** : ✅ Terminée

### Ce qui a été fait

#### Documentation créée (14 fichiers dans `docs/`)

| Fichier | Rôle |
|---------|------|
| `docs/MASTER_CONTEXT.md` | Source de vérité consolidée |
| `docs/NON_NEGOTIABLE_RULES.md` | 27 règles non négociables |
| `docs/PRODUCT_SCOPE_AND_POSITIONING.md` | Positionnement multi-secteurs + wedge |
| `docs/ARCHITECTURE_DECISIONS.md` | 13 ADR légers |
| `docs/ARCHITECTURE_V1.md` | Architecture système complète |
| `docs/PHASE_PLAN_AND_MODEL_POLICY.md` | 10 phases + politique modèle IA |
| `docs/ROADMAP.md` | 6 milestones + planning hebdo |
| `docs/RISKS_AND_MITIGATIONS.md` | 10 risques + mitigations |
| `docs/TASK_BOARD.md` | 10 epics avec tâches détaillées |
| `docs/HANDOFF_CHECKPOINTS.md` | 7 checkpoints utilisateur |
| `docs/PROJECT_BRIEF.md` | Vision, MVP scope, KPIs |
| `docs/RUNBOOK_SETUP.md` | Guide setup local dev |
| `docs/DECISIONS.md` | Log décisions (15 validées + 6 pendantes) |
| `docs/PROGRESS_TRACKER.md` | Ce fichier (ajouté sur demande utilisateur) |

---

## Phase 1 — Foundation (repo, envs, bootstrap, conventions) ✅

**Date** : 2026-03-05
**Statut** : ✅ Terminée

### Étape 1.1 — Fichiers racine monorepo ✅

| Fichier | Description |
|---------|-------------|
| `README.md` | Vue d'ensemble, quick start, liens docs |
| `.gitignore` | Python + Node.js + IDE + env ignores |
| `.editorconfig` | Indentation cohérente (4 spaces Python, 2 spaces JS/TS) |
| `docker-compose.yml` | PostgreSQL 16 (pgvector) + Redis 7 avec healthchecks |
| `infra/docker/init-db.sql` | Init PostgreSQL (extensions vector + uuid-ossp) |

### Étape 1.2 — Django project bootstrap ✅

| Fichier | Description |
|---------|-------------|
| `backend/manage.py` | Entry point Django (settings dev par défaut) |
| `backend/.env.example` | Template env vars (DB, Redis, JWT, OpenAI, Celery, Sentry) |
| `backend/pyproject.toml` | Metadata + config pytest/black/isort/ruff |
| `backend/requirements/base.txt` | 18 dépendances avec versions pinnées |
| `backend/requirements/dev.txt` | + debug toolbar, pytest, factory-boy, ruff, black |
| `backend/requirements/prod.txt` | Extends base |

### Étape 1.3 — Django config (settings multi-env) ✅

| Fichier | Description |
|---------|-------------|
| `backend/config/__init__.py` | Package init |
| `backend/config/settings/__init__.py` | Package init |
| `backend/config/settings/base.py` | Settings complets : DRF, JWT, CORS, Celery, Sentry, logging, RAG config, upload limits |
| `backend/config/settings/dev.py` | Debug=True, browseable API, CORS relaxé |
| `backend/config/settings/staging.py` | SSL redirect, security headers, JSON logging |
| `backend/config/settings/prod.py` | HSTS 1 an + preload, strict security |
| `backend/config/urls.py` | Routes API v1 (auth, tenants, health) |
| `backend/config/wsgi.py` | WSGI entry point |
| `backend/config/asgi.py` | ASGI entry point |

### Étape 1.4 — Core module ✅

| Fichier | Description |
|---------|-------------|
| `backend/apps/__init__.py` | Package init |
| `backend/apps/core/__init__.py` | Package init |
| `backend/apps/core/apps.py` | AppConfig |
| `backend/apps/core/models.py` | BaseUUIDModel, TenantScopedModel, SoftDeleteModel + Managers |
| `backend/apps/core/middleware.py` | RequestIdMiddleware (correlation logs) |
| `backend/apps/core/exceptions.py` | Custom exception handler DRF + business exceptions (TenantAccessDenied, RAGInsufficientContext, etc.) |
| `backend/apps/core/permissions.py` | IsTenantMember, IsTenantAdmin, IsTenantManager |
| `backend/apps/core/pagination.py` | StandardPagination (page_size=20, max=100) |
| `backend/apps/core/constants.py` | Enums : TenantRole, MembershipStatus, DocumentStatus, JobType, JobStatus, MessageRole, ResponseStatus, AuditAction, etc. |
| `backend/apps/core/logging.py` | JsonFormatter pour logs structurés (staging/prod) |
| `backend/apps/core/urls.py` | Health check endpoint `/api/v1/health/` |
| `backend/apps/core/utils.py` | generate_slug (French-aware), compute_sha256, truncate_text |

### Étape 1.5 — Modules métier (squelettes 8 modules) ✅

Chaque module créé avec : `__init__.py`, `apps.py`, sous-dossiers `domain/`, `application/`, `infrastructure/`, `api/`, `migrations/`

| Module | Fichiers clés supplémentaires |
|--------|-------------------------------|
| `identity_access` | `models.py` (Custom User, email-based auth), `admin.py`, `api/urls.py` (stub) |
| `tenancy` | `models.py` (Tenant, TenantMembership, KnowledgeSpace), `admin.py`, `api/urls.py` (stub) |
| `documents` | Squelette complet |
| `ingestion` | + sous-dossiers `infrastructure/parsers/`, `chunking/`, `embeddings/`, `vector_store/` |
| `retrieval` | + sous-dossiers `infrastructure/llm/`, `prompts/` |
| `conversations` | Squelette complet |
| `audit_observability` | Squelette complet |
| `admin_ops` | Squelette complet |

### Étape 1.6 — Workers + Tests + Scripts ✅

| Fichier | Description |
|---------|-------------|
| `backend/workers/__init__.py` | Package init |
| `backend/workers/celery_app.py` | Config Celery + Django settings + auto-discover |
| `backend/tests/__init__.py` | Package init |
| `backend/tests/conftest.py` | Shared pytest fixtures (APIClient) |
| `backend/tests/unit/__init__.py` | Package init |
| `backend/tests/integration/__init__.py` | Package init |
| `backend/tests/api/__init__.py` | Package init |
| `backend/scripts/seed_dev.py` | Seed : admin user, demo tenant, membership, knowledge space |
| `backend/scripts/smoke_test.py` | Health check API test |

### Étape 1.7 — Frontend Next.js bootstrap ✅

| Fichier | Description |
|---------|-------------|
| `frontend/package.json` | Next.js 15 + React 19 + TypeScript + Tailwind v4 |
| `frontend/tsconfig.json` | TS config avec path aliases `@/*` |
| `frontend/next.config.mjs` | API proxy vers Django backend |
| `frontend/postcss.config.mjs` | PostCSS pour Tailwind v4 |
| `frontend/.env.local.example` | Template env vars frontend |
| `frontend/src/app/globals.css` | CSS global + Tailwind import |
| `frontend/src/app/layout.tsx` | Root layout (lang=fr, SEO metadata) |
| `frontend/src/app/page.tsx` | Page placeholder "En construction" |
| `frontend/src/lib/api-client.ts` | HTTP client centralisé (auth tokens, errors, upload) |
| `frontend/src/types/auth.types.ts` | Types: LoginRequest, UserProfile, etc. |
| `frontend/src/types/tenant.types.ts` | Types: Tenant, TenantMembership, KnowledgeSpace, etc. |
| `frontend/src/types/document.types.ts` | Types: Document, DocumentVersion |
| `frontend/src/types/chat.types.ts` | Types: Conversation, Message, Citation, AskRequest |
| `frontend/src/types/api.types.ts` | Types: PaginatedResponse, ApiErrorResponse |

Dossiers créés : `(auth)/login`, `(dashboard)/dashboard|documents|chat|admin|settings`, `components/ui|layout|documents|chat|admin`, `services/`, `hooks/`

### Étape 1.8 — Infra ✅

| Fichier/Dossier | Description |
|-----------------|-------------|
| `infra/docker/init-db.sql` | Script init PostgreSQL (pgvector + uuid-ossp) |
| `infra/nginx/` | Dossier placeholder |
| `infra/scripts/` | Dossier placeholder |

---

### Résumé Phase 1 — Total fichiers créés

- **Root** : 4 fichiers
- **Backend** : ~50 fichiers (config, core, 8 modules, workers, tests, scripts)
- **Frontend** : ~15 fichiers + config
- **Infra** : 1 fichier + 2 dossiers
- **Documentation** : 14 fichiers

**Total : ~85 fichiers créés**

---

## ⏳ En attente : Checkpoint 1

Actions utilisateur nécessaires :
1. Créer l'environnement Python virtualenv et installer les dépendances
2. Lancer Docker (PostgreSQL + Redis)
3. Installer les dépendances frontend (`npm install`)
4. Vérifier que tout fonctionne
5. Créer le repo GitHub et faire le premier push

---

## Phase 2 — Identity/Access + Tenancy + RBAC 🔲

(Non commencée — après validation Checkpoint 1)

## Phase 3 — Documents 🔲

(Non commencée)

## Phase 4 — Audit baseline + request_id 🔲

(Non commencée)

## Phase 5 — Ingestion async 🔲

(Non commencée)

## Phase 6 — Retrieval + RAG + Citations 🔲

(Non commencée)

## Phase 7 — Conversations/History 🔲

(Non commencée)

## Phase 8 — Admin Stats 🔲

(Non commencée)

## Phase 9 — Hardening sécurité + observabilité 🔲

(Non commencée)

## Phase 10 — Déploiement staging/prod 🔲

(Non commencée)
