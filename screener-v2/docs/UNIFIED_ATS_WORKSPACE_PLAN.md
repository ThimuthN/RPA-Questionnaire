# Unified ATS Workspace Plan

Last updated: 2026-06-02

Classification: `Patch`

Baseline:

- Branch: `staging-dev`
- Commit: `f90cb70`
- Worktree at audit start: clean

## One-system model

- The repo should present one ATS, not one global ATS plus a second department-only ATS.
- Global pages remain the canonical hiring surfaces.
- Department pages should become scope wrappers around the same candidate and applicant workspace UI, not separate custom tables.
- Canonical detail links should stay on `/people/candidates/[id]` and `/people/candidates/applicants/[id]`.
- Scope belongs in loader inputs and permission checks, not in duplicate UI ownership.

## Implementation status

- Batch `15AH-B` implemented `CandidateWorkspaceView` and `ApplicantWorkspaceView`.
- `/people/candidates` and `/departments/[id]/candidates` now render the same candidate workspace body with different scope inputs.
- `/people/candidates/applicants` and `/departments/[id]/applicants` now render the same applicant workspace body with different scope inputs.
- Department candidate pages no longer own a local simplified `DataTable`.
- Candidate profile links remain canonical `/people/candidates/[id]`.
- Remaining duplicated ATS list surfaces are jobs and department assessments.

## Duplicate-system audit

| Area | Global implementation | Department implementation | Duplication problem | Shared component/loader candidate | Consolidation risk | Recommended action |
| --- | --- | --- | --- | --- | --- | --- |
| Candidates route shell | `/people/candidates` uses `SceneShell`, `PeopleViewSwitch`, and now `CandidateWorkspaceView`. | `/departments/[id]/candidates` uses the department layout and now `CandidateWorkspaceView`. | Resolved for candidate workflow body. Outer shell still differs because global uses the people shell and department uses the department layout. | `CandidateWorkspaceView` | Low | Done in `15AH-B` |
| Candidates data loader | Both routes call `listCandidateWorkspacePage` through `CandidateWorkspaceView`. | Both routes call `listCandidateWorkspacePage` through `CandidateWorkspaceView`. | Resolved. Query parsing now lives in one shared candidate workspace body. | `listCandidateWorkspacePage` | Low | Done in `15AH-B` |
| Candidates table | Both routes now use `CandidateWorkspaceTable`. | Both routes now use `CandidateWorkspaceTable`. | Resolved. | `CandidateWorkspaceTable` | Low | Done in `15AH-B` |
| Candidate filters | Global filters remain richer because only global scope can switch departments, but both scopes now render one shared filter form body. | Same shared filter form body with department filter removed by scope. | Resolved without adding a new abstraction layer. | `CandidateWorkspaceView` | Low | Done in `15AH-B` |
| Candidate stage tabs and buckets | Both routes now use `CandidatesViewSwitch` with shared scoped counts and shared links. | Both routes now use `CandidatesViewSwitch` with shared scoped counts and shared links. | Resolved for candidates/applicants/jobs switch styling and bucket labels. | `CandidatesViewSwitch` | Low | Done in `15AH-B` |
| Candidate actions | Both routes now expose the same table actions, bulk actions, pagination, and canonical profile navigation. | Both routes now expose the same table actions, bulk actions, pagination, and canonical profile navigation. | Resolved for the workspace surface. | `CandidateWorkspaceTable` | Low | Done in `15AH-B` |
| Candidate pagination | Both routes now render `PaginationBar` from the shared view. | Both routes now render `PaginationBar` from the shared view. | Resolved. | `PaginationBar` | Low | Done in `15AH-B` |
| Applicants route shell | `/people/candidates/applicants` uses `SceneShell` and now `ApplicantWorkspaceView`. | `/departments/[id]/applicants` uses the department layout and now `ApplicantWorkspaceView`. | Resolved for applicant workflow body. | `ApplicantWorkspaceView` | Low | Done in `15AH-B` |
| Applicants loader, table, bulk assignment, pagination | Both routes now use `listApplicantWorkspacePage`, `ApplicantsTable`, and `PaginationBar` through the shared view. | Both routes now use `listApplicantWorkspacePage`, `ApplicantsTable`, and `PaginationBar` through the shared view. | Resolved. | `ApplicantWorkspaceView` | Low | Done in `15AH-B` |
| Jobs workspace | `/people/candidates/jobs` and `/departments/[id]/jobs` both call `listJobPostings`, but each defines its own `DataTable` columns and action layout. | Department route is a smaller duplicate of the global jobs table. | Real duplication exists, but it is not the highest-value ATS unification slice. | Possible future `JobsWorkspaceTable`. | Medium. Global jobs has publish/open/edit actions that the department route does not mirror completely. | Defer until after candidate/applicant workspace unification. |
| Assessments workspace | `/assessments` is a global hub for create/templates/results. | `/departments/[id]/assessments` is a placeholder card that just points back to candidates. | This is not true shared-workspace duplication yet; the department page is not a real assessment workspace. | No extraction target yet. | Low. | Defer. Either remove it from primary navigation later or replace it with real scoped evidence entry points. |

## Candidate lifecycle source-of-truth audit

### Current ownership

- `CandidateApplication` is the intake and applicant-review record.
- `HiringAssignment` is attached to `CandidateApplication`, so responsible-team ownership is application-scoped.
- The candidate table, candidate profile status pills, and finalization actions are driven by the persisted candidate row: `stage`, `orgStage`, `finalizedAs`, `orgStatus`, and `nextAction`.
- The profile timeline is driven separately by `CandidateMilestone` records and optional linked assessments/checks.

### Mapping facts

- Applicant queue status labels come from `candidateApplicationStatusLabels`.
- Candidate stage labels historically came from `candidateStageLabels` plus duplicated local overrides for the screening label. This batch adds `getCandidateStageLabel()` as the shared stage-label helper.
- Candidate table bucket logic comes from `toCandidateWorkspaceItem()` and `openWorkBucket()`, which use `candidate.stage`, resume presence, latest assessment status, and `nextAction`.
- Candidate profile “current focus” comes from `currentFocusFromMilestones()`, which reads milestone state, not the candidate row stage.
- `CandidateMilestoneTimeline` groups milestones by `sortOrder`, infers active/completed status from milestone records, and treats advanced-review items as a grouped node.
- Finalization APIs update the candidate row directly (`stage`, `orgStage`, `finalizedAs`, `orgStatus`) and log activity events, but they do not update the finalized milestone record.

### Findings

1. Is `CandidateApplication` the workflow anchor today?

- No, not across the whole lifecycle.
- It is the anchor for applicant intake, applicant review state, and responsible-team assignment.
- Once someone is in the pipeline, the active workflow anchor becomes the candidate row plus milestone/evidence records.

2. Can table and profile disagree on stage/status?

- Yes.
- The table reads the candidate row and workspace bucket logic.
- The profile header reads the candidate row plus `currentFocusFromMilestones()`.
- The timeline reads milestone state only.
- Because finalization routes do not update milestone state, a candidate can be finalized in the table/profile header while the timeline still shows the finalized milestone as not started or stale.

3. What helper currently maps lifecycle labels?

- There was no single lifecycle label helper before this batch.
- Stage labels came from `candidateStageLabels` plus duplicated local `displayStageLabel()` wrappers.
- Application labels come from `candidateApplicationStatusLabels`.
- Milestone labels come from the `candidateMilestone*Labels` maps.

4. What helper should become shared?

- `getCandidateStageLabel()` should be the single source of truth for candidate stage display labels.
- Next batch should also add one tiny shared stage-query parser for the candidate workspace routes so stage tabs stop drifting again.

5. What must wait until candidate import creates `CandidateApplication` records?

- Responsible-team assignment on imported/manual candidates.
- Canonical applicant review flows.
- Bulk assignment of reviewers/hiring managers.
- Per-application job context on the profile.
- Any “real ATS” claim that imported candidates are fully equivalent to job applicants.

## Implemented shared workspace contract

### Candidate workspace shared view

- One shared route-level component used by:
  - `/people/candidates`
  - `/departments/[id]/candidates`
- Implemented inputs:
  - `scope: "global" | "department"`
  - `departmentId?: string`
  - `searchParams`
- Preserved:
  - DB-side pagination and filtering through `listCandidateWorkspacePage`
  - `CandidateWorkspaceTable`
  - existing candidate stage tabs/buckets
  - existing empty states and notices
  - canonical profile links to `/people/candidates/[id]`
- Shared lifecycle labels still come from `getCandidateStageLabel()`.

### Applicant workspace shared view

- One shared route-level component used by:
  - `/people/candidates/applicants`
  - `/departments/[id]/applicants`
- Implemented inputs:
  - `scope: "global" | "department"`
  - `departmentId?: string`
  - `searchParams`
- Preserved:
  - DB-side pagination and filtering through `listApplicantWorkspacePage`
  - `ApplicantsTable`
  - current bulk assignment behavior
  - current empty states
  - canonical applicant detail links to `/people/candidates/applicants/[id]`

### Jobs workspace

- Duplicated, but not the next slice.
- Only include after the candidate/applicant shared views land cleanly.
- If touched later, reuse `listJobPostings` and extract only a table/view shell, not a new service layer.

### Assessments workspace

- Defer.
- The department assessment page is placeholder-grade and should not drive a fake extraction now.

## Sidebar and navigation recommendation

### Normal department-scoped users

- Primary:
  - Workspaces / Departments
- Reachable but not primary:
  - All Jobs
  - All Applicants
  - All Candidates
  - Assessments

### Admin or global users

- Primary:
  - Workspaces / Departments
- Secondary/global:
  - All Jobs
  - All Applicants
  - All Candidates
  - Assessments

### What should remain reachable but not primary

- Department-local assessment placeholder pages.
- Any admin-only global pages that exist for oversight rather than day-to-day hiring work.

## Batch 15AH-B changes

- Added `CandidateWorkspaceView` and `ApplicantWorkspaceView`.
- Rewired global and department candidate/applicant routes to those shared views.
- Replaced the department candidates local `DataTable` flow with `CandidateWorkspaceTable`.
- Reused `ApplicantsTable` for both applicant scopes through one shared route body.
- Converted `CandidatesViewSwitch` to one shared scoped switch with scoped stage counts and scoped links.
- Kept canonical candidate profile links on `/people/candidates/[id]`.
- Added focused tests for shared view wiring, route rewiring, canonical candidate links, and nav correction.

## Exact next recommended implementation batch

`Batch 15AH-C: Resolve remaining ATS surface duplication and import parity blockers`

Scope:

- Decide whether jobs should be extracted into one shared scoped workspace or explicitly deferred again.
- Make the department assessments tab honest: either turn it into a real scoped evidence entry point or demote/remove it from primary workspace flow.
- Close import parity gaps by defining how imported/manual candidates gain real `CandidateApplication` records without fake workflow data.
