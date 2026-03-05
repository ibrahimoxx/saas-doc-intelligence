# DocPilot AI — Decisions Log (DECISIONS.md)

> Tracks all decisions made throughout the project with status.

## Decision Format
- **Status**: ✅ Accepted | ⏳ Pending | 🔄 Revised
- **Date**: when decided
- **Owner**: who made the decision

---

## Validated Decisions (from blueprint)

| # | Decision | Status | Date | Notes |
|---|----------|--------|------|-------|
| D1 | Architecture: Modular Monolith | ✅ | 2026-03-05 | No microservices until proven bottleneck |
| D2 | Multi-tenant: Shared DB + tenant_id | ✅ | 2026-03-05 | All business tables |
| D3 | Stack: Next.js + Django/DRF + PG/pgvector + Redis/Celery + R2 | ✅ | 2026-03-05 | |
| D4 | Auth: JWT access + refresh | ✅ | 2026-03-05 | SimpleJWT |
| D5 | Refresh token: httpOnly cookie | ⏳ | 2026-03-05 | Pending user confirmation |
| D6 | Tenant in URL path | ✅ | 2026-03-05 | `/api/v1/tenants/{id}/...` |
| D7 | MVP: PDF only | ✅ | 2026-03-05 | DOCX in V2 |
| D8 | Provider IA: OpenAI | ✅ | 2026-03-05 | With provider abstraction |
| D9 | UI: French default | ✅ | 2026-03-05 | Responses match question language |
| D10 | RBAC: owner/admin/manager/member | ✅ | 2026-03-05 | Tenant-scoped |
| D11 | Storage: local dev → R2 prod | ✅ | 2026-03-05 | Abstract adapter |
| D12 | Deploy: Render + Vercel | ✅ | 2026-03-05 | |
| D13 | Monorepo | ✅ | 2026-03-05 | Single repo |
| D14 | CSS: Tailwind CSS | ✅ | 2026-03-05 | Per blueprint |
| D15 | Product: multi-sector from day 1 | ✅ | 2026-03-05 | Wedge = cabinet/PME |

## Pending Decisions (need user confirmation)

| # | Question | Default recommendation | Status |
|---|----------|----------------------|--------|
| P1 | Python version: 3.13 or 3.11/3.12? | Try 3.13, fallback 3.12 | ⏳ |
| P2 | Refresh token storage (httpOnly cookie vs localStorage) | httpOnly cookie | ⏳ |
| P3 | OpenAI monthly budget limit? | ~$50 dev, TBD prod | ⏳ |
| P4 | Tenant quotas V1 (queries/month, storage MB)? | Soft limits (logged, not enforced) | ⏳ |
| P5 | Knowledge spaces in V1: required or optional? | Default space auto-created per tenant | ⏳ |
| P6 | Tailwind CSS version? | v4 (latest) | ⏳ |
