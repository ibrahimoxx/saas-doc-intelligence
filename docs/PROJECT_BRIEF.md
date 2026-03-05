# DocPilot AI — Project Brief

## Nom provisoire
**DocPilot AI**

## Vision
Plateforme SaaS multi-tenant de Document Intelligence (RAG) permettant à des organisations de centraliser leurs documents et d'obtenir des réponses IA **fiables, contextualisées, traçables (citations)**.

## Cible
SaaS **horizontal** (multi-secteurs) : écoles, cabinets, PME, entreprises, administrations.

### Wedge de lancement
Cabinets médicaux/dentaires + PME — segment pilote pour validation marché rapide.

## Proposition de valeur
*"Transformer les documents internes en une base de connaissance interrogeable en langage naturel, avec réponses fiables, sourcées, auditables et sécurisées."*

## Valeur perçue
- ⏱️ Gain de temps
- ✅ Réduction des erreurs
- 🔄 Réponses cohérentes
- 🚀 Onboarding équipes rapide
- 🏛️ Gouvernance de la connaissance

## Personas prioritaires

| Persona | Description | Besoin principal |
|---------|-------------|-------------------|
| Admin/Manager | Gère utilisateurs, droits, documents | Plateforme fiable, simple, sécurisée |
| Staff/Utilisateur | Pose des questions au quotidien | Réponse rapide, claire, avec citations |
| Ops/Qualité | Vérifie politiques/procédures | Traçabilité (logs, sources) |
| IT/Sécurité (V2+) | Exige isolation, audit, compliance | Features enterprise |

## MVP (v1) — Scope gelé

### Inclus
- Multi-tenant simple (`tenant_id`)
- Auth JWT + RBAC (owner/admin/manager/member)
- Upload PDF + métadonnées
- Parsing + chunking + embeddings (OpenAI)
- RAG Q&A avec citations obligatoires
- Conversations + historique
- Dashboard admin simple (stats + recent queries)
- Audit logs (upload/delete/auth/admin)
- Gestion erreurs + fallback no-answer
- Request_id correlation
- Sentry error tracking

### Exclu (V2+)
OCR, DOCX, SSO/SAML, billing, connecteurs cloud, permissions fines par collection, feedback qualité, hybrid search, API publique

## Stack technique
- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Backend**: Django + Django REST Framework
- **Auth**: JWT (SimpleJWT) — access + refresh tokens
- **DB**: PostgreSQL + pgvector
- **Queue/Cache**: Redis + Celery
- **Storage**: Cloudflare R2 (local en dev)
- **AI**: OpenAI (LLM + embeddings)
- **Monitoring**: Sentry + structured logs
- **CI/CD**: GitHub Actions
- **Deploy**: Render (backend/worker) + Vercel (frontend)

## KPIs MVP
- Time-to-first-answer < 15 min après onboarding
- % tenants ayant uploadé des docs
- % utilisateurs posant ≥ 3 questions
- Taux de réponses utiles
- Taux de fallback
- Coût IA / tenant actif
