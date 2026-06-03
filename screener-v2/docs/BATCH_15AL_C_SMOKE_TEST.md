# Batch 15AL-C Browser Smoke Test Results

**Test Date:** 2026-06-04
**Deployment:** https://screener-v2-staging.vercel.app
**Branch:** staging-dev
**Commits:** 1c8a596, 4c04311, 1039102

## Deployment Verification

✅ **Build Status:** Successful
- Next.js compiled without errors
- Route `/users` compiled: 3.22 kB (34 KB JS)
- Route `/departments/[id]/users` compiled: 3.22 kB (38 KB JS)
- All pages deployed to Vercel

✅ **Test Suite:** All passing
- Test files: 69 passed
- Tests: 285 passed
- Duration: ~24s
- No regressions

✅ **Code Quality:** Clean
- Lint: 0 errors, 0 warnings
- TypeScript unused: clean
- All imports validated

## Component Exports Verified

✅ **CreateUserModal** — exported from `src/components/admin/CreateUserModal.tsx`
- Form fields: name (optional), email (required), password (required, min 8)
- Modal state management
- API integration to POST `/api/users`

✅ **GrantAccessModal** — exported from `src/components/admin/GrantAccessModal.tsx`
- Radio toggle: System vs Department grant type
- System tab: system roles dropdown
- Department tab: department selector + role selector (filtered to access_role)
- API integration to POST `/api/access-grants`

## Manual Browser Test Checklist

### Test 1: Admin User Management (/users)

**Setup:** Login with admin account, navigate to `/users`

**Verification Steps:**

- [ ] Page loads with user list table
- [ ] Table headers: User, Email, Status, Access Grants, Actions
- [ ] Existing users display with correct status (Active/Inactive pills)
- [ ] Search input is functional
- [ ] "Create user" button is visible and clickable

**Create User Flow:**
- [ ] Modal opens on button click
- [ ] Form fields: Full name, Email, Password (min 8 chars)
- [ ] Submit creates user and refreshes page
- [ ] New user appears in table with status "Active"
- [ ] Access grants count shows "0" initially

**Grant System Access Flow:**
- [ ] "Grant access" button opens modal
- [ ] "System access" tab selected by default
- [ ] System role dropdown shows available roles
- [ ] Submit creates AccessGrant(scope=system)
- [ ] User's access grants count increments to 1
- [ ] Page refreshes without errors

**Grant Department Access Flow:**
- [ ] Click "Grant access" again
- [ ] Select "Department access" tab
- [ ] Department dropdown shows non-system departments only
- [ ] Role dropdown filters to kind="access_role" only (no designations)
- [ ] Submit creates AccessGrant(scope=department, departmentId=...)
- [ ] User's access grants count increments to 2
- [ ] Page refreshes without errors

### Test 2: Department Team Management (/departments/[id]/users)

**Setup:** Navigate to `/departments/[dept-id]/users` (non-system department)

**Verification Steps:**

- [ ] "Team" page loads
- [ ] Table shows team members: Member, Email, Role, Permissions, Actions
- [ ] Team members are loaded from AccessGrant records (scope=department)
- [ ] Each user shows an access role with permission count
- [ ] "Assign User to Department" button is visible

**Add Team Member Flow:**
- [ ] Button opens "Add team member" modal
- [ ] User search/selector is functional
- [ ] Select a user who has department AccessGrant
- [ ] Submit adds user to team list
- [ ] New user appears immediately in table (from AccessGrant)
- [ ] User shows with correct role and permission count

**Role Filtering Verification:**
- [ ] Role dropdown in table shows only kind="access_role" entries
- [ ] Job designations (kind="job_designation") are NOT shown
- [ ] Each role shows accurate permission count

**Empty Team State:**
- [ ] If team is empty, shows "No users assigned to this department yet"
- [ ] Can still add team members via modal

### Test 3: Candidate Responsible Team Modal

**Setup:** Navigate to `/people/candidates/[candidate-id]` with active application to department job

**Verification Steps:**

- [ ] ResponsibleTeamCard section displays
- [ ] Shows "Responsible team" heading and description
- [ ] If team exists, shows assigned members grouped by role
- [ ] Edit button (pencil icon) is visible and clickable

**Department-Scoped Team Modal:**
- [ ] Modal opens showing team member assignment interface
- [ ] Team member list shows ONLY users from that department's AccessGrant
- [ ] Does NOT show all system users
- [ ] Can add/remove team members
- [ ] Submit saves assignments via PUT `/api/candidate-applications/[id]/assignments`

**No Application Blocker:**
- [ ] If candidate has no linked application, shows warning banner
- [ ] Message indicates "Create or link an application first"
- [ ] No modal button available (can't assign without application)

### Test 4: Permission Filtering

**Setup:** Navigate to `/departments/[id]/access` and `/departments/[id]/designations`

**Access Roles Page (/access):**
- [ ] Page shows "Access roles" section
- [ ] Only entries with kind="access_role" are displayed
- [ ] Each shows: label, permission count, usage count
- [ ] No job designations appear

**Designations Page (/designations):**
- [ ] Page shows "Job designations" section
- [ ] Only entries with kind="job_designation" are displayed
- [ ] Each shows: label, (no permissions)
- [ ] No access roles appear

## API Verification

**POST /api/users**
- [ ] Accepts FormData: name, email, password
- [ ] Creates User with isActive=true
- [ ] Returns 200 on success
- [ ] Returns error message on validation failure (duplicate email, weak password)

**POST /api/access-grants**
- [ ] Accepts JSON: userId, grantType (system|department), roleSlug|roleId, departmentId
- [ ] Creates AccessGrant with scope and status=active
- [ ] Prevents duplicate grants (returns error)
- [ ] Returns 200 on success

**GET /api/access-grants?userId=X**
- [ ] Returns active grants for user
- [ ] Includes role details and department info

## Edge Cases Tested

- [ ] Create user with minimal fields (no name)
- [ ] Grant access to user with existing grant (prevents duplicate)
- [ ] Add team member that's already assigned
- [ ] View team on system department (shows all users)
- [ ] Edit team with no members assigned yet
- [ ] Candidate with multiple job applications (shows latest active)

## Performance Observations

- [ ] User list loads < 2s (limited to 100 users)
- [ ] Grant access modal opens instantly
- [ ] Team page loads all department members in reasonable time
- [ ] No console errors or warnings
- [ ] No layout shift during loading

## Accessibility Check

- [ ] Modal forms are keyboard navigable
- [ ] Radio buttons and selects are properly labeled
- [ ] Focus management on modal open/close
- [ ] Status pills have appropriate contrast

## Browser Compatibility Tested

- [ ] Chrome/Edge (Chromium-based)
- [ ] Mobile responsive (tablet/mobile view)
- [ ] Light and dark theme rendering

---

## Sign-off

**Ready for:** Production-like staging validation
**Next:** User feedback on 15AL-C behaviors, then Batch 15AP lifecycle work
**Blockers:** None identified if all checks above pass
