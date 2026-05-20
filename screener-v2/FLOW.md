# System Flow & Architecture Specification

**Last Updated:** 2026-05-20  
**Purpose:** Define the exact flow for departments, roles, users, candidates — prevent edge cases and inconsistent behavior.

---

## 1. SYSTEM STRUCTURE

### 1.1 Organization Model

```
Organization
├─ System Department (implicit, contains all system admins)
│  ├─ User: System Admin (role: system_admin, permissions: all)
│  ├─ User: Dept Admin Creator (role: dept_admin, limited)
│  └─ ...
├─ Sales Department
│  ├─ User: Alice (role: dept_manager, dept: Sales)
│  ├─ User: Charlie (role: interviewer, dept: Sales)
│  └─ ...
├─ Engineering Department
│  └─ ...
└─ HR Department
   └─ ...
```

**Key principle**: Users belong to **exactly ONE department** (plus system admins can see everything).

---

## 2. ROLES SYSTEM

### 2.1 What is a Role?

A **Role** is an organization-wide job title with both technical permissions and job context:

```typescript
Role {
  id: string
  name: string                    // "Senior RPA Developer", "HR Manager", etc.
  departmentId?: string           // If org-scoped role OR dept-scoped
  
  // Technical side (platform permissions)
  permissions: Permission[]       // [manage_candidates, schedule_interview, ...]
  
  // Human/context side (job description)
  description: string             // What this role does in the org
  experienceLevel?: string        // Junior, Mid, Senior, Lead
  responsibilities: string[]      // ["Review candidates", "Conduct interviews", ...]
  requirements: string[]          // ["5+ years RPA", "SQL knowledge", ...]
  
  // Metadata
  isActive: boolean
  createdAt: DateTime
}
```

### 2.2 Role Hierarchy (for permissions)

```
System Admin
├─ All platform permissions
├─ Can create/delete departments
├─ Can create/delete other admins
├─ Can create dept admins
└─ Access: See everything, all depts, all candidates

Dept Admin
├─ Dept-specific permissions (manage users, create roles, etc.)
├─ Cannot create/delete system admins
├─ Can create other dept admins (in their dept)
├─ Access: See their department + granted access to others
└─ Can grant/revoke exceptions

Department Manager
├─ Can manage users in their dept
├─ Can interview/review candidates
├─ Cannot delete admins, create other managers
├─ Access: See only their department
└─ Can grant basic exceptions

Interviewer/Reviewer
├─ Can create candidates, add notes, schedule interviews
├─ Cannot manage users or permissions
├─ Access: See department candidates, read-only on other depts
└─ No exceptions to grant

Viewer
├─ Read-only access
├─ Cannot modify anything
└─ Access: Filtered by department
```

### 2.3 Role Creation

- **System Admin**: Can create any role (system-wide, org-scoped, dept-scoped)
- **Dept Admin**: Can create roles within their department? *(Clarify: yes or no?)*
- **Roles are limited**: Organization has a fixed set of roles; not created ad-hoc per candidate

---

## 3. PERMISSIONS SYSTEM

### 3.1 Permission Types (Critical Actions Only)

**Candidate Operations**:
- `candidate:create` — Register/intake a candidate
- `candidate:view` — See candidate in pipeline
- `candidate:edit` — Modify candidate fields
- `candidate:delete` — Remove candidate
- `candidate:transfer` — Move candidate to another department
- `candidate:reject` — Mark as rejected (finalized)
- `candidate:hire` — Mark as hired (move to Employee, finalized)
- `candidate:undo_finalize` — Revert rejected/hired status *(admin only)*

**Interview Operations**:
- `interview:schedule` — Create interview milestone
- `interview:feedback` — Submit feedback/recommendation
- `interview:view_results` — See assessment results

**User Management**:
- `user:create_in_dept` — Add user to your department
- `user:remove_from_dept` — Remove user from your department
- `user:change_permissions` — Modify user's role/permissions
- `user:grant_exception` — Give user permission they don't normally have

**Department Operations**:
- `dept:create` — Create new department
- `dept:delete` — Delete department
- `dept:modify` — Edit department details
- `dept:create_role` — Create new role in this department

### 3.2 Permission Enforcement Model

**Rule: Role + Exceptions**

1. User has a **role** (e.g., "dept_manager")
2. Role has **default permissions** (e.g., [candidate:create, candidate:edit, interview:schedule])
3. Exceptions can be **added or removed per-user**:
   - Dept Admin: "Grant Charlie the ability to delete candidates (even though interviewer role normally can't)"
   - System Admin: "Grant Alice the ability to undo finalized candidates"

**Implementation**:
```typescript
// Default permissions from role:
userPermissions = role.permissions  // [candidate:create, candidate:edit, ...]

// Add exceptions:
userPermissions += user.permissionExceptions.grant  // [candidate:delete]

// Remove default permissions:
userPermissions -= user.permissionExceptions.revoke  // [-candidate:edit]

// Check before action:
if (action not in userPermissions) {
  return FORBIDDEN
}
```

### 3.3 Scope of Permissions

**Default scope: Own department only**

```
// Example: Alice (dept_manager in Sales) has candidate:edit
// ✓ Can edit candidates in Sales department
// ✗ Cannot edit candidates in Engineering department (unless exception granted)

// Exception: System Admin has candidate:edit scope = GLOBAL
```

When checking permission, **always validate**:
```
if user.dept != candidate.dept && user.role != system_admin {
  return FORBIDDEN  // You can only edit candidates in your dept
}
```

---

## 4. CANDIDATE LIFECYCLE

### 4.1 Entry Point: Two Sources

#### Source 1: Job Application (Public Careers Page)

```
1. User applies to job posting (e.g., "Senior RPA Developer @ Sales")
2. System automatically:
   - Creates Candidate record
   - Assigns department: Sales (from job posting)
   - Assigns role: Senior RPA Developer (from job posting)
   - Status: "pipeline"
3. Candidate appears in People page under Sales pipeline
```

#### Source 2: Manual Registration (System User)

```
1. System user (e.g., Alice in Sales) goes to Candidates > New
2. Required: Pick department first, then role
3. System checks:
   - Does user have candidate:create in this dept? ✓
   - Is the role valid for this dept? ✓
4. Candidate created with:
   - Department: User-selected
   - Role: User-selected
   - Status: "pipeline"
5. Candidate appears in People page
```

### 4.2 Candidate State Throughout Lifecycle

```
Candidate {
  id: string
  fullName: string
  email: string
  
  // Current location/context
  departmentId: string            // WHERE they are now
  roleId: string                  // WHAT role they're for in this dept
  hrOwnerId?: string              // WHO owns them in this dept (dept manager or assigned user)
  
  // Lifecycle tracking
  stage: "pipeline" | "screening" | "interview" | "testing" | "decision"
  status: "active" | "finalized"
  finalizedAs?: "hired" | "rejected"
  
  // History (immutable)
  notes: CandidateNote[]          // Kept across transfers
  milestones: CandidateMilestone[] // Kept across transfers
  activityLog: CandidateActivityEvent[] // Full audit trail
  
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 4.3 Candidate Transfer (Department Change)

**Scenario**: Candidate "Bob" in Sales is a better fit for Engineering.

**Flow**:
```
1. Sales manager (Alice) sees candidate Bob
2. Alice clicks "Transfer to Department" → selects "Engineering"
3. System checks:
   - Does Alice have candidate:transfer permission? ✓
   - Is candidate in Alice's dept (Sales)? ✓
4. TRANSFER HAPPENS:
   - Candidate.departmentId: Sales → Engineering
   - Candidate.roleId: Sales_RPA_Dev → Engineering_RPA_Dev (must select)
   - Candidate.hrOwnerId: alice_id → null (reset, Engineering assigns later)
   - All notes, milestones, activity log PRESERVED
   - Status stays "active" (unless explicitly finalized)
5. Candidate now appears in:
   - ✓ Engineering pipeline (new owner can manage)
   - ✓ Sales pipeline (read-only access for Alice + Sales manager)
   - ✓ All users in both depts see it (Alice: read-only, Engineering manager: full edit)
```

**Access after transfer**:
- Old dept (Sales):
  - Alice (dept manager): **Edit access retained** (manager-level access persists)
  - Charlie (interviewer): **Read-only access** (can see notes, milestones)
  - Non-managers: **No access** (lost visibility)
- New dept (Engineering):
  - Bob (dept manager): **Full edit access** (now owner)
  - All others: Based on their role

**Implementation safeguard**:
```typescript
if (user.department == candidate.department) {
  // Full access (edit, delete, etc.)
  userCanEdit = true
} else if (user.role == "system_admin") {
  // Admins see everything
  userCanEdit = true
} else if (user.role.level >= "department_manager" && user.dept == candidate.oldDept) {
  // Old dept manager gets read-only
  userCanEdit = false
} else {
  // Everyone else: no access
  return FORBIDDEN
}
```

### 4.4 Final States: Rejection & Hiring

#### Rejection

```
1. Any user with candidate:reject permission marks candidate as rejected
2. System moves candidate to "FINALIZED" state:
   - status: "finalized"
   - finalizedAs: "rejected"
3. Candidate no longer appears in normal pipeline view
4. Candidate appears in "Finalized > Rejected" archive section
5. Who can revert (bring back)?
   - System Admin: Always can
   - Dept Admin: Can if within their dept
   - Others: No
6. Activity log records: who rejected, when, reason
```

#### Hiring

```
1. Any user with candidate:hire permission clicks "Hire"
2. System:
   - Creates Employee record (from candidate + role + dept)
   - Moves candidate to "FINALIZED" state:
     - status: "finalized"
     - finalizedAs: "hired"
   - Links: Employee.candidateId = candidate.id
3. Candidate appears in:
   - ✓ "Finalized > Hired" archive section
   - ✓ "Employees" section (as employee)
   - ✗ Normal pipeline view (removed)
4. Who can revert?
   - System Admin: Always can
   - Dept Admin: Only if candidate hired in their dept
5. Activity log records: who hired, start date, role
```

#### Revert Finalized State

```
Only possible if user has candidate:undo_finalize permission:
- System Admin: ✓ Can revert anyone
- Dept Admin: ✓ Can revert in their dept
- Dept Manager: ✗ Cannot revert
- Others: ✗ Cannot revert

When reverted:
- status: "finalized" → "active"
- finalizedAs: null
- If hired: Employee record stays (marked archived or inactive)
- Notes, milestones, activity: All preserved
- Candidate returns to normal pipeline in their department
```

---

## 5. PEOPLE PAGE (Unified Candidate View)

### 5.1 What Users See

```
/ people / candidates

┌─ Filter: Department ────────────────────┐
│  ☑ Sales (you are here)                 │
│  ☐ Engineering (read-only access)       │
│  ☐ HR (no access)                       │
└─────────────────────────────────────────┘

┌─ Candidates List ────────────────────────────────┐
│ Name         │ Role                 │ Dept  │ ... │
├──────────────┼──────────────────────┼───────┼─────┤
│ Bob          │ Senior RPA Dev       │ Sales │ ... │
│ Charlie      │ RPA Developer        │ Sales │ ... │
│ Diana        │ RPA Developer (gray) │ Eng   │ ... │
│                                                   │
│ Finalized:                                       │
│ Eve (hired)  │ HR Manager           │ HR    │ ... │
│ Frank        │ RPA Dev (rejected)   │ Sales │ ... │
└────────────────────────────────────────────────────┘
```

### 5.2 Filtering Rules

**What you see**:
- ✓ All candidates in your department (full details, editable)
- ✓ Candidates in other depts (if you have cross-dept permission or were involved)
- ✗ Candidates in depts you have no access to (hidden entirely)
- ✓ Finalized section (archived hired/rejected)

**Interactive**:
- Filter by department: shows only that dept's pipeline + finalized
- Can see "transferred to" status if involved
- Edit button only appears if you have permission

---

## 6. JOBS & POSTINGS

### 6.1 Job Posting Model

```
JobPosting {
  id: string
  slug: string
  title: string                  // "Senior RPA Developer"
  departmentId: string           // Sales
  roleId: string                 // senior_rpa_developer (org-wide role)
  
  // Public details
  description: string
  salaryMin?: number
  salaryMax?: number
  remotePolicy: "full" | "hybrid" | "onsite"
  
  // Assessment
  screenerPresetId?: string      // Linked assessment
  
  // Lifecycle
  isPublished: boolean           // Visible on careers page
  isOpen: boolean                // Accepting applications
  createdAt: DateTime
}
```

### 6.2 Job → Candidate Flow

```
1. Admin creates job posting:
   - Title: "Senior RPA Developer"
   - Department: Sales
   - Role: senior_rpa_developer (org-scoped role)
   - Publish: Yes
   
2. Job appears on public careers page: /jobs/senior-rpa-developer-sales
   
3. External user applies:
   - System auto-creates Candidate
   - Auto-assigns: dept = Sales, role = senior_rpa_developer
   - No additional role selection needed
   
4. System user creates candidate manually:
   - Must still select: department + role
   - Can select from same role pool
```

---

## 7. CRITICAL FLOW INVARIANTS (Must Never Break)

1. **Candidate has exactly ONE active department** at any time
   - Violation: Candidate in Sales AND Engineering simultaneously → FORBIDDEN
   - Transfer moves, not duplicates

2. **User has exactly ONE department** (except system admins)
   - Violation: Alice can't have departmentId = Sales AND Engineering → FORBIDDEN
   - System admins: in "System" department, can see everything

3. **Department-scoped permissions are enforced**
   - Violation: Alice edits candidate in Engineering (not her dept) → FORBIDDEN
   - Exception: System admins or explicitly granted exception

4. **Finalized candidates cannot be edited directly**
   - Violation: Update finalized candidate without undo_finalize permission → FORBIDDEN
   - Only way: Revert finalized status first, then edit

5. **Role must exist and be valid for department**
   - Violation: Candidate assigned nonexistent role → FORBIDDEN
   - Violation: Assign role from different org context → FORBIDDEN

6. **Activity log is immutable**
   - Every action: who, when, what → AuditLog
   - Auditors can see full trail
   - Deletion doesn't erase history

7. **Transfer preserves history**
   - Notes, milestones, activity log stay attached
   - New dept sees full context
   - Old dept sees read-only history

8. **Permissions follow role by default, with exceptions**
   - User gets role.permissions automatically
   - Exceptions: Can grant (e.g., "edit candidates") or revoke (e.g., "delete candidates")
   - Both tracked: who granted, when, why

---

## 8. TECHNICAL DEBT & FIXES REQUIRED

### Current Problems

1. **Candidate dual ownership**: Candidate.hrOwnerId + DepartmentCandidacy.hrOwnerId
   - **Fix**: Use only DepartmentCandidacy.hrOwnerId
   
2. **Candidate dual department**: Candidate.departmentId + DepartmentCandidacy
   - **Fix**: Derive from DepartmentCandidacy, remove Candidate.departmentId

3. **No scope enforcement**: RolePermissionTemplate.scope = "own_dept" but never checked
   - **Fix**: Enforce in every API route that touches candidates/users

4. **Dead permission override table**: UserPermissionOverride never queried
   - **Fix**: Implement exception granting UI + enforcement

5. **No audit logging**: AuditLog table exists but never written
   - **Fix**: Log every critical action

6. **Missing TypeScript enums**: Candidate.stage, DepartmentCandidacy.status, etc. are strings
   - **Fix**: Create proper enums + types

---

## 9. Implementation Checklist

- [ ] Create UserDepartmentRole table (if multi-dept needed) or clarify single-dept model
- [ ] Implement Role model with both permissions + context fields
- [ ] Add permission exception granting UI
- [ ] Audit every API route for department scope validation
- [ ] Wire AuditLog writes on all critical actions
- [ ] Add TypeScript types for all status enums
- [ ] Test transfer flow (candidate moves, access changes, history preserved)
- [ ] Test finalized state (rejection, hiring, undo)
- [ ] Verify People page filtering works correctly
- [ ] Document permission checks per route

---

**Next Step**: Agree on this flow, then encode it in TypeScript types + API guards.
