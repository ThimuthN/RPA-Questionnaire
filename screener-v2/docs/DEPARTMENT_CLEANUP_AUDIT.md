# Department Cleanup Audit (15AB)

## Findings

Based on the current schema and code inspection:

### System Department
- **Status:** ⚠️ Likely bootstrap-only
- **Finding:** Used in role assignment bootstrap scripts but not actively in hiring workflow
- **Recommendation:** Hide from hiring department list while keeping for internal/admin use
- **Risk:** Low - no active jobs or candidates expected
- **Action in 15AB:** Mark as hidden from hiring UI (add `showInHiringUI` flag concept, document for future)

### RPA Department
- **Status:** Active
- **Finding:** Has designations, users, and likely active candidates/jobs
- **Recommendation:** Keep active
- **Risk:** None
- **Action in 15AB:** No changes; verify in usage data

### Engineering Department
- **Status:** Active or bootstrap
- **Finding:** Present in initial setup but actual usage depends on hiring workflow
- **Recommendation:** Audit usage; likely safe to keep
- **Risk:** Low
- **Action in 15AB:** No changes without explicit audit

### RPA-IND, RPA-SL, QA-IND, QA-SL, etc.
- **Status:** Active (variant departments)
- **Finding:** Current structure scopes roles by department AND variant
- **Recommendation:** Keep as-is; these are the primary hiring departments
- **Risk:** None
- **Action in 15AB:** No changes

## Deferred Decisions

The following require explicit approval or further audit:

1. **System Department Visibility** — Hide from hiring UI (deferred method implementation)
2. **Engineering/RPA Cleanup** — Confirm usage before deactivation
3. **Duplicate Department Consolidation** — No evidence of true duplicates; RPA-IND and RPA-SL are intentional variants

## What 15AB Actually Does

Since we cannot safely audit without database query infrastructure in this batch:

1. ✅ Document classification above
2. ✅ Hide System from hiring context conceptually (prepare for UI change)
3. ❌ Do NOT delete or deactivate any departments
4. ❌ Do NOT make database changes

**Next batch:** Implement `showInHiringUI` flag or similar if System department hiding is approved.

## Data Safety Note

No department records will be modified or deleted in this batch. The audit is informational only.
