# DocPilot AI — Progress Tracker (forMe)

> **Objectif** : Suivi complet de tout ce qui a été fait, structuré par phase.
> Mis à jour à la fin de chaque phase ou tâche importante.

---

## Phase 0 — Discovery + Planning ✅

**Date** : 2026-03-05 | 14 fichiers docs créés, Checkpoint 0 validé.

---

## Phase 1 — Foundation ✅

**Date** : 2026-03-05 | ~85 fichiers créés.

Backend Django (config multi-env, core module 9 fichiers, 8 modules métier), Frontend Next.js 15, Docker Compose (PG16 pgvector port 5433 + Redis 7). Checkpoint 1 validé : migrations OK, health check 200, seed data, git push 111 objets → `github.com:ibrahimoxx/saas-doc-intelligence.git`.

---

## Phase 2 — Identity/Access + Tenancy + RBAC ✅

**Date** : 2026-03-05 | **Statut** : ✅ Terminée et vérifiée

### Backend — 8 fichiers créés

| Fichier | Description |
|---------|-------------|
| `identity_access/api/serializers.py` | Login, register, me, change-password serializers |
| `identity_access/api/views.py` | 6 endpoints JWT (login, register, refresh, logout, me, change-password) |
| `identity_access/api/urls.py` | 6 routes auth |
| `identity_access/backends.py` | Email auth backend (timing attack protection) |
| `tenancy/api/serializers.py` | Tenant CRUD, membership, invite, knowledge spaces, permissions |
| `tenancy/api/views.py` | 6 endpoints (my tenants, create, detail, permissions, members CRUD, spaces) |
| `tenancy/api/urls.py` | 6 routes tenancy |
| `config/settings/base.py` | + `token_blacklist` app + `AUTHENTICATION_BACKENDS` |

### Frontend — 6 fichiers créés

| Fichier | Description |
|---------|-------------|
| `services/auth.service.ts` | Service auth (login, register, refresh, logout, me) |
| `services/tenant.service.ts` | Service tenancy (my tenants, create, members, spaces) |
| `hooks/useAuth.tsx` | Context auth global (token management, auto-refresh) |
| `(auth)/login/page.tsx` | Page login (dark glassmorphism) |
| `(dashboard)/dashboard/page.tsx` | Dashboard + tenant selector |
| `page.tsx` | Auto-redirect /login ou /dashboard |

### 12 endpoints API

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/api/v1/auth/login/` | Connexion JWT |
| POST | `/api/v1/auth/register/` | Inscription |
| POST | `/api/v1/auth/refresh/` | Refresh token |
| POST | `/api/v1/auth/logout/` | Blacklist token |
| GET/PATCH | `/api/v1/auth/me/` | Profil |
| POST | `/api/v1/auth/change-password/` | Changement mot de passe |
| GET/POST | `/api/v1/tenants/` | Mes tenants / créer |
| GET | `/api/v1/tenants/{id}/` | Détail |
| GET | `/api/v1/tenants/{id}/me/permissions/` | Permissions |
| GET/POST | `/api/v1/tenants/{id}/members/` | Membres / inviter |
| PATCH/DEL | `/api/v1/tenants/{id}/members/{mid}/` | Modifier/retirer |
| GET/POST | `/api/v1/tenants/{id}/spaces/` | Espaces |

### Vérification ✅

- 13 migrations token_blacklist → OK
- Login → Dashboard → "Bienvenue, Admin Dev 👋" + "Cabinet Démo (owner)"
- Tenant selector fonctionnel

---

## Phase 3 — Documents ✅

**Date** : 2026-03-xx | Implémentée et vérifiée.

Upload/list/delete/status endpoints. Storage adapter local + S3/R2. `Document`, `DocumentVersion`, `DocumentProcessingJob` models. Frontend: `(dashboard)/documents/page.tsx`.

---

## Phase 4 — Audit baseline ✅

**Date** : 2026-03-xx | Implémentée et vérifiée.

`AuditLog` model + `log_action()` service. `RequestIdMiddleware`. Wirée sur auth + documents.

---

## Phase 5 — Ingestion async ✅

**Date** : 2026-03-xx | Implémentée et vérifiée.

Celery + Redis. Pipeline: PDF parser → text chunker → embedding service (Gemini). `DocumentChunk` model avec `embedding vector(1536)`. Tâche Celery `process_document_task`.

---

## Phase 6 — Retrieval + RAG + Citations ✅

**Date** : 2026-03-xx | Implémentée et vérifiée.

pgvector cosine similarity search. RAG pipeline: Gemini 2.0 Flash (+ OpenAI fallback + dev mock). Citations. `QueryLog`. Endpoint `/chat/ask/`. Système prompt en français.

---

## Phase 7 — Conversations/History ✅

**Date** : 2026-03-xx | Implémentée et vérifiée.

`Conversation`, `Message`, `MessageCitation` models. Endpoints: list/create conversations + follow-up messages. Frontend: `(dashboard)/chat/page.tsx`.

---

## Phase 8 — Admin Stats ✅ (avec bugs)

**Date** : 2026-03-xx | Implémentée — 2 bugs ouverts.

Endpoints `/admin/stats/` et `/admin/queries/recent/`. Frontend: `admin/dashboard/page.tsx` (données partiellement mockées). Bug: `model_used` → `model_name` **fixé 2026-04-20**.

---

## Phase 9 — Hardening sécurité 🔄 EN COURS

**Date** : 2026-04-20 | Active.

✅ Rate limiting (login/register/chat/upload)
✅ Structured logging (JsonFormatter)
✅ Sentry config (optionnel en dev)
✅ 5 bugs critiques fixés (2026-04-20) :
  - BUG-1: login `res.success` → `res.ok`
  - BUG-2: STATUS_CONFIG `pending/completed` → `queued/indexed`
  - BUG-3: admin_views `model_used` → `model_name`
  - BUG-4: tests `DocumentStatus.AVAILABLE` → `QUEUED` + `slug` manquant
  - BUG-5: endpoint suppression espace + téléchargement document ajoutés
🔲 Tests complets à valider
🔲 Dockerfiles app (backend + worker)
🔲 CI/CD GitHub Actions

---

## Phase 10 — Déploiement 🔲

Pas encore commencé. Dépend de Phase 9 complète.
