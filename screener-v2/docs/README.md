# Documentation Map

This repository keeps active operating documents under `docs/` and a small set of historical root-level reference files. Use this map to avoid treating older planning material as current execution truth.

## Current source of truth

- `docs/RELEASE_READINESS_BACKLOG.md` - current release status, remaining work, and execution order
- `docs/MASTER_RELEASE_PLAN.md` - design rationale for implemented and planned release work
- `docs/MASTER_UX_ARCHITECTURE_PLAN.md` - UX architecture and forward plan
- `DEPLOYMENT.md` - deployment steps and environment requirements
- `README.md` - local setup, runtime scope, and developer commands

## Supporting active references

- `docs/REAL_ATS_READINESS_GATE.md` - ATS and release-readiness gap analysis
- `docs/FEATURE_EXPANSION_PLAN.md` - post-release feature expansion plan
- `docs/RELEASE_HANDOFF_15X.md` - release archive and handoff notes

## Historical or point-in-time references

These files remain at the repository root because they still provide useful audit context, but they are not the current execution source of truth:

- `AUDIT_15T-A_NORTHSTAR_IA.md`
- `CANONICAL_IA_15T-B.md`
- `ROUTE_INVENTORY_15T-B.md`
- `CLEANUP_HANDOVER.md`

## Archive boundary

- `salvaged/` is a tracked archive and must not be imported into active code.
- Archived material should only be used when a task explicitly restores or replaces it.
