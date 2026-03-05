# DocPilot AI — Master Context (Source of Truth)

> **Last updated**: 2026-03-05 — Étape 0 (Extraction)

## Vision

**Plateforme SaaS multi-tenant de Document Intelligence (RAG)** permettant à des organisations de centraliser leurs documents et d'obtenir des réponses IA **fiables, contextualisées, traçables (citations)**.

## Proposition de valeur

*"Transformer les documents internes en une base de connaissance interrogeable en langage naturel, avec réponses fiables, sourcées, auditables et sécurisées."*

## Cible

- **SaaS multi-secteurs** : écoles, cabinets, PME, entreprises, administrations
- **Wedge de lancement** : Cabinet médical/dentaire + PME (stratégie d'exécution uniquement)
- ⚠️ Le produit est conçu **multi-secteurs dès le départ** (architecture, données, modules, UI, permissions)

## Nom provisoire

**DocPilot AI**

## Architecture

- **Type** : Modular Monolith (progressivement extractible)
- **Multi-tenant** : Shared DB + `tenant_id`
- **Stack** : Next.js + Django/DRF + PostgreSQL/pgvector + Redis + Celery + S3/R2
- **Observabilité** : Sentry + structured logs + request_id
- **Auth** : JWT access + refresh (rotation recommandée)

## Environnement développeur

| Item | Valeur |
|------|--------|
| OS | Windows |
| Terminal | PowerShell |
| Éditeur | VS Code |
| Python | 3.13.3 (fallback 3.11/3.12 si incompatibilités) |
| Node.js | v22.21.1 |
| Docker | Installé |
| PostgreSQL | Installé localement |
| Redis | Installé localement |

## Rythme de travail

- Part-time sérieux : ~2h/jour + 4-6h week-end
- Objectif MVP : 8-10 semaines

## Niveau technique (auto-évaluation)

| Technologie | Niveau |
|-------------|--------|
| Django/DRF | Avancé |
| Next.js/React | Avancé |
| TypeScript | Avancé |
| Docker | Intermédiaire |
| PostgreSQL | Débutant |
| Redis | Débutant |
| Celery | Débutant |
| DevOps/Deploy | Débutant |

## Préférences cloud

- **Backend** : Render (backend + worker)
- **Frontend** : Vercel (si possible), sinon Render
- **DB** : PostgreSQL Managed
- **Storage** : Cloudflare R2 (local en dev)
- **CI/CD** : GitHub Actions
- **Monitoring** : Sentry

## Provider IA

- **LLM** : OpenAI (défaut)
- **Embeddings** : OpenAI (défaut)
- **Priorité** : équilibre qualité + coût + vitesse

## Langue produit

- **UI** : Français (défaut)
- **Documents** : Français / mixte
- **Réponses IA** : même langue que la question (français par défaut)

## Scope MVP gelé

- ✅ Multi-tenant simple (`tenant_id`)
- ✅ Auth + RBAC de base
- ✅ Upload PDF (PDF only au départ)
- ✅ Parsing + chunking + embeddings
- ✅ RAG Q&A avec citations
- ✅ Dashboard admin simple
- ✅ Logs des requêtes + audit
- ✅ Gestion erreurs et fallback
- ✅ Conversations/historique
- ❌ Pas OCR, pas SSO, pas billing, pas connectors au MVP

## Repo

- **Nom** : `saas-doc-intelligence`
- **Type** : Monorepo
- **GitHub** : non encore créé
