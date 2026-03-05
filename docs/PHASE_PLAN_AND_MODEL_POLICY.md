# DocPilot AI — Phase Plan & Model Policy

## Phase Overview

| Phase | Name | Type of Work | Duration (est.) |
|-------|------|-------------|-----------------|
| 0 | Discovery + Extraction | Architecture/Planning | 1 day |
| 1 | Foundation | Bootstrap/Config | 2-3 days |
| 2 | Identity/Access + Tenancy | Implementation | 3-4 days |
| 3 | Documents | Implementation | 3-4 days |
| 4 | Audit + Observability baseline | Implementation | 1-2 days |
| 5 | Ingestion async | Implementation | 4-5 days |
| 6 | Retrieval + RAG + Citations | Implementation | 4-5 days |
| 7 | Conversations/History | Implementation | 2-3 days |
| 8 | Admin Stats | Implementation | 1-2 days |
| 9 | Hardening + Security | QA/Hardening | 3-4 days |
| 10 | Deploy + Runbooks | DevOps | 3-4 days |

**Total estimated**: ~8-10 weeks (part-time)

---

## Model Policy per Phase

### Phase 0 — Discovery / Architecture / Decisions
- **Recommended model**: Claude Opus 4.6 (Thinking)
- **Why**: Long reasoning, architectural coherence, constraint management
- **When to switch**: After Checkpoint 0 validated

### Phase 1 — Foundation / Bootstrap / Structure
- **Recommended model**: Claude Opus 4.6 (Thinking) → then Claude Sonnet 4.6 (Thinking)
- **Why**: Opus for consolidation and structure setup, Sonnet for file generation
- **When to switch**: After Python/Node project setup validated

### Phase 2-3 — Identity/Tenancy + Documents (Implementation)
- **Recommended model**: Claude Sonnet 4.6 (Thinking)
- **Why**: Good speed/quality ratio for structured implementation
- **Use Opus if**: Complex multi-module interaction issues

### Phase 4 — Audit Baseline
- **Recommended model**: Claude Sonnet 4.6 (Thinking)
- **Why**: Straightforward implementation

### Phase 5 — Ingestion Async (Celery + RAG pipeline)
- **Recommended model**: Claude Sonnet 4.6 (Thinking)
- **Use Opus if**: Celery/pgvector integration issues or multi-layer debugging
- **Why Sonnet**: Implementation-focused, well-defined patterns

### Phase 6 — Retrieval + RAG + Citations
- **Recommended model**: Claude Sonnet 4.6 (Thinking)
- **Use Opus if**: Prompt engineering, citation logic, or RAG quality issues
- **Why**: Core product value — may need Opus for quality tuning

### Phase 7-8 — Conversations + Admin Stats
- **Recommended model**: Claude Sonnet 4.6 (Thinking)
- **Why**: CRUD implementation with known patterns

### Phase 9 — Hardening + Security
- **Recommended model**: Claude Sonnet 4.6 (Thinking)
- **Use Opus if**: Security architecture analysis or complex tenant isolation testing
- **Why**: Mostly checklist-driven + tests

### Phase 10 — Deployment + Runbooks
- **Recommended model**: Claude Sonnet 4.6 (Thinking)
- **Use Opus if**: Complex deployment troubleshooting
- **Why**: Config-heavy, well-documented patterns

---

## Transition Criteria

A phase is **ready to transition** when:
1. All "Must" tasks are complete
2. Tests pass (where applicable)
3. User has validated the checkpoint
4. Task Board updated
5. Docs updated

## Fallback Models

| Priority | Model | Use case |
|----------|-------|----------|
| 1 | Claude Opus 4.6 (Thinking) | Architecture, complex debugging |
| 2 | Claude Sonnet 4.6 (Thinking) | Daily implementation |
| 3 | Gemini 3.1 Pro (High) | Large context consolidation |
| 4 | Gemini 3 Flash | Quick corrections, reformulations |
