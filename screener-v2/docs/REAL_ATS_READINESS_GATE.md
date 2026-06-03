# Real ATS Readiness Gate

Last checked: 2026-06-04 (15AL-C: Responsible team AccessGrant integration)

Scope: committed repo state after removing untracked 15AD copy/archive residue.

This repo is not handoff-safe today. Tracked `.env.backup` and `.env.vercel` remain as deferred security debt. Do not share externally in this state. Rotate the credentials before external sharing, remove the files from Git before final handoff, and consider history scrubbing later.

## Decision criteria

- The product must behave like a lean internal ATS, not an HRMS or AI demo.
- Department scoping and permission rules must be real, not implied.
- Candidate work must stay anchored to real application and evidence records.
- List pages must not rely on unbounded fetch-all behavior.
- Deployment must be reproducible without local tracked secrets.

## Unified ATS workspace gate

Status: Yellow

Facts:

- Candidate and applicant workspace bodies are now shared across global and department scopes through `CandidateWorkspaceView` and `ApplicantWorkspaceView`.
- Both candidate scopes now use `CandidateWorkspaceTable`, shared lifecycle labels, shared pagination, and shared stage tabs.
- Both applicant scopes now use `ApplicantsTable`, shared summary cards, shared filters, and shared pagination.
- Jobs still have duplicate global and department list views.
- Department assessments is still a placeholder page, not a real scoped assessment workspace.

Gaps:

- The product no longer has duplicate candidate/applicant workflow UIs, but jobs and department assessments still keep the ATS surface uneven.
- Responsible-team assignment remains application-scoped, so imported/manual candidates are still second-class workflow citizens until imports create `CandidateApplication` records.

Next implementation slice:

- Decide whether jobs should become one shared scoped workspace or remain intentionally separate for now.
- Make department assessments honest as a real scoped evidence entry point or remove it from primary workspace flow.
- Define candidate-import parity so imported/manual candidates can gain real `CandidateApplication` records.

## Readiness summary

| Area | Status | Why |
| --- | --- | --- |
| Department workspace | Yellow | Candidate and applicant workflow views now share the same scoped UI as global, but jobs still duplicate and assessments is still placeholder-grade. |
| Users/access | Green | Department scoping via AccessGrant exists with working UI. Admin /users page allows creating users and granting system or department access. Team member discovery is now real and scoped. AccessGrant model replaces legacy departmentId defaults. |
| Job designations | Yellow | Department-scoped designation records exist, but they still carry access permissions, which keeps business designation and access role concerns coupled. |
| Jobs | Yellow | Jobs can be created, published, and tied to applications, but global and department job pages still duplicate list UI instead of sharing one scoped ATS view. |
| Applicants | Yellow | Applicant review now uses one shared route-level workspace body across global and department scopes, with DB-side search, pagination, counts, and filters preserved. |
| Candidates | Yellow | Candidate list/detail flow is real and both scopes now share one workspace body, but assessment-status filtering and sorting still drift after page fetch and jobs duplication is still adjacent. |
| Responsible team | Green | Application-based responsible-team assignment exists. Modal now loads AccessGrant-scoped team members for department job postings, and falls back to all active users for system-scoped applications. Candidates without applications show clear warning blocker. |
| Assessments/evidence | Yellow | Assessment creation, invites, results, and milestone evidence exist, but department-level assessment review is still not a real scoped workspace. |
| Candidate profile | Yellow | The profile is usable and evidence-driven, but permission wording is inconsistent and imported/no-application cases still expose workflow gaps. |
| Candidate table | Yellow | Primary action and pagination exist, but responsible-team visibility and some bulk/owner UX remain weak. |
| Production-to-staging candidate import | Red | No accepted committed import/copy pipeline exists in the repo after cleanup. |
| Vercel deployment readiness | Red | Build wiring exists, but tracked secret files remain and staging environment isolation is not proven. |

## Cross-cutting repo truth

- The repo now has a cleaner working tree, but it still carries deferred secret debt in tracked env files.
- The committed product surface is ATS-focused, but the schema still includes non-v1 shapes such as `Employee`, `PerformanceReview`, `InterviewPanel`, and `CandidateOffer`.
- The UI text claims HRMS is outside v1, which is directionally correct, but the repo shape still mixes future HRMS/interview residue with the ATS core.

## Area notes

### 1. Department workspace

Status: Yellow

Facts:

- Department routes exist for overview, designations, jobs, applicants, candidates, assessments, users, and access.
- The layout enforces workspace access before rendering the tab set.
- The overview page provides counts for users, designations, jobs, applicants, active candidates, and finalized candidates.
- Department candidates and applicants now reuse the same route-level workspace bodies as the global ATS views.

Gaps:

- The workspace is still uneven because jobs remain duplicated and assessments is still not a real operational workspace.
- The assessments tab is still a redirect-style placeholder.
- The overview counts are useful, but they do not replace actual operational views.

### 2. Users/access

Status: Yellow

Facts:

- Effective permissions come from role templates plus user overrides.
- Department permission use is checked through session department matching unless a permission has global scope.
- Department access and users pages surface assigned users, roles, and permission counts.

Gaps:

- `RoleCatalog` still carries both designation data and access permissions. That is workable, but it is still conceptually mixed.
- A dedicated `hire_candidate` permission exists in the permission catalog, but candidate finalization UI and APIs still gate on `manage_candidates`. That makes the permission model misleading.

### 3. Job designations

Status: Yellow

Facts:

- Designations are department-scoped and reusable across users, jobs, and candidates.
- The direction away from raw department strings is real.

Gaps:

- The same records still own both designation identity and permission templates.
- That means “designation” and “access role” are clearer in naming than in storage ownership.

### 4. Jobs

Status: Yellow

Facts:

- Jobs are persisted, have stable slugs, can be published/opened, and can attach screening presets.
- Public job application flow exists and creates `CandidateApplication` records.

Gaps:

- Department job listing is straightforward but thin.
- `listJobPostings` pulls all matching jobs and includes application rows to derive counts rather than using DB aggregates. That is acceptable at small scale, not strong at ATS scale.

### 5. Applicants

Status: Yellow

Facts:

- Applicant review and promotion flow exists.
- Applications are first-class records tied to both candidate and job posting.
- `listApplicantWorkspacePage` now applies department, job, status, and free-text search in the Prisma `where` clause.
- Applicant pagination is now DB-side with bounded `skip`/`take`, a default page size of 12, and a hard cap of 50.
- Total count and summary counts now come from Prisma `count()` calls instead of JS counting over the full result set.
- The applicant list query now selects only list fields needed for the table and avoids loading full job descriptions, resumes, notes, milestones, or assessment payloads.

Before:

- The workspace fetched matching application rows first.
- Free-text search happened in memory.
- Pagination happened in memory.
- Summary counts happened in memory.
- Job options were not department-scoped.

After:

- Search is DB-side for candidate name, candidate email, owner text, job title, and role label.
- Pagination is DB-side and clamped to a bounded page window.
- Summary counts are DB-side.
- Department applicant job options are department-scoped.
- Both applicant list pages now expose the same summary, filters, table, and pagination through one shared workspace body.

Remaining risks:

- Applicant bulk team assignment still fetches all active users for the modal instead of a narrower department-aware user set.
- Free-text search still uses case-insensitive `contains` matching, which is functionally correct but not ideal for larger datasets.

Index review:

- Existing helpful indexes already present:
  - `CandidateApplication(jobPostingId, status, createdAt)`
  - `CandidateApplication(candidateId, createdAt)`
  - `JobPosting(roleId)`
  - `RoleCatalog(departmentId)`
- No migration was added in this batch.
- Recommended later if applicant volume grows materially:
  - add search-oriented indexes for candidate name/email and job title lookup, likely trigram or full-text depending on the final search direction.

### 6. Candidates

Status: Yellow

Facts:

- Candidate workspace has real filters, pagination controls, profile navigation, and finalization states.
- Candidate detail is evidence-backed with resumes, notes, applications, milestones, and activity.
- This batch added a shared `getCandidateStageLabel()` helper so stage labels stop diverging between the table and profile.
- This batch also unified global and department candidate workspace bodies through `CandidateWorkspaceView`.

Gaps:

- Candidate workspace uses DB pagination, but assessment-status filtering happens after the page fetch and sorting also happens in application code.
- That means totals and visible rows can diverge from what the filter appears to mean.
- The remaining duplication problem has shifted to jobs and the placeholder department assessments surface.

### 7. Responsible team

Status: Yellow

Facts:

- Responsible-team assignment is modeled through `HiringAssignment` on `CandidateApplication`.
- Candidate profile shows grouped assignment roles and supports editing through an API-backed modal.

Gaps:

- The feature depends on a `CandidateApplication`. Imported or manually created candidates with no application cannot have a responsible team yet.
- Candidate detail fetches all active users to populate the modal rather than a department-limited or permission-limited candidate list.

### 8. Assessments/evidence

Status: Yellow

Facts:

- Assessment presets, invites, attempts, results, candidate-assessment linkage, and timeline evidence are real.
- Candidate profile and results pages expose actual evidence rather than fake AI summaries.

Gaps:

- Department assessments tab is not a true assessment workspace.
- Evidence review is split across candidate profile, result pages, and milestone UI rather than presented as one clear department-scoped evidence workflow.

### 9. Candidate profile

Status: Yellow

Facts:

- The profile now shows current stage, owner, resume state, assessment state, applications, responsible team, notes, activity, and final decision controls.
- Imported/no-application candidates are called out explicitly instead of pretending the application exists.

Gaps:

- Final decision behavior is real, but the permission contract is muddy because the UI/API use `manage_candidates` instead of the existing `hire_candidate` action.
- Responsible team and some downstream actions still degrade when the candidate has no application.
- Finalization updates the candidate row directly, but milestone state is still separate, so the profile timeline can drift from the finalization state.

### 10. Candidate table

Status: Yellow

Facts:

- The primary action is opening the profile.
- The table supports pagination, filters, quick actions, and bulk actions.

Gaps:

- Unassigned owner is only plain text and does not stand out enough.
- Responsible team is not visible in the table and not directly assignable there.
- Bulk owner assignment still uses a raw owner ID input, which is operationally weak UX for a real ATS.

### 11. Production-to-staging candidate import

Status: Yellow

Facts:

- Public application creation and local CSV candidate import exist.
- A committed dry-run candidate import path now exists at `scripts/candidate-import-dry-run.ts`.
- The dry run is capped, read-only, RPA-only, maps only to `RPA IND` / `RPA SL`, plans `CandidateApplication` creation, does not load resume blobs, and prints only redacted console output.

Gaps:

- This batch intentionally stops at dry-run planning; no staging write path is accepted or executed yet.
- Exact job matches can still fall back to department-scoped pool jobs, so the dry run still needs review before any staging-only apply batch.
- Source and target database isolation still must be proven operationally before any live import.

### 12. Vercel deployment readiness

Status: Red

Facts:

- `.env.example` documents required variables.
- `vercel.json` uses `npm run build`.
- The repo has deployment notes and Prisma generation scripts.

Gaps:

- Tracked `.env.backup` and `.env.vercel` make the repo not handoff-safe.
- Staging DB isolation and staging Blob isolation are not proven in repo truth.
- `DEPLOYMENT.md` overstates readiness and contains scope claims that no longer cleanly match the repo shape.

## Recommended next order

1. Remove tracked env files from Git after credential rotation, then verify staging and Blob isolation explicitly.
2. Review the candidate import dry-run output, then add a staging-only apply step that uses the same plan and never writes to the source database.
3. Decide whether jobs should become one shared scoped workspace or remain intentionally separate for now.
4. Decide whether `RoleCatalog` will continue to own both designations and access roles; if yes, finish the permission wording cleanup and align `hire_candidate` usage.
5. Decide whether the department assessments tab becomes a real evidence workspace or should be removed until it is real.
