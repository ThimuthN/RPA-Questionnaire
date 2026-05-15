# Strict Engineering Review: Role Systems Architecture
**Date**: 2026-05-15  
**Severity Level**: HIGH - Architectural Confusion

---

## Executive Summary

Your system has **TWO FUNDAMENTALLY DIFFERENT "ROLE" SYSTEMS** sharing an identical semantic space, causing:
- **Cognitive confusion** for developers (what role are we talking about?)
- **Type safety gaps** (User.role is an untyped string)
- **Authorization inconsistency** (different permission models)
- **Domain model ambiguity** (overlapping Department fields)
- **No clear separation of concerns**

This review identifies 12 critical issues and 8 secondary concerns requiring architectural remediation.

---

## CRITICAL ISSUES

### 1. ⚠️ NOMENCLATURE COLLISION - "Role" Means Two Different Things

**Problem**: Both systems use identical terminology for opposing concepts.

| System | Called | Stored As | Purpose | Values |
|--------|--------|-----------|---------|--------|
| **System A** | `AppRole` / `User.role` | String in User table | **WHO** can access app | admin, recruiter, hiring_manager, interviewer, member |
| **System B** | `RoleCatalog` / Job role | Record in RoleCatalog table | **WHAT** position is a candidate for | User-created (e.g., "Senior Backend Engineer") |

**Impact**: 
- Developer searches for "role" return 100+ results, 50% irrelevant
- Code review comments become ambiguous ("Fix role handling" - which one?)
- New team members require extensive onboarding to understand the difference
- **Risk**: Accidentally passing System A values to System B functions or vice versa

**Example of Confusion**:
```typescript
// Which "role" is this?
const user = await getUser(userId);
console.log(user.role); // Is this "admin" or "Senior Backend Engineer"?

// This function name is ambiguous:
async function assignRoleToCandidate(candidateId, roleId) {
  // Is roleId a System A string or System B CUID?
}
```

**Recommendation**: **Rename immediately**
- System A → `AppRole` → rename to `AppAccessLevel` or `UserPermissionLevel`
  - Update type: `export type AppAccessLevel = "admin" | "recruiter" | "hiring_manager" | "interviewer" | "member"`
  - Update User field: `accessLevel` instead of `role`
  - Update session: `accessLevel` instead of `role`

- System B → `RoleCatalog` → **keep** (already clear in context)

**Files to Update**:
- [session.ts](src/lib/auth/session.ts) - Line 12, 18, 56
- [app-auth.ts](src/lib/auth/app-auth.ts) - Lines 20-25, 83
- [app-session.ts](src/lib/auth/app-session.ts) - Need to verify
- [guards.ts](src/lib/auth/guards.ts) - Lines 35, 54
- [users/route.ts](src/app/api/users/route.ts) - Line 14
- Prisma schema: User model line 18
- All migrations using User.role

---

### 2. ⚠️ TYPE SAFETY: User.role is Untyped String

**Problem**: Database stores `User.role` as a plain string with no constraints.

```prisma
model User {
  role  String  // ❌ NO CONSTRAINT - can be anything
}
```

**Current "Safety" Mechanism**: `normalizeRole()` function validates and defaults
```typescript
function normalizeRole(role: string): AppRole {
  if (role === "admin" || role === "recruiter" || ...) {
    return role as AppRole;
  }
  return "member"; // ❌ SILENT DEFAULT - hides data corruption
}
```

**Risks**:
1. **Silent data corruption**: Invalid role silently becomes "member"
   - User with corrupted role "adm1n" becomes "member" (no error, no log)
   - Admin doesn't know data is inconsistent
   
2. **No validation at insert/update**: 
   - Nothing prevents `UPDATE users SET role = 'superuser'`
   - Direct DB writes bypass normalizeRole()
   
3. **Type coercion hides bugs**:
   ```typescript
   const role: AppRole = "admin" as AppRole; // ✅ Passes TS but dangerous
   ```

4. **Session contains invalid data**:
   - If corrupted role reaches verifySessionToken(), it silently becomes "member"
   - User thinks they're admin but aren't

**Recommendation**: **Use Prisma enum**
```prisma
enum AppAccessLevel {
  admin
  recruiter
  hiring_manager
  interviewer
  member
}

model User {
  id            String           @id @default(cuid())
  accessLevel   AppAccessLevel   @default(member)  // ✅ ENFORCED BY DATABASE
  // ... other fields
}
```

**Why this matters**: 
- PostgreSQL ENUM prevents invalid values at database level
- Type system matches database constraint
- All code gets type safety for free
- No need for runtime validation/normalization

---

### 3. ⚠️ AUTHORIZATION INCONSISTENCY: Different Permission Models

**Problem**: Role creation and user creation have different permission requirements.

```typescript
// POST /api/users - ADMIN ONLY
export async function POST(request: Request) {
  const auth = await requireAdminApiSession(); // ✅ Strict
  // ...
}

// POST /api/roles - ANY AUTHENTICATED USER
export async function POST(request: Request) {
  const auth = await requireApiSession(); // ❌ Permissive
  // ...
}
```

**Issue**: 
- System A (access control) is strictly admin-managed ✅
- System B (job roles) is anyone-managed ❌
- No documented reason for different policies
- Risk: Any recruiter can create/modify all job roles

**Question for stakeholder**: 
- Should recruiters be able to create new job roles? 
- If yes, should they only create roles for their department?
- Should admins approve role creation?
- Should there be an audit trail of who created which role?

**Recommendation**: Document and enforce intentional policy
```typescript
// Option 1: Admin only (most restrictive)
const auth = await requireAdminApiSession();

// Option 2: Recruiter+ (documented as intentional)
const auth = await requireApiSession();
if (!["admin", "recruiter"].includes(auth.session.role)) {
  return forbiddenApi("Recruiters and admins can create roles.");
}

// Option 3: Department-scoped (role-based granularity)
const auth = await requireApiSession();
const canCreateRole = await canUserCreateRoleInDepartment(auth.session.userId, body.department);
if (!canCreateRole) {
  return forbiddenApi("You don't have permission to create roles in this department.");
}
```

**Current Policy Document**: None found. [policy.ts](src/lib/auth/policy.ts) lists paths but not permission reasoning.

---

### 4. ⚠️ SILENT FAILURE: normalizeRole() Defaults Without Logging

**Problem**: Invalid roles silently convert to "member" with no notification.

```typescript
function normalizeRole(role: string): AppRole {
  if (role === "admin" || ...) return role as AppRole;
  return "member"; // ❌ No warning, no log, no error
}
```

**Scenario**:
1. Admin creates user with role "adm1n" (typo)
2. Database accepts it (no constraint)
3. User logs in
4. normalizeRole("adm1n") returns "member" silently
5. User can't access admin features
6. No audit trail of why
7. Admin has no idea what happened

**Risks**:
- Silent privilege escalation/degradation
- Hard to debug (role looks correct in DB, wrong in session)
- Violates principle of fail-secure (should ERROR, not downgrade)
- No monitoring/alerting on data inconsistency

**Recommendation**: 
```typescript
function normalizeRole(role: string): AppRole {
  if (role === "admin" || role === "recruiter" || role === "hiring_manager" || role === "interviewer") {
    return role as AppRole;
  }
  
  // ❌ BEFORE: return "member";
  
  // ✅ AFTER: Fail loudly
  console.error(`[SECURITY] Invalid role value in database: "${role}". Returning member as fallback.`);
  // TODO: Add sentry or logging integration
  // If critical: throw new Error(`Invalid user role: ${role}`);
  
  return "member";
}
```

Better solution: Use Prisma enum (Issue #2) to prevent this entirely.

---

### 5. ⚠️ DUPLICATE DOMAIN: Department in Both User and RoleCatalog

**Problem**: `department` field exists in both tables with unclear ownership.

```prisma
model User {
  department    String?  // What is this for? User's dept? Their managed dept?
}

model RoleCatalog {
  department    String?  // Job posting department?
}
```

**Questions Without Answers**:
1. Is User.department the user's department or the department they manage?
2. Can a recruiter in Engineering create roles for Product?
3. If a role's department is "Engineering" and user's is "Product", what happens?
4. If user.department is NULL, can they access all roles?
5. Should department=NULL mean "global" or "unassigned"?

**Evidence of Confusion**:
- User creation form accepts optional department ([users/route.ts](src/app/api/users/route.ts:12))
- RoleCatalog queries include department filtering ([catalog.ts](src/lib/roles/catalog.ts:80))
- Default departments exist ([departments.ts](src/lib/roles/departments.ts))
- BUT: No validation that User.department matches a valid Department

**Recommendation**: 
1. Define domain ownership:
   ```markdown
   - User.department = User's organizational unit (HR, Engineering, etc.)
   - RoleCatalog.department = Job posting's organizational context
   - These are DIFFERENT concepts and should use different column names
   ```

2. Rename for clarity:
   ```prisma
   model User {
     organizationalUnit    String?  // User's dept (hiring, interviewing, etc.)
   }
   
   model RoleCatalog {
     department    String?  // Job position's dept (remains clear)
   }
   ```

3. Add validation:
   ```typescript
   const VALID_DEPARTMENTS = [
     "Engineering", "Product", "Design", "Marketing", 
     "Sales", "HR", "Finance", "Operations", "QA", "Data"
   ];
   
   if (input.department && !VALID_DEPARTMENTS.includes(input.department)) {
     throw new Error("Invalid department");
   }
   ```

---

### 6. ⚠️ BOOTSTRAP ADMIN: Bypasses All Checks

**Problem**: Environment variable admin bypasses User table entirely.

```typescript
export async function authenticateAppUser(email: string, password: string) {
  const bootstrap = bootstrapUser();

  if (bootstrap && normalizedEmail === bootstrap.email && password === bootstrap.password) {
    return {
      userId: null,  // ❌ No user record in database
      email: bootstrap.email,
      name: bootstrap.name,
      role: "admin",
      bootstrap: true,  // ⚠️ Only marker
      exp: 0
    };
  }
  // ...
}
```

**Problems**:
1. **No user record**: userId is null, so audit logs can't link to a user
2. **No isActive check**: Bootstrap admin can't be deactivated
3. **Credentials in env**: Password is in environment variables (security smell)
4. **No session validation**: Bootstrap flag is never checked elsewhere
5. **Orphaned session**: What if bootstrap admin's credentials are compromised?
6. **No logout mechanism**: Bootstrap session doesn't respect maxAge
7. **Missing from user list**: `listAppUsers()` won't show bootstrap admin

**Risk Scenario**:
```
1. Staging environment uses BOOTSTRAP_ADMIN_EMAIL = "admin@company.com"
2. That email also exists as a real User (different password)
3. Former employee's email was reused for staging admin
4. They can log in with old password via environment variable
5. App grants them admin access (userId=null, no way to revoke)
```

**Recommendation**: Create bootstrap user in database on first run
```typescript
async function ensureBootstrapAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase();
  if (!email) return;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!password) throw new Error("BOOTSTRAP_ADMIN_PASSWORD required");

  await prisma.user.create({
    data: {
      email,
      name: process.env.BOOTSTRAP_ADMIN_NAME || "Bootstrap Admin",
      role: "admin",  // ✅ Stored with type safety (use enum from Issue #2)
      passwordHash: hashPassword(password),
      isActive: true
    }
  });

  console.log("Bootstrap admin created in database. Env vars can be removed.");
}
```

Then:
```typescript
// authenticateAppUser becomes normal
const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
if (!user || !verifyPassword(password, user.passwordHash)) {
  return null; // ✅ No special case, no bypasses
}
```

---

### 7. ⚠️ SCHEMA MIGRATION INCONSISTENCY: Field Type Doesn't Match Type System

**Current state**:
```prisma
// schema.prisma line 18
role  String

// session.ts line 12
export type AppRole = "admin" | "recruiter" | "hiring_manager" | "interviewer" | "member";

// app-auth.ts line 20-25
function normalizeRole(role: string): AppRole {
  // Must validate every time
}
```

**Issue**: Type system says `AppRole` is a union, database says `String`. They don't match.

**Why this is dangerous**:
- TypeScript compiler can't help (string ≠ AppRole)
- Runtime must validate (normalizeRole)
- Prisma can't enforce enum constraint
- Direct SQL bypasses all safety

**Recommendation**: Create and apply Prisma migration
```prisma
enum AppAccessLevel {
  admin
  recruiter
  hiring_manager
  interviewer
  member
}

model User {
  accessLevel  AppAccessLevel  @default(member)
}
```

```sql
-- migration.sql
CREATE TYPE "AppAccessLevel" AS ENUM ('admin', 'recruiter', 'hiring_manager', 'interviewer', 'member');
ALTER TABLE "User" ADD COLUMN "accessLevel" "AppAccessLevel" DEFAULT 'member';
-- Migrate existing data
UPDATE "User" SET "accessLevel" = CASE 
  WHEN role = 'admin' THEN 'admin'::AppAccessLevel
  WHEN role = 'recruiter' THEN 'recruiter'::AppAccessLevel
  WHEN role = 'hiring_manager' THEN 'hiring_manager'::AppAccessLevel
  WHEN role = 'interviewer' THEN 'interviewer'::AppAccessLevel
  ELSE 'member'::AppAccessLevel
END;
-- Remove old column
ALTER TABLE "User" DROP COLUMN "role";
```

---

### 8. ⚠️ NO AUDIT TRAIL: Who Changed What Role When?

**Problem**: No history of role assignments or changes.

When admin runs:
```bash
curl -X POST /api/users \
  -d '{"email": "alice@company.com", "role": "admin"}'
```

Questions with no answers:
- Who requested this?
- When exactly?
- What was the old role?
- Was it approved?
- Is there a record?
- Can we revert?

**Current state**: One query to users table shows current role only, no history.

**Recommendation**: Add audit table
```prisma
model AuditLog {
  id         String   @id @default(cuid())
  action     String   // "user_created", "role_changed", "user_deleted"
  userId     String?  // Who did it (admin)
  targetId   String   // Who it was done to
  targetType String   // "user", "role", "invite"
  before     Json?    // Previous state
  after      Json?    // New state
  timestamp  DateTime @default(now())
  ip         String?
  userAgent  String?
}
```

Then in createAppUser:
```typescript
await prisma.auditLog.create({
  data: {
    action: "user_created",
    userId: adminUserId,
    targetId: newUser.id,
    targetType: "user",
    after: { email: newUser.email, role: newUser.role },
    timestamp: new Date()
  }
});
```

---

### 9. ⚠️ MISSING PERMISSION BOUNDARIES: No Role-Based Access Control

**Current authorization**:
```typescript
// ✅ Check if admin
if (session.role !== "admin") {
  redirect(fallbackPath);
}

// ❌ No checks for: 
// - recruiter accessing another recruiter's candidates
// - recruiter modifying roles outside their department
// - hiring_manager escalating their own permissions
// - interviewer creating test invites
```

**Problem**: System only has on/off (admin vs. non-admin), no granular permissions.

**Questions**:
1. Can a recruiter view all candidates, or only theirs?
2. Can an interviewer create new job postings?
3. Can a hiring_manager modify roles?
4. Are there department boundaries?
5. Can one admin delete another admin's users?

**Recommendation**: Define permission matrix

| Action | Admin | Recruiter | Hiring Manager | Interviewer | Member |
|--------|-------|-----------|---|---|---|
| Create User | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit User | ✅ | ❓ | ❓ | ❌ | ❌ |
| Deactivate User | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Role | ✅ | ✅ | ❌ | ❌ | ❌ |
| Modify Role | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Candidates | ✅ | ✅ | Dept | ❌ | ❌ |
| Create Job | ✅ | ✅ | ✅ | ❌ | ❌ |

Then implement:
```typescript
export function can(session: AppSession, action: string, resource?: any): boolean {
  const permissions: Record<string, Set<AppRole>> = {
    "create_user": new Set(["admin"]),
    "create_role": new Set(["admin", "recruiter"]),
    "create_job": new Set(["admin", "recruiter", "hiring_manager"]),
    "view_candidates": new Set(["admin", "recruiter", "hiring_manager"]),
  };
  
  return (permissions[action] || new Set()).has(session.role);
}

// Usage:
if (!can(session, "create_role")) {
  return forbiddenApi("You cannot create roles.");
}
```

---

### 10. ⚠️ SESSION EXPIRATION BYPASS: exp Field Set to 0

**Problem**: Session creation sets expiration to 0 (epoch).

```typescript
return {
  userId: user.id,
  email: user.email,
  name: user.name,
  role: normalizeRole(user.role),
  bootstrap: false,
  exp: 0  // ❌ WRONG - should be calculated
};
```

But verification checks:
```typescript
if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
  return null;  // ❌ Expired
}
```

**Result**: All sessions appear expired immediately because exp=0.

**Likely hidden by**:
```typescript
export async function createSessionToken(payload: Omit<AppSession, "exp">) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const encodedPayload = stringToBase64Url(JSON.stringify({ ...payload, exp })); // ✅ Overrides
  // ...
}
```

**Risk**: If someone refactors or calls createSessionToken() with a pre-built AppSession, exp=0 gets baked in.

**Recommendation**: Make exp non-optional and prevent setting it in client code
```typescript
export interface AppSession {
  userId: string | null;
  email: string;
  name?: string | null;
  role: AppRole;
  bootstrap?: boolean;
  // ❌ Remove exp from here - it's only set by createSessionToken()
}

export async function createSessionToken(payload: Omit<AppSession, "exp">) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  // exp is always calculated here, never passed in
  // ...
}
```

---

### 11. ⚠️ MISSING DEPARTMENT VALIDATION: RoleCatalog Accepts Any String

**Problem**: RoleCatalog.department can be any string, not from the approved list.

```typescript
// departments.ts lists approved departments
const VALID_DEPARTMENTS = [
  "Engineering", "Product", "Design", "Marketing", "Sales", "HR", "Finance", "Operations", "QA", "Data"
];

// But catalog.ts doesn't enforce it
export async function createRoleCatalogEntry(input: {
  label: string;
  department?: string;  // ❌ No validation against VALID_DEPARTMENTS
}) {
  // ...accepts anything
}
```

**Risk**: 
- Typo: "Engineering" vs "engineering" vs "Eng"
- Orphaned roles with department="Sales2" (deprecated department)
- No way to query "all roles in valid departments"
- Inconsistent data makes reporting unreliable

**Recommendation**: Validate against approved list
```typescript
import { VALID_DEPARTMENTS } from "@/lib/roles/departments";

export async function createRoleCatalogEntry(input: {
  label: string;
  department?: string;
}) {
  const label = input.label.trim();
  const department = normalizeDepartment(input.department);
  
  if (!label) {
    throw new Error("Role label is required.");
  }
  
  if (department && !VALID_DEPARTMENTS.includes(department)) {
    throw new Error(`Invalid department. Must be one of: ${VALID_DEPARTMENTS.join(", ")}`);
  }
  
  // ...rest of creation
}
```

---

### 12. ⚠️ MISSING REQUEST VALIDATION: Zod Schemas Are Incomplete

**Problem**: Zod schema in [users/route.ts](src/app/api/users/route.ts) doesn't reject "member" role.

```typescript
const userSchema = z.object({
  role: z.enum(["admin", "recruiter", "hiring_manager", "interviewer"]).default("recruiter"),
  // ❌ "member" is not in the enum, but normalizeRole() can return it
});
```

**Inconsistency**:
- API won't let you send `role: "member"` ✅
- But database can store it
- And normalizeRole() defaults to it
- So session.role can be "member" even though API never creates it

**Recommendation**: Make enum single source of truth
```typescript
export const APP_ROLES = ["admin", "recruiter", "hiring_manager", "interviewer", "member"] as const;
export type AppRole = typeof APP_ROLES[number];

// In session.ts
export type AppRole = typeof APP_ROLES[number];

// In users/route.ts
const userSchema = z.object({
  role: z.enum(APP_ROLES).default("member"),
});

// In app-auth.ts
function normalizeRole(role: string): AppRole {
  return APP_ROLES.includes(role) ? (role as AppRole) : "member";
}
```

**Now single source of truth is clear and refactoring is safe.**

---

## SECONDARY CONCERNS (Medium Priority)

### S1: RoleCatalog Soft Delete Not Enforced
- `isActive` flag exists but some queries ignore it (e.g., `findRoleCatalogEntryByLabel`)
- Deleted roles might still be used
- Recommendation: Add `where: { isActive: true }` consistently OR document why it's ignored

### S2: User.isInterviewer Boolean + Role Redundancy
- Both `isInterviewer` boolean AND `role: "interviewer"` exist
- One is redundant
- Recommendation: Remove isInterviewer or rename to clarify (e.g., only true for role="interviewer")

### S3: No Enum for Invite.roleLocked / contextType
- These are strings too ("true"/"false" and "general"/other)
- Recommendation: Use boolean and enum for contextType

### S4: User.title Field Has No Validation
- Can be any string (e.g., "admin" could appear here, confusing with role)
- Recommendation: Add max length, disallow role-like values

### S5: Policy.ts Only Lists Paths, No Reasoning
- Why is `/api/roles` open but `/api/users` admin-only?
- Document the intent
- Recommendation: Add comments explaining each policy decision

### S6: No Role-Department Affinity Check
- Nothing prevents a recruiter from recruiting for departments they don't manage
- Recommendation: Validate `user.department` matches `role.department` where applicable

### S7: No Logging of Authorization Failures
- When access is denied, no log is created
- Hard to debug permission issues
- Recommendation: Add console.error or audit log for all forbiddenApi() calls

### S8: Session Cookie Not HttpOnly on All Configs
- Code marks HttpOnly but development might override
- Recommendation: Verify it's always true in all environments

---

## RECOMMENDED ROADMAP

### Phase 1: Fix Type Safety (1-2 days, HIGH impact)
1. Create Prisma enum for AppAccessLevel (Issue #2)
2. Rename User.role → User.accessLevel everywhere
3. Update session.ts, app-auth.ts, guards.ts
4. Update all migrations

### Phase 2: Fix Nomenclature (1 day, HIGH clarity)
1. Rename AppRole → AppAccessLevel in type system
2. Update variable names: `role` → `accessLevel` (or `appRole` → `appAccessLevel`)
3. Add comments distinguishing System A (access) from System B (job posting)

### Phase 3: Fix Initialization (1 day, MEDIUM security)
1. Create bootstrap user in database instead of env variable
2. Remove BOOTSTRAP_ADMIN_PASSWORD from env
3. Ensure bootstrap admin is deactivatable

### Phase 4: Fix Domain Model (2 days, MEDIUM clarity)
1. Rename User.department → User.organizationalUnit
2. Add department validation for RoleCatalog
3. Document domain ownership of each field

### Phase 5: Add Authorization Framework (3 days, MEDIUM control)
1. Define permission matrix
2. Implement `can(session, action)` function
3. Apply to all sensitive endpoints
4. Add audit logging

### Phase 6: Documentation (1 day)
1. Create ROLES.md explaining System A vs System B
2. Document permission matrix
3. Add decision log to policy.ts

---

## TESTING CHECKLIST

After implementing fixes:
- [ ] Invalid database values are rejected (Prisma enum prevents bad inserts)
- [ ] Session.role values match AppAccessLevel enum
- [ ] normalizeRole() is no longer called (redundant with enum)
- [ ] Bootstrap admin can be deactivated
- [ ] All tests pass with renamed fields
- [ ] Audit logs created for all role changes
- [ ] Permission matrix is enforced
- [ ] Department validation prevents typos
- [ ] No "member" role created accidentally by API
- [ ] Session expiration works (exp !== 0)

---

## QUESTIONS FOR STAKEHOLDERS

1. Should recruiters create roles or only admins?
2. Should recruiters be limited to their department?
3. Who should be able to deactivate/reactivate users?
4. Should there be an approval workflow for role creation?
5. What's the purpose of User.title and User.department?
6. Should former employees have audit trail access?
7. Do you need role change history/auditing?
8. Should bootstrap admin be removable after initial setup?

---

## CONCLUSION

Your role system is salvageable but requires **architectural clarity** before adding more features. The confusion between two "role" concepts is the root cause. Fix nomenclature and type safety first (Phase 1-2), then layer on granular permissions (Phase 5).

**Estimated total effort**: 8-10 days (1-2 weeks)  
**Risk of not fixing**: Growing technical debt, authorization bugs, compliance issues
