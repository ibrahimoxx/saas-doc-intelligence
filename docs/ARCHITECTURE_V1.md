# DocPilot AI — Architecture V1

## Architecture Type
**Modular Monolith** — progressively extractible

## System View

```
[Client Web - Next.js]
        |
        | HTTPS (JWT / secure cookies)
        v
[Reverse Proxy (Nginx/Render)]
        |
        v
[Backend SaaS API - Django/DRF (Modular Monolith)]
  |     |     |     |     |
  |     |     |     |     +--> [Audit / Logs / Metrics]
  |     |     |     |
  |     |     |     +--> [RAG Retrieval + Response Service]
  |     |     |
  |     |     +--> [Document Management + Metadata]
  |     |
  |     +--> [Identity / Access / Tenancy / RBAC]
  |
  +--> [Celery Task Dispatch]
              |
              v
        [Celery Workers]
          +--> PDF Parsing / Chunking
          +--> Embeddings Generation
          +--> Reindexing Jobs

[PostgreSQL + pgvector]  <---->  [Backend + Workers]
[Redis] (queue/cache)    <---->  [Backend + Workers]
[S3/R2 Storage]          <---->  [Backend + Workers]
[OpenAI API]             <---->  [Backend/Workers]
[Sentry]                 <----   [Backend + Frontend]
```

## Backend Modules

| Module | Responsibilities |
|--------|-----------------|
| `core` | Shared utilities, base models, middleware, exceptions, permissions |
| `tenancy` | Tenants, memberships, knowledge spaces, tenant context |
| `identity_access` | Auth (JWT), users, RBAC, profiles |
| `documents` | Upload, metadata, status, versions, processing jobs |
| `ingestion` | Parsing, chunking, embeddings, vector store, async tasks |
| `retrieval` | Vector search, prompt building, LLM calls, citations, fallback |
| `conversations` | Conversations, messages, message citations |
| `audit_observability` | Audit logs, query logs, model usage logs |
| `admin_ops` | Admin stats, operational views |
| `billing` | Placeholder V2+ |

## Module Dependencies (allowed)

```
core ← (everything depends on core)
tenancy ← identity_access, documents, ingestion, retrieval, conversations, audit, admin_ops
identity_access ← documents, retrieval, conversations, admin_ops
documents ← ingestion, retrieval
ingestion ← retrieval
retrieval ← conversations
audit_observability ← (transversal, minimal deps)
admin_ops ← (reads from multiple modules)
```

## Multi-Tenant Strategy

- **V1**: Shared DB + `tenant_id` on all business tables
- **Filtering**: Centralized (not ad-hoc)
- **Future**: Schema-per-tenant for enterprise (V3+)

## RBAC V1

| Role | Documents | Upload | Delete | Chat | Admin Stats | Manage Members |
|------|-----------|--------|--------|------|-------------|----------------|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅* | ✅ | ✅ | ❌ |
| Member | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |

## Key Flows

### Auth + Tenant Context
1. User logs in → JWT access + refresh tokens
2. Frontend selects active tenant
3. API URL includes tenant: `/api/v1/tenants/{tenant_id}/...`
4. Backend: validate token → check membership → load role → inject tenant context

### Document Upload (async)
1. Admin uploads → validate auth + role + file (type/size)
2. Save metadata (Document + DocumentVersion, status `queued`)
3. Store file on S3/R2
4. Dispatch Celery task
5. Worker: parse → chunk → embed → index → status `indexed`

### RAG Q&A (sync API + external calls)
1. User sends question → validate auth + tenant + role + rate limit
2. Embed question → similarity search (pgvector, filtered by tenant)
3. If context insufficient → fallback no-answer
4. Build prompt (template) → call LLM → generate answer
5. Persist message + citations + query log + usage log
6. Return answer + citations

## Database Tables (V1)

### Core/Auth
- `users`, `tenants`, `tenant_memberships`, `knowledge_spaces`

### Documents
- `documents`, `document_versions`, `document_processing_jobs`

### RAG
- `document_chunks` (with embedding vector)

### Conversations
- `conversations`, `messages`, `message_citations`

### Logs
- `audit_logs`, `query_logs`, `model_usage_logs`

## API Conventions
- Prefix: `/api/v1`
- Tenant-scoped: `/tenants/{tenant_id}/...`
- JSON only
- Errors: `{ code, message, details, request_id }`
- UUID for all IDs
- Timestamps in UTC
- Pagination: page/limit (V1)

## Security Baseline
- JWT + refresh rotation
- RBAC tenant-scoped on every endpoint
- Deny-by-default for RAG
- Rate limiting (login/chat/upload)
- Upload validation (type/size/mime)
- Input validation (backend = source of truth)
- Audit logs on sensitive actions
- Secrets management (never in code)
- HTTPS only in prod
- CORS strict
