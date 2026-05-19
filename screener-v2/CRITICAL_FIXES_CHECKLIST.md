# 🔥 CRITICAL FIXES CHECKLIST - Must Complete Before Production

## Week 1 Sprint (40 hours)

### 1. Magic Link Authentication Race Condition
**Severity:** CRITICAL | **Time:** 4 hours | **Complexity:** ⚠️ Medium

**Files to change:**
- `src/lib/auth/magic-link.ts` - Reorder token deletion/verification
- `src/lib/auth/app-auth.ts` - Add rate limiting on verification
- `src/lib/server/rate-limit.ts` - Implement verification attempt tracking

**Steps:**
- [ ] Delete token BEFORE verification (use `delete` with `catch`)
- [ ] Add `checkVerificationRateLimit()` - max 3 attempts per token
- [ ] Implement IP-based blocking after 5 failed attempts
- [ ] Log all verification attempts with user agent, IP
- [ ] Test: Verify token is unusable after first use
- [ ] Test: Verify replay attack is impossible

**Test case:**
```bash
# 1. Request magic link
curl -X POST /api/auth/magic/request -d 'email=test@example.com'
TOKEN="<from email>"

# 2. First verification should work
curl /api/auth/magic/verify?token=$TOKEN  # ✅ Success

# 3. Second verification should fail
curl /api/auth/magic/verify?token=$TOKEN  # ❌ "Invalid or already-used token"

# 4. IP blocking after 5 failures
for i in {1..5}; do curl /api/auth/magic/verify?token=invalid; done
# Next request should return 429 Too Many Requests
```

---

### 2. Permission Bootstrap Validation
**Severity:** CRITICAL | **Time:** 3 hours | **Complexity:** Low

**Files to change:**
- `src/lib/auth/app-auth.ts` - Define all valid permissions
- `src/lib/auth/guards.ts` - Type-safe permission checking
- `src/app/api/**/*` - Audit all permission checks

**Steps:**
- [ ] Create `const VALID_PERMISSIONS = [...]` in `auth/app-auth.ts`
- [ ] Add all used permissions: hire_candidate, promote_candidate, delete_candidate, update_candidate
- [ ] Change `requirePermission(session: AppSession, action: AppAction)` to `action: ValidPermission`
- [ ] Bootstrap creates ALL permissions in VALID_PERMISSIONS array
- [ ] Audit all API routes: grep -r "requirePermission" src/app/api/
- [ ] Ensure each permission is in VALID_PERMISSIONS

**All permissions checklist:**
- [ ] manage_users
- [ ] create_role / edit_role / delete_role
- [ ] create_job / edit_job / delete_job
- [ ] view_candidates / manage_candidates
- [ ] hire_candidate (missing!)
- [ ] promote_candidate (missing!)
- [ ] delete_candidate (missing!)
- [ ] update_candidate (missing!)
- [ ] create_invite
- [ ] view_results
- [ ] manage_addons

---

### 3. File Upload Validation
**Severity:** CRITICAL | **Time:** 5 hours | **Complexity:** ⚠️ Medium

**Files to change:**
- `src/lib/storage/blob-storage.ts` - Add validation before upload
- `src/app/api/candidates/[id]/resume/route.ts` - API validation
- Create `src/lib/candidates/file-validation.ts` - New validation module

**Steps:**
- [ ] Create validation module with MAX_SIZE = 10MB, ALLOWED_TYPES = ['application/pdf', 'application/msword', ...]
- [ ] Add file type validation using MIME type + magic bytes
- [ ] Add size validation (throw if > 10MB)
- [ ] Sanitize filename (remove /, \, .., null bytes)
- [ ] (Optional) Add ClamAV virus scanning
- [ ] Update API route to use validation
- [ ] Add error messages to UI
- [ ] Test: Upload valid PDF ✅
- [ ] Test: Upload .exe file ❌
- [ ] Test: Upload 50MB file ❌
- [ ] Test: Upload with path traversal `../../../etc/passwd` ❌

**Code template:**
```typescript
// src/lib/candidates/file-validation.ts
const MAX_RESUME_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export function validateResume(file: File): { ok: boolean; error?: string } {
  if (file.size > MAX_RESUME_SIZE) {
    return { ok: false, error: `File too large (max ${MAX_RESUME_SIZE / 1024 / 1024}MB)` };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { ok: false, error: 'Only PDF and Word documents allowed' };
  }
  const safeName = sanitizeFilename(file.name);
  if (safeName !== file.name) {
    return { ok: false, error: 'Invalid filename characters' };
  }
  return { ok: true };
}
```

---

### 4. CSV Import Validation
**Severity:** CRITICAL | **Time:** 4 hours | **Complexity:** Low

**Files to change:**
- `src/lib/candidates/csv.ts` - Add Zod validation
- `src/app/api/candidates/bulk/route.ts` - Use validated schema

**Steps:**
- [ ] Create Zod schema for candidate row validation
- [ ] Add fullName regex: /^[a-zA-Z\s'-]+$/ (letters, spaces, hyphens, apostrophes only)
- [ ] Add email validation: z.string().email()
- [ ] Add phone regex (if required): /^[\d\-\+\s\(\)]+$/
- [ ] Remove leading equals/+ signs (formula injection prevention)
- [ ] Validate each field before inserting
- [ ] Return validation errors to user
- [ ] Add max row limit: 1000 rows per import
- [ ] Test: Import valid CSV ✅
- [ ] Test: Import with formula injection `=cmd|'/c ...` ❌
- [ ] Test: Import with XSS `<img src=x onerror=...` ❌
- [ ] Test: Import with 2000 rows ❌ (over limit)

**Code template:**
```typescript
// src/lib/candidates/csv.ts
const candidateRowSchema = z.object({
  fullName: z.string()
    .min(1, "Name required")
    .max(255, "Name too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Invalid characters in name")
    .transform(s => s.trim()),
  email: z.string()
    .email("Invalid email format")
    .max(255)
    .toLowerCase(),
  phone: z.string()
    .regex(/^[\d\-\+\s\(\)]+$/, "Invalid phone format")
    .optional(),
  positionAppliedFor: z.string().max(255).optional()
});

export async function importCandidatesFromCsv(text: string) {
  const rows = parseCsvLine(text);
  if (rows.length > 1000) {
    throw new Error('Maximum 1000 rows allowed per import');
  }
  
  const validated = await Promise.all(
    rows.map((row, idx) => 
      candidateRowSchema.parse(row).catch(err => {
        throw new Error(`Row ${idx + 1}: ${err.message}`);
      })
    )
  );
  
  return validated;
}
```

---

### 5. Rate Limiting - Make Redis Mandatory
**Severity:** CRITICAL | **Time:** 3 hours | **Complexity:** Low

**Files to change:**
- `src/lib/server/rate-limit.ts` - Remove fallback, add timeout

**Steps:**
- [ ] Make Redis initialization fail hard (throw error if unavailable)
- [ ] Add timeout to all Redis operations (2 second max)
- [ ] Add proper error logging with request context
- [ ] Test that missing BLOB_READ_WRITE_TOKEN causes startup error
- [ ] Don't silently fall back to local cache
- [ ] Create `withTimeout(promise, ms)` helper

**Code template:**
```typescript
// src/lib/server/rate-limit.ts
import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_URL;
const redisToken = process.env.UPSTASH_REDIS_TOKEN;

if (!redisUrl || !redisToken) {
  throw new Error(
    "Rate limiting requires UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN"
  );
}

const redisClient = new Redis({
  url: redisUrl,
  token: redisToken
});

export async function checkRateLimit(key: string, windowMs: number) {
  const timeout = withTimeout(
    redisClient.get(key),
    2000 // 2 second timeout
  );
  
  const lastTime = await timeout;
  const now = Date.now();
  const lastValue = typeof lastTime === "number" ? lastTime : 0;
  
  if (now - lastValue < windowMs) {
    return false; // Rate limited
  }
  
  await withTimeout(
    redisClient.setex(key, Math.ceil(windowMs / 1000), now),
    2000
  );
  
  return true; // Allowed
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    )
  ]);
}
```

---

### 6. Fix API Endpoint - Missing NotificationBanner Component
**Severity:** BLOCKING | **Time:** 1 hour | **Complexity:** Low

**The error:** `Module not found: Can't resolve '@/components/primitives/NotificationBanner'`

**Files missing:**
- `src/components/primitives/NotificationBanner.tsx`

**Used by:**
- `src/components/users/AddUserModal.tsx`
- `src/app/departments/page.tsx`
- `src/app/users/page.tsx`

**Steps:**
- [ ] Create `src/components/primitives/NotificationBanner.tsx`
- [ ] Match existing primitive component pattern
- [ ] Export component from all three files

**Quick template:**
```typescript
// src/components/primitives/NotificationBanner.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const bannerVariants = cva(
  'w-full px-4 py-3 rounded-lg flex items-start gap-3',
  {
    variants: {
      variant: {
        success: 'bg-green-50 border border-green-200',
        warning: 'bg-yellow-50 border border-yellow-200',
        error: 'bg-red-50 border border-red-200',
        info: 'bg-blue-50 border border-blue-200'
      }
    },
    defaultVariants: { variant: 'info' }
  }
);

interface NotificationBannerProps extends VariantProps<typeof bannerVariants> {
  children: React.ReactNode;
  onClose?: () => void;
}

export function NotificationBanner({
  variant,
  children,
  onClose
}: NotificationBannerProps) {
  return (
    <div className={cn(bannerVariants({ variant }))}>
      <div className="flex-1">{children}</div>
      {onClose && (
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      )}
    </div>
  );
}
```

- [ ] Create `src/components/departments/AssignUserToDeptModal.tsx`
- [ ] Match modal component pattern

---

### 7. Type Safety - Remove `as any` Casts
**Severity:** HIGH | **Time:** 6 hours | **Complexity:** ⚠️ Medium

**Files with `as any`:**
- `src/components/users/AddUserModal.tsx` - action as any
- `src/components/candidates/CandidateNotesModal.tsx` - note as any
- `src/app/candidates/[id]/page.tsx` - candidate.orgStatus as any
- `src/lib/assessment-engine/scoring.ts` - answer as any (multiple)
- `src/components/interviews/InterviewRoundCard.tsx` - tone as any

**Steps for each:**
- [ ] Find file with `as any`
- [ ] Create proper type guard or discriminated union
- [ ] Replace cast with type guard
- [ ] Add unit test for type guard
- [ ] Verify TypeScript strict mode passes

**Example - scoring.ts:**
```typescript
// ❌ Before
function scoreQuestion(item: ExamQuestion, answer: any): ScoreOutput {
  // ...
}

// ✅ After
type AnswerInput = string | string[] | Record<string, unknown> | null | undefined;

function validateAnswer(answer: unknown): answer is AnswerInput {
  return (
    typeof answer === 'string' ||
    (Array.isArray(answer) && answer.every(a => typeof a === 'string')) ||
    (typeof answer === 'object' && answer !== null) ||
    answer === null ||
    answer === undefined
  );
}

function scoreQuestion(item: ExamQuestion, answer: unknown): ScoreOutput {
  if (!validateAnswer(answer)) {
    return { normalized: 0, pointsEarned: 0, pointsPossible: 0, isCorrect: false };
  }
  // answer is now properly typed
}
```

---

## Week 2-3 Sprint (35 hours)

### 8. Fix N+1 Permission Query Problem
**Severity:** HIGH | **Time:** 8 hours | **Complexity:** ⚠️⚠️ Hard

**Expected impact:** 3 queries/request → 1 query/request (3x performance improvement)

**Files to change:**
- `src/lib/auth/app-session.ts` - Combine queries
- `src/lib/auth/permission-evaluator.ts` - Delete or refactor

**Before:**
```
getAppSession() -> 3 queries:
  1. SELECT user WHERE id = $1
  2. SELECT rolePermissions WHERE roleId = $1
  3. SELECT permissionOverrides WHERE userId = $1
```

**After:**
```
getAppSession() -> 1 query:
  SELECT user (with role.permissions and permissionOverrides)
```

- [ ] Update Prisma relation loads to use `include` properly
- [ ] Merge permission calculation into one place
- [ ] Test with 100 concurrent requests - verify 100 queries instead of 300
- [ ] Add cache layer for session token

---

### 9. Fix Bulk Operations - Add Transactions
**Severity:** HIGH | **Time:** 4 hours | **Complexity:** ⚠️ Medium

**File:** `src/app/api/candidates/bulk/route.ts`

- [ ] Wrap bulk operations in `prisma.$transaction()`
- [ ] Verify all succeed or all fail
- [ ] Return count only if transaction succeeds
- [ ] Add detailed error messages (which operation failed, why)

---

### 10. Fix Result List Over-Fetching
**Severity:** HIGH | **Time:** 3 hours | **Complexity:** Low

**File:** `src/lib/db/result-repository.ts`

- [ ] Replace `include` with explicit `select`
- [ ] Omit examState, sectionState from list view
- [ ] Add pagination (default 50 rows)
- [ ] Test memory usage with 10k results

---

### 11. Add Error Boundaries
**Severity:** HIGH | **Time:** 4 hours | **Complexity:** Low

**Files:**
- `src/components/runtime/renderers/` - Wrap each renderer
- `src/app/(runtime)/**` - Wrap page boundaries
- Create `src/components/primitives/ErrorBoundary.tsx`

---

### 12. Complete Zod Validation Schemas
**Severity:** HIGH | **Time:** 4 hours | **Complexity:** Low

**Remove all `z.any()` and replace with proper schemas**

- [ ] `src/app/api/attempts/[attemptId]/autosave/route.ts`
- [ ] `src/app/api/attempts/start/route.ts`
- [ ] `src/app/api/candidacies/route.ts`

---

### 13. Fix useEffect Dependency Arrays
**Severity:** MEDIUM | **Time:** 4 hours | **Complexity:** Low

**Files to audit:**
- `src/components/candidates/EditCandidateInfoModal.tsx`
- `src/components/candidates/CandidateActivityModal.tsx`
- `src/components/candidates/CandidateCsvImportModal.tsx`

- [ ] Audit all useEffect hooks
- [ ] Ensure dependency arrays are correct
- [ ] Add cleanup functions for fetch requests

---

### 14. Add Loading States to Modals
**Severity:** MEDIUM | **Time:** 3 hours | **Complexity:** Low

- [ ] Add `isSubmitting` state to all form modals
- [ ] Disable submit button while submitting
- [ ] Show spinner + "Saving..." text
- [ ] Prevent double submissions

---

## Week 4 Sprint (25 hours)

### 15. Move Hardcoded Values to .env
**Severity:** MEDIUM | **Time:** 2 hours | **Complexity:** Low

**Variables to move:**
- SESSION_MAX_AGE (currently 7 days)
- MAX_BULK_IDS_PER_REQUEST (currently 500)
- MAX_CSV_ROWS (currently 1000)
- AUTOSAVE_RATE_LIMIT_MS (currently 5000)
- BULK_OP_RATE_LIMIT_MS (currently 30000)

---

### 16. Add Security Event Logging
**Severity:** MEDIUM | **Time:** 4 hours | **Complexity:** Low

**Add logging for:**
- [ ] Permission denial attempts
- [ ] Failed authentication attempts
- [ ] Suspicious patterns (10+ failures in 1 hour)
- [ ] File upload rejections
- [ ] CSV import errors

---

### 17. Implement Session Token Refresh
**Severity:** MEDIUM | **Time:** 3 hours | **Complexity:** ⚠️ Medium

- [ ] Refresh token if expiring within 24 hours
- [ ] Return new token in response headers
- [ ] Update cookie on client
- [ ] Test: Token refreshes automatically

---

### 18. Add Request Timeout Middleware
**Severity:** MEDIUM | **Time:** 3 hours | **Complexity:** Low

- [ ] Create middleware that aborts requests after 30 seconds
- [ ] Return 408 timeout error
- [ ] Log slow requests (>5 seconds)

---

### 19. Create E2E Tests
**Severity:** MEDIUM | **Time:** 10 hours | **Complexity:** ⚠️⚠️ Hard

**Critical paths to test:**
- [ ] User signup → magic link → login → create assessment
- [ ] Candidate import → assessment invite → candidate takes test → results
- [ ] Permission checks (non-admin can't access admin routes)
- [ ] Bulk operations (add 500 candidates to department)
- [ ] File upload (valid + invalid files)
- [ ] Rate limiting (exceed limits)

---

## Tracking Sheet

```
Week 1 - CRITICAL FIXES
[ ] 1. Magic link race condition         4h  Owner: ___
[ ] 2. Permission bootstrap              3h  Owner: ___
[ ] 3. File upload validation            5h  Owner: ___
[ ] 4. CSV import validation             4h  Owner: ___
[ ] 5. Rate limiting mandatory           3h  Owner: ___
[ ] 6. Missing components (build error)  1h  Owner: ___
[ ] 7. Remove `as any` casts             6h  Owner: ___
TOTAL: 26 hours (leaves 14h buffer for testing/fixes)

Week 2-3 - MAJOR PERFORMANCE
[ ] 8.  Fix N+1 permission queries       8h  Owner: ___
[ ] 9.  Bulk operations transactions     4h  Owner: ___
[ ] 10. Result list pagination           3h  Owner: ___
[ ] 11. Add error boundaries             4h  Owner: ___
[ ] 12. Complete Zod validation          4h  Owner: ___
[ ] 13. Fix useEffect dependencies       4h  Owner: ___
[ ] 14. Loading states in modals         3h  Owner: ___
TOTAL: 30 hours (leaves 5h buffer)

Week 4 - MEDIUM IMPROVEMENTS
[ ] 15. Move to .env variables           2h  Owner: ___
[ ] 16. Security event logging           4h  Owner: ___
[ ] 17. Session token refresh            3h  Owner: ___
[ ] 18. Request timeout middleware       3h  Owner: ___
[ ] 19. E2E test suite                  10h  Owner: ___
TOTAL: 22 hours
```

---

## Definition of Done for Each Fix

Each fix is complete when:
1. Code changes are written
2. TypeScript strict mode passes (`tsc --noEmit`)
3. Linting passes (`npm run lint`)
4. Existing tests still pass (`npm run test`)
5. New tests added for the fix
6. Tested manually in development
7. Code reviewed (if on team)
8. Merged to main branch

---

## Risk Matrix

| Item | Complexity | Risk if Wrong | Testing Effort |
|------|-----------|--------------|----------------|
| 1. Magic link | Medium | CRITICAL | 3 hours |
| 2. Permissions | Low | HIGH | 2 hours |
| 3. File upload | Medium | HIGH | 2 hours |
| 4. CSV validation | Low | MEDIUM | 1 hour |
| 5. Rate limiting | Low | MEDIUM | 1 hour |
| 6. Missing components | Low | CRITICAL | 0.5 hours |
| 7. Type assertions | Medium | MEDIUM | 2 hours |
| 8. N+1 queries | HARD | HIGH | 4 hours |
| 9. Transactions | Medium | HIGH | 2 hours |
| 10. Pagination | Low | MEDIUM | 1 hour |

---

**ESTIMATED TOTAL EFFORT:** 100 hours = 2.5 weeks with full-time developer

**RECOMMENDED APPROACH:**
- Week 1: Fix critical security issues (6-7 items)
- Week 2-3: Fix performance and major issues (8-14 items)
- Week 4: Polish and testing (15-19 items)
- Week 5: Load testing, monitoring setup, documentation

**BEFORE YOU CAN DEPLOY TO PRODUCTION:**
✅ Complete all Week 1 items (minimum)
✅ Complete item 8 (N+1 queries) from Week 2
✅ Pass load test (100+ concurrent users)
✅ Pass security review
✅ Have backup/disaster recovery plan
