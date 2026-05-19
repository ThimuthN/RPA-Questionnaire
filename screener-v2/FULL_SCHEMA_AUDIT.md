# Full Schema & Code Audit

**Date:** 2026-05-20  
**Status:** ⚠️ CRITICAL MISALIGNMENTS FOUND

---

## Executive Summary

The Prisma schema and actual database are **OUT OF SYNC**. Models defined in `schema.prisma` don't exist in the database, causing runtime errors.

| Category | Issue | Severity |
|----------|-------|----------|
| Permission System | Tables defined in schema but NO migrations exist | 🔴 CRITICAL |
| Enums | 2 missing TypeScript type definitions | 🔴 CRITICAL |
| Migrations | 2 new migrations created but not yet applied | 🟡 HIGH |
| Type Safety | Inconsistent typing in batch operations | 🟡 HIGH |

---

## 1. CRITICAL: Permission System Not Migrated

### Schema Definition (exists in schema.prisma)
```prisma
model RolePermissionTemplate {
  id         String   @id @default(cuid())
  roleId     String
  role       RoleCatalog @relation(...)
  permission String
  scope      String   @default("own_dept")
  createdAt  DateTime @default(now())
  @@unique([roleId, permission])
}

model UserPermissionOverride {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(...)
  permission String
  action    String    -- "grant" | "revoke"
  grantedBy String
  reason    String?
  grantedAt DateTime @default(now())
  @@unique([userId, permission])
}
```

### Database Status
❌ **MISSING** - No migration exists before `20260520_add_permission_system_tables`

### Code Dependencies
- `src/lib/auth/permission-evaluator.ts` line 8: Queries `permissionOverrides` relation
- `src/lib/auth/app-auth.ts` line 127: Calls `getEffectivePermissions()`
- Both fail with "column does not exist" when tables missing

### Impact
🔴 **Login completely broken** - Any user trying to authenticate will crash

### Fix Status
- Migration created: `20260520_add_permission_system_tables`
- Status: **NOT YET COMMITTED/PUSHED**

---

## 2. CRITICAL: Enum TypeScript Definitions Missing

### AttemptStatus Enum
**Prisma:** `in_progress | submitted | graded | reviewed`  
**TypeScript:** ❌ No type definition found  
**Used By:** `Attempt.status` column  
**Risk:** String literals not validated at compile time

### CandidateOfferStatus Enum  
**Prisma:** `draft | sent | accepted | rejected | expired`  
**TypeScript:** ❌ No type definition found  
**Used By:** `CandidateOffer.status` column  
**Risk:** String literals not validated at compile time

### Fix Status
- Documented in `SCHEMA_AUDIT.md`
- **NOT YET IMPLEMENTED**

---

## 3. CandidateMilestoneStatus Schema Change Issues

### Change History
| Commit | Change |
|--------|--------|
| 629705e | Added to schema as `{pending, in_progress, completed, passed, failed}` |
| 6812caa | Changed to `{pending, in_progress, completed, passed, failed}` (no actual change) |
| 3172a5d | Changed to `{not_started, in_progress, done, failed, skipped}` |
| **NOW** | Created migration to update existing data |

### Migration Status
✅ Created: `20260520_align_milestone_status_enum_values`  
✅ Data Mapping: `pending→not_started`, `completed|passed→done`  
✅ Data Safety: No deletion, all data restructured  
**Status:** Waiting for push & application

### Code Locations Updated
- ✅ `src/app/api/candidates/[id]/delete/route.ts` line 33: `"completed"→"done"`
- ✅ `src/app/api/candidates/[id]/milestones/route.ts` line 83: `"pending"→"not_started"`
- ✅ `src/app/api/candidates/__tests__/candidate-operations.test.ts` line 79: `"pending"→"not_started"`
- ✅ `src/lib/db/candidates.ts` lines 689-697: Type definitions fixed

---

## 4. Database Schema vs Code Mismatches

### User Model
**Schema Fields:**
```
id, email, name, departmentId, roleId, passwordHash, isActive, 
lastLoginAt, createdAt, updatedAt
```

**Relations:**
- ✅ `dept` → Department (via departmentId FK)
- ✅ `role` → RoleCatalog (via roleId FK)
- ✅ `permissionOverrides` → UserPermissionOverride (but table MISSING)
- ✅ `ownedCandidates` → Candidate
- ✅ `interviewPanels` → InterviewPanelMember
- ✅ `interviewFeedbacks` → InterviewFeedback

**Code Accessing:**
- `authenticateAppUser()` selects: `id, email, name, roleId, departmentId, passwordHash, isActive` ✅
- `listAppUsers()` selects: role relation (lines 152-154) ⚠️ VERIFY WORKS
- `getEffectivePermissions()` requires permissionOverrides relation ❌ MISSING

---

## 5. Missing Migrations Timeline

### Not Yet Created
None - all schema models have migrations

### Created But Not Applied
1. `20260520_align_milestone_status_enum_values` - Enum value updates
2. `20260520_add_permission_system_tables` - Permission system tables
3. `4cab9f7` - TypeScript type fixes (not a migration)

**Status:** Created locally, NOT pushed to GitHub

---

## 6. Uncommitted/Unpushed Changes

| Item | Status | Commit |
|------|--------|--------|
| Fix delete route enum | ✅ Committed | 744c89c |
| Fix milestones route enum | ✅ Committed | 35491aa |
| Fix batch type definitions | ✅ Committed | 4cab9f7 |
| Milestone status migration | ✅ Committed | a002845 |
| Fix migration table name | ✅ Committed | 2123315 |
| Permission system tables migration | ✅ Committed | 40d5eca |
| **All changes** | ❌ NOT PUSHED | Git auth issue |

---

## 7. Code Issues Remaining

### Type Safety in Batch Operations
**File:** `src/lib/db/candidates.ts:689-697`  
**Fixed:** ✅ TypeScript types now match enums

### Unused Code Patterns
**File:** Various  
**Issue:** Some old enum values still referenced in comments/tests  
**Status:** Likely fixed by migrations

---

## 8. What Needs to Happen (In Order)

### Phase 1: Push Existing Work (Blocked)
1. ❌ Git push failing due to authentication
2. Need to resolve git credential issue
3. Then push all 6 commits

### Phase 2: Apply Migrations (Depends on Phase 1)
1. Vercel detects new commits
2. Applies migrations in order:
   - `20260520_align_milestone_status_enum_values` - Updates existing data
   - `20260520_add_permission_system_tables` - Creates new tables
3. Builds Next.js and tests TypeScript

### Phase 3: Implement Missing Types (After Migrations)
1. Create `src/lib/assessment/attempt-types.ts`
2. Create `src/lib/offers/offer-types.ts`
3. Update code to use types instead of string literals
4. Run `npx tsc --noEmit` to verify

### Phase 4: Comprehensive Testing
1. Login flow works end-to-end
2. All routes using enums still work
3. Batch operations succeed
4. Permissions system initializes empty but doesn't crash

---

## 9. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Permission tables missing on login | HIGH | CRITICAL | Apply migration immediately |
| Enum migration fails | MEDIUM | HIGH | Test with sample data first |
| Type system still loose | MEDIUM | MEDIUM | Implement missing types after migrations |
| Data loss in enum migration | LOW | CRITICAL | Migration uses safe UPDATE, no DELETE |

---

## 10. Audit Checklist

- [x] List all models in schema vs migrations
- [x] Find enum definitions vs TypeScript types
- [x] Identify permission system gap
- [x] Check code for unmigrated features
- [x] Find uncommitted code changes
- [x] Verify migration safety (no deletions)
- [ ] Push and apply migrations
- [ ] Test login flow
- [ ] Verify enum values in production
- [ ] Implement missing TypeScript types

---

## Summary

**We are NOT at a stable point.** The system has accumulated ~6 commits of changes that haven't been pushed yet. Most critically, the permission system tables are defined in the schema but don't exist in the database, which breaks authentication.

**Blocking Issue:** Git credential/auth preventing push

**Next Step:** Resolve git push, then apply all migrations in order

**Data Safety:** ✅ All migrations are additive or safe UPDATEs. No data is deleted.
