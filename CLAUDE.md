# CLAUDE.md — DocPilot AI (SaaS Document Intelligence)

> Context file for Claude Code. Read this FIRST before any task.

## 1. Project Overview
DocPilot AI is a multi-tenant SaaS document intelligence platform. Organizations upload internal documents (currently PDF-focused), then query them in natural language through a RAG pipeline that returns sourced answers (citations), with tenant isolation, RBAC, and auditability.

- Product name: `DocPilot AI`
- Core problem solved: internal knowledge in static docs is hard to search, inconsistent, and slow to use
- Primary users:
  - tenant admins/managers (setup, upload, member management)
  - tenant members (ask questions, review cited answers)
  - platform superadmin (`is_superuser`) for global stats
- Value proposition:
  - faster knowledge retrieval
  - traceable/cited AI responses
  - multi-tenant security boundaries
  - operational observability (audit logs + query logs)
- Business model context (from docs): B2B SaaS with multi-organization tenancy; billing is planned but not yet implemented in code

Key files:
- `README.md`
- `docs/PROJECT_BRIEF.md`
- `docs/ARCHITECTURE_V1.md`

## 2. Tech Stack
### Frontend
- Framework: Next.js App Router (`next` `^15.1.0`)
- Runtime/UI: React (`^19.0.0`), React DOM (`^19.0.0`)
- Language: TypeScript (`^5.7.0`, strict mode)
- Styling: Tailwind CSS v4 (`tailwindcss` `^4.0.0`) + custom CSS in `globals.css`
- Icons/libs: `lucide-react`, `@heroicons/react`, `date-fns`

Files:
- `frontend/package.json`
- `frontend/tsconfig.json`
- `frontend/src/app/globals.css`

### Backend
- Framework: Django (`>=5.1,<5.2`)
- API: Django REST Framework (`>=3.15,<4.0`)
- Auth: SimpleJWT (`djangorestframework-simplejwt`)
- Queue/async: Celery (`>=5.4,<6.0`) + Redis (`>=5.0,<6.0`)
- DB adapter: psycopg3 (`psycopg[binary]>=3.2,<4.0`) + `dj-database-url`
- Logging/monitoring: `django-structlog`, `sentry-sdk[django,celery]`
- Storage libs: `boto3`, `django-storages`
- AI/RAG libs: `openai`, `google-generativeai`, `tiktoken`
- PDF parsing: `pymupdf`, `filetype`
- Vector: `pgvector`

Files:
- `backend/requirements/base.txt`
- `backend/requirements/dev.txt`
- `backend/pyproject.toml`

### Database / Infra
- PostgreSQL with pgvector extension
- Redis
- Docker Compose local infrastructure

Files:
- `docker-compose.yml`
- `infra/docker/init-db.sql`

### Third-party services integrated
- OpenAI API
- Google Gemini API
- Sentry
- S3-compatible object storage (Cloudflare R2-style config)

Files:
- `backend/config/settings/base.py`
- `backend/.env.example`

## 3. Project Structure
```text
saas-doc-intelligence/
├── README.md
├── CLAUDE.md
├── docker-compose.yml
├── docs/                         # Product/architecture/runbook/roadmap docs (currently gitignored)
├── infra/
│   └── docker/
│       └── init-db.sql           # Enables pgvector + uuid-ossp
├── backend/
│   ├── manage.py
│   ├── pyproject.toml
│   ├── .env.example
│   ├── requirements/
│   │   ├── base.txt
│   │   ├── dev.txt
│   │   └── prod.txt
│   ├── config/
│   │   ├── urls.py               # Global API routing
│   │   └── settings/
│   │       ├── base.py           # Main settings and env contracts
│   │       ├── dev.py
│   │       ├── staging.py
│   │       └── prod.py
│   ├── apps/
│   │   ├── core/                 # Shared models, constants, perms, middleware, exceptions
│   │   ├── identity_access/      # User model + JWT auth endpoints
│   │   ├── tenancy/              # Tenants, memberships, knowledge spaces
│   │   ├── documents/            # Upload/list/delete/status + storage adapter
│   │   ├── ingestion/            # Parsing/chunking/embedding tasks + DocumentChunk
│   │   ├── retrieval/            # Vector search + RAG + query logging + admin stats endpoints
│   │   ├── conversations/        # Conversation/message/citations API
│   │   ├── audit_observability/  # Audit log model + logging service
│   │   └── admin_ops/            # Registered app; minimal implementation currently
│   ├── scripts/
│   │   ├── seed_dev.py
│   │   └── smoke_test.py
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_permissions.py
│   │   └── test_isolation.py
│   └── workers/
│       └── celery_app.py
└── frontend/
    ├── package.json
    ├── package-lock.json
    ├── .env.local.example
    ├── next.config.mjs
    ├── tsconfig.json
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx
        │   ├── globals.css
        │   ├── (auth)/login/page.tsx
        │   ├── (dashboard)/dashboard/page.tsx
        │   ├── (dashboard)/documents/page.tsx
        │   ├── (dashboard)/chat/page.tsx
        │   ├── (dashboard)/membres/page.tsx
        │   ├── (dashboard)/espaces/page.tsx
        │   └── admin/{layout.tsx,dashboard/page.tsx}
        ├── hooks/useAuth.tsx
        ├── lib/api-client.ts
        ├── services/
        │   ├── auth.service.ts
        │   ├── tenant.service.ts
        │   ├── conversation.service.ts
        │   └── admin.service.ts
        ├── components/layout/{TopBar.tsx,Sidebar.tsx}
        ├── components/ui/*
        └── types/*
```

## 4. Architecture & Design Patterns
- Overall architecture: modular monolith backend + Next.js frontend
- Tenancy pattern: shared DB, tenant scope via URL and DB foreign keys (`tenant_id` on business tables)
- API style: REST JSON under `/api/v1`
- Backend modular domains:
  - identity/auth
  - tenancy/RBAC
  - documents + ingestion pipeline
  - retrieval + conversations
  - audit/observability
- Async processing:
  - upload request writes `Document`, `DocumentVersion`, `DocumentProcessingJob`
  - Celery task handles parse -> chunk -> embed -> store vectors
- RAG runtime:
  1. embed question
  2. pgvector cosine similarity search
  3. build bounded context
  4. call provider (Gemini preferred if key present, else OpenAI, else dev mock)
  5. return answer + citations, write `QueryLog`
- Cross-cutting patterns:
  - custom API error envelope via DRF exception handler
  - request correlation id middleware
  - scoped DRF throttle rates (`login`, `register`, `chat`, `upload`)
  - soft-delete mixin on selected domain models

Key files:
- `backend/config/settings/base.py`
- `backend/apps/core/middleware.py`
- `backend/apps/core/exceptions.py`
- `backend/apps/ingestion/tasks.py`
- `backend/apps/retrieval/infrastructure/rag_pipeline.py`
- `backend/apps/retrieval/infrastructure/vector_search.py`

## 5. Database Schema
ORM: Django ORM, migration files in each app under `migrations/0001_initial.py`.

### Core identity/tenant
- `users` (`identity_access.User`)
  - UUID PK, unique email, full_name, flags (`is_active`, `is_staff`, `is_superuser`)
- `tenants` (`tenancy.Tenant`)
  - UUID PK, unique `slug`, `status`
- `tenant_memberships` (`tenancy.TenantMembership`)
  - FK tenant + user, role + status, unique `(tenant,user)`
- `knowledge_spaces` (`tenancy.KnowledgeSpace`)
  - FK tenant, `slug`, optional created_by, soft delete
  - unique `(tenant,slug)`

### Documents + ingestion
- `documents` (`documents.Document`)
  - FK tenant, knowledge_space, created_by
  - status in `{queued,processing,indexed,failed}`
  - soft delete support
- `document_versions` (`documents.DocumentVersion`)
  - FK document
  - file metadata, indexing_status, versioning
  - unique `(document,version_number)`
- `document_processing_jobs` (`documents.DocumentProcessingJob`)
  - FK document_version
  - job type/status/start/end/error/metadata
- `document_chunks` (`ingestion.DocumentChunk`)
  - FK document_version, tenant, knowledge_space
  - chunk index/content/token_count/page
  - `embedding` vector dim 1536
  - unique `(document_version,chunk_index)`
  - index `(tenant,knowledge_space)`

### Retrieval + conversations + audit
- `query_logs` (`retrieval.QueryLog`)
  - FK tenant, optional user/space
  - question/answer/status/model/tokens/latency/chunks_used
- `conversations` (`conversations.Conversation`)
  - FK tenant, user, optional knowledge_space, status active/archived
- `messages` (`conversations.Message`)
  - FK conversation, role user/assistant/system, content/model/tokens/latency
- `message_citations` (`conversations.MessageCitation`)
  - FK message, optional FK chunk, citation metadata (doc/page/similarity/excerpt)
- `audit_logs` (`audit_observability.AuditLog`)
  - optional FK tenant/user
  - action/resource/details/request metadata
  - indexes on tenant/user action and created_at

DB extension bootstrap:
- `infra/docker/init-db.sql` enables `vector` and `uuid-ossp`.

## 6. Authentication & Authorization
### Authentication
- Strategy: JWT bearer tokens via SimpleJWT
- Login/register return both access + refresh token
- Refresh rotation enabled (`ROTATE_REFRESH_TOKENS=True`, blacklist enabled)
- Logout endpoint blacklists refresh token
- Frontend currently stores tokens in `localStorage` (`access_token`, `refresh_token`)

Backend files:
- `backend/apps/identity_access/api/views.py`
- `backend/config/settings/base.py` (`SIMPLE_JWT`)

Frontend files:
- `frontend/src/hooks/useAuth.tsx`
- `frontend/src/services/auth.service.ts`

### Authorization
- Tenant-scoped role model:
  - `owner`, `admin`, `manager`, `member`
- Generic permission classes:
  - `IsTenantMember`
  - `IsTenantAdmin` (owner/admin)
  - `IsTenantManager` (owner/admin/manager)
- Additional inline checks in view methods for specific actions (invite, delete, create space, upload)
- Platform admin endpoints require `request.user.is_superuser`

Files:
- `backend/apps/core/constants.py`
- `backend/apps/core/permissions.py`
- `backend/apps/tenancy/api/views.py`
- `backend/apps/documents/api/views.py`
- `backend/apps/retrieval/api/admin_views.py`

## 7. API Reference
Base prefix: `/api/v1`

| Method | Path | Purpose | Auth required |
|---|---|---|---|
| GET | `/api/v1/health/` | Health check | No |
| POST | `/api/v1/auth/login/` | Login, issue JWT | No |
| POST | `/api/v1/auth/register/` | Register account | No |
| POST | `/api/v1/auth/refresh/` | Rotate refresh/access | No |
| POST | `/api/v1/auth/logout/` | Blacklist refresh token | Yes |
| GET | `/api/v1/auth/me/` | Current user profile | Yes |
| PATCH | `/api/v1/auth/me/` | Update current profile | Yes |
| POST | `/api/v1/auth/change-password/` | Change password | Yes |
| GET | `/api/v1/tenants/` | List current user tenant memberships | Yes |
| POST | `/api/v1/tenants/` | Create tenant (+ owner membership + default space) | Yes |
| GET | `/api/v1/tenants/{tenant_id}/` | Tenant detail | Yes + tenant member |
| GET | `/api/v1/tenants/{tenant_id}/summary/` | Dashboard counters | Yes + tenant member |
| GET | `/api/v1/tenants/{tenant_id}/me/permissions/` | Computed tenant permissions | Yes + tenant member |
| GET | `/api/v1/tenants/{tenant_id}/members/` | List members | Yes + tenant member |
| POST | `/api/v1/tenants/{tenant_id}/members/` | Invite member | Yes + admin/owner |
| PATCH | `/api/v1/tenants/{tenant_id}/members/{member_id}/` | Change member role | Yes + admin/owner |
| DELETE | `/api/v1/tenants/{tenant_id}/members/{member_id}/` | Remove member | Yes + admin/owner |
| GET | `/api/v1/tenants/{tenant_id}/spaces/` | List knowledge spaces | Yes + tenant member |
| POST | `/api/v1/tenants/{tenant_id}/spaces/` | Create knowledge space | Yes + manager+ |
| GET | `/api/v1/tenants/{tenant_id}/documents/` | List documents (filters: `space_id`,`search`,`status`) | Yes + tenant member |
| POST | `/api/v1/tenants/{tenant_id}/documents/` | Upload document and dispatch ingestion | Yes + manager+ |
| GET | `/api/v1/tenants/{tenant_id}/documents/{document_id}/` | Document detail | Yes + tenant member |
| DELETE | `/api/v1/tenants/{tenant_id}/documents/{document_id}/` | Soft-delete document | Yes + manager+ |
| GET | `/api/v1/tenants/{tenant_id}/documents/{document_id}/status/` | Processing status/jobs | Yes + tenant member |
| POST | `/api/v1/tenants/{tenant_id}/chat/ask/` | One-shot RAG ask | Yes + tenant member |
| GET | `/api/v1/tenants/{tenant_id}/conversations/` | List active conversations | Yes + tenant member |
| POST | `/api/v1/tenants/{tenant_id}/conversations/` | Create conversation + first QA | Yes + tenant member |
| GET | `/api/v1/tenants/{tenant_id}/conversations/{conversation_id}/` | Conversation detail with messages/citations | Yes + owner conversation |
| DELETE | `/api/v1/tenants/{tenant_id}/conversations/{conversation_id}/` | Archive conversation | Yes + owner conversation |
| POST | `/api/v1/tenants/{tenant_id}/conversations/{conversation_id}/messages/` | Follow-up question + assistant response | Yes + owner conversation |
| GET | `/api/v1/admin/stats/` | Platform stats | Yes + superuser |
| GET | `/api/v1/admin/queries/recent/` | Recent cross-tenant queries/messages | Yes + superuser |

Rate limiting:
- `login: 5/min`
- `register: 3/min`
- `chat: 20/min`
- `upload: 10/min`

Source files:
- `backend/config/urls.py`
- `backend/apps/*/api/urls.py`
- `backend/config/settings/base.py`

## 8. Environment Variables
Only names are documented here (no secret values).

| Variable | Description | Required | Example format |
|---|---|---|---|
| `DATABASE_URL` | Django DB connection string | Yes | `postgres://user:pass@host:5432/db` |
| `REDIS_URL` | Redis base URL | Yes (for queue/cache flows) | `redis://localhost:6379/0` |
| `SECRET_KEY` | Django secret key | Yes | long random string |
| `DEBUG` | Django debug mode | Yes | `True` / `False` |
| `ALLOWED_HOSTS` | Allowed hostnames | Yes | `localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | Frontend origins | Yes | `http://localhost:3000` |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | Access token duration | Optional | `30` |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | Refresh token duration | Optional | `7` |
| `STORAGE_BACKEND` | Storage mode | Yes | `local` or `s3` |
| `STORAGE_LOCAL_PATH` | Local storage path | Required for local mode | `./media/documents` |
| `AWS_ACCESS_KEY_ID` | S3/R2 access key | Required for s3 mode | key-like string |
| `AWS_SECRET_ACCESS_KEY` | S3/R2 secret | Required for s3 mode | secret-like string |
| `AWS_STORAGE_BUCKET_NAME` | S3/R2 bucket name | Required for s3 mode | `docpilot-bucket` |
| `AWS_S3_ENDPOINT_URL` | S3-compatible endpoint | Optional/required by provider | `https://<account>.r2.cloudflarestorage.com` |
| `AWS_S3_REGION_NAME` | S3 region | Optional | `auto` |
| `OPENAI_API_KEY` | OpenAI key for embeddings/generation | Optional if Gemini used | `sk-...` |
| `GEMINI_API_KEY` | Gemini key for generation (preferred if set) | Optional | non-empty string |
| `CELERY_BROKER_URL` | Celery broker URL | Yes for ingestion workers | `redis://localhost:6379/1` |
| `CELERY_RESULT_BACKEND` | Celery result backend URL | Yes for async jobs | `redis://localhost:6379/2` |
| `SENTRY_DSN` | Sentry DSN | Optional | URL-like DSN |
| `NEXT_PUBLIC_API_URL` | Frontend backend API base | Yes | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_SENTRY_DSN` | Frontend Sentry DSN | Optional | DSN string |
| `NEXT_PUBLIC_APP_NAME` | App display name | Optional | `DocPilot AI` |

Env files:
- `backend/.env.example`
- `frontend/.env.local.example`

## 9. Commands Reference
### Root / infrastructure
| Command | Purpose |
|---|---|
| `docker compose up -d` | Start local PostgreSQL + Redis services |
| `docker compose up -d postgres redis` | Start only DB and Redis services |

### Backend
| Command | Purpose |
|---|---|
| `cd backend` | Enter backend project |
| `python -m venv venv` | Create virtual environment |
| `venv\\Scripts\\activate` | Activate venv (Windows) |
| `pip install -r requirements/dev.txt` | Install backend + dev dependencies |
| `python manage.py migrate` | Apply DB migrations |
| `python manage.py runserver` | Start Django API server |
| `python manage.py createsuperuser` | Create platform admin user |
| `python manage.py process_documents` | Run ingestion management command |
| `python manage.py seed_dev` | Seed development data (if command registered) |
| `celery -A workers.celery_app worker --loglevel=info` | Start Celery worker |
| `celery -A workers.celery_app beat --loglevel=info` | Start Celery beat scheduler |
| `python run_tests.py` | Run selected tenancy tests |
| `python scripts/smoke_test.py` | Smoke-check API health endpoint |
| `python scripts/seed_dev.py` | Seed admin + demo tenant directly via script |

### Frontend
| Command | Purpose |
|---|---|
| `cd frontend` | Enter frontend project |
| `npm install` | Install frontend dependencies |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build production bundle |
| `npm run start` | Run built app |
| `npm run lint` | Run Next lint |

Script sources:
- `README.md`
- `docs/RUNBOOK_SETUP.md`
- `frontend/package.json`
- `backend/run_tests.py`

## 10. ✅ What's Already Done
Implemented capabilities with concrete code locations:

1. JWT authentication + user profile flows  
   - `backend/apps/identity_access/api/views.py`
   - `backend/apps/identity_access/api/serializers.py`
   - `frontend/src/services/auth.service.ts`
   - `frontend/src/hooks/useAuth.tsx`

2. Multi-tenant model + membership RBAC  
   - `backend/apps/tenancy/models.py`
   - `backend/apps/core/permissions.py`
   - `backend/apps/tenancy/api/views.py`

3. Tenant operations and default space bootstrap  
   - tenant creation auto-creates owner membership and `general` space  
   - `backend/apps/tenancy/api/views.py`

4. Knowledge spaces listing/creation  
   - `backend/apps/tenancy/api/views.py`
   - `frontend/src/app/(dashboard)/espaces/page.tsx`

5. Document upload/list/detail/delete/status endpoints  
   - `backend/apps/documents/api/views.py`
   - `backend/apps/documents/models.py`
   - `frontend/src/app/(dashboard)/documents/page.tsx`

6. Storage abstraction local + S3-compatible backend  
   - `backend/apps/documents/infrastructure/storage.py`

7. Async ingestion pipeline with Celery  
   - parse/chunk/embed/store and status updates  
   - `backend/apps/ingestion/tasks.py`
   - `backend/apps/ingestion/infrastructure/*`

8. Vector retrieval + RAG response with citations  
   - `backend/apps/retrieval/infrastructure/vector_search.py`
   - `backend/apps/retrieval/infrastructure/rag_pipeline.py`
   - `backend/apps/retrieval/api/views.py`

9. Conversation persistence with citation links  
   - `backend/apps/conversations/models.py`
   - `backend/apps/conversations/api/views.py`
   - `frontend/src/app/(dashboard)/chat/page.tsx`

10. Audit and observability base  
   - request id middleware + structured errors + audit logs + query logs  
   - `backend/apps/core/middleware.py`
   - `backend/apps/core/exceptions.py`
   - `backend/apps/audit_observability/models.py`
   - `backend/apps/audit_observability/services.py`

11. Platform admin API and UI shell  
   - `backend/apps/retrieval/api/admin_views.py`
   - `frontend/src/app/admin/layout.tsx`
   - `frontend/src/app/admin/dashboard/page.tsx`

12. Tenant isolation and permission tests (with caveats, see issues)  
   - `backend/tests/test_permissions.py`
   - `backend/tests/test_isolation.py`
   - duplicated under `backend/apps/tenancy/tests/*`

## 11. 🚧 Work In Progress
Partially implemented or inconsistent areas:

1. Knowledge space deletion flow mismatch
- Frontend calls `DELETE /tenants/{tenant_id}/spaces/{space_id}/`
- Backend only defines `/spaces/` GET/POST
- Files:
  - `frontend/src/services/tenant.service.ts`
  - `backend/apps/tenancy/api/urls.py`

2. Document download UI points to non-existent API route
- UI opens `/api/v1/tenants/{tenant}/knowledge-spaces/{space}/documents/{doc}/download/`
- No backend URL/view exists for download endpoint
- File:
  - `frontend/src/app/(dashboard)/documents/page.tsx`

3. Admin area navigation is ahead of implementation
- Layout links to `/admin/tenants`, `/admin/users`, `/admin/settings`
- Corresponding pages do not exist in `frontend/src/app/admin/*`
- File:
  - `frontend/src/app/admin/layout.tsx`

4. Admin dashboard activity section is placeholder-only visual content
- Static mock rows, not wired to API data
- File:
  - `frontend/src/app/admin/dashboard/page.tsx`

5. Deployment docs vs repo configs drift
- Docs claim GitHub Actions + Render/Vercel pipeline
- Repository has no `.github/workflows` or deploy manifests at this time
- Files:
  - `docs/ROADMAP.md`
  - `docs/PROJECT_BRIEF.md`

## 12. 📋 Roadmap — What's Next
Prioritized next steps based on code state + documented roadmap:

1. Fix broken auth UI contract
- Accept criteria:
  - login page checks `res.ok` instead of `res.success`
  - failed login shows backend error cleanly
- Files:
  - `frontend/src/app/(auth)/login/page.tsx`
  - `frontend/src/hooks/useAuth.tsx`

2. Normalize document status contract across FE/BE
- Accept criteria:
  - frontend maps backend statuses `{queued,processing,indexed,failed}` correctly
  - no fallback mislabeling
- Files:
  - `backend/apps/core/constants.py`
  - `frontend/src/app/(dashboard)/documents/page.tsx`

3. Implement missing knowledge space deletion endpoint (or remove FE action)
- Accept criteria:
  - endpoint exists and is secured (admin/owner)
  - deletion strategy documented (soft delete/cascade)
  - FE action works end-to-end
- Files:
  - `backend/apps/tenancy/api/urls.py`
  - `backend/apps/tenancy/api/views.py`
  - `frontend/src/services/tenant.service.ts`

4. Implement document download endpoint (or remove download button)
- Accept criteria:
  - URL path is defined and validated for tenant ownership
  - file stream/redirect works
- Files:
  - `backend/apps/documents/api/urls.py`
  - `backend/apps/documents/api/views.py`
  - `frontend/src/app/(dashboard)/documents/page.tsx`

5. Fix admin recent queries bug
- Accept criteria:
  - use `QueryLog.model_name` instead of non-existent `model_used`
  - endpoint returns valid payload
- Files:
  - `backend/apps/retrieval/api/admin_views.py`
  - `backend/apps/retrieval/models.py`

6. Repair backend tests to match current models/constants
- Accept criteria:
  - create `Tenant` with required `slug`
  - use valid `DocumentStatus` values
  - URL name assumptions corrected
- Files:
  - `backend/tests/test_permissions.py`
  - `backend/tests/test_isolation.py`
  - `backend/apps/tenancy/tests/*`

7. Align token storage security decision
- Accept criteria:
  - explicit team decision: localStorage vs httpOnly cookie
  - implementation + docs aligned
- Files:
  - `docs/DECISIONS.md`
  - `frontend/src/hooks/useAuth.tsx`

8. Add real CI/CD manifests or update docs to avoid drift
- Accept criteria:
  - either working workflow files added, or docs updated with current reality
- Files:
  - `.github/workflows/*` (missing today)
  - docs under `docs/`

## 13. ⚠️ Known Issues
No inline `TODO`, `FIXME`, or `HACK` tags were found via repository search, but the following concrete issues exist:

1. Login page uses wrong return property
- `if (!res.success)` should use `res.ok`
- File: `frontend/src/app/(auth)/login/page.tsx`

2. Document status mismatch between frontend and backend enum values
- FE expects `pending/completed`; BE uses `queued/indexed`
- Files:
  - `frontend/src/app/(dashboard)/documents/page.tsx`
  - `backend/apps/core/constants.py`

3. Admin recent query endpoint references non-existent model field
- Uses `query.model_used` but model field is `model_name`
- Files:
  - `backend/apps/retrieval/api/admin_views.py`
  - `backend/apps/retrieval/models.py`

4. Tests reference invalid constants and incomplete model construction
- `DocumentStatus.AVAILABLE` does not exist
- `Tenant.objects.create(name=...)` misses required unique `slug`
- Files:
  - `backend/tests/test_isolation.py`
  - `backend/tests/test_permissions.py`

5. Frontend actions call missing backend routes
- space deletion and document download paths do not exist server-side
- Files:
  - `frontend/src/services/tenant.service.ts`
  - `frontend/src/app/(dashboard)/documents/page.tsx`
  - `backend/apps/tenancy/api/urls.py`
  - `backend/apps/documents/api/urls.py`

6. `.gitignore` currently excludes `docs/` while docs are project-critical
- risk: doc updates not tracked consistently
- File: `.gitignore`

## 14. 💡 Conventions & Code Style
- Python:
  - Black/isort/Ruff configured in `backend/pyproject.toml`
  - line length 120
  - Django module-per-domain structure under `backend/apps/*`
- TypeScript/Frontend:
  - strict TS config in `frontend/tsconfig.json`
  - app router conventions in `frontend/src/app/*`
  - alias import style `@/*` for `src/*`
- Formatting:
  - `.editorconfig` with 4-space Python, 2-space JS/TS/CSS/JSON/YAML
- API conventions:
  - prefix `/api/v1`
  - tenant in path
  - JSON response/error structures
- Git conventions (documented):
  - branch naming: `feature/*`, `fix/*`, `chore/*`
  - conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)

Files:
- `backend/pyproject.toml`
- `.editorconfig`
- `README.md`
- `frontend/tsconfig.json`

## 15. 🧠 Gotchas & Important Decisions
1. AI provider selection is dynamic and prioritized
- runtime order is Gemini key -> OpenAI key -> dev mock
- this can change model outputs/cost behavior silently by env
- File: `backend/apps/retrieval/infrastructure/rag_pipeline.py`

2. Token storage implementation differs from decision log
- docs indicate pending/preferred httpOnly cookie strategy
- production code currently uses `localStorage`
- Files:
  - `docs/DECISIONS.md`
  - `frontend/src/hooks/useAuth.tsx`

3. Frontend routes are French-slugged for key pages
- `/membres` and `/espaces` are canonical URLs
- avoid accidental rename without nav updates
- Files:
  - `frontend/src/app/(dashboard)/membres/page.tsx`
  - `frontend/src/app/(dashboard)/espaces/page.tsx`

4. Admin stats combine two data sources for query counts
- counts aggregate `QueryLog` plus user messages from conversations
- can double-count conceptual "questions" if both systems used
- File: `backend/apps/retrieval/api/admin_views.py`

5. Soft delete is not universal
- some models use soft-delete managers while others are hard-delete
- enforce caution in cleanup and analytics queries
- Files:
  - `backend/apps/core/models.py`
  - `backend/apps/tenancy/models.py`
  - `backend/apps/documents/models.py`

## 16. Business Rules
Implemented and inferred rules from code:

### Tenant and role rules
- Every tenant creator becomes `owner`
- Default knowledge space (`general`) is auto-created per new tenant
- `owner` role cannot be reassigned or removed via member management endpoints
- Members cannot remove themselves through member removal endpoint

Files:
- `backend/apps/tenancy/api/views.py`

### Permission capabilities
- `member`: read/list/query only
- `manager`: document upload/delete + space creation + admin-like dashboard access
- `admin/owner`: member lifecycle management
- `superuser` only: platform admin endpoints

Files:
- `backend/apps/core/constants.py`
- `backend/apps/core/permissions.py`
- `backend/apps/retrieval/api/admin_views.py`

### Document processing lifecycle
- Upload starts with `queued`
- async worker moves through `processing` to `indexed` or `failed`
- chunk embeddings stored per document version

Files:
- `backend/apps/documents/api/views.py`
- `backend/apps/ingestion/tasks.py`

### RAG response behavior
- if no chunks retrieved: explicit no-answer response
- citations returned with metadata and excerpt
- query telemetry persisted (`tokens`, `latency`, status)

Files:
- `backend/apps/retrieval/infrastructure/rag_pipeline.py`
- `backend/apps/retrieval/api/views.py`

### Quotas/pricing/business limits
- No explicit billing tiers or hard quotas implemented in executable code
- Throttling exists as request-rate control (not billing quota)
- Pending doc-level product decisions listed in `docs/DECISIONS.md`

## 17. Deployment
Current repository deployment state:

- Local development infra is fully defined:
  - `docker-compose.yml` for postgres + redis
  - `infra/docker/init-db.sql` DB extensions
- Environment splits exist in Django:
  - `backend/config/settings/dev.py`
  - `backend/config/settings/staging.py`
  - `backend/config/settings/prod.py`
- Documented target platforms (not implemented in repo manifests):
  - backend/worker on Render
  - frontend on Vercel
  - documented in `docs/PROJECT_BRIEF.md` and `docs/ROADMAP.md`
- CI/CD configuration files are currently absent:
  - no `.github/workflows/*` found
  - no checked-in Dockerfiles for app services

Branching/development:
- active branch from audit: `main`
- remote branch: `origin/main`
- conventions documented in `README.md`

Recent git context (captured during audit):
- `git log --oneline -50` reviewed for feature history cadence
- `git branch -a` reviewed for branch topology

## 18. External Services & Integrations
### OpenAI
- Usage: embeddings + LLM fallback path
- Config: `OPENAI_API_KEY`
- Code:
  - `backend/apps/ingestion/infrastructure/embeddings/embedding_service.py`
  - `backend/apps/retrieval/infrastructure/rag_pipeline.py`
- Docs: [OpenAI API docs](https://platform.openai.com/docs)

### Google Gemini
- Usage: preferred generation provider when key exists
- Config: `GEMINI_API_KEY`
- Code: `backend/apps/retrieval/infrastructure/rag_pipeline.py`
- Docs: [Gemini API docs](https://ai.google.dev/gemini-api/docs)

### PostgreSQL + pgvector
- Usage: relational store + vector similarity
- Config: `DATABASE_URL`
- Code:
  - `backend/apps/ingestion/models.py`
  - `backend/apps/retrieval/infrastructure/vector_search.py`
- Docs: [pgvector](https://github.com/pgvector/pgvector)

### Redis + Celery
- Usage: async processing queue and result backend
- Config: `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`
- Code:
  - `backend/workers/celery_app.py`
  - `backend/apps/ingestion/tasks.py`
- Docs: [Celery docs](https://docs.celeryq.dev), [Redis docs](https://redis.io/docs)

### S3-compatible object storage (R2-style)
- Usage: file storage adapter
- Config: `STORAGE_BACKEND` + `AWS_*`
- Code: `backend/apps/documents/infrastructure/storage.py`
- Docs: [Boto3 docs](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)

### Sentry
- Usage: exception/performance monitoring for Django/Celery (+ frontend DSN env available)
- Config: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`
- Code: `backend/config/settings/base.py`
- Docs: [Sentry docs](https://docs.sentry.io/)
