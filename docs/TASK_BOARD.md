# DocPilot AI — Task Board

> Updated: 2026-03-05 | Phase: 0 (Discovery/Extraction)

## Status Legend
- 🔲 Not started
- 🔵 In progress
- ✅ Done
- ⛔ Blocked
- 👤 Requires user action

---

## Epic 0 — Discovery + Extraction + Plan

| Task | Owner | Status | Depends on | Done Criteria |
|------|-------|--------|-----------|---------------|
| Read & consolidate 3 reference messages | Antigravity | 🔵 | — | MASTER_CONTEXT.md complete |
| Create docs reference files | Antigravity | 🔵 | — | All docs/*.md created |
| Extract explicit decisions | Antigravity | 🔵 | — | ARCHITECTURE_DECISIONS.md complete |
| List missing hypotheses | Antigravity | 🔵 | — | Decision checklist generated |
| Generate Execution Plan v1 | Antigravity | 🔲 | All above | implementation_plan.md ready |
| User validates Checkpoint 0 | User | 👤 | Execution Plan | User confirms decisions |

---

## Epic 1 — Foundation (repo, envs, bootstrap)

| Task | Owner | Status | Depends on | Done Criteria |
|------|-------|--------|-----------|---------------|
| Init monorepo structure | Antigravity | 🔲 | Epic 0 validated | Dirs created, .gitignore, README |
| Django project init + settings | Antigravity | 🔲 | Monorepo | `manage.py runserver` works |
| Core module (base models, middleware) | Antigravity | 🔲 | Django init | BaseModel, RequestIdMiddleware |
| Next.js project init | Antigravity | 🔲 | Monorepo | `npm run dev` works |
| Docker compose (PG + Redis) | Antigravity | 🔲 | Monorepo | `docker compose up` works |
| `.env.example` files | Antigravity | 🔲 | Django + Next.js init | Both .env.example created |
| GitHub repo creation | User | 👤 | Monorepo | Repo exists, first push done |
| CI baseline (GitHub Actions) | Antigravity | 🔲 | GitHub repo | Lint + test pipeline runs |

---

## Epic 2 — Identity/Access + Tenancy + RBAC

| Task | Owner | Status | Depends on | Done Criteria |
|------|-------|--------|-----------|---------------|
| Custom User model | Antigravity | 🔲 | Core module | Migration runs, admin works |
| Tenant + TenantMembership models | Antigravity | 🔲 | User model | Migration runs |
| KnowledgeSpace model | Antigravity | 🔲 | Tenant model | Migration runs |
| JWT auth endpoints (login/refresh/me) | Antigravity | 🔲 | User model | API tests pass |
| RBAC permissions (IsTenantMember) | Antigravity | 🔲 | Membership model | Permission checks work |
| Tenant context middleware | Antigravity | 🔲 | Tenant model | request.tenant available |
| Seed dev data script | Antigravity | 🔲 | All models above | 1 user, 1 tenant, 1 membership |
| Frontend: login page | Antigravity | 🔲 | JWT auth API | Login flow works |
| Frontend: dashboard shell + tenant selector | Antigravity | 🔲 | Login page | Protected routes work |
| Auth + tenancy API tests | Antigravity | 🔲 | All above | All tests pass |

---

## Epic 3 — Documents

| Task | Owner | Status | Depends on | Done Criteria |
|------|-------|--------|-----------|---------------|
| Document + DocumentVersion + ProcessingJob models | Antigravity | 🔲 | Epic 2 | Migrations run |
| Storage adapter (local + S3/R2 interface) | Antigravity | 🔲 | Models | Upload saves file |
| Upload endpoint + validation | Antigravity | 🔲 | Storage + models | PDF upload works |
| List/delete/status endpoints | Antigravity | 🔲 | Upload endpoint | CRUD complete |
| Documents API tests | Antigravity | 🔲 | All CRUD | Tenant isolation verified |
| Frontend: Documents page | Antigravity | 🔲 | API complete | Upload + table + badges |

---

## Epic 4 — Audit Baseline

| Task | Owner | Status | Depends on | Done Criteria |
|------|-------|--------|-----------|---------------|
| AuditLog model | Antigravity | 🔲 | Core module | Migration runs |
| `log_action()` service | Antigravity | 🔲 | AuditLog model | Service callable |
| RequestId middleware | Antigravity | 🔲 | Core module | request_id in all logs |
| Wire audit into auth + documents | Antigravity | 🔲 | All above | Audit trail visible |

---

## Epic 5 — Ingestion Async

| Task | Owner | Status | Depends on | Done Criteria |
|------|-------|--------|-----------|---------------|
| Celery + Redis setup | Antigravity | 🔲 | Epic 3 | Worker starts, test task runs |
| PDF parser | Antigravity | 🔲 | Celery setup | Text extracted from PDF |
| Chunking service | Antigravity | 🔲 | Parser | Text split into chunks |
| pgvector extension setup | User/Antigravity | 👤 | PostgreSQL | `CREATE EXTENSION vector` works |
| Embeddings integration (OpenAI) | Antigravity | 🔲 | pgvector + OpenAI key | Embeddings generated + stored |
| DocumentChunk model | Antigravity | 🔲 | pgvector | Migration runs |
| Async pipeline (upload→process→indexed) | Antigravity | 🔲 | All above | End-to-end flow works |
| OpenAI API key setup | User | 👤 | — | Key in .env, API callable |

---

## Epic 6 — Retrieval + RAG

| Task | Owner | Status | Depends on | Done Criteria |
|------|-------|--------|-----------|---------------|
| Vector similarity search | Antigravity | 🔲 | Epic 5 | Top-k results returned |
| Prompt template system | Antigravity | 🔲 | — | Templates versionable |
| LLM provider abstraction | Antigravity | 🔲 | OpenAI key | LLM call works |
| `/chat/ask` endpoint | Antigravity | 🔲 | All above | Q&A returns answer |
| Citations persistence | Antigravity | 🔲 | Chat endpoint | Citations stored + returned |
| Fallback no-answer | Antigravity | 🔲 | Chat endpoint | Handles insufficient context |
| QueryLog + ModelUsageLog | Antigravity | 🔲 | Chat endpoint | Logs created per query |

---

## Epic 7 — Conversations

| Task | Owner | Status | Depends on | Done Criteria |
|------|-------|--------|-----------|---------------|
| Conversation + Message models | Antigravity | 🔲 | Epic 2 | Migration runs |
| Conversations CRUD endpoints | Antigravity | 🔲 | Models | List/create/messages work |
| Frontend: Chat UI | Antigravity | 🔲 | API + Epic 6 | Messages + citations display |

---

## Epic 8 — Admin Stats

| Task | Owner | Status | Depends on | Done Criteria |
|------|-------|--------|-----------|---------------|
| Admin stats endpoint | Antigravity | 🔲 | Epic 6-7 | Stats returned |
| Recent queries endpoint | Antigravity | 🔲 | QueryLog | List returned |
| Frontend: Admin dashboard | Antigravity | 🔲 | API | Cards + lists display |

---

## Epic 9 — Hardening

| Task | Owner | Status | Depends on | Done Criteria |
|------|-------|--------|-----------|---------------|
| Rate limiting | Antigravity | 🔲 | Epic 2-6 | login/chat/upload limited |
| Sentry integration | Antigravity | 🔲 | — | Errors captured |
| Structured logging | Antigravity | 🔲 | — | JSON logs with request_id |
| Tenant isolation tests | Antigravity | 🔲 | Epic 2-3 | Cross-tenant blocked |
| Sentry DSN setup | User | 👤 | Sentry account | DSN in .env |

---

## Epic 10 — Deploy

| Task | Owner | Status | Depends on | Done Criteria |
|------|-------|--------|-----------|---------------|
| Docker production config | Antigravity | 🔲 | All epics | Build works |
| Staging deploy (Render) | User/Antigravity | 👤 | Docker config | App runs on Render |
| Frontend deploy (Vercel) | User/Antigravity | 👤 | Docker config | App runs on Vercel |
| Managed PostgreSQL setup | User | 👤 | — | DB accessible |
| Cloudflare R2 setup | User | 👤 | — | Bucket created |
| Backup strategy | Antigravity | 🔲 | PG managed | Backups scheduled |
| Health checks | Antigravity | 🔲 | Deploy | Health endpoint works |
| Production deploy | User/Antigravity | 👤 | Staging OK | Prod live |
