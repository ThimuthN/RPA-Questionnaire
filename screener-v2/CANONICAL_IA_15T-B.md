# NORTHSTAR CANONICAL INFORMATION ARCHITECTURE (v1)

**Verified:** Batch 15T-B Route Canonicalization Audit  
**Date:** 2026-06-01  
**Baseline Commit:** 07aa336 (Batch 15S-F)

---

## CANONICAL ROUTE HIERARCHY

### PUBLIC TIER

**Unauthenticated, no admin required**

```
/                               Marketing home + workspace preview
/login                          Magic link / credential authentication
/jobs                           Public careers page (requires PUBLIC_JOBS_ENABLED)
├─ /jobs/[slug]                Job detail page (public)
└─ /jobs/application-status     Check application status
```

**Status:** ✅ Clean, no duplicates

---

### HIRING WORKSPACE TIER

**Authenticated users, role-based access**

```
/people/candidates              CANONICAL: Candidate database
├─ Links to: /candidates/[id]   (legacy, no equivalent at /people/candidates/[id])
├─ Links to: /candidates/new    (legacy, no equivalent at /people/candidates/new)
└─ [⚠️ TODO 15T-C: Create /people/candidates/[id] and /people/candidates/new]

/people/candidates/jobs         CANONICAL: Job management hub
├─ /people/candidates/jobs/[id] Job detail + edit
└─ /people/candidates/jobs/new  Create new job

/people/candidates/applicants   CANONICAL: Applicants from public jobs
└─ /people/candidates/applicants/[id] Applicant profile
```

**Status:** ⚠️ Partially canonical
- New `/people/*` structure correct
- But still links to legacy `/candidates/*` because equivalents don't exist yet

---

### ASSESSMENT WORKSPACE TIER

**Authenticated users**

```
/assessments                    CANONICAL: Assessment hub (entry point)
├─ /create-test                Create or assign assessment
├─ /addons                      Assessment template library
│  └─ /addons/[id]/review      View template details + answer key
├─ /results                     Results workspace + filtering
│  └─ /results/[attemptId]     Detailed result review + decision recording
└─ /run-test                    Public quick test runner (no auth required)
```

**Status:** ✅ Clean, well-isolated, no duplicates

---

### ASSESSMENT RUNTIME TIER

**Unauthenticated candidates taking assessments**

```
/(runtime)/a/[slug]/start                     Start assessment page
│                                             (validation, passcode, name/email entry)
├─ /(runtime)/a/[slug]/page                  Assessment info page
├─ /(runtime)/a/[slug]/attempt/[attemptId]   Take assessment (full-screen)
└─ /(runtime)/a/[slug]/result/[attemptId]    View result after submission
```

**Status:** ✅ Clean, well-structured, no conflicts

**Quick Live Testing:**
```
/(runtime)/quick/live                         Quick session entry
└─ /(runtime)/quick/live/[sessionCode]        Join live session
```

---

### ADMIN TIER

**Authenticated with `manage_users` permission**

```
/departments                    CANONICAL: Department management
├─ /departments/[id]           Department detail
└─ /departments/[id]/users     User assignments
```

**Status:** ✅ Clean, no duplicates

---

## REDIRECT ROUTES (Legacy but safe)

```
/people                         → /people/candidates
/candidates                     → /people/candidates (with query forwarding)
/users                          → /departments/[systemDeptId]/users
```

**Status:** ✅ All redirect correctly, used as fallbacks

---

## DISABLED ROUTES (v1 Limitations)

**All return explicit "disabled" messages, no data exposure**

```
/people/employees               Placeholder: "Employee management outside v1"
/people/employees/[id]         Placeholder: "Employee management outside v1"
/(runtime)/employee            Placeholder: "Employee HRMS outside v1"
/(runtime)/employee/verify     Dead code: "Employee HRMS outside v1"
/api/employees/*               All endpoints disabled
```

**Status:** ✅ Cleanly marked, no navigation links, safe to delete in future

---

## LEGACY BUT ACTIVE ROUTES

**Routes still functioning but not in canonical structure**

```
/candidates/[id]                LEGACY: Candidate profile
                                (linked from /people/candidates via CandidateWorkspaceTable)
                                (no /people/candidates/[id] equivalent exists)
                                [⚠️ TODO 15T-C: Migrate to /people/candidates/[id]]

/candidates/new                 LEGACY: Create candidate
                                (linked from /people/candidates/page.tsx)
                                (no /people/candidates/new equivalent exists)
                                [⚠️ TODO 15T-C: Migrate to /people/candidates/new]
```

**Status:** ⚠️ Working but deprecated
- Must be migrated in 15T-C
- Currently only active creation/profile pages for candidates

---

## REMOVED IN 15T-B

```
/live                           DELETED: Was dead redirect to /run-test
                                (no navigation links, no references in code)
```

---

## VERIFICATION STATUS (15T-B)

**Build:** ✅ Success  
**Lint:** ✅ No warnings  
**Tests:** ✓ Not run (audit batch)

**Changes Made:** 3 safe fixes, 9 LOC total
- Fixed marketing page legacy link (1 LOC)
- Simplified `/candidates/[id]` back button (1 LOC)
- Removed dead `/live` redirect (5 LOC deleted)

**Routes Deleted:** 1 (`/live`)  
**Routes Created:** 0  
**Routes Modified:** 2 (link updates only)

**Status:** ✅ Audit complete, safe fixes applied, no breaking changes

---

## NEXT BATCH RECOMMENDATION (15T-C)

Create canonical equivalents for candidate operations to fully canonicalize.
