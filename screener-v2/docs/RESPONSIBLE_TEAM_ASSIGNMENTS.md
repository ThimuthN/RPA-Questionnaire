# Responsible Team Assignments (Batch 15AA)

Assign multiple users to specific roles for candidate applications.

## Data Model

**HiringAssignment** — attached to `CandidateApplication` (not `Candidate`), supports multiple applications per candidate with independent teams.

- `id`, `applicationId`, `userId`, `assignmentRole`, `isPrimary`, `active`, `assignedAt`, `assignedById`, `dueAt`, `createdAt`, `updatedAt`
- Roles: `recruiter`, `hiring_manager`, `interviewer`, `reviewer`, `coordinator`, `approver`
- Only one active primary recruiter per application
- Multiple users per role allowed

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/candidate-applications/[id]/assignments` | Fetch active assignments |
| PUT | `/api/candidate-applications/[id]/assignments` | Update assignments (mode: add, replace_role) |
| POST | `/api/candidate-applications/assignments/bulk` | Bulk assign same team to multiple applications |

**Request body:** `{ mode: "add" | "replace_role", assignments: [{userId, assignmentRole, isPrimary?}] }`

## UI

**ApplicantsTable** (`/people/candidates/applicants`):
- Checkboxes for bulk selection
- "Assign team" button opens AssignmentModal
- Modal: role multi-select, user picker, primary flag

**ResponsibleTeamCard** (candidate profile sidebar):
- Shows team grouped by role
- "Edit team" button (if `manage_candidates`)
- Uses same AssignmentModal for editing

## Permissions

- `view_candidates` (scoped): GET assignments
- `manage_candidates` (scoped): PUT/POST assignments
- Department scoping enforced on all operations
- Company designations do NOT grant app permissions

## Implementation

**Database:** `src/lib/db/hiring-assignments.ts`
- `validateUsers()` — check active users exist
- `getApplicationAssignments()` — fetch for UI
- `setApplicationAssignments()` — apply add/replace_role modes
- `bulkAssignApplications()` — bulk operation

**Components:** Consolidated `AssignmentModal.tsx` for both bulk and single-app cases

**Tests:** API endpoint tests + DB layer tests (216 passing)

## Constraints

- ✅ No work queue page
- ✅ No company designation → permission mapping
- ✅ Only access roles control assignment
- ✅ Department scoping throughout
- ✅ Multiple recruiters/managers/interviewers supported
- ✅ Single primary recruiter per application

See `prisma/migrations/20260601_add_hiring_assignments/` for schema migration.
