# DocPilot AI — Handoff Checkpoints

> Actions that require **user intervention**. Updated as the project progresses.

## Status Legend
- 🔲 Not yet needed
- ⏳ Pending (user action required now)
- ✅ Done

---

## Checkpoint 0 — Project Decisions Validation
- **Status**: ⏳
- **When**: Before starting Phase 1
- **What**:
  1. Validate MVP scope (frozen list)
  2. Confirm stack decisions
  3. Confirm Python version (3.13 vs 3.11/3.12)
  4. Confirm Tailwind CSS usage
  5. Confirm auth strategy (JWT httpOnly cookie)
  6. Confirm storage strategy (local dev → R2 prod)
  7. Confirm tenant-in-URL pattern
  8. Confirm AI provider + budget
- **How to verify**: Review Decision Checklist, respond with confirmations/changes
- **After**: Antigravity proceeds to Phase 1 (Foundation)

---

## Checkpoint 1 — GitHub Repository Creation
- **Status**: 🔲
- **When**: After monorepo structure created
- **What**:
  1. Create GitHub repo `saas-doc-intelligence` (private)
  2. Initial push
- **Commands**:
  ```bash
  git init
  git remote add origin git@github.com:<username>/saas-doc-intelligence.git
  git add .
  git commit -m "chore: initial monorepo structure"
  git push -u origin main
  ```
- **How to verify**: `git remote -v` shows correct URL, `git log` shows commit

---

## Checkpoint 2 — Local Development Environment
- **Status**: 🔲
- **When**: After Docker compose + project init
- **What**:
  1. Run `docker compose up -d` (PostgreSQL + Redis)
  2. Verify PostgreSQL accessible
  3. Verify Redis accessible
  4. Run Django migrations
  5. Run Next.js dev server
- **How to verify**: Both servers start without errors

---

## Checkpoint 3 — pgvector Extension
- **Status**: 🔲
- **When**: Before Epic 5 (Ingestion)
- **What**:
  1. Install pgvector extension on PostgreSQL
  2. `CREATE EXTENSION IF NOT EXISTS vector;`
- **Why**: Required for embedding storage + similarity search
- **How to verify**: `SELECT * FROM pg_extension WHERE extname = 'vector';` returns row

---

## Checkpoint 4 — OpenAI API Key
- **Status**: 🔲
- **When**: Before Epic 5 (Embeddings) and Epic 6 (LLM)
- **What**:
  1. Create/confirm OpenAI API key
  2. Add to `.env` as `OPENAI_API_KEY=sk-...`
  3. Set monthly budget limit on OpenAI dashboard
- **Why**: Required for embeddings generation + LLM responses
- **How to verify**: `python -c "import openai; print(openai.Model.list())"` works

---

## Checkpoint 5 — Sentry Setup
- **Status**: 🔲
- **When**: Before Epic 9 (Hardening)
- **What**:
  1. Create Sentry project (Python + JavaScript)
  2. Get DSN for backend + frontend
  3. Add to `.env` files
- **How to verify**: Test error sent and visible in Sentry dashboard

---

## Checkpoint 6 — Cloud Services Setup (Staging/Prod)
- **Status**: 🔲
- **When**: Before Epic 10 (Deploy)
- **What**:
  1. Render account: create web service (backend) + background worker (Celery)
  2. Vercel account: connect frontend repo
  3. Managed PostgreSQL (Render or external)
  4. Cloudflare R2: create bucket
  5. Set environment variables on all services
  6. Custom domain (if ready)
- **Why**: Production infrastructure
- **How to verify**: Each service is accessible + env vars confirmed

---

## Checkpoint 7 — Production Deploy Validation
- **Status**: 🔲
- **When**: After staging validated
- **What**:
  1. Run full E2E on staging (login → upload → chat → citations)
  2. Confirm backup schedule
  3. Confirm monitoring alerts
  4. Approve production deploy
- **How to verify**: Full user journey works on staging
