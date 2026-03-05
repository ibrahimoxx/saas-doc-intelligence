# DocPilot AI — Architecture Decisions (ADR Log)

> Lightweight ADR (Architecture Decision Records) — updated as decisions are made or revised.

---

## ADR-001: Modular Monolith Architecture

- **Date**: 2026-03-05
- **Status**: ✅ Accepted
- **Context**: Solo dev, MVP phase, need speed + cohesion
- **Decision**: Modular Monolith with extractible modules
- **Rationale**: Simpler ops, less coordination debt, allows future extraction (ingestion worker, AI/RAG service)
- **Alternatives rejected**: Microservices (too complex), FastAPI (less structured than Django)

---

## ADR-002: Multi-tenant Strategy — Shared DB + tenant_id

- **Date**: 2026-03-05
- **Status**: ✅ Accepted
- **Context**: MVP/Beta phase, single database affordable
- **Decision**: Shared DB with `tenant_id` on all business tables
- **Rationale**: Simple dev/ops, low infra cost, sufficient for MVP/Beta
- **Migration path**: Schema-per-tenant or DB-per-tenant for enterprise clients (V3+)

---

## ADR-003: Authentication — JWT Access + Refresh

- **Date**: 2026-03-05
- **Status**: ✅ Accepted
- **Context**: SPA (Next.js) + DRF backend
- **Decision**: JWT access token (short-lived) + refresh token (rotation)
- **Storage**: `httpOnly` cookie for refresh token recommended
- **Library**: `djangorestframework-simplejwt`

---

## ADR-004: Tenant Context in API

- **Date**: 2026-03-05
- **Status**: ✅ Accepted
- **Decision**: Tenant ID in URL path (`/api/v1/tenants/{tenant_id}/...`)
- **Rationale**: More explicit, safer for debug/audit, standard SaaS pattern
- **Alternative considered**: `X-Tenant-Id` header (kept as internal option)

---

## ADR-005: Storage Strategy

- **Date**: 2026-03-05
- **Status**: ✅ Accepted
- **Decision**: Local filesystem in dev, Cloudflare R2 (S3-compatible) in staging/prod
- **Rationale**: R2 is cost-effective (no egress fees), S3-compatible API
- **Interface**: Abstract storage adapter (swap implementations)

---

## ADR-006: LLM/Embeddings Provider

- **Date**: 2026-03-05
- **Status**: ✅ Accepted
- **Decision**: OpenAI as default provider (GPT + embeddings)
- **Rationale**: Best quality/speed ratio, good Python ecosystem
- **Design**: Provider abstraction layer to allow swapping
- **Budget**: To be confirmed by user

---

## ADR-007: Vector Store — pgvector

- **Date**: 2026-03-05
- **Status**: ✅ Accepted
- **Decision**: PostgreSQL + pgvector extension
- **Rationale**: Single database, no extra service, good enough for MVP scale
- **Alternative for later**: Dedicated vector DB (Qdrant, Pinecone) if scale demands

---

## ADR-008: Async Jobs — Celery + Redis

- **Date**: 2026-03-05
- **Status**: ✅ Accepted
- **Decision**: Celery with Redis as broker/backend
- **Use cases**: Document parsing, chunking, embeddings, reindexing
- **Rationale**: Django ecosystem standard, well-documented

---

## ADR-009: Frontend Framework — Next.js + TypeScript + Tailwind

- **Date**: 2026-03-05
- **Status**: ✅ Accepted
- **Decision**: Next.js App Router + TypeScript + Tailwind CSS
- **Rationale**: User is advanced in Next.js/TS, good DX, SSR capabilities

---

## ADR-010: UI Language — French Default

- **Date**: 2026-03-05
- **Status**: ✅ Accepted
- **Decision**: French as default UI language
- **AI responses**: Same language as question (French default)
- **i18n preparation**: Not required for MVP, but code should not hardcode strings excessively

---

## ADR-011: RBAC Roles (V1)

- **Date**: 2026-03-05
- **Status**: ✅ Accepted
- **Roles**: `owner`, `admin`, `manager`, `member`
- **Scope**: Tenant-level (not resource-level in V1)
- **Permissions matrix**:
  - Owner/Admin: full access
  - Manager: upload + admin stats + chat
  - Member: chat + read documents

---

## ADR-012: Document Format — PDF Only (MVP)

- **Date**: 2026-03-05
- **Status**: ✅ Accepted
- **Decision**: PDF only for MVP
- **DOCX**: V2 (placeholder parser created)
- **OCR**: V2+ feature

---

## ADR-013: Deployment Strategy

- **Date**: 2026-03-05
- **Status**: ✅ Accepted
- **Backend + Worker**: Render
- **Frontend**: Vercel (preferred) or Render fallback
- **DB**: Managed PostgreSQL (Render or external)
- **CI/CD**: GitHub Actions
