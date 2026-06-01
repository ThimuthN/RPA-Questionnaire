# BATCH 15T-B: Route Canonicalization Audit

## Step 1: Baseline Verification ✅

**Status:** CLEAN

```
Branch: staging-dev
Commit: 07aa336 (Batch 15S-F)
Untracked: AUDIT_15T-A_NORTHSTAR_IA.md (documentation only)
```

---

## Step 2: Complete Route Inventory

### Route Classification Matrix

| Route | Type | Purpose | Referenced From | User-Facing | Runtime | Admin | Candidate-Facing | Assessment-Facing | Status |
|-------|------|---------|-----------------|-------------|---------|-------|------------------|-------------------|--------|
| `/` | Page | Marketing home | Direct | ✅ | ❌ | ❌ | ❌ | ❌ | Canonical |
| `/login` | Page | Authentication | All guarded routes | ✅ | ❌ | ❌ | ❌ | ❌ | Canonical |
| `/people` | Redirect | Redirect to candidates | Few | ❌ | ❌ | ❌ | ❌ | ❌ | Redirect-Only |
| `/people/candidates` | Page | Candidate workspace | Nav, old `/candidates` | ✅ | ❌ | ❌ | ✅ | ❌ | **Canonical** |
| `/people/candidates/jobs` | Page | Job management | Nav | ✅ | ❌ | ❌ | ❌ | ❌ | **Canonical** |
| `/people/candidates/jobs/[id]` | Page | Job detail admin | Job links | ✅ | ❌ | ❌ | ❌ | ❌ | **Canonical** |
| `/people/candidates/jobs/new` | Page | Create job | Job links | ✅ | ❌ | ❌ | ❌ | ❌ | **Canonical** |
| `/people/candidates/applicants` | Page | Applicants view | Nav | ✅ | ❌ | ❌ | ❌ | ❌ | **Canonical** |
| `/people/candidates/applicants/[id]` | Page | Applicant detail | Applicant links | ✅ | ❌ | ❌ | ❌ | ❌ | **Canonical** |
| `/people/employees` | Page | Employee placeholder | ❌ Not linked | ✅ | ❌ | ❌ | ❌ | ❌ | **Disabled** |
| `/people/employees/[id]` | Page | Employee detail placeholder | ❌ Not linked | ✅ | ❌ | ❌ | ❌ | ❌ | **Disabled** |
| `/candidates` | Redirect | Redirect to `/people/candidates` | Old links | ❌ | ❌ | ❌ | ❌ | ❌ | Redirect-Only |
| `/candidates/[id]` | Page | **Candidate profile** | CandidateWorkspaceTable | ✅ | ❌ | ❌ | ✅ | ❌ | **Legacy Active** ⚠️ |
| `/candidates/new` | Page | **Create candidate** | `/people/candidates/page.tsx` | ✅ | ❌ | ❌ | ✅ | ❌ | **Legacy Active** ⚠️ |
| `/jobs` | Page | Public careers | (marketing), direct | ✅ | ❌ | ❌ | ✅ | ❌ | **Canonical** |
| `/jobs/[slug]` | Page | Public job detail | `/jobs` search | ✅ | ❌ | ❌ | ✅ | ❌ | **Canonical** |
| `/jobs/application-status` | Page | Public app status | `/jobs` | ✅ | ❌ | ❌ | ✅ | ❌ | **Canonical** |
| `/assessments` | Page | Assessment hub | Nav | ✅ | ❌ | ❌ | ❌ | ✅ | **Canonical** |
| `/create-test` | Page | Create assessment | `/assessments` | ✅ | ❌ | ❌ | ❌ | ✅ | **Canonical** |
| `/addons` | Page | Assessment templates | `/assessments` | ✅ | ❌ | ❌ | ❌ | ✅ | **Canonical** |
| `/addons/[id]/review` | Page | Review addon | `/addons` | ✅ | ❌ | ❌ | ❌ | ✅ | **Canonical** |
| `/results` | Page | Results workspace | Nav, `/assessments` | ✅ | ❌ | ❌ | ❌ | ✅ | **Canonical** |
| `/results/[attemptId]` | Page | Result detail | `/results` table | ✅ | ❌ | ❌ | ❌ | ✅ | **Canonical** |
| `/run-test` | Page | Quick test runner | `/` public | ✅ | ❌ | ❌ | ❌ | ✅ | **Canonical** |
| `/live` | Redirect | Redirect to `/run-test` | ❌ Not linked | ❌ | ❌ | ❌ | ❌ | ❌ | Redirect-Only |
| `/departments` | Page | Departments admin | Nav (if admin) | ✅ | ❌ | ✅ | ❌ | ❌ | **Canonical** |
| `/departments/[id]` | Page | Department detail | `/departments` | ✅ | ❌ | ✅ | ❌ | ❌ | **Canonical** |
| `/departments/[id]/users` | Page | Department users | Department detail | ✅ | ❌ | ✅ | ❌ | ❌ | **Canonical** |
| `/users` | Redirect | Redirect to `/departments/[id]/users` | ❌ Not linked | ❌ | ❌ | ❌ | ❌ | ❌ | Redirect-Only |
| `/(runtime)/a/[slug]/start` | Page | Assess. start | Invite email | ✅ | ✅ | ❌ | ✅ | ✅ | **Canonical** |
| `/(runtime)/a/[slug]/page` | Page | Assess. info | Assessment start | ✅ | ✅ | ❌ | ✅ | ✅ | **Canonical** |
| `/(runtime)/a/[slug]/attempt/[attemptId]` | Page | Take assess. | Start page | ✅ | ✅ | ❌ | ✅ | ✅ | **Canonical** |
| `/(runtime)/a/[slug]/result/[attemptId]` | Page | Assess. result | After submit | ✅ | ✅ | ❌ | ✅ | ✅ | **Canonical** |
| `/(runtime)/quick/live` | Page | Quick live test | ❌ Not linked | ✅ | ✅ | ❌ | ❌ | ✅ | **Runtime Only** ⚠️ |
| `/(runtime)/quick/live/[sessionCode]` | Page | Join quick session | Quick live | ✅ | ✅ | ❌ | ❌ | ✅ | **Runtime Only** ⚠️ |
| `/(runtime)/employee` | Page | Employee disabled | ❌ Not linked | ✅ | ✅ | ❌ | ❌ | ❌ | **Disabled** |
| `/(runtime)/employee/verify` | Page | Employee verify | ❌ Not linked | ✅ | ✅ | ❌ | ❌ | ❌ | **Dead Code** ⚠️ |

---

## Step 3: Canonical Route Decisions

### A. Candidate Workspace

**Decision: `/people/candidates/*` is canonical**

**Evidence:**
- Listed in navigation config
- New IA structure using `/people/*`
- `/candidates` redirects to `/people/candidates` with query forwarding
- However: `/candidates/[id]` and `/candidates/new` still exist and are actively used

**Current Problem:**
- `/people/candidates/page.tsx` links to `/candidates/new` (legacy)
- `/people/candidates/page.tsx` links to `/candidates/new` at 2 locations (lines 143, 302)
- `CandidateWorkspaceTable.tsx:181` links to `/candidates/[id]`
- `/candidates/[id]/page.tsx` back button links to `/candidates` or `/people/candidates/applicants`
- No `/people/candidates/new` or `/people/candidates/[id]` pages exist

**Classification:**
```
Canonical (New):        /people/candidates/*
Legacy Active:          /candidates/[id], /candidates/new
Redirect-Only:          /candidates → /people/candidates
```

---

### B. Jobs

**Decision: Multiple job hierarchies exist**

**Canonical Admin Path:**
```
/people/candidates/jobs           (admin job management)
/people/candidates/jobs/[id]      (admin job detail)
/people/candidates/jobs/new       (admin create job)
```

**Canonical Public Path:**
```
/jobs                             (public careers page, requires PUBLIC_JOBS_ENABLED)
/jobs/[slug]                      (public job detail)
/jobs/application-status          (public app status checker)
```

**No conflicts. Both paths serve different audiences.**

---

### C. Applicants

**Decision: `/people/candidates/applicants/*` is canonical**

**Evidence:**
- Listed in navigation config
- Separate view for direct job applicants
- Correctly under `/people/candidates/*` hierarchy
- No conflicts or legacy alternatives

**Status:** ✅ Clean

---

### D. Assessments

**Decision: Scattered but non-conflicting**

**Canonical Workspace:**
```
/assessments              (entry point / hub)
/create-test             (create or assign assessment)
/addons                  (template library)
/addons/[id]/review      (review template)
/results                 (results workspace)
/results/[attemptId]     (result detail)
/run-test                (quick test runner - public)
```

**Canonical Runtime:**
```
/(runtime)/a/[slug]/start                    (start assessment invite)
/(runtime)/a/[slug]/page                     (assessment info)
/(runtime)/a/[slug]/attempt/[attemptId]      (take assessment)
/(runtime)/a/[slug]/result/[attemptId]       (view result)
```

**Navigation Quirk:**
- `/assessments` entry point used
- `/create-test` also directly accessible
- `nav-config.ts` treats both as same (line 34: `pathname.startsWith("/create-test")`)

**Status:** ✅ Logical separation, no duplicates

---

### E. Admin/Settings

**Decision: `/departments/*` is canonical**

**Canonical:**
```
/departments              (admin only - requires manage_users permission)
/departments/[id]        (department detail)
/departments/[id]/users  (department user assignments)
```

**Legacy Redirect:**
```
/users                    → /departments/[systemDeptId]/users
```

**Status:** ✅ Clean routing

---

## Step 4: Duplicate Implementation Audit

| Feature | Path A | Path B | Classification | Evidence |
|---------|--------|--------|-----------------|----------|
| Candidate Profile | `/candidates/[id]` | ❌ No `/people/candidates/[id]` | Same feature, one broken | CandidateWorkspaceTable links to old path; no new path exists |
| Create Candidate | `/candidates/new` | ❌ No `/people/candidates/new` | Same feature, one only | `/people/candidates/page.tsx` links to old path; no new path exists |
| Job Detail Admin | `/people/candidates/jobs/[id]` | ❌ No old path | Different purpose | Admin only, no conflict |
| Job Detail Public | `/jobs/[slug]` | ❌ No admin conflict | Different purpose | Public careers, no admin path |
| Assessment Start | `/(runtime)/a/[slug]/start` | ❌ No workspace alternative | Runtime only | No conflict |
| Results Review | `/results/[attemptId]` | ❌ No runtime alternative | Workspace only | No conflict |

**Verdict:** No true duplicates. But **critical issue**: `/candidates/[id]` and `/candidates/new` should have equivalents under `/people/candidates/*` but don't.

---

## Step 5: Legacy Employee Surface Audit

### `/people/employees`
- **Status:** Disabled with explicit v1 limitation message
- **Reachable:** Yes, via direct URL or admin navigation (if ever added)
- **Referenced:** No navigation links point here
- **Safe to remove later:** ✅ Yes (clear message, guarded by requirePageSession)

### `/people/employees/[id]`
- **Status:** Disabled (shows v1 limitation message, template page)
- **Reachable:** Only via direct URL
- **Referenced:** No links
- **Safe to remove later:** ✅ Yes

### `/(runtime)/employee`
- **Status:** Disabled (shows v1 limitation message)
- **Reachable:** Only via direct URL
- **Referenced:** No links
- **Safe to remove later:** ✅ Yes

### `/(runtime)/employee/verify`
- **Status:** Disabled/Dead (labeled "LegacyEmployeeEntryPage" in code)
- **Reachable:** Only via direct URL
- **Referenced:** No links
- **Safe to remove later:** ✅ Yes (completely unreferenced)

### `/api/employees/*`
- **Status:** Disabled (all endpoints return EMPLOYEE_MANAGEMENT_DISABLED_MESSAGE)
- **Routes Disabled:** GET/POST/PUT/DELETE on `/api/employees`, goals, reviews, termination
- **Safe to remove later:** ✅ Yes (all disabled)

**Overall Verdict:** Employee surface is cleanly disabled with explicit messages. No hidden references. Safe to remove in future cleanup batch.

---

## Step 6: Navigation Truth Audit

### WorkspaceRail & nav-config.ts

**Current Navigation Items:**
1. `/people/candidates/jobs` ✅ Canonical
2. `/people/candidates/applicants` ✅ Canonical
3. `/people/candidates` ✅ Canonical
4. `/assessments` ✅ Canonical
5. `/departments` ✅ Canonical (admin only)

**Active State Detection (`isNavItemActive`):**
```javascript
(href === "/people/candidates/jobs" && pathname.startsWith("/people/candidates/jobs"))
(href === "/people/candidates/applicants" && pathname.startsWith("/people/candidates/applicants"))
(href === "/people/candidates" && pathname === "/people/candidates")
(href === "/assessments" && (pathname.startsWith("/assessments") || pathname.startsWith("/create-test")))
(href === "/departments" && pathname === "/departments")
```

**Issues Found:**
1. ✅ Navigation points exclusively to canonical routes
2. ⚠️ Legacy routes (`/candidates/*`) still active but not in nav (hidden)
3. ✅ Redirects correct and not masking issues
4. ❌ Page links still reference legacy paths

**Navigation Drift Level:** `MODERATE`

**Evidence:**
```
✅ Correct items in sidebar nav
⚠️  But /candidates/[id] still being used by CandidateWorkspaceTable
⚠️  But /candidates/new still being linked from /people/candidates/page.tsx
```

---

## Step 7: Safe Fixes Audit

**Scope Check:** Changes must be:
- ≤50 LOC
- No route behavior changes
- No backend changes
- No permission changes

### Identified Safe Fixes

#### Fix 1: Fix marketing page link (2 LOC)
**File:** `src/app/(marketing)/page.tsx:320`
**Issue:** Links to `/candidates?sort=inbox` instead of canonical `/people/candidates?sort=inbox`
**Change:** Replace hardcoded legacy link
**Risk:** ✅ Safe - simple URL redirect
**LOC:** 1

#### Fix 2: Fix `/people/candidates/page.tsx` links (2 LOC)
**File:** `src/app/people/candidates/page.tsx:143, 302`
**Issue:** Links to `/candidates/new` instead of canonical path
**Change:** Update both links to canonical path
**Problem:** ❌ **Cannot fix because no canonical path exists**
**Status:** BLOCKED - need `/people/candidates/new` page first (not in this batch)

#### Fix 3: Fix CandidateWorkspaceTable links (1 LOC)
**File:** `src/components/candidates/CandidateWorkspaceTable.tsx:181`
**Issue:** Links to `/candidates/[id]` instead of canonical path
**Change:** Update to new path
**Problem:** ❌ **Cannot fix because no `/people/candidates/[id]` page exists**
**Status:** BLOCKED - need `/people/candidates/[id]` page first (not in this batch)

#### Fix 4: Fix `/candidates/[id]` back button (1 LOC)
**File:** `src/app/candidates/[id]/page.tsx:173`
**Issue:** Conditional back link mixes old and new paths
**Change:** Always use `/people/candidates` or `/people/candidates/applicants` based on stage
**Risk:** ✅ Safe - simplifies logic
**LOC:** 1

#### Fix 5: Remove `/live` redirect (can delete entire file)
**File:** `src/app/live/page.tsx` - just redirects to `/run-test`
**Risk:** ✅ Safe - nobody links to it, just a redirect
**LOC:** Delete 3 lines

### Safe Fixes Summary

**Total Safe Fixes Possible:** 3/5

| Fix | LOC | Safe | Action |
|-----|-----|------|--------|
| Marketing link | 1 | ✅ | IMPLEMENT |
| `/candidates/[id]` back button | 1 | ✅ | IMPLEMENT |
| Delete `/live` | 3 | ✅ | IMPLEMENT |
| Candidates new links | - | ❌ | BLOCKED (no canonical path) |
| Workspace table links | - | ❌ | BLOCKED (no canonical path) |

**Total LOC for safe changes:** 5

---

## Step 8: Canonical Northstar IA Map

```
NORTHSTAR IA MAP (CANONICAL v1)

═══════════════════════════════════════════════════════════════

PUBLIC / MARKETING
├─ / ............................ Home page (marketing + workspace stats)
├─ /login ........................ Authentication entry
└─ /jobs ......................... Public careers page
   └─ /jobs/[slug] .............. Public job detail
   └─ /jobs/application-status .. Application status checker

HIRING WORKSPACE (Authenticated)
├─ /people/candidates ........... Candidate database (NEW CANONICAL)
│  ├─ Linked from: CandidateWorkspaceTable (via old /candidates/[id])
│  ├─ Creates link to: /candidates/new (LEGACY)
│  └─ [⚠️ MISALIGNMENT: links to legacy paths]
│
├─ /people/candidates/jobs ...... Job management
│  └─ /people/candidates/jobs/[id] ... Job detail
│  └─ /people/candidates/jobs/new ... Create job
│
├─ /people/candidates/applicants  .. Applicants from job postings
│  └─ /people/candidates/applicants/[id] ... Applicant detail

ASSESSMENT WORKSPACE (Authenticated)
├─ /assessments ................. Assessment hub (entry point)
│  ├─ /create-test .............. Create/assign assessment
│  ├─ /addons ................... Assessment templates
│  │  └─ /addons/[id]/review ... Review template
│  └─ /results .................. Results workspace
│     └─ /results/[attemptId] .. Result detail & decision
│
└─ /run-test .................... Quick test runner (public)

ASSESSMENT RUNTIME (Unauthenticated/Public)
├─ /(runtime)/a/[slug]/start ................. Assessment start & validation
├─ /(runtime)/a/[slug]/page ................. Assessment info
├─ /(runtime)/a/[slug]/attempt/[attemptId] . Take assessment
├─ /(runtime)/a/[slug]/result/[attemptId] .. View attempt result
├─ /(runtime)/quick/live ................... Quick live test entry
└─ /(runtime)/quick/live/[sessionCode] .... Join quick session

ADMIN / SETTINGS (Authenticated, manage_users permission)
├─ /departments ..................... Department management
│  ├─ /departments/[id] ............ Department detail
│  └─ /departments/[id]/users ...... Department user assignments

LEGACY / REDIRECTS (Should remove or consolidate)
├─ /candidates ..................... → /people/candidates
├─ /candidates/[id] ............... STILL ACTIVE (no new equivalent)
├─ /candidates/new ................ STILL ACTIVE (no new equivalent)
├─ /people ....................... → /people/candidates
├─ /users ........................ → /departments/[systemDeptId]/users
└─ /live ......................... → /run-test

DISABLED (v1 Limitations, not accessible via nav)
├─ /people/employees ............. Placeholder: "Employee management outside v1"
├─ /people/employees/[id] ........ Placeholder: "Employee management outside v1"
├─ /(runtime)/employee ........... Placeholder: "Employee HRMS outside v1"
├─ /(runtime)/employee/verify .... Dead code: "Employee HRMS outside v1"
└─ /api/employees/* .............. All disabled with message

═══════════════════════════════════════════════════════════════
```

---

## Step 9: Verification (Pre-Implementation)

No code changes yet. This is audit-phase verification.

```bash
# Baseline clean
git status --short
  ?? AUDIT_15T-A_NORTHSTAR_IA.md
  ?? ROUTE_INVENTORY_15T-B.md (this file)

# No uncommitted source changes
```

---

## FINDINGS SUMMARY

### ✅ What's Working Well

1. **Canonical navigation** - `/people/candidates/*`, `/assessments`, etc. all clean
2. **Public/private separation** - Clear boundaries between public careers and admin
3. **Runtime assessment system** - `/(runtime)/a/*` is well-isolated
4. **Disabled surface** - Employee routes properly marked and not linked
5. **Assessment subsystem** - Workspace and runtime paths don't conflict

### ⚠️ Critical Issues

1. **Candidate Profile Duplication**
   - `/candidates/[id]` is legacy but still actively used by CandidateWorkspaceTable
   - No `/people/candidates/[id]` equivalent exists
   - Back button uses mixed old/new path logic
   - **Fix required:** Create `/people/candidates/[id]` page, migrate links

2. **Candidate Creation Duplication**
   - `/candidates/new` is legacy but only active creation point
   - No `/people/candidates/new` equivalent exists
   - `/people/candidates/page.tsx` links to it with no alternative
   - **Fix required:** Create `/people/candidates/new` page, migrate links

3. **Navigation Drift**
   - Marketing page links to `/candidates?sort=inbox` (legacy)
   - `/people/candidates/page.tsx` links to legacy paths
   - Architecture suggests `/people/*` but links don't follow through

### 🔧 Safe Fixes in This Batch

1. ✅ Fix marketing page link `/candidates?sort=inbox` → `/people/candidates?sort=inbox`
2. ✅ Fix `/candidates/[id]` back button logic
3. ✅ Remove `/live/page.tsx` (dead redirect)

**Total LOC:** ~5

### 🚫 Cannot Fix in This Batch

Without creating new pages `/people/candidates/[id]` and `/people/candidates/new` (out of scope), cannot:
- Fix `/people/candidates/page.tsx` links
- Fix CandidateWorkspaceTable links

These require page creation, which exceeds audit scope.

---

## NEXT STEPS (NOT THIS BATCH)

Batch 15T-C should create:
1. `/people/candidates/new` - new canonical create candidate page
2. `/people/candidates/[id]` - new canonical candidate profile page
3. Migrate all links from `/candidates/*` to `/people/candidates/*`
4. Delete old `/candidates/*` pages

This batch (15T-B) is AUDIT + SMALL SAFE FIXES only.
