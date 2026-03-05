# DocPilot AI — Product Scope & Positioning

## Positioning

**"SaaS de Document Intelligence sécurisé et traçable pour équipes métiers."**

Keywords: KnowledgeOps, Internal AI Assistant, Source-grounded, Tenant-safe, Operational-ready

### NOT positioned as

- Chatbot IA générique
- Outil de résumé
- Simple moteur de recherche PDF

## Target Market

### Global vision (multi-sector)

Écoles, cabinets, PME, entreprises, administrations — any organization with internal documents.

### Launch wedge (execution strategy)

- **Segment pilote** : Cabinet médical/dentaire + PME
- **Reason** : Existing domain experience → faster launch, real-world validation, then generalize

> ⚠️ Architecture, data models, modules, UI, and permissions are **sector-agnostic from day 1**.

## Personas (priority order)

| Persona | Role | Needs |
|---------|------|-------|
| A — Admin/Manager | Manages users, roles, documents | Reliable, simple, secure platform |
| B — Staff/User | Asks daily questions | Fast, clear answers with citations |
| C — Ops/Quality | Verifies policies/procedures | Traceability (logs, sources, versions) |
| D — IT/Security (later) | Demands isolation, audit, compliance | V2+ feature set |

## Valeur perçue (client)

- Gain de temps
- Réduction erreurs
- Réponses cohérentes
- Onboarding équipes rapide
- Gouvernance de la connaissance

## Scope: MVP vs V2 vs V3

### MVP (version vendable/démontrable)

- Multi-tenant simple (`tenant_id`)
- Auth + RBAC de base
- Upload PDF
- Parsing + chunking + embeddings
- RAG Q&A avec citations
- Conversations + historique
- Dashboard admin simple
- Logs requêtes + audit
- Gestion erreurs + fallback propre

### V2 (solidification produit)

- OCR PDF scannés
- Permissions fines par collection
- Feedback qualité (helpful/not helpful)
- Analytics avancés
- DOCX support
- Versioning documents
- Webhooks/notifications
- API keys (B2B intégration)
- Quotas usage

### V3 (scale & enterprise readiness)

- SSO/SAML/OIDC
- RBAC avancé / ABAC léger
- Schema-per-tenant (option)
- Audit export / retention policies
- Billing / subscriptions
- SLA & monitoring avancé
- Reranking / Hybrid search
- Connecteurs cloud (Drive/SharePoint)
