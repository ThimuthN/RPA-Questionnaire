# Schema-Type Mismatch Audit Report

## Overview
Audit of all Prisma enums vs TypeScript type definitions to detect misalignments that cause compilation errors.

---

## Audit Results

### 1. ✅ ResultReviewState
**Status:** ALIGNED

| Prisma | TypeScript |
|--------|-----------|
| `unreviewed` | `unreviewed` |
| `reviewed` | `reviewed` |
| `flagged` | `flagged` |

**Location:** `src/lib/assessment-engine/types.ts`
**File:** `prisma/schema.prisma:18-22`

---

### 2. ✅ CandidateMilestoneStatus  
**Status:** FIXED (was broken)

| Prisma | TypeScript |
|--------|-----------|
| `not_started` | `not_started` |
| `in_progress` | `in_progress` |
| `done` | `done` |
| `failed` | `failed` |
| `skipped` | `skipped` |

**Location:** `src/lib/candidates/milestones.ts`
**File:** `prisma/schema.prisma:24-30`
**Note:** Was misaligned until commit `3172a5d`

---

### 3. ⚠️ AttemptStatus
**Status:** NO TYPESCRIPT DEFINITION FOUND

**Prisma Values:**
- `in_progress`
- `submitted`
- `graded`
- `reviewed`

**TypeScript:** ❌ Not found in codebase
**Used By:** `Attempt` model
**Risk:** HIGH - No validation, easy to use wrong values

**Fix Needed:**
```typescript
// Create src/lib/assessment/attempt-types.ts
export const attemptStatusValues = [
  "in_progress",
  "submitted",
  "graded",
  "reviewed"
] as const;

export type AttemptStatus = (typeof attemptStatusValues)[number];
```

---

### 4. ⚠️ CandidateOfferStatus
**Status:** NO TYPESCRIPT DEFINITION FOUND

**Prisma Values:**
- `draft`
- `sent`
- `accepted`
- `rejected`
- `expired`

**TypeScript:** ❌ Not found in codebase
**Used By:** `CandidateOffer` model
**Risk:** HIGH - No validation, easy to use wrong values

**Fix Needed:**
```typescript
// Create src/lib/offers/offer-types.ts
export const offerStatusValues = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired"
] as const;

export type CandidateOfferStatus = (typeof offerStatusValues)[number];
```

---

## Summary Table

| Enum | Prisma | TypeScript | Status | Risk |
|------|--------|-----------|--------|------|
| ResultReviewState | ✅ | ✅ | ALIGNED | LOW |
| CandidateMilestoneStatus | ✅ | ✅ | ALIGNED (fixed) | LOW |
| AttemptStatus | ✅ | ❌ | **MISSING** | **HIGH** |
| CandidateOfferStatus | ✅ | ❌ | **MISSING** | **HIGH** |

---

## Impact Analysis

### HIGH RISK (Missing TypeScript Types)
1. **AttemptStatus** 
   - Code using enum values: `attempt.status = "in_progress"` - no type checking
   - Typos won't be caught: `attempt.status = "in_progres"` - compiles fine, fails at runtime
   - Database constraints enforce it, but still risky

2. **CandidateOfferStatus**
   - Same risk as AttemptStatus
   - Enum values hard-coded in many places
   - Refactoring would be painful

### RECOMMENDED ACTIONS

**Immediate (This Week):**
1. Create TypeScript type definitions for both missing enums
2. Add Zod schemas for validation
3. Update code to import from TypeScript, not hardcoded strings

**Short Term (This Sprint):**
1. Run TypeScript strict mode to catch all enum usage
2. Create tests that verify Prisma enums match TypeScript types
3. Add pre-commit hook to catch enum drift

**Long Term (Architecture):**
1. All Prisma enums MUST have TypeScript equivalents
2. All enums MUST have Zod validation schemas
3. CI/CD should fail if enum values drift
4. Add enum audit to every schema change PR

---

## Prevention Strategy

### Checklist for Future Schema Changes

```markdown
## Schema Change Checklist
- [ ] All new enums have TypeScript type definitions
- [ ] TypeScript types match Prisma enum values exactly
- [ ] Zod schemas exist for validation
- [ ] Tests verify enum alignment
- [ ] Export constants for easy access
- [ ] Label objects exist for UI display
- [ ] Guard functions exist (isCandidateStatus, etc)
- [ ] Pre-commit hook passes
```

### Automated Validation

**Create `scripts/validate-schema.mjs`:**
```javascript
// Compare Prisma schema enums with TypeScript definitions
// Fail build if mismatch found
// Run in CI/CD on every PR
```

---

## TypeScript Files to Create

### 1. `src/lib/assessment/attempt-types.ts`
```typescript
export const attemptStatusValues = [
  "in_progress",
  "submitted", 
  "graded",
  "reviewed"
] as const;

export type AttemptStatus = (typeof attemptStatusValues)[number];

export const attemptStatusLabels: Record<AttemptStatus, string> = {
  in_progress: "In Progress",
  submitted: "Submitted",
  graded: "Graded",
  reviewed: "Reviewed"
};

export function isAttemptStatus(value: string): value is AttemptStatus {
  return (attemptStatusValues as readonly string[]).includes(value);
}
```

### 2. `src/lib/offers/offer-types.ts`
```typescript
export const offerStatusValues = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired"
] as const;

export type CandidateOfferStatus = (typeof offerStatusValues)[number];

export const offerStatusLabels: Record<CandidateOfferStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired"
};

export function isOfferStatus(value: string): value is CandidateOfferStatus {
  return (offerStatusValues as readonly string[]).includes(value);
}
```

---

## Related Issues

This audit revealed systemic issues:

1. **No schema validation** - Enums can drift without detection
2. **Inconsistent patterns** - Some enums have TS types, some don't
3. **String literals scattered** - Hard-coded enum values throughout code
4. **No compile-time safety** - Missing enums only caught at runtime

---

## Timeline to Fix

| Priority | Items | Time | Owner |
|----------|-------|------|-------|
| P0 (Today) | Create missing type definitions | 30 min | Engineer |
| P0 (Today) | Update code to use types | 1 hour | Engineer |
| P1 (This week) | Add schema validation script | 2 hours | DevOps |
| P1 (This week) | Add pre-commit hook | 1 hour | DevOps |
| P2 (This sprint) | Create enum audit tests | 2 hours | QA |
| P2 (This sprint) | Document enum patterns | 1 hour | Tech Lead |

---

## Conclusion

**Finding:** 2 out of 4 enums missing TypeScript type definitions
**Severity:** HIGH - Causes runtime errors
**Root Cause:** No architectural requirement to keep schema and types in sync
**Fix Effort:** 4 hours (immediate) + 6 hours (infrastructure)
**Prevention:** Schema validation in CI/CD + mandatory TypeScript types for all enums

This is a **critical quality gap** that must be addressed before scaling the system to enterprise use.
