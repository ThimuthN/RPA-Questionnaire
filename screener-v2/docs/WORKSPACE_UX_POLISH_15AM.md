# Workspace UX Polish — Batch 15AM-R

## Overview

This batch implements visible frontend UX cleanup across the core workspace surfaces: candidate workspace, workspace selector, candidate profile journey, and manage workspaces admin page. All changes preserve DB-side logic, permissions, and pagination while improving visual hierarchy and user guidance.

## Changes

### 1. Candidate Workspace Header/Action Cleanup

**File:** `src/components/candidates/CandidateWorkspaceView.tsx`

**Changes:**
- Split the header section into three distinct areas:
  - Header text: "Candidate database" title + subtitle
  - Status summary row: total candidates, ready for review, stalled pills
  - Action row: "Add candidate" + "Import" buttons
- Status pills and action buttons no longer share the same flex container
- Desktop layout: title/subtitle on left, status pills below, actions below or separate
- Mobile layout: actions wrap cleanly without overlap

**Motivation:** Clear visual separation between informational status and actionable controls improves cognitive load and reduces accidental clicks.

### 2. Workspace Dropdown UX Improvements

**File:** `src/components/navigation/WorkspaceSelector.tsx`

**Changes:**
- Converted from HTML `<details>` element to controlled React component using `useState`
- Added section labels:
  - "Admin" section with Admin Workspace
  - "Department Workspaces" section with active departments
- Selected workspace is visually marked with brand background
- Dropdown closes on selection (`onClick` handler sets `isOpen = false`)
- Added click-outside handler to close dropdown
- Improved styling: opaque background, strong z-index, readable department names

**Motivation:** Controlled component allows reliable close-on-select behavior; section labels clarify workspace purpose; visual selected state removes ambiguity.

### 3. Candidate Profile Journey & Responsible Team

**Files:**
- `src/components/candidates/DefaultJourneySkeleton.tsx` (new)
- `src/app/people/candidates/[id]/page.tsx`

**Changes:**

#### Default Journey Skeleton
- New component that renders a visual journey structure with 6 default stages:
  - Registered / Applied
  - Screening
  - Assessment
  - Interview
  - Advanced Review
  - Finalized
- Numbered stages with clear visual separation
- No fake data, timestamps, or completed status
- Shows context-appropriate copy based on candidate state

#### Profile Page Journey Section
- Always show journey structure (either real milestones or skeleton)
- Real milestones: show `CandidateMilestoneTimeline`
- No milestones: show `DefaultJourneySkeleton` with explanatory copy:
  - No linked application: "Imported/manual candidate — no linked application journey yet."
  - Has application: "No tracked milestones yet. Milestones will appear as the candidate moves through the hiring workflow."

#### Profile Page Responsible Team Section
- Always visible (not conditionally hidden)
- With active application: show `ResponsibleTeamCard` with team assignments
- Without active application: show warning card:
  - Heading: "Responsible team required"
  - Copy: "Create or link an application first to assign a responsible team." (if no applications)
  - Or: "Assign an owner or hiring team before advancing this candidate." (if applications exist but no active one)

**Motivation:** Always visible journey and team sections provide consistent reference points; skeleton prevents "empty state confusion"; warnings guide users toward required actions without blocking transitions.

### 4. Manage Workspaces Admin Page Enhancement

**File:** `src/app/departments/page.tsx`

**Changes:**
- Added intro panel above directory:
  - Heading: "Workspace management"
  - Copy: "Workspaces represent hiring departments or operating units. Use them to separate jobs, candidates, assessments, teams, and access."
  - Note: "Countries/markets are currently represented in workspace names. A dedicated country model can be added later."
- Renamed section to "Workspace directory"
- Updated directory description: "Manage hiring workspaces, access, and settings."
- Added "Open workspace" action button to each row
- Preserved Edit, Activate/Deactivate actions

**Motivation:** Intro panel provides context for admins new to workspace management; "Open workspace" action provides quick access to workspace settings without separate navigation.

## Tests Added

1. **CandidateWorkspaceView.test.tsx**
   - Verify status pills are rendered separately from actions
   - Verify "Add candidate" and "Import" are in action area
   - Verify department empty state copy is correct

2. **WorkspaceSelector.test.tsx** (new)
   - Verify Admin and Department Workspaces section labels render
   - Verify selected workspace is marked
   - Verify dropdown behavior with multiple workspaces
   - Verify no render when currentWorkspace is null

3. **DefaultJourneySkeleton.test.tsx** (new)
   - Verify all 6 default stages render
   - Verify imported-only message displays
   - Verify pending milestones message displays
   - Verify stage numbers are rendered in order

4. **Candidate profile page.test.tsx** (new)
   - Verify default journey skeleton renders when no milestones
   - Verify responsible team warning renders when no application
   - Verify responsible team card renders when application exists
   - Verify responsible team section always visible

5. **Departments page.test.tsx** (new)
   - Verify intro panel renders with correct copy
   - Verify workspace directory title and description
   - Verify "Open workspace" action appears
   - Verify signal cards display correct counts

## Deferred / Not Changed

- ❌ Country schema addition (noted in intro as future work)
- ❌ Country flags or country-specific UI
- ❌ User creation or access role redesign (next batch: 15AL)
- ❌ Team assignment workflows (next batch: 15AL)
- ❌ Candidate import/copy logic (unchanged, works as before)
- ❌ DB schema changes (none)
- ❌ Package upgrades (none)
- ❌ Lifecycle write enforcement (none)

## Verification

- ✅ npm ci: passed
- ✅ npx prisma generate: passed
- ✅ npm run typecheck:unused: passed
- ✅ npm run lint: passed (max-warnings=0)
- ✅ npm test: 281 tests passed
- ✅ npm run build: successful
- ✅ Deployment to staging: https://screener-v2-staging.vercel.app

## Smoke Test Checklist

When testing on staging:

**Candidate Workspace**
- [ ] `/departments/<id>/candidates` shows status pills (total, ready, stalled) separated from buttons
- [ ] "Add candidate" and "Import" buttons appear in action row
- [ ] Filter card renders cleanly
- [ ] Empty state shows correct copy for department scope

**Workspace Dropdown**
- [ ] Admin Workspace appears with "Admin" label
- [ ] Department workspaces appear with "Department Workspaces" label
- [ ] Active workspace shows visual selection state
- [ ] Clicking a workspace closes the dropdown
- [ ] Dropdown closes when clicking outside

**Candidate Profile**
- [ ] No-milestone candidate shows journey skeleton with 6 stages
- [ ] Skeleton shows correct message (imported vs. no-milestones)
- [ ] Responsible team section always visible
- [ ] No-active-application shows "Responsible team required" warning
- [ ] Active application shows ResponsibleTeamCard

**Manage Workspaces**
- [ ] `/departments` shows workspace management intro panel
- [ ] Intro panel has correct copy and country note
- [ ] "Open workspace" button appears in each row
- [ ] Table no longer feels table-only; has contextual intro and clear actions

## Next Batch

**Batch 15AL: Team, user creation, access roles, and hiring-team assignment**

- User creation workflows (email invites, role assignment)
- Access role redesign (recruiter, hiring_manager, reviewer, etc.)
- Hiring team assignment to applications
- Team-based permission scoping
