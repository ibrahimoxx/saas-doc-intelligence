# DocPilot AI — Roadmap

## Milestones

| ID | Milestone | Target | Dependencies |
|----|-----------|--------|-------------|
| M1 | Foundation Secure Multi-tenant | Week 2 | — |
| M2 | Document Pipeline Operational | Week 4 | M1 |
| M3 | RAG with Citations Working | Week 6 | M2 |
| M4 | Beta Ready (security + monitoring + QA) | Week 8 | M3 |
| M5 | Launch Ready | Week 10-12 | M4 |
| M6 | First Pilot Customer Onboarded | Week 12-16 | M5 |

---

## Phase 1 — Discovery + Foundation (Weeks 1-2)

### Week 1: Discovery + Decisions + Bootstrap
- Discovery: vision, personas, MVP scope, decisions
- Monorepo init: `backend/`, `frontend/`, `infra/`, `docs/`
- Django project + settings (base/dev/staging/prod)
- Next.js project + TypeScript + Tailwind
- Docker compose (PostgreSQL + Redis)
- CI/CD baseline (GitHub Actions)

### Week 2: Auth + Tenancy + Frontend Shell
- Custom User model
- JWT auth (login/refresh/me)
- Tenant + TenantMembership + KnowledgeSpace models
- RBAC tenant-scoped permissions
- Seed dev data
- Frontend: login page + dashboard shell + tenant selector

**➜ Milestone M1: Foundation Secure Multi-tenant**

---

## Phase 2 — Documents + Audit (Weeks 3-4)

### Week 3: Documents Module
- Document + DocumentVersion + ProcessingJob models
- Upload endpoint + validation (PDF/type/size)
- Storage adapter (local + S3/R2 interface)
- List/delete/status endpoints
- Documents API tests

### Week 4: Audit + Frontend Documents
- AuditLog model + `log_action()` service
- RequestId middleware
- Wire audit into auth + document actions
- Frontend: Documents page (upload + table + badges)

**➜ Milestone M2: Document Pipeline Operational**

---

## Phase 3 — Ingestion + RAG (Weeks 5-6)

### Week 5: Ingestion Pipeline
- Celery + Redis setup
- PDF parser + chunking service
- pgvector setup + embeddings integration
- Async pipeline: upload → processing → indexed
- Retry/failure handling

### Week 6: RAG + Citations
- Retrieval service (similarity search)
- Prompt template system
- LLM provider abstraction
- `/chat/ask` endpoint + citations
- Fallback no-answer + QueryLog

**➜ Milestone M3: RAG with Citations Working**

---

## Phase 4 — Conversations + Admin + Hardening (Weeks 7-8)

### Week 7: Conversations + Admin
- Conversation + Message models + CRUD
- Chat UI (messages + citations)
- Admin stats + recent queries endpoints
- Admin dashboard UI

### Week 8: Hardening + QA
- Rate limiting (login/chat/upload)
- Sentry integration
- Structured logging + request_id
- Tenant isolation tests
- UI polish (loading/empty/error states)
- Smoke tests + QA

**➜ Milestone M4: Beta Ready**

---

## Phase 5 — Deploy + Launch Prep (Weeks 9-10)

### Week 9: Staging Deploy
- Docker production config
- Staging deploy (Render + Vercel)
- Backup strategy + health checks

### Week 10: Production + Onboarding
- Prod deploy + verification
- README + architecture docs
- Onboarding demo tenant
- KPIs setup

**➜ Milestone M5: Launch Ready**

---

## Hors scope MVP (V2+)

- OCR PDF scannés
- DOCX support
- Permissions fines par collection
- Feedback qualité
- Analytics avancés
- API keys / webhooks
- SSO/SAML
- Billing
- Connecteurs cloud
- Hybrid search / reranking
