# Unified ATS Workspace Plan

Last audited: 2026-06-02

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

## Duplicate-system audit

| Area | Global implementation | Department implementation | Duplication problem | Shared component/loader candidate | Consolidation risk | Recommended action |
| --- | --- | --- | --- | --- | --- | --- |
| Candidates route shell | `/people/candidates` uses `SceneShell`, `PeopleViewSwitch`, `CandidatesViewSwitch`, summary pills, notices, filters, empty state, and `PaginationBar`. | `/departments/[id]/candidates` renders a local header and local tabs inside the department layout. | Two different shells exist for the same ATS workflow. The department page is materially thinner and behaves like a second system. | Shared route-level `CandidateWorkspaceView` with scope props. | Medium. Permissions and surrounding layout differ, but the page payload is already compatible. | Next batch: share the route shell while keeping department access checks in the route. |
| Candidates data loader | Both routes call `listCandidateWorkspacePage`. | Both routes call `listCandidateWorkspacePage`. | Loader is already shared, but stage-query parsing drifted. Department logic mixed applicants into pipeline and previously treated finalized as active. | Keep `listCandidateWorkspacePage`; add one small shared stage-query parser next batch. | Low. The data contract already exists. | Preserve the loader. Consolidate query parsing, not the DB code. |
| Candidates table | Global route uses `CandidateWorkspaceTable`. | Department route used a custom `DataTable`. | Department candidates loses bulk actions, quick actions, assessment pills, owner visibility, and canonical stage display rules. | `CandidateWorkspaceTable`. | Low. The table already accepts permissions and department options. | Next batch: use `CandidateWorkspaceTable` for department scope instead of maintaining a second table. |
| Candidate filters | Global filters: `q`, `roleId`, `departmentId` when globally scoped, `owner`, `assessmentStatus`, `finalizedAs`, `sort`, plus reset/quick filters. | Department filters: only `q` and `roleId`. | Same workspace concept, different filter semantics and different empty states. | Shared filter form with scope-aware field toggles. | Medium. Global-only filters must stay hidden for department users. | Next batch: extract one shared filter form configuration. |
| Candidate stage tabs and buckets | `CandidatesViewSwitch` plus `/api/candidates/stage-counts`; workspace summary comes from `buildCandidateOpenWorkSummary`. | Hard-coded local tabs with no counts and no open-work summary. | Separate tab systems encourage drift. Department candidate tabs were already wrong in query behavior. | Shared stage switch fed by scoped counts or static counts fallback. | Medium. Scoped counts need either a scoped endpoint or route-provided counts. | Next batch: share the stage switch after candidate table unification. |
| Candidate actions | Global page exposes import, add candidate, bulk actions, move-stage actions, reject, assessment shortcuts, resume shortcut, and profile navigation. | Department page only links to the profile. | Department route is a stripped shadow UI, not the same ATS workspace. | `CandidateWorkspaceTable` action surface. | Low. Action permissions already live in the shared table. | Do not re-implement actions locally. Reuse the shared table next batch. |
| Candidate pagination | Global page renders `PaginationBar`. | Department page paginates in the loader but exposes no pager. | Same loader, different page semantics. Department view silently truncates after the first page. | `PaginationBar` via shared route shell. | Low. | Fix as part of the shared route shell, not as another local one-off. |
| Applicants route shell | `/people/candidates/applicants` uses `SceneShell`, `CandidatesViewSwitch`, summary cards, notices, filters, shared table, and pager. | `/departments/[id]/applicants` uses the department layout with a smaller local header and the same table/pager. | This is mostly a shell duplication problem, not a loader/table duplication problem. | Shared route-level `ApplicantWorkspaceView`. | Low. | Next batch: unify the page shell only. Keep the shared table and loader as-is. |
| Applicants loader, table, bulk assignment, pagination | Global route uses `listApplicantWorkspacePage`, `ApplicantsTable`, assignment modal/API flow, and `PaginationBar`. | Department route uses the same loader, table, modal/API flow, and pager. | This area is mostly already unified. The remaining differences are copy, empty state, and route wrapper only. | Existing `listApplicantWorkspacePage` and `ApplicantsTable`. | Low. | Treat applicant unification as a shell cleanup, not a data-layer rewrite. |
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

## Shared implementation contract for the next batch

### Candidate workspace shared view

- One shared route-level component or helper used by:
  - `/people/candidates`
  - `/departments/[id]/candidates`
- Required inputs:
  - `scope: "global" | "department"`
  - `departmentId?: string`
  - `searchParams`
  - `permissions`
  - optional `departmentOptions` only when `scope === "global"`
- Must preserve:
  - DB-side pagination and filtering through `listCandidateWorkspacePage`
  - `CandidateWorkspaceTable`
  - existing candidate stage tabs/buckets
  - existing empty states and notices
  - canonical profile links to `/people/candidates/[id]`
- Must not do in the next batch:
  - no new generic workspace framework
  - no schema changes
  - no candidate profile rewrite

### Applicant workspace shared view

- One shared route-level component or helper used by:
  - `/people/candidates/applicants`
  - `/departments/[id]/applicants`
- Required inputs:
  - `scope: "global" | "department"`
  - `departmentId?: string`
  - `searchParams`
  - `users`
- Must preserve:
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

## Tiny safe fixes in this batch

- Added `getCandidateStageLabel()` with unit coverage so candidate stage labels stop being duplicated between the shared table and profile.
- Fixed the department candidates route so the `finalized` tab reads finalized candidates instead of querying `orgStage: "active"`.
- Fixed the department candidates pipeline filter so it no longer mixes applicant-stage records into the pipeline view.

## Exact next recommended implementation batch

`Batch 15AH-B: Extract shared candidate and applicant workspace views`

Scope:

- Replace `/departments/[id]/candidates` with the same mature candidate workspace UI used globally, scoped by department.
- Replace `/departments/[id]/applicants` with the same mature applicant workspace shell used globally, scoped by department.
- Keep jobs and assessments out of scope unless a truly trivial extraction falls out naturally after the candidate/applicant work is complete.
