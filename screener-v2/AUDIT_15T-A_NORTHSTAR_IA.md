# 15T-A: Northstar Information Architecture Audit

Complete audit of all routes, navigation, and information architecture as of this batch.

---

## VISIBLE NAVIGATION

Routes that appear in the primary navigation rail (`WorkspaceRail`) for authenticated users.

| Route | Purpose |
|-------|---------|
| `/people/candidates/jobs` | Jobs management - create, edit, and manage open positions |
| `/people/candidates/applicants` | Applicants view - direct applicants to open jobs |
| `/people/candidates` | Candidates hub - primary workspace for candidate profiles and lifecycle |
| `/assessments` | Assessment hub - entry point for assessment operations (create, templates, results) |
| `/departments` | Departments admin - manage hiring departments and user roles (admin only) |

**Navigation Rules:**
- Conditional: `/departments` only shown to users with `manage_users` permission
- Public navigation when unauthenticated: Only `/jobs` (public careers page)
- Active state detection in `isNavItemActive()` handles prefixes (e.g., `/assessments` matches `/create-test`)

---

## ASSESSMENT SUBSYSTEM

All routes related to creating, managing, taking, and reviewing assessments.

### Assessment Workspace (Authenticated)

| Route | Purpose |
|-------|---------|
| `/assessments` | Assessment hub - three-card navigation: Create assessment, Assessment templates, Assessment results |
| `/create-test` | Create/assign assessment builder - drag-drop builder for custom assessments or from presets |
| `/addons` | Assessment templates library - manage reusable addon templates and presets |
| `/addons/[id]/review` | Review addon template - view resolved question set and answer key for a specific addon |
| `/results` | Assessment results workspace - table view with filtering, search, and bulk actions on all attempt results |
| `/results/[attemptId]` | Detailed result review - full evidence review, integrity metrics, and final decision recording |

### Assessment Invites & Runtime (Unauthenticated/Public)

| Route | Purpose |
|-------|---------|
| `/(runtime)/a/[slug]/start` | **Assessment start page** - candidate enters name/email, reviews details, starts attempt (validation, passcode entry) |
| `/(runtime)/a/[slug]/page` | **Assessment info page** - displays assessment metadata (intermediate, rarely user-facing) |
| `/(runtime)/a/[slug]/attempt/[attemptId]` | **Take assessment** - full-screen assessment interface with integrity monitoring, autosave, submission |
| `/(runtime)/a/[slug]/result/[attemptId]` | **Attempt result view** - candidate sees their result after submission (decision, score, feedback) |

### Quick/Live Testing

| Route | Purpose |
|-------|---------|
| `/run-test` | Quick test runner - public assessment preview tool (no auth required, for testing live assessments) |
| `/(runtime)/quick/live` | Quick live test - entry point for live session-based testing |
| `/(runtime)/quick/live/[sessionCode]` | Join quick session - specific live test session participant view |

---

## ADMIN / SETTINGS

Routes for system administration, configuration, and authentication.

| Route | Purpose |
|-------|---------|
| `/login` | Authentication - magic link email or credential entry (guards all authenticated pages) |
| `/departments` | Departments admin - CRUD for departments, view department user assignments |
| `/departments/[id]` | Department detail - view/edit single department configuration |
| `/departments/[id]/users` | Department users - assign and manage users within a specific department |

**Auth Flow:**
- `requirePageSession()` - redirects unauthenticated users to login with return path
- `requireAdminPageSession()` - requires `manage_users` permission
- Post-login redirect includes URL for returning to intended page

---

## RUNTIME ONLY

Routes that exist in the runtime layout group but do not appear in main navigation and are not actively used.

| Route | Purpose | Status |
|-------|---------|--------|
| `/(runtime)/employee` | Employee placeholder - shows v1 limitation message | **Not linked from anywhere** |
| `/(runtime)/employee/verify` | Employee verification stub - likely from early employee management spike | **Not implemented** |

**Note:** These are defined in the route tree but have no navigation links and appear to be remnants from pre-v1 exploration.

---

## DISABLED

Routes that exist in the codebase but return explicit "disabled" messages and should not be used.

| Route | Purpose | Reason |
|-------|---------|--------|
| `/people/employees` | Employee management hub | Employee management is outside v1 hiring workflow; reserved for future HRMS integration |
| `/api/employees` | Employee CRUD API | Same as above |
| `/api/employees/[id]/goals` | Employee goals API | Same as above |
| `/api/employees/[id]/reviews` | Employee reviews API | Same as above |
| `/api/employees/[id]/terminate` | Employee termination API | Same as above |

**Message:** "Employee management is outside the v1 hiring workflow."

---

## LEGACY / SHOULD REMOVE LATER

Routes that redirect, duplicate, or should be consolidated into primary paths.

### Explicit Redirects (Safe to Delete)

| Old Route | Redirects To | Consolidation Action |
|-----------|--------------|----------------------|
| `/live` | `/run-test` | Remove `/live/page.tsx`, use `/run-test` directly |
| `/people` | `/people/candidates` | Remove `/people/page.tsx`, no direct navigation to intermediate |
| `/users` | `/departments/[systemDeptId]/users` | Remove `/users/page.tsx`, always route to specific department |
| `/candidates` | `/people/candidates` | Remove `/candidates/page.tsx` and related query forwarding logic |

### Partial/Duplicate Implementations

| Route | Status | Notes |
|-------|--------|-------|
| `/candidates/new` | **Live but old** | Separate from new `/people/candidates/applicants/new` flow; consolidate candidate creation |
| `/candidates/[id]` | **Live but old** | Separate from new `/people/candidates/[id]` flow; check if referenced anywhere |
| `/departments/[id]` (old app root) | **Coexists** | New path structure uses `/people/candidates/jobs/[id]` |
| `/jobs/application-status` | **Unclear** | Check if used in application workflows; may be dead code |
| `/jobs/[slug]` | **Live** | Public job detail page; coexists with admin `/people/candidates/jobs/[slug]` |

---

## PUBLIC FACING

Routes accessible without authentication, typically for external users.

| Route | Purpose | Condition |
|-------|---------|-----------|
| `/` | Marketing home page | Shows workspace stats if authenticated; features and CTAs if not |
| `/jobs` | Public careers page | Requires `PUBLIC_JOBS_ENABLED=true` in env; shows all public job postings with search/filter |

---

## API ROUTES

Backend routes (not user-facing but critical for app function).

### Authentication
- `POST /api/auth/logout` - Log out current session
- `POST /api/auth/magic/request` - Request magic link email
- `POST /api/auth/magic/verify` - Verify magic link token

### Assessment Data
- `GET/POST /api/results` - List/create results
- `GET/POST /api/results/[attemptId]` - Get/update specific result
- `POST /api/results/[attemptId]/delete` - Soft delete result
- `POST /api/results/bulk` - Bulk result operations
- `GET/POST /api/attempts/start` - Start new assessment attempt
- `POST /api/attempts/[attemptId]/autosave` - Autosave attempt progress
- `POST /api/attempts/[attemptId]/submit` - Submit completed attempt

### Candidate Management
- `GET/POST /api/candidates` - List/create candidates
- `GET/PUT/DELETE /api/candidates/[id]` - Candidate CRUD
- `POST /api/candidates/[id]/promote` - Promote candidate to next stage
- `POST /api/candidates/[id]/delete` - Soft delete candidate
- `GET /api/candidates/[id]/org-status` - Get candidate's org-wide status

### Job Management
- `GET/POST /api/jobs` - Not explicitly in routes (check if needed)
- `POST /api/jobs/[id]/apply` - Record application to job

### Assessment Templates
- `GET/POST /api/addons` - List/create addons
- `GET/PUT/DELETE /api/addons/[id]` - Addon CRUD
- `GET/POST /api/addon-presets` - List/create presets
- `GET/PUT/DELETE /api/addon-presets/[id]` - Preset CRUD

### Department & User Management
- `GET/POST /api/departments` - List/create departments
- `GET /api/departments/[id]/candidates` - Get candidates in department
- `GET/POST /api/roles` - List/create roles
- `GET/PUT /api/users/[id]/permissions` - Manage user permissions

### Invites
- `GET /api/invites/validate` - Validate assessment invite token

---

## KEY INSIGHTS & RECOMMENDATIONS

### 1. **Two Information Architecture Paths**
   - **New (Primary):** `/people/candidates/*` with granular job/applicant/candidate separation
   - **Old (Legacy):** `/candidates/*`, `/departments/[id]/*` at root level
   - **Action:** Systematically deprecate old paths; redirect isn't enough (removes navigation clarity)

### 2. **Assessment Subsystem is Well-Structured**
   - Clear separation: workspace (`/assessments`, `/results`) vs. runtime (`/(runtime)/a/*`)
   - Intent-driven routes: `/start`, `/attempt`, `/result` are semantic
   - **No action needed** — this layer is solid

### 3. **Runtime-Only Routes Should Be Removed**
   - `/(runtime)/employee/*` pages are disconnected (disabled in `/people/employees`)
   - **Action:** Remove `/app/(runtime)/employee/` entirely; decide on employee feature or delete

### 4. **Navigation Configuration Needs Audit**
   - `isNavItemActive()` uses hardcoded route prefixes (brittle)
   - Doesn't cover new nested `/people/candidates/*` structure
   - **Action:** Refactor to data-driven active state or use path matching logic

### 5. **Route Guard Consistency**
   - Mix of `requirePageSession()`, `requireAdminPageSession()`, and `notFound()`
   - No standardized approach to role-based redirects
   - **Action:** Create a route permission matrix in a config file (audit/document only)

---

## Summary Table

| Category | Count | Status |
|----------|-------|--------|
| **Visible Navigation** | 5 | ✅ Active & Authorized |
| **Assessment Subsystem** | 10 | ✅ Active & Well-Structured |
| **Admin/Settings** | 4 | ✅ Active |
| **Runtime Only** | 2 | ⚠️ Unused, Should Remove |
| **Disabled** | 5 | ⚠️ Placeholder Messages |
| **Legacy Redirects** | 4 | ⚠️ Should Deprecate |
| **API Routes** | 25+ | ✅ Active |
| **Public Facing** | 2 | ✅ Active |
| **TOTAL PAGE ROUTES** | 45+ | Mixed |

**Recommended Priority:**
1. Remove unused runtime employee routes
2. Deprecate old `/candidates/*` in favor of `/people/candidates/*`
3. Consolidate duplicate route implementations (`/candidates/new`, `/jobs/[slug]`)
4. Refactor navigation active state detection to be data-driven
5. Document route permission matrix for consistency
