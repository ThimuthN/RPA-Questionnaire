# Real ATS Readiness Gate

Last checked: 2026-06-02

Scope: committed repo state after removing untracked 15AD copy/archive residue.

This repo is not handoff-safe today. Tracked `.env.backup` and `.env.vercel` remain as deferred security debt. Do not share externally in this state. Rotate the credentials before external sharing, remove the files from Git before final handoff, and consider history scrubbing later.

## Decision criteria

- The product must behave like a lean internal ATS, not an HRMS or AI demo.
- Department scoping and permission rules must be real, not implied.
- Candidate work must stay anchored to real application and evidence records.
- List pages must not rely on unbounded fetch-all behavior.
- Deployment must be reproducible without local tracked secrets.

## Readiness summary

| Area | Status | Why |
| --- | --- | --- |
| Department workspace | Yellow | Real routes and access gates exist, but some tabs are still thin and the assessments tab is placeholder-grade. |
| Users/access | Yellow | Department scoping and permission inheritance exist, but role/designation ownership is still mixed and one permission is misleadingly unused. |
| Job designations | Yellow | Department-scoped designation records exist, but they still carry access permissions, which keeps business designation and access role concerns coupled. |
| Jobs | Yellow | Jobs can be created, published, and tied to applications, but list pages are still basic and not clearly hardened for scale. |
| Applicants | Yellow | Applicant review now uses DB-side search, pagination, counts, and department/job/status filters, but bulk assignment still loads all active users and text search is still plain `contains` without dedicated search indexes. |
| Candidates | Yellow | Candidate list/detail flow is real, but some filtering and sorting still happen after page fetch, so totals and page semantics can drift. |
| Responsible team | Yellow | Application-based responsible-team assignment exists, but candidates without applications cannot use it and the profile loads all active users instead of department-limited choices. |
| Assessments/evidence | Yellow | Assessment creation, invites, results, and milestone evidence exist, but department-level assessment review is not a real workspace yet. |
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

Gaps:

- The workspace is uneven. Jobs, applicants, candidates, and users are real pages; assessments is still a redirect-style placeholder.
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
- Both applicant list pages now expose pagination controls and clearer filtered-empty states.

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

Gaps:

- Candidate workspace uses DB pagination, but assessment-status filtering happens after the page fetch and sorting also happens in application code.
- That means totals and visible rows can diverge from what the filter appears to mean.

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

Status: Red

Facts:

- Public application creation and local CSV candidate import exist.
- The untracked 15AD copy scripts and reports were cleanup residue, not accepted product work.

Gaps:

- There is no accepted committed production-to-staging import or copy pipeline in this repo.
- If existing candidate data must be moved safely, that work still needs a constrained dry-run design and acceptance.

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
2. Repair the candidate import dry-run path so imported candidates always land with valid `CandidateApplication` records.
3. Decide whether `RoleCatalog` will continue to own both designations and access roles; if yes, finish the permission wording cleanup and align `hire_candidate` usage.
4. Decide whether the department assessments tab becomes a real evidence workspace or should be removed until it is real.
5. Narrow applicant bulk-assignment user loading if the active user base starts growing materially.
