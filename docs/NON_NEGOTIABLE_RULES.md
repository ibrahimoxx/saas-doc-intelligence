# DocPilot AI — Non-Negotiable Rules

> These rules are **binding** throughout the entire project lifecycle.  
> Any change requires **explicit user validation** + documented justification.

## Architecture

1. **Modular Monolith** — no microservices until proven bottleneck
2. **Shared DB + `tenant_id`** — all business tables carry `tenant_id`
3. **tenant isolation centralized** — not ad-hoc per query
4. **Domain / Application / Infrastructure** separation per module
5. **API versioning** from day 1 (`/api/v1/...`)

## Product

6. Product is **multi-sector SaaS** from day 1 (architecture, data, modules, UI, permissions)
7. Cabinet médical/dentaire = **launch wedge only**, not a product limitation
8. **MVP scope is frozen** — no scope creep (OCR/SSO/billing/connectors are V2+)

## Security

9. **RBAC tenant-scoped** on every endpoint
10. **Deny-by-default** for RAG (no answer if context insufficient)
11. **Audit logs** on all sensitive actions
12. **Rate limiting** on login/chat/upload
13. **Input validation** — backend is source of truth
14. **Secrets** never in code — `.env` in dev, secret manager in prod
15. Upload validation: type, size, mime check

## Execution Process

16. **No phase transition without user validation**
17. Checkpoint format must be followed when user intervention needed
18. **Update docs files** after each significant step
19. **Re-read reference docs** before starting new phase
20. No silent strategy changes

## Code Quality

21. `views.py` = HTTP only, no heavy business logic
22. Business logic in `application/services.py`
23. No cross-module wild imports — use application services
24. Every business table: `id` (UUID), `tenant_id`, `created_at`, `updated_at`
25. Soft delete where appropriate (`deleted_at`)
26. Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
27. Tests: tenant isolation, authorization, upload transitions, RAG ask+citations
