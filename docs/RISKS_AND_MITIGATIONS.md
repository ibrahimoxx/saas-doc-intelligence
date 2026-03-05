# DocPilot AI — Risks and Mitigations

## Risk Register

### R1 — Over-engineering
- **Probability**: Medium
- **Impact**: High (delays, complexity bloat)
- **Mitigation**:
  - Modular monolith, not microservices
  - MVP scope frozen
  - Extract modules only on proven bottleneck
  - Weekly scope review

### R2 — Technical Debt Accumulation
- **Probability**: Medium
- **Impact**: Medium
- **Mitigation**:
  - Code conventions from day 1
  - Domain/Application/Infrastructure separation
  - Continuous light refactoring
  - Strict Definition of Done
  - Visible tech debt backlog

### R3 — Security Gaps (tenant isolation, auth)
- **Probability**: Medium
- **Impact**: Critical
- **Mitigation**:
  - Security baseline from foundation
  - Centralized tenant filtering (not ad-hoc)
  - RBAC tests mandatory
  - Deny-by-default for RAG
  - Upload validation (type/size/mime)
  - Audit logs on sensitive actions

### R4 — RAG Quality Issues
- **Probability**: High
- **Impact**: High (core product value)
- **Mitigation**:
  - Proper chunking strategy
  - Citation mandatory for informative answers
  - No-answer fallback if context insufficient
  - Prompt template versioning
  - QueryLog + ModelUsageLog for monitoring
  - Provider timeout handling

### R5 — AI Provider Costs
- **Probability**: Medium
- **Impact**: Medium
- **Mitigation**:
  - ModelUsageLog from V1
  - Token count tracking
  - Per-tenant usage monitoring
  - Rate limiting + quotas
  - Provider abstraction (swap if needed)

### R6 — Scope Creep
- **Probability**: High
- **Impact**: High (MVP delays)
- **Mitigation**:
  - MoSCoW prioritization strict
  - Explicit V2/V3 lists
  - No feature without ticket
  - Weekly scope review (checklist)

### R7 — Monitoring Gaps
- **Probability**: Medium
- **Impact**: High (invisible incidents)
- **Mitigation**:
  - Sentry from early MVP
  - Structured JSON logs
  - request_id correlation
  - Health checks + dashboards

### R8 — Python 3.13 Compatibility
- **Probability**: Low-Medium
- **Impact**: Medium
- **Mitigation**:
  - Test key dependencies early
  - Fallback to Python 3.11/3.12 if needed
  - Document version choice in ADR

### R9 — Solo Dev Burnout / Velocity
- **Probability**: Medium
- **Impact**: High
- **Mitigation**:
  - Part-time realistic planning
  - One visible deliverable per day
  - Don't add scope if day slips
  - Fixed weekly review

### R10 — Deployment Complexity
- **Probability**: Medium
- **Impact**: Medium
- **Mitigation**:
  - Docker from dev (same as staging/prod)
  - Managed services (Render, Vercel, managed PG)
  - Runbooks documented
  - Staging before prod (always)
