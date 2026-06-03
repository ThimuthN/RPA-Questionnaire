# Batch 15AL-RESET: Verification Report

**Date**: 2026-06-03  
**Status**: ✓ Pre-Reset Verification Complete  
**Environment**: Staging (neondb, Neon us-east-1)  

---

## 1. Database Identity Verification

✓ **SAFE**: Staging database confirmed

```
Database: neondb
User: neondb_owner
Endpoint: ep-late-bonus-a4dwjjni.us-east-1.aws.neon.tech
```

**NOT Production**: Production database (read-only) is separate. This reset targets staging only.

---

## 2. Migration Status

✓ **55 migrations applied**

Latest migration: `20260603_add_access_grants_and_role_kind`
- Added `AccessGrant` model with user-role grants at system/department scope
- Added `kind` field to `RoleCatalog` (job_designation vs access_role)
- All migrations up to date with schema.prisma

---

## 3. Current DB Truth (Before Reset)

### Preservation (Keep)
- **Department**: 23 records ✓
- **RoleCatalog**: 163 records (job designations + existing roles) ✓

### To Wipe (Clean Slate)
- **User**: 1 record (legacy test user)
- **Candidate**: 0 records
- **CandidateApplication**: 0 records
- **CandidateNote**: 0 records
- **CandidateAssessment**: 0 records
- **CandidateMilestone**: 0 records
- **HiringAssignment**: 0 records
- **CandidateActivityEvent**: 0 records
- **Attempt**: 0 records
- **Invite**: 0 records
- **InterviewPanel**: 0 records
- **DepartmentCandidacy**: 0 records
- **AccessGrant**: 0 records

**Total records to wipe**: 1  
**Total records to preserve**: 186

---

## 4. Verification Suite Results

### ✓ npm ci
- 479 packages installed
- 10 vulnerabilities (2 moderate, 8 high) - pre-existing, not introduced
- No new dependencies added

### ✓ npx prisma generate
- Prisma Client v6.19.2 generated successfully
- Schema compilation passed

### ✓ npm run typecheck:unused
- TypeScript strict mode: PASS
- No unused variables
- No unused parameters
- All type checks clean

### ✓ npm run lint
- ESLint with max-warnings=0: PASS
- No new linting issues

### ✓ npm test
- Test Files: 69 passed
- Tests: 285 passed
- Duration: 19.77s
- All existing tests still passing

### ✓ npm run build
- Next.js build: SUCCESS
- 24 dynamic route segments
- 1 middleware
- No build errors

---

## 5. Reset Script Summary

File: `scripts/reset-staging-clean-slate.ts`

**Safety Gates**:
1. ✓ Requires `ALLOW_STAGING_RESET=true` environment variable
2. ✓ Requires `BOOTSTRAP_ADMIN_EMAIL` environment variable
3. ✓ Requires `BOOTSTRAP_ADMIN_PASSWORD` environment variable (never printed)
4. ✓ Verifies database identity (must be neondb, neondb_owner)
5. ✓ Refuses execution if not staging
6. ✓ No secrets or PII printed

**Actions Performed**:
1. Verify bootstrap configuration (email + password)
2. Verify staging DB identity
3. Capture before state (table counts)
4. Wipe non-preserved data (26 tables in dependency order)
5. Seed 7 default access roles:
   - System Admin
   - Department Admin
   - Hiring Manager
   - Recruiter
   - Interviewer
   - Reviewer
   - Viewer
6. Create/update bootstrap system admin user with provided email
7. Hash password using app's crypto.scryptSync method
8. Create system-level AccessGrant for bootstrap admin
9. Capture after state
10. Print reset summary

**Preservation Strategy**:
- Departments: Kept intact (23 records)
- RoleCatalog: Kept intact, new access roles created
- All other tables: Wiped with respect to foreign key constraints

**Bootstrap Admin**:
- Email: tnayanapriya@innobothealth.com
- Access Level: System-wide
- Grant Type: System scope AccessGrant
- Password: Hashed using app's scryptSync with random salt
- Password is NOT printed or logged

---

## 6. Reset Execution Command

When ready to execute (after user approval):

```bash
ALLOW_STAGING_RESET=true \
  BOOTSTRAP_ADMIN_EMAIL=tnayanapriya@innobothealth.com \
  BOOTSTRAP_ADMIN_PASSWORD=<password-provided-by-user> \
  npx tsx scripts/reset-staging-clean-slate.ts
```

**Bootstrap Credentials**:
- Email: `tnayanapriya@innobothealth.com`
- Password: Provided by user, never printed or logged
- Hash Method: App's crypto.scryptSync (salt:hash format)

**Preconditions Met**:
- ✓ Database identity verified
- ✓ All dependencies installed
- ✓ Prisma schema current
- ✓ All type checks passing
- ✓ All tests passing
- ✓ Build successful
- ✓ Reset script created and verified
- ✓ Password hashing uses app's native method

---

## 7. Expected Outcome

### After Reset
- **Department**: 23 (unchanged)
- **RoleCatalog**: 163 + 7 new access roles = ~170
- **User**: 1 (bootstrap admin)
- **AccessGrant**: 1 (bootstrap admin system access)
- **All other tables**: 0 records

### State Diagram
```
Before:    Dept(23) + Roles(163) + Users(1) + legacy data(0)
           ↓
Wipe:      Delete all non-preserved records
           ↓
Seed:      Create system, bootstrap admin, access roles
           ↓
After:     Dept(23) + Roles(~170) + Users(1) + clean slate
```

---

## 8. Risk Assessment

**Risks Identified**: STAGING ONLY - Not production

| Risk | Mitigation |
|------|-----------|
| Wrong database wiped | DB identity verification gate before any delete |
| Data loss | Staging only, no production data exposed |
| Missing dependencies | All verify/build steps passed |
| Script errors | Comprehensive wipe order respects FK constraints |
| Missing bootstrap | AccessGrant model migration deployed, schema synced |

**Confidence Level**: ✓ HIGH

---

## 9. Smoke Tests (After Reset)

After successful reset execution, verify staging at: **https://screener-v2-staging.vercel.app/login**

**Expected Behaviors**:

1. **Login with provided credentials**
   - Email: tnayanapriya@innobothealth.com
   - Password: (as provided)
   - Expected: Login succeeds, redirects to dashboard

2. **Admin Workspace visible**
   - Expected: Dashboard shows "Admin Workspace" or similar system admin view
   - All 23 departments visible in department selector

3. **Access Control working**
   - Navigate to Access/Roles/Permissions page
   - Expected: 7 default access roles visible (System Admin, Department Admin, Hiring Manager, Recruiter, Interviewer, Reviewer, Viewer)

4. **Candidate pages functional but empty**
   - Navigate to People > Candidates
   - Expected: Page loads, candidate list is empty (no error)
   - No broken UI components
   - Search/filter controls functional

5. **Job postings page**
   - Navigate to People > Candidates > Jobs
   - Expected: Page loads, job list is empty (no error)

6. **Fresh system state**
   - Only bootstrap admin user exists
   - No legacy test data
   - Clean AccessGrant table with only bootstrap admin grant

**Failure Indicators** (contact support if observed):
- Login fails or password hash error
- 500 errors on any page
- Department selector shows incorrect data
- Access roles not visible or incomplete

---

## 10. Next Steps

1. **User Review**: Verify reset scope and expected outcomes
2. **Bootstrap Password**: User provides password (never commit, never print)
3. **User Approval**: Explicit approval to execute reset
4. **Execution**: Run reset command with all three required env vars
5. **Smoke Testing**: Verify login and key UI features
6. **Documentation**: Update deployment notes

---

**Prepared by**: Claude Code  
**Review Status**: Ready for approval  
**Execution Status**: PENDING USER APPROVAL  
**Bootstrap Email**: tnayanapriya@innobothealth.com  
**Password Source**: User-provided (environment variable only)
