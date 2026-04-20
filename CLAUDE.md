# CLAUDE.md — DocPilot AI

> Working session brief for Claude Code. Read top-to-bottom on first load; jump to sections by number during active work.

---

## Recent Changes to This File

**2026-04-20 — All Phase 9 bugs fixed + cleanup executed by Claude Code**
- BUG-1: Fixed `res.success` → `res.ok` in `login/page.tsx:26`
- BUG-2: Fixed `STATUS_CONFIG` keys `pending/completed` → `queued/indexed` in `documents/page.tsx`
- BUG-3: Fixed `query.model_used` → `query.model_name` in `admin_views.py:90`
- BUG-4: Fixed all 4 test files — added `slug` to `Tenant.objects.create()`, replaced `DocumentStatus.AVAILABLE` with `QUEUED`, removed unused `pytest` import
- BUG-5a: Added `KnowledgeSpaceDetailView` DELETE endpoint + URL + import to tenancy app
- BUG-5b: Added `DocumentDownloadView` + URL; replaced `window.open()` with auth-aware `fetch()` + blob download in frontend; handles both local file serve and S3 presigned URL
- Removed `docs/` from `.gitignore` — docs now tracked in git
- Moved 4 debug scripts to `backend/scripts/debug/`; deleted 11 stale files from `backend/` root
- Fixed `RUNBOOK_SETUP.md`: DB port 5432 → 5433, seed command `manage.py seed_dev` → `scripts/seed_dev.py`
- Updated `PROGRESS_TRACKER.md` — phases 3–9 now reflect reality

**2026-04-20 — Rewritten by Claude Code (claude-sonnet-4-6)**
- Full audit and restructure of Cursor-generated CLAUDE.md
- Fixed 5 errors: PostgreSQL port (5433), seed_dev command, document status bug location, AI provider framing, PROGRESS_TRACKER staleness
- Added 12 missing items: French UI context, Gemini embedding truncation gotcha, undocumented core files, debug script inventory, non-negotiable rules, true current phase, docs/ gitignore recommendation, developer profile
- Merged WIP + Known Issues + Roadmap into unified "Current State" section
- Added 5 DECIDED BY CLAUDE CODE decisions (see each section)
- Added Tech Debt & Cleanup section

---

## 1. Identity Snapshot

| Field | Value |
|---|---|
| Product | DocPilot AI |
| Type | B2B multi-tenant SaaS — document intelligence via RAG |
| Repo | `saas-doc-intelligence` (monorepo) |
| GitHub | `git@github.com:ibrahimoxx/saas-doc-intelligence.git` |
| Stack | Next.js 15 + Django 5.1 + PostgreSQL/pgvector + Redis + Celery |
| AI | Gemini 2.0 Flash (generation) + gemini-embedding-001 (embeddings) |
| Active phase | **Phase 9 — Hardening** (all 8 feature epics done, fixing bugs before deploy) |
| UI language | **French** — all user-facing text is in French |
| Developer | Solo, part-time (~2h/day + 4–6h weekends), Windows 11 / VS Code |
| Deploy target | Backend → Render, Frontend → Vercel, DB → PostgreSQL Managed, Storage → Cloudflare R2 |

Docs (gitignored — see §14 for why this should change):
- `docs/MASTER_CONTEXT.md` — primary source of truth
- `docs/NON_NEGOTIABLE_RULES.md` — binding architectural constraints
- `docs/ARCHITECTURE_V1.md` — technical architecture
- `docs/ROADMAP.md` — planned phases

---

## 2. Local Setup Quick-Ref

### Prerequisites
- Docker running
- Python venv activated: `backend/venv/Scripts/activate` (Windows)
- `.env` present at `backend/.env` (already exists locally)
- `frontend/.env.local` present (already exists locally)

### Start everything
```bash
# 1. Infrastructure (PostgreSQL on port 5433, Redis on 6379)
docker compose up -d

# 2. Backend API (from backend/)
cd backend
venv/Scripts/activate
python manage.py migrate
python manage.py runserver
# → http://localhost:8000

# 3. Celery worker (separate terminal, from backend/)
celery -A workers.celery_app worker --loglevel=info

# 4. Frontend (from frontend/)
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Seed dev data
```bash
# From backend/ with venv active
python scripts/seed_dev.py
```

### ⚠️ Port note
PostgreSQL maps to host port **5433** (not 5432). `DATABASE_URL` in `.env` already reflects this. Any tool connecting to the DB must use port 5433.

---

## 3. Current State

### True Phase: 9 — Hardening
PROGRESS_TRACKER.md is stale (last updated after Phase 2). All phases 1–8 are implemented. Phase 9 is active.

| Phase | Status | Notes |
|---|---|---|
| 1 — Foundation | ✅ Done | Monorepo, Docker, migrations |
| 2 — Identity/Auth/RBAC | ✅ Done | JWT, tenancy, permissions |
| 3 — Documents | ✅ Done | Upload/list/delete/status |
| 4 — Audit baseline | ✅ Done | AuditLog, request_id middleware |
| 5 — Ingestion async | ✅ Done | Celery, PDF parse/chunk/embed |
| 6 — Retrieval + RAG | ✅ Done | pgvector search + Gemini + citations |
| 7 — Conversations | ✅ Done | Conversation/Message/Citation models + API |
| 8 — Admin stats | ✅ Done (with bugs) | Stats + recent queries endpoints |
| 9 — Hardening | 🔄 In progress | Rate limiting ✅, structured logs ✅, bugs open ⬇ |
| 10 — Deploy | 🔲 Not started | No CI/CD, no production Dockerfiles |

### Active Bugs ~~(all fixed 2026-04-20)~~

**All 5 bugs fixed on 2026-04-20.**

| Bug | Fix applied |
|---|---|
| BUG-1 login `res.success` | → `res.ok` in `login/page.tsx:26` |
| BUG-2 STATUS_CONFIG keys | `pending`→`queued`, `completed`→`indexed` in `documents/page.tsx` |
| BUG-3 `model_used` | → `model_name` in `admin_views.py:90` |
| BUG-4 broken tests | `slug` added to `Tenant.objects.create()`, `AVAILABLE`→`QUEUED`, all 4 test files |
| BUG-5 missing endpoints | `KnowledgeSpaceDetailView` DELETE + `DocumentDownloadView` added |

### WIP / Incomplete

| Item | Status | Files |
|---|---|---|
| Admin nav links to non-existent pages | `/admin/tenants`, `/admin/users`, `/admin/settings` linked but pages don't exist | `frontend/src/app/admin/layout.tsx` |
| Admin dashboard activity is placeholder | Static mock rows, not wired to API | `frontend/src/app/admin/dashboard/page.tsx` |
| No CI/CD manifests | Docs mention GitHub Actions + Render/Vercel — no `.github/workflows/*` exists | — |
| Token storage decision (see §10 gotcha #2) | Using localStorage, not httpOnly cookies | `frontend/src/hooks/useAuth.tsx` |

---

## 4. Architecture Map

```
saas-doc-intelligence/
├── docker-compose.yml          ← postgres:5433 + redis:6379
├── infra/docker/init-db.sql    ← enables pgvector + uuid-ossp
├── backend/
│   ├── manage.py
│   ├── .env                    ← LOCAL ONLY, gitignored
│   ├── .env.example
│   ├── requirements/
│   │   ├── base.txt
│   │   ├── dev.txt
│   │   └── prod.txt
│   ├── config/
│   │   ├── urls.py             ← global API routing
│   │   └── settings/
│   │       ├── base.py         ← main settings + env contracts + RAG defaults
│   │       ├── dev.py
│   │       ├── staging.py
│   │       └── prod.py
│   ├── apps/
│   │   ├── core/
│   │   │   ├── models.py       ← BaseModel (UUID, timestamps, soft-delete mixin)
│   │   │   ├── constants.py    ← DocumentStatus, MemberRole, etc.
│   │   │   ├── permissions.py  ← IsTenantMember, IsTenantAdmin, IsTenantManager
│   │   │   ├── middleware.py   ← request_id injection
│   │   │   ├── exceptions.py   ← custom DRF exception handler + error envelope
│   │   │   ├── pagination.py   ← StandardPagination (page_size=20, max=100)
│   │   │   ├── logging.py      ← JsonFormatter for structured logs
│   │   │   └── utils.py        ← generate_slug, compute_sha256, truncate_text, safe_int
│   │   ├── identity_access/
│   │   │   ├── models.py       ← custom User (UUID PK, email auth, no username)
│   │   │   ├── backends.py     ← EmailBackend (timing-attack safe)
│   │   │   └── api/            ← login, register, refresh, logout, me, change-password
│   │   ├── tenancy/
│   │   │   ├── models.py       ← Tenant, TenantMembership, KnowledgeSpace
│   │   │   ├── api/            ← tenant CRUD, members, spaces
│   │   │   ├── management/commands/assign_user.py  ← dev utility
│   │   │   └── tests/          ← duplicate of backend/tests/ (see BUG-4)
│   │   ├── documents/
│   │   │   ├── models.py       ← Document, DocumentVersion, DocumentProcessingJob
│   │   │   ├── api/            ← upload/list/detail/delete/status
│   │   │   └── infrastructure/storage.py  ← local + S3/R2 abstraction
│   │   ├── ingestion/
│   │   │   ├── models.py       ← DocumentChunk (1536-dim vector)
│   │   │   ├── tasks.py        ← Celery: parse → chunk → embed → store
│   │   │   ├── management/commands/process_documents.py
│   │   │   └── infrastructure/
│   │   │       ├── parsers/pdf_parser.py
│   │   │       ├── chunking/text_chunker.py
│   │   │       └── embeddings/embedding_service.py  ← Gemini/OpenAI/dev
│   │   ├── retrieval/
│   │   │   ├── models.py       ← QueryLog
│   │   │   ├── api/
│   │   │   │   ├── views.py    ← /chat/ask + conversations
│   │   │   │   ├── admin_views.py  ← /admin/stats + /admin/queries/recent (BUG-3)
│   │   │   │   ├── urls.py
│   │   │   │   └── admin_urls.py
│   │   │   └── infrastructure/
│   │   │       ├── vector_search.py  ← pgvector cosine similarity
│   │   │       └── rag_pipeline.py   ← context build + Gemini/OpenAI/dev LLM
│   │   ├── conversations/
│   │   │   ├── models.py       ← Conversation, Message, MessageCitation
│   │   │   └── api/            ← conversation CRUD + follow-up messages
│   │   ├── audit_observability/
│   │   │   ├── models.py       ← AuditLog
│   │   │   └── services.py     ← log_action() service
│   │   └── admin_ops/          ← registered app, minimal (just AppConfig)
│   ├── scripts/
│   │   ├── seed_dev.py         ← seed admin + demo tenant
│   │   └── smoke_test.py       ← hit /health endpoint
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_permissions.py ← BROKEN — see BUG-4
│   │   └── test_isolation.py   ← BROKEN — see BUG-4
│   └── workers/celery_app.py
└── frontend/
    ├── package.json            ← scripts: dev, build, start, lint
    ├── next.config.mjs
    ├── tsconfig.json           ← strict TS, @/* alias
    └── src/
        ├── app/
        │   ├── page.tsx                         ← auto-redirect /login or /dashboard
        │   ├── layout.tsx
        │   ├── globals.css
        │   ├── (auth)/login/page.tsx            ← BUG-1 here
        │   ├── (dashboard)/dashboard/page.tsx
        │   ├── (dashboard)/documents/page.tsx   ← BUG-2, BUG-5 (download) here
        │   ├── (dashboard)/chat/page.tsx
        │   ├── (dashboard)/membres/page.tsx     ← French slug, do not rename
        │   ├── (dashboard)/espaces/page.tsx     ← French slug, do not rename
        │   └── admin/
        │       ├── layout.tsx                   ← links to non-existent pages (WIP)
        │       └── dashboard/page.tsx           ← placeholder data (WIP)
        ├── hooks/useAuth.tsx                    ← JWT context, localStorage (see gotcha #2)
        ├── lib/api-client.ts                    ← axios/fetch wrapper
        ├── services/
        │   ├── auth.service.ts
        │   ├── tenant.service.ts                ← BUG-5 (space delete) here
        │   ├── conversation.service.ts
        │   └── admin.service.ts
        ├── components/
        │   ├── layout/{TopBar.tsx,Sidebar.tsx}
        │   └── ui/                              ← Avatar, Badge, Button, EmptyState,
        │                                           ErrorBanner, Input, LoadingSpinner, Modal
        └── types/
            ├── api.types.ts
            ├── auth.types.ts
            ├── chat.types.ts
            ├── document.types.ts
            └── tenant.types.ts
```

### Architecture patterns
- **Modular monolith** — no microservices, one Django project with domain apps
- **Shared DB + tenant_id** — every business table has `tenant_id` FK
- **REST JSON** under `/api/v1`, tenant scoped in URL path
- **Async ingestion** — upload writes job record, Celery worker processes
- **RAG runtime** — embed question → pgvector cosine search → build context → Gemini → return answer + citations
- **Cross-cutting** — custom error envelope, request_id middleware, DRF throttle rates, soft-delete mixin

---

## 5. API Reference

Base: `/api/v1`

| Method | Path | Purpose | Auth |
|---|---|---|---|
| GET | `/health/` | Health check | No |
| POST | `/auth/login/` | Issue JWT | No |
| POST | `/auth/register/` | Register | No |
| POST | `/auth/refresh/` | Rotate tokens | No |
| POST | `/auth/logout/` | Blacklist refresh | Yes |
| GET/PATCH | `/auth/me/` | Profile | Yes |
| POST | `/auth/change-password/` | Change password | Yes |
| GET/POST | `/tenants/` | List / create tenant | Yes |
| GET | `/tenants/{tid}/` | Tenant detail | Yes + member |
| GET | `/tenants/{tid}/summary/` | Dashboard counters | Yes + member |
| GET | `/tenants/{tid}/me/permissions/` | Computed permissions | Yes + member |
| GET/POST | `/tenants/{tid}/members/` | List / invite member | Yes + member/admin |
| PATCH/DELETE | `/tenants/{tid}/members/{mid}/` | Update / remove member | Yes + admin |
| GET/POST | `/tenants/{tid}/spaces/` | List / create space | Yes + member/manager |
| GET/POST | `/tenants/{tid}/documents/` | List / upload document | Yes + member/manager |
| GET | `/tenants/{tid}/documents/{did}/` | Document detail | Yes + member |
| DELETE | `/tenants/{tid}/documents/{did}/` | Soft-delete document | Yes + manager |
| GET | `/tenants/{tid}/documents/{did}/status/` | Processing status | Yes + member |
| GET | `/tenants/{tid}/documents/{did}/download/` | Download file (local: blob; S3: presigned URL) | Yes + member |
| DELETE | `/tenants/{tid}/spaces/{sid}/` | Soft-delete space (blocks `general` space) | Yes + admin |
| POST | `/tenants/{tid}/chat/ask/` | One-shot RAG ask | Yes + member |
| GET/POST | `/tenants/{tid}/conversations/` | List / create conversation | Yes + member |
| GET/DELETE | `/tenants/{tid}/conversations/{cid}/` | Detail / archive | Yes + owner |
| POST | `/tenants/{tid}/conversations/{cid}/messages/` | Follow-up message | Yes + owner |
| GET | `/admin/stats/` | Platform stats | Yes + superuser |
| GET | `/admin/queries/recent/` | Recent queries (BUG-3) | Yes + superuser |

Rate limits: `login: 5/min` · `register: 3/min` · `chat: 20/min` · `upload: 10/min`

---

## 6. Database Schema

ORM: Django ORM. Migrations at `apps/*/migrations/0001_initial.py`.

### Identity / Tenancy
| Table | App model | Key fields |
|---|---|---|
| `users` | `identity_access.User` | UUID PK, unique `email`, `full_name`, `is_active`, `is_staff`, `is_superuser` |
| `tenants` | `tenancy.Tenant` | UUID PK, unique `slug`, `status` |
| `tenant_memberships` | `tenancy.TenantMembership` | FK tenant+user, `role` (owner/admin/manager/member), `status`, unique `(tenant,user)` |
| `knowledge_spaces` | `tenancy.KnowledgeSpace` | FK tenant, `slug`, optional `created_by`, soft-delete, unique `(tenant,slug)` |

### Documents + Ingestion
| Table | App model | Key fields |
|---|---|---|
| `documents` | `documents.Document` | FK tenant/space/created_by, `status` {queued,processing,indexed,failed}, soft-delete |
| `document_versions` | `documents.DocumentVersion` | FK document, file metadata, `indexing_status`, unique `(document,version_number)` |
| `document_processing_jobs` | `documents.DocumentProcessingJob` | FK doc_version, `job_type/status/start/end/error/metadata` |
| `document_chunks` | `ingestion.DocumentChunk` | FK doc_version/tenant/space, `content/token_count/page`, `embedding vector(1536)`, unique `(doc_version,chunk_index)` |

### Retrieval + Conversations + Audit
| Table | App model | Key fields |
|---|---|---|
| `query_logs` | `retrieval.QueryLog` | FK tenant/user/space, question/answer/status/`model_name`/tokens/latency/chunks_used |
| `conversations` | `conversations.Conversation` | FK tenant/user/space, status active/archived |
| `messages` | `conversations.Message` | FK conversation, role user/assistant/system, content/model/tokens/latency |
| `message_citations` | `conversations.MessageCitation` | FK message/chunk, doc/page/similarity/excerpt |
| `audit_logs` | `audit_observability.AuditLog` | optional FK tenant/user, action/resource/details/request metadata |

DB extension bootstrap: `infra/docker/init-db.sql` — enables `vector` and `uuid-ossp`.

---

## 7. Auth & Authorization

### Authentication
- Strategy: JWT bearer (SimpleJWT)
- Login/register return access + refresh token
- Refresh rotation enabled, blacklist on logout
- Token storage: **localStorage** — `access_token`, `refresh_token` (see gotcha #2)
- Custom `EmailBackend` at `identity_access/backends.py` — timing-attack safe, supports `email` or `username` kwarg (for Django admin compat)

### Authorization (RBAC)
| Role | Capabilities |
|---|---|
| `member` | Read/list/query only |
| `manager` | + document upload/delete, space creation |
| `admin` | + member lifecycle management |
| `owner` | Same as admin, cannot be reassigned/removed via API |
| `superuser` (`is_superuser`) | Platform admin endpoints only |

Permission classes in `core/permissions.py`:
- `IsTenantMember` — any active member
- `IsTenantAdmin` — owner or admin
- `IsTenantManager` — owner, admin, or manager

Business rules enforced in code:
- Tenant creator becomes `owner` automatically
- Default `general` knowledge space auto-created per new tenant
- Members cannot remove themselves via member management endpoint

---

## 8. AI / RAG Configuration

### Active setup
| Component | Provider | Model | Notes |
|---|---|---|---|
| Generation (LLM) | **Google Gemini** | `gemini-2.0-flash` | Free tier, 15 req/min |
| Embeddings | **Google Gemini** | `gemini-embedding-001` | Free tier, 429 handling built-in |
| Fallback (LLM) | OpenAI | `gpt-4o-mini` | Commented out in .env — quota exceeded |
| Dev mode | Mock | — | Returns structured placeholder, no API needed |

Provider selection is automatic: if `GEMINI_API_KEY` is set → Gemini. If `OPENAI_API_KEY` set → OpenAI. Neither → dev mock.

RAG settings (configured in `config/settings/base.py`):
- `RAG_TOP_K_CHUNKS = 5`
- `RAG_MIN_SIMILARITY_SCORE = 0.7`
- `RAG_MAX_CONTEXT_TOKENS = 4000`
- `RAG_TEMPERATURE = 0.1`

System prompt language: French (`"Tu es DocPilot AI, un assistant expert en analyse de documents."`)
Response language: adapts to question language (instructions in system prompt)

**⚠️ Embedding dimension gotcha** — see §10 gotcha #3.

---

## 9. Non-Negotiable Rules

Extracted from `docs/NON_NEGOTIABLE_RULES.md` (binding throughout project lifecycle):

### Architecture
- Modular Monolith — no microservices until proven bottleneck
- `views.py` = HTTP layer only — no heavy business logic in views
- Business logic belongs in `application/services.py` per domain
- No cross-module wild imports — use application services
- Every business table must have: `id` (UUID), `tenant_id`, `created_at`, `updated_at`
- Soft delete where appropriate (`deleted_at`)
- Tenant isolation must be centralized — not ad-hoc per query
- API versioning from day 1 (`/api/v1/...`)

### Security
- RBAC tenant-scoped on every endpoint
- Deny-by-default for RAG: return explicit no-answer if context insufficient
- Audit logs on all sensitive actions
- Rate limiting on login/chat/upload
- Backend is source of truth for input validation
- Secrets never in source code

### Product
- MVP scope is frozen — no OCR, SSO, billing, or connectors until V2+
- Product is multi-sector SaaS from day 1 (not just medical/dental)
- Cabinet médical/dentaire is launch wedge, not a product limitation

---

## 10. Conventions & Gotchas

### Code conventions
- **Python**: Black + isort + Ruff, line length 120, configured in `backend/pyproject.toml`
- **TypeScript**: strict mode, `@/*` alias for `src/*`
- **Formatting**: 4-space Python, 2-space JS/TS/CSS/JSON/YAML (`.editorconfig`)
- **Git commits**: conventional commits — `feat(scope):`, `fix(scope):`, `chore(scope):`, `docs(scope):`
- **Branches**: `feature/*`, `fix/*`, `chore/*`

### UI language
The UI is entirely in French. User-facing labels, error messages, empty states, and system prompts are all in French. When writing frontend code, match the existing language. Do not translate to English.

### Gotcha #1 — French route slugs
`/membres` and `/espaces` are canonical dashboard URLs. Do not rename them without updating `Sidebar.tsx` and all navigation references.
- `frontend/src/app/(dashboard)/membres/page.tsx`
- `frontend/src/app/(dashboard)/espaces/page.tsx`

### Gotcha #2 — Token storage (localStorage)
Current implementation stores JWT in `localStorage`. This is acceptable for MVP — internal B2B SaaS, low XSS surface, no user-generated HTML rendered.

**DECIDED BY CLAUDE CODE**: localStorage is fine for MVP launch. Upgrade to httpOnly cookies before public/consumer launch or any compliance requirement. Document as open tech debt.

Priority: `LOW` for MVP, `HIGH` before public launch. File: `frontend/src/hooks/useAuth.tsx`.

### Gotcha #3 — Gemini embedding dimension truncation
`gemini-embedding-001` natively returns 3072-dim vectors. The `DocumentChunk` schema defines `embedding vector(1536)` (sized for OpenAI compatibility). The embedding service truncates Gemini vectors at 1536 dims:
```python
if len(vec) > 1536:
    vec = vec[:1536]
```
This means you lose ~half the embedding information. Similarity search still works but quality is reduced vs native 3072-dim.

To fix properly: run a migration to change `vector(1536)` to `vector(3072)`, re-index all documents, update `RAG_EMBEDDING_MODEL` setting. This is non-trivial but worth doing before indexing large document sets.

File: `backend/apps/ingestion/infrastructure/embeddings/embedding_service.py`

### Gotcha #4 — AI provider auto-detection is silent
If `GEMINI_API_KEY` is removed from `.env`, the system silently falls back to OpenAI (if key exists) or dev mock. There is no log warning when falling back. Monitor `apps.retrieval` and `apps.ingestion` logs to confirm which provider is active after `.env` changes.
File: `backend/apps/retrieval/infrastructure/rag_pipeline.py` → `_get_ai_provider()`

### Gotcha #5 — Admin stats double-counts queries
`/admin/stats/` aggregates both `QueryLog` records AND user messages from conversations. This can double-count "questions asked" if both systems are active simultaneously.
File: `backend/apps/retrieval/api/admin_views.py`

### Gotcha #6 — Soft delete is not universal
Some models use soft-delete (`deleted_at` via mixin), others are hard-deleted. Check `core/models.py` for the mixin, then verify per-model before writing cleanup or analytics queries.
Files: `core/models.py`, `tenancy/models.py`, `documents/models.py`

### Gotcha #7 — Gemini free tier rate limits
Gemini free tier: ~15 req/min. Built-in 429 retry logic uses exponential backoff (max 60s delay, 5 retries). Under heavy ingestion or concurrent chat, jobs will slow down significantly. Do not remove retry logic.
Files: `ingestion/infrastructure/embeddings/embedding_service.py`, `retrieval/infrastructure/rag_pipeline.py`

---

## 11. Environment Variables

| Variable | Description | Required | Current state |
|---|---|---|---|
| `DATABASE_URL` | DB connection string | Yes | Set — `postgres://postgres:postgres@localhost:5433/docpilot_dev` |
| `REDIS_URL` | Redis base URL — declared in .env but not consumed by Django settings; Celery uses its own `CELERY_BROKER_URL` below | No | `redis://localhost:6379/0` |
| `SECRET_KEY` | Django secret key | Yes | Set (dev placeholder, change for prod) |
| `DEBUG` | Django debug mode | Yes | `True` in dev |
| `ALLOWED_HOSTS` | Allowed hostnames | Yes | `localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | Frontend origins | Yes | `http://localhost:3000` |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | Access token duration | Optional | `30` |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | Refresh token duration | Optional | `7` |
| `STORAGE_BACKEND` | Storage mode | Yes | `local` |
| `STORAGE_LOCAL_PATH` | Local storage path | Required for local | `./media/documents` |
| `AWS_ACCESS_KEY_ID` | S3/R2 access key | Required for s3 mode | — |
| `AWS_SECRET_ACCESS_KEY` | S3/R2 secret | Required for s3 mode | — |
| `AWS_STORAGE_BUCKET_NAME` | S3/R2 bucket | Required for s3 mode | — |
| `AWS_S3_ENDPOINT_URL` | S3-compatible endpoint | Required for R2 | — |
| `AWS_S3_REGION_NAME` | S3 region | Optional | `auto` |
| `GEMINI_API_KEY` | **Active AI provider** | Yes (currently) | **Set in .env** |
| `OPENAI_API_KEY` | Fallback AI provider | Optional | Commented out — quota exceeded |
| `CELERY_BROKER_URL` | Celery broker | Yes for workers | `redis://localhost:6379/1` |
| `CELERY_RESULT_BACKEND` | Celery result backend | Yes for workers | `redis://localhost:6379/2` |
| `SENTRY_DSN` | Sentry backend DSN | Optional | Empty in dev |
| `NEXT_PUBLIC_API_URL` | Frontend API base | Yes | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_SENTRY_DSN` | Frontend Sentry DSN | Optional | — (not yet consumed in frontend code) |
| `NEXT_PUBLIC_APP_NAME` | App display name | Optional | — (not yet consumed in frontend code) |

Env files:
- `backend/.env` — local dev (gitignored, already exists)
- `backend/.env.example` — template
- `frontend/.env.local` — local dev (gitignored, already exists)
- `frontend/.env.local.example` — template

---

## 12. Commands Reference

### Infrastructure
```bash
docker compose up -d                          # Start postgres:5433 + redis:6379
docker compose up -d postgres redis           # Start only DB and Redis
docker compose down                           # Stop services
```

### Backend (from `backend/` with venv active)
```bash
python manage.py migrate                      # Apply migrations
python manage.py runserver                    # Start API server → http://localhost:8000
python manage.py createsuperuser             # Create platform admin
python manage.py process_documents            # Manual ingestion trigger
python manage.py assign_user                  # Assign user@docpilot.dev to first tenant (dev utility)

python scripts/seed_dev.py                    # Seed admin + demo tenant
python scripts/smoke_test.py                  # Smoke-check /health endpoint

celery -A workers.celery_app worker --loglevel=info  # Start async worker
celery -A workers.celery_app beat --loglevel=info    # Start beat scheduler

python run_tests.py                           # Run apps/tenancy/tests/ subset (NOT backend/tests/)
```

### Frontend (from `frontend/`)
```bash
npm install       # Install dependencies
npm run dev       # Start dev server → http://localhost:3000
npm run build     # Production build
npm run start     # Run built app
npm run lint      # ESLint check
```

---

## 13. Roadmap — Phase 9 Completion Checklist

**All bugs fixed 2026-04-20.** Remaining before Phase 10:

- [x] BUG-1 login `res.success` fixed
- [x] BUG-2 STATUS_CONFIG keys fixed
- [x] BUG-3 `model_used` fixed
- [x] BUG-4 all 4 test files repaired
- [x] BUG-5 space DELETE + document download endpoints added
- [ ] Validate tests actually pass: `cd backend && python run_tests.py`
- [ ] Decide: implement or remove admin nav links (`/admin/tenants`, `/admin/users`, `/admin/settings`)
- [ ] Wire admin dashboard activity to real API data (currently placeholder)

Phase 10 prerequisites:
- [ ] Write `Dockerfile` for backend (Django + Gunicorn)
- [ ] Write `Dockerfile` for Celery worker
- [ ] Add `.github/workflows/` CI pipeline (lint + test)
- [ ] Provision Cloudflare R2 bucket, set `AWS_*` vars
- [ ] Configure Render web service + background worker
- [ ] Configure Vercel for frontend
- [ ] Set production env vars on all services
- [ ] Validate `prod.py` settings (HTTPS, `CORS_ALLOWED_ORIGINS`, `ALLOWED_HOSTS`, `DEBUG=False`)

V2 scope (do not implement until MVP is live):
- OCR for scanned PDFs
- SSO / SAML
- Billing / tenant quotas
- Document connectors (Google Drive, Notion, etc.)
- Embedding schema upgrade: `vector(1536)` → `vector(3072)` for full Gemini quality

---

## 14. Tech Debt & Cleanup

### Debug scripts cleanup ✅ Done 2026-04-20

11 files removed from `backend/` root. 4 useful ones moved to `backend/scripts/debug/`:
```
backend/scripts/debug/force_user.py         — reset user password + ensure membership
backend/scripts/debug/test_admin_stats.py   — test admin API views without HTTP
backend/scripts/debug/test_gemini.py        — verify Gemini API key + list models
backend/scripts/debug/test_tenants.py       — live smoke test for auth + tenants API
```

### docs/ gitignore ✅ Fixed 2026-04-20

`docs/` removed from `.gitignore`. All 13 docs files are now tracked in git. No real secrets were in docs/ (only placeholder values like `sk-...`).

### Embedding dimension mismatch (see §10 gotcha #3)
**Priority: address before indexing a large document corpus.** Migrating vector dimensions requires re-embedding all existing documents. The longer you wait, the more expensive the migration.

### Token storage (localStorage → httpOnly cookies)
**Priority: LOW for MVP, required before public/enterprise launch.** Tracked in §10 gotcha #2.

---

## 15. External Services

### Google Gemini (active)
- Usage: generation (`gemini-2.0-flash`) + embeddings (`gemini-embedding-001`)
- Key: `GEMINI_API_KEY` — set in `backend/.env`
- Free tier limits: ~15 req/min, exponential backoff built in
- Code: `retrieval/infrastructure/rag_pipeline.py`, `ingestion/infrastructure/embeddings/embedding_service.py`

### OpenAI (fallback, currently disabled)
- Usage: generation (`gpt-4o-mini`) + embeddings (`text-embedding-3-small`) when `OPENAI_API_KEY` set
- Key: `OPENAI_API_KEY` — commented out in `.env` (quota exceeded)
- Code: same files as Gemini above

### PostgreSQL + pgvector
- Usage: relational store + vector similarity search
- Local: port **5433** (mapped from container's 5432)
- Image: `pgvector/pgvector:pg16`
- Config: `DATABASE_URL`

### Redis + Celery
- Usage: async task queue (ingestion) + result backend
- Local: port 6379
- Config: `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`
- Code: `workers/celery_app.py`, `ingestion/tasks.py`

### S3-compatible storage (Cloudflare R2)
- Usage: document file storage (local in dev, R2 in prod)
- Dev mode: `STORAGE_BACKEND=local`, files in `backend/media/documents/`
- Prod mode: `STORAGE_BACKEND=s3`, requires `AWS_*` vars
- Code: `documents/infrastructure/storage.py`

### Sentry
- Usage: exception + performance monitoring (backend + frontend)
- Config: `SENTRY_DSN` (backend), `NEXT_PUBLIC_SENTRY_DSN` (frontend)
- Currently: empty in dev (not blocking)
- Code: `config/settings/base.py`
