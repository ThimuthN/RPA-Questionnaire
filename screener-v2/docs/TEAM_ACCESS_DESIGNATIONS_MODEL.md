# Team Access and Designations Model

Last updated: 2026-06-04
Batch: 15AL-C (Responsible team integration with AccessGrant)

## Overview

The system separates **access roles** (control what users can do) from **job designations** (classify jobs and candidates). Both are stored in `RoleCatalog` but distinguished by the `kind` field.

## RoleCatalog.kind values

| kind | Purpose | Scope | Permissions | Example |
| --- | --- | --- | --- | --- |
| `access_role` | Controls user capabilities in the system | system or department | permissions relation required | "Hiring Manager", "Recruiter", "Admin" |
| `job_designation` | Classifies jobs and candidate qualifications | department only | no permissions | "Senior Engineer", "Data Scientist", "Product Manager" |

## Team Access Model (AccessGrant)

Users gain access through `AccessGrant` records, which define their capability scope:

```prisma
model AccessGrant {
  id           String
  userId       String      // Who
  scope        String      // "system" or "department"
  departmentId String?     // If scope=department, which department
  roleId       String      // Which access_role
  role         RoleCatalog
  status       String      // "active" or "revoked"
  createdAt    DateTime
  updatedAt    DateTime
}
```

### System access
- `scope: "system"` + `departmentId: null`
- User gains permissions from the system role globally
- Example: system-admin has all permissions everywhere

### Department access
- `scope: "department"` + `departmentId: "dept-123"`
- User gains permissions only within that specific department
- Example: A user assigned as "Hiring Manager" for the RPA SL department

## Responsible Team Assignment

The responsible team feature links hiring team members to candidates through the `HiringAssignment` model:

```prisma
model HiringAssignment {
  id                  String
  applicationId       String   // Links to a specific job application
  userId              String
  assignmentRole      String   // "recruiter", "hiring_manager", "interviewer", etc.
  isPrimary           Boolean
}
```

### Team member availability

When assigning a responsible team to a candidate:

1. **If candidate has a job application with a department job posting:**
   - Team members are loaded from that department's `AccessGrant` records
   - Only department-scoped access roles (kind="access_role") are available
   - Ensures candidates are owned by their job's department team

2. **If candidate has no linked job application:**
   - All system-wide active users are available
   - System administrators can assign candidates to team members not yet department-scoped
   - This is a fallback for unlinked candidates

## Designations (Job Classifications)

Job designations classify the work and candidate qualifications. They are:
- Department-scoped only
- No permissions attached
- Purely descriptive metadata
- Shown in job posting and candidate profile
- Example uses: track required qualifications, filter by role family

Designation records are created at `/departments/[id]/designations` and visible only to users with `manage_departments` permission in that department.

## Admin User Management

### Create user
Users with `manage_users` permission can:
- Create new user accounts at `/users`
- Set initial password
- User starts as `isActive: true`

### Grant access
After creation, grant access via `/users > Grant access button`:

**System access:**
- Assigns one system role (e.g., system-admin, recruiter, hiring_manager)
- Creates `AccessGrant(scope=system)` record
- User gains those permissions everywhere

**Department access:**
- Select target department
- Select access role for that department
- Creates `AccessGrant(scope=department, departmentId=...)` record
- User gains those permissions only in that department

### Team member workflow
1. Create user at `/users`
2. Grant system or department access
3. Navigate to `/departments/[id]/users`
4. Verify user appears in Team section (loaded from AccessGrant)
5. Assign to applications via Responsible Team modal

## Permission checks

### Department workspace permissions

Users see `/departments/[id]/...` pages only if they have an active `AccessGrant` for that department.

Guards check:
```
accessGrant where scope=department && departmentId=X && status=active
```

### Access role filtering

Pages that display "access roles" use:
```
RoleCatalog where kind="access_role"
```

Pages that display "designations" use:
```
RoleCatalog where kind="job_designation"
```

This ensures the UI doesn't mix capabilities (access) with classifications (designations).

## Migration from legacy model

The legacy `departmentId` field on User was used for default workspace. This is now superseded by `AccessGrant` records:

- Users can belong to multiple departments (multiple AccessGrant records)
- Users with no AccessGrant cannot access any department workspace
- The last-used workspace is stored in session context, not on the user record

## Next implementation

- [ ] Bulk import of users with department pre-assignment
- [ ] Approval workflow for access changes
- [ ] Audit log of AccessGrant creation/revocation
- [ ] Automatic access revocation on department deactivation
- [ ] SSO integration with role sync
