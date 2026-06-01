# Department, Designation, and Access Role Model

## Overview

The system has three distinct concepts that are currently conflated in the schema:

1. **Departments** — Organizational units scoping visibility and access
2. **Job Designations** — Classification of jobs/candidates within a department
3. **Access Roles** — User roles that grant app permissions

## Current Schema State

### Department (Correct)
```
model Department {
  id, name, slug, isActive, sortOrder
  └─ Relationships: roles, users, candidates, jobPostings
```
**Role:** Scope for visibility. Users belong to departments. Designations are department-scoped.

### RoleCatalog (Conflated — **NEEDS CLEANUP**)
```
model RoleCatalog {
  id, label, slug, description, experienceLevel, requirements
  departmentId, isActive, sortOrder
  └─ Relations: candidates, employees, jobPostings, departmentCandidacies, users, permissions
```

**Current use cases:**
- **Job Designations:** `Candidate.roleId`, `JobPosting.roleId`, `Employee.roleId` (classify jobs/candidates by position)
- **Access Roles:** `User.roleId` (assign to users for permission lookup via RolePermissionTemplate)

**Problem:** Single table serves two distinct purposes. UI conflates them.

### RolePermissionTemplate (Correct — But Only for Access Roles)
```
model RolePermissionTemplate {
  roleId (FK → RoleCatalog)
  permission, scope
}
```

**Role:** Maps access roles to permissions. Job designations should NOT have permission rows.

## Current UI Issues (15AB Will Fix)

### Department Detail Page
**Location:** `src/app/departments/[id]/page.tsx`
**Component:** `src/components/roles/RoleCatalogSection.tsx`

**Current state:**
- Section titled "Hiring roles"
- Copy: "Create hiring roles to organize candidates by position and department"
- Table columns: Role | Department | In use | **Permissions** | Actions
- Displays permission count for ALL roles (designations + access roles)

**Issue:** Permissions column shown for job designations, which should not have access permissions.

## What This Batch Fixes (15AB)

### UI Wording (Low Risk)
1. Rename "Hiring roles" section → "Job designations"
2. Update copy to clarify designations classify jobs/candidates, not grant access
3. **Remove "Permissions" column** from department-level designation table
4. Keep access-role permission management separate (if it exists) or document as bootstrap-only

### Cleanup (No Data Deletion)
1. Create safe dependency report for departments (System, Engineering, RPA)
2. Classify departments as: keep, hide-from-hiring, candidate-for-deactivation, needs-manual-decision
3. If safe: hide "System" department from hiring UI (but keep internally)
4. Do NOT delete/deactivate departments without explicit approval

### Schema (No Migration Yet)
1. Document naming convention: access-role RoleCatalog records vs designation records
2. Add guardrail: designations should have NO RolePermissionTemplate entries
3. Defer schema split (AccessRole table vs JobDesignation table) to later batch if needed

## What This Batch Does NOT Do

- ❌ Split RoleCatalog into AccessRole + JobDesignation tables (deferred)
- ❌ Remove access-role functionality (only clarify it)
- ❌ Delete or auto-deactivate departments
- ❌ Redesign access-role admin UI
- ❌ Build work queue page
- ❌ Map company designations to app permissions

## How to Distinguish Going Forward

**Job Designation RoleCatalog Records:**
- Used by Candidate.roleId, JobPosting.roleId, Employee.roleId
- Should have slug like `engineer-ind`, `qa-sl`, `rpa-lead`
- Should have description, experienceLevel, requirements
- Should have empty permissions array
- Appear in department "Job Designations" table

**Access Role RoleCatalog Records:**
- Used by User.roleId
- Should have slug like `hiring-manager`, `recruiter`, `admin`
- Have RolePermissionTemplate entries
- Should NOT appear in department designation table
- Managed separately (bootstrap/admin-only for now)

## Departments to Audit

**System** — Likely bootstrap-only, candidate for hiding from hiring UI
**Engineering** — Check if actively used
**RPA** — Check if actively used or duplicate with RPA-IND, RPA-SL variants

See Part D report for full audit results.

## Related Documentation

- `docs/RESPONSIBLE_TEAM_ASSIGNMENTS.md` — Uses designations to link applications to teams
- `src/lib/auth/permissions.ts` — Defines access permissions
- `src/lib/auth/access-roles.ts` — Bootstrap access role setup
