# Release Readiness Backlog — single source of execution truth

**Last updated:** 2026-06-15
**Branch:** `staging-dev`
**Baseline verified this session:** `npx tsc --noEmit` clean (exit 0). Test baseline ~570 tests passing (last reported run).
**Purpose:** This document is written so a lower-cost model (Sonnet/Haiku) can execute the remaining work to reach an enterprise-grade, modular, genuinely usable ATS **without** re-deriving repo truth or re-auditing. Every task is self-contained: goal, files, steps, acceptance, verify command.

This document **supersedes** the scattered status in `MASTER_RELEASE_PLAN.md`, `REAL_ATS_READINESS_GATE.md`, `UNIFIED_ATS_WORKSPACE_PLAN.md`, and `ENTERPRISE_ATS_EXECUTION_PLAN_2026-06-15.md` for the question "what is left to do." Those remain useful as design rationale. When they conflict with this file, **this file wins** because its status table was verified against the actual code on 2026-06-15.

---

## 0. Read this before touching anything (guardrails)

These rules exist because an earlier automated audit produced **false "delete this" verdicts**. Follow them exactly.

1. **Prisma access is camelCase.** The model is `AppNotification` in `schema.prisma`, but code uses `prisma.appNotification`. To check whether a model is used, grep the **camelCase** accessor, never the PascalCase name:
   ```bash
   grep -rIn "prisma\.appNotification\|tx\.appNotification" src
   ```
   A PascalCase grep returning zero hits does **not** mean a model is dead.
2. **Never delete a schema model or run a destructive migration** unless this document explicitly lists it under "Dead code" with a verified zero-reference note. When in doubt, leave it.
3. **One task = one commit.** After each task: `npx tsc --noEmit` must be clean and `npm test` must pass. Commit with the task ID in the message (e.g. `fix(R3): wire new-applicant notification`).
4. **No new service/abstraction layers.** Extend existing modules. Keep route handlers thin — business logic goes in `src/lib/**`, not inline in `route.ts`.
5. **No schema rewrites.** Additive migrations only (new nullable columns, new tables). Never edit an existing migration file.
6. **TypeScript strict.** Zero `any`, zero `as unknown`, zero `@ts-ignore`. Server components by default; `"use client"` only when the component owns interactive state.
7. **Match surrounding code.** Copy the naming, file layout, and test style of the nearest existing equivalent before inventing a new pattern. The naming conventions table is in §6.
8. **Terminology is fixed vocabulary (§5).** Do not introduce synonyms. "Candidate", "Applicant", "Stage", "Scorecard", "Interview Kit", "Hiring Team", "Talent Pool", "Offer", "Source" mean specific things.

---

## 1. Verified status table (do NOT redo what is already real)

Verified by reading the code on 2026-06-15. Status legend: ✅ real end-to-end · 🟡 partial (gap named) · 🔴 missing/broken · 💀 dead code.

| Area | Status | Verified note |
|---|---|---|
| Core flow: apply → applicant → pipeline → finalize | ✅ | Works. |
| Assessment engine (invites, attempts, results, scoring) | ✅ | Genuine. |
| Evidence-backed profile (milestones, notes, activity) | ✅ | Works. |
| Permission model (AccessGrant + RolePermissionTemplate) | ✅ | Real scoping. |
| Interview Kits / scorecards (Batch B) | ✅ | Feedback form pre-populates from kit; saves structured JSON. |
| Microsoft 365: mailbox send + calendar + Teams (Batch F) | ✅ | Real Graph calls in `src/lib/email/send.ts`, `calendar-sync.ts`. Resend fallback intact. |
| Microsoft webhook handler | ✅ | Parses Graph change notifications. |
| Google / Zoom webhooks | 🟡 | Return 501 by design ("not active in phase 1"). Acceptable for release if scoped out — see R20. |
| Offer approval chain enforcement (Batch H) | ✅ | State machine + send-gating real. |
| **Offer approval chain *definition*** | 🔴 | `OfferApprovalChain` is **read** but there is **no UI/API to create one**. Without a chain, every offer **auto-approves** → approval feature is effectively off. **R1.** |
| Self-scheduling (Batch G) | 🟡 | Token, public page, booking all real. But slots are **manually entered windows**, not pulled from calendars. **R6.** |
| Notifications infra (Batch L) | ✅ | Model, service, API, bell all real. |
| **Notification event hooks** | 🟡 | Only offer-approval + stage-advance fire. **new-applicant and scorecard-submitted are NOT wired.** **R3.** |
| Global search API + Cmd+K palette (Batch J) | ✅ | `CommandPalette.tsx` exists; FTS + LIKE fallback real. |
| Analytics depth (Batch E) | 🟡 | Funnel/time-in-stage/role-aging/interviewer-load all real. **But sourcing is useless** — see next row. |
| **Source attribution** | 🔴 | `CandidateApplication.source` is **hardcoded to `"job_application"`** (`src/lib/db/jobs.ts:1101`). Sourcing analytics collapse to one bucket. **R2.** |
| Talent pool (Batch C) | ✅ | Pool view + toggle real. |
| Duplicate detection (Batch D) | ✅ | Email/phone check on create. |
| `src/app/candidates/` route tree | 💀 | Redirect-only shim (3 pages). Plan said delete; still ships. Low harm. **R10.** |
| HRMS surface (`/people/employees`, `/api/employees/**`, `src/lib/employees|reviews|goals`) | 💀 | Routes return 404 / "outside v1". Query libs + 2 components **never imported**. **R11.** |
| `OfferApprovalChainStep` model | 💀 | **0 references** (camelCase verified). True duplicate of `OfferApprovalStep`. **R12.** |
| Permission `hire_candidate` | ✅ | `hire/route.ts` already gates on `hire_candidate` (the documented inconsistency appears resolved). Verify in R13. |
| `create-test` / `run-test` / `live` pages | ✅ | LIVE assessment infra, nav-linked. **Keep.** Not dead. |
| `departments/[id]/assessments` | ✅ | Now renders real `AssessmentHubView`. Not a placeholder anymore. |
| Finalization ↔ milestone state drift | 🟡 | Historically the candidate row could be finalized while the timeline lagged. Recent commits added sync; **verify, don't assume** — R4. |
| Tracked secrets (`.env.backup`, `.env.vercel`) | 🔴 | Handoff blocker. **R0.** |

**Net:** the product is much further along than the older docs imply. The release-blocking work is small and specific: a handful of wiring gaps (R1–R6), one security item (R0), and standardization/cleanup (R10–R30). Most batches are genuinely done.

---

## 2. Priority order (execute top-to-bottom)

- **P0 — release blockers / trust:** R0, R1, R2, R3, R4
- **P1 — usability completeness:** R5, R6, R7, R8, R9
- **P2 — dead code & modularization:** R10, R11, R12, R13, R14, R15
- **P3 — terminology & UX standardization:** R20–R30

A cheaper model should do **P0 first, in order**, verifying after each. P2/P3 are mechanical and safe to batch.

---

## 3. P0 — Release blockers

### R0 — Remove tracked secrets from Git
**Why:** `.env.backup` and `.env.vercel` are committed. Repo is not handoff-safe.
**Steps:**
1. Confirm: `git ls-files | grep -E "\.env\.(backup|vercel)"`.
2. Add both to `.gitignore` if absent.
3. `git rm --cached .env.backup .env.vercel` (keep local copies; do not delete from disk blindly — confirm with user first).
4. Tell the user (do not do this silently): credentials in those files **must be rotated** because they remain in Git history; history scrubbing (BFG/filter-repo) is a separate follow-up.
**Acceptance:** `git ls-files` shows neither file. A note to the user about rotation + history exists.
**Verify:** `git ls-files | grep -c "\.env\.\(backup\|vercel\)"` → `0`.
**Model:** Haiku, but **must surface the rotation warning to the user, not auto-rotate.**

### R1 — Offer approval chain has no definition UI (feature is silently off)
**Why:** `prisma.offerApprovalChain.findFirst` is read in `src/app/api/candidates/[id]/offer/route.ts:175` and `src/app/people/candidates/[id]/page.tsx:334`, but **nothing creates a chain**. Result: `route.ts:180` always hits the auto-approve branch. The whole Batch H approval feature is dormant in practice.
**Decision (resolved 2026-06-15):** Build the **Admin UI per department**. Do not ship auto-approve as the v1 default behavior — the chain-definition UI is in scope.
**Implementation (department-scoped):**
1. API: `POST /api/departments/[id]/offer-approval-chain` — body `{ steps: [{ approverId, sortOrder }] }`. Upsert one `OfferApprovalChain` per `departmentId` + replace its `steps`. Gate on `manage_users` (or a dedicated admin permission — match how integrations admin routes gate).
2. API: `GET` same path — return the chain for display.
3. UI: a section on the department workspace (or `/integrations`-style admin surface) listing ordered approvers with add/remove/reorder. Reuse the existing approver/user picker pattern used by Hiring Team assignment.
4. Keep the auto-approve fallback (it is correct when no chain is defined) but surface it honestly in the offer panel: "No approval chain configured for this workspace — offers approve automatically."
**Acceptance:** An admin can define an ordered chain for a department; a new offer in that department creates real `OfferApprovalStep` rows and requires sequential approval before "Send" unlocks.
**Verify:** `npm test` + a new test under `src/app/api/departments/[id]/offer-approval-chain/route.test.ts`.
**Model:** Sonnet (multi-file, needs UI judgment).

### R2 — Source attribution is hardcoded
**Why:** `src/lib/db/jobs.ts:1101` sets `source: "job_application"` for every public application. The schema/plan define a taxonomy (`referral | linkedin | job_board | direct | agency | other`). Sourcing analytics (`/people/analytics/sourcing`) therefore show 100% one bucket.
**Steps:**
1. Public apply page (`src/app/jobs/[slug]/apply/page.tsx` + `JobApplicationForm.tsx`): add an optional "How did you hear about us?" select bound to the taxonomy, plus an optional `referredBy` text field (shown only when `source === "referral"`).
2. Capture `?src=` / `utm_source` query param as a default when present; otherwise default to `"direct"` for public applies (not `"job_application"`).
3. Thread the value into `createCandidateApplicationFromPublicSubmission` (or whichever function `jobs.ts:1101` lives in) and persist to `CandidateApplication.source` / `referredBy`.
4. Show a source pill on the applicant card and candidate profile header.
**Acceptance:** Applying with different sources stores different values; sourcing analytics show a real breakdown.
**Verify:** `npm test`; add a test asserting the apply mutation persists the chosen source.
**Model:** Sonnet.

### R3 — Missing notification event hooks
**Why:** `createNotification()` exists and is called on offer-approval and stage-advance, but **not** on new application or scorecard submission. The bell misses the two highest-frequency recruiter events. Confirmed: no `createNotification` call in `src/app/api/jobs/[id]/apply/route.ts` or `src/app/api/interviews/[panelId]/feedback/route.ts`.
**Steps:**
1. **New applicant:** in the apply mutation path (`src/lib/db/jobs.ts` create-application function, or the route), after the application is created, look up the job's hiring-team members / responsible owners and `createNotification({ type: "new_applicant", entityType: "application", entityId, ... })` for each. Reuse the recipient-resolution used by the application-received email so you notify the same people.
2. **Scorecard submitted:** in `src/app/api/interviews/[panelId]/feedback/route.ts`, after saving feedback, notify the candidate's responsible owner / hiring manager with `type: "scorecard_submitted"`.
3. Keep generation **fire-and-forget / non-blocking** — a notification failure must never fail the parent mutation (match the pattern already used for calendar sync).
**Acceptance:** Submitting a public application and submitting a scorecard each produce a notification row for the right recipients within the polling window.
**Verify:** `npm test`; add tests asserting a notification row is created for each event.
**Model:** Sonnet.

### R4 — Verify (and fix if needed) finalization ↔ milestone state truth
**Why:** Older audit said a finalized candidate could show a stale timeline because finalization routes updated the candidate row but not the finalized milestone. Commits `5a61ae8` and `b2f9d60` claim to have addressed sync. **Do not assume — verify.**
**Steps:**
1. Read `src/app/api/candidates/[id]/hire/route.ts`, `reject/route.ts`, `revert-finalization/route.ts`, and the milestone derivation in `src/lib/candidates/*` / `src/lib/db/candidates/*`.
2. Manually trace: when a candidate is hired/rejected, does the corresponding `CandidateMilestone` reach a terminal state AND does the header/timeline read consistently?
3. If a drift path still exists, fix it so finalization and milestone state cannot disagree. Prefer deriving stage from milestones (the `b2f9d60` direction) over dual-writing.
**Acceptance:** A hired/rejected/reverted candidate shows identical state in header, table, and timeline — no path leaves them disagreeing.
**Verify:** `npm test`; add/extend a test that finalizes a candidate and asserts header + timeline agree.
**Model:** Sonnet (requires tracing).

---

## 4. P1 — Usability completeness

### R5 — Honest empty/zero states everywhere a feature can be unconfigured
**Why:** Enterprise feel = the product tells the operator *why* something is empty and *what to do*. Several surfaces render blank or "0" with no guidance (sourcing before R2, notifications when none, approval panel when no chain, analytics with no data).
**Steps:** For each of: offer panel (no chain), sourcing analytics (no source data), notifications drawer (empty), department assessments (no presets), talent pool (empty) — add a compact empty state with one sentence of context and, where relevant, a primary action link. Reuse the existing empty-state component if one exists; otherwise create one shared `EmptyState` and use it everywhere (do not hand-roll per page).
**Acceptance:** No primary workspace surface renders a bare blank or unexplained "0".
**Verify:** Visual + `npm test` unchanged.
**Model:** Haiku (mechanical, after the shared component exists).

### R6 — Self-scheduling: document the manual-window limitation (and optionally close it)
**Why:** Slots are manually entered availability windows, not computed from connected calendars. This is fine for v1 **if stated**, misleading if not.
**Steps (v1, cheap):** In the scheduling-link generation UI and the public page, label clearly that windows are recruiter-defined. Add a note in the integrations page that calendar-driven availability is not yet automatic.
**Steps (v2, defer unless asked):** Compute free/busy from Graph `getSchedule` and subtract from windows.
**Acceptance:** No UI implies automatic calendar availability that doesn't exist.
**Model:** Haiku for v1 labeling.

### R7 — Global search: confirm Cmd+K is mounted globally
**Why:** `CommandPalette.tsx` exists; confirm it is actually rendered in the global nav/layout and bound to Cmd/Ctrl+K, with permission gating.
**Steps:** Grep for where `CommandPalette` is imported/rendered. If it is not in the root layout / `MainNav`, mount it. Verify keyboard binding and that results respect `view_candidates`.
**Acceptance:** Cmd+K opens the palette from any authenticated page; results are permission-scoped.
**Model:** Haiku.

### R8 — Applicant bulk assignment uses raw owner-ID input
**Why:** Documented weak UX: bulk owner assignment takes a raw owner ID string. Real ATS use a searchable people picker.
**Steps:** Replace the raw ID input in the applicant bulk-assign modal with the same searchable user picker used elsewhere (Hiring Team modal). Scope the candidate list to department-aware active users, not all users.
**Acceptance:** Bulk assignment uses a name-search picker scoped to the relevant users.
**Model:** Sonnet.

### R9 — Candidate table: surface responsible team + owner clearly
**Why:** Documented gap: unassigned owner is plain text, responsible team not visible in the table.
**Steps:** Add an owner/team avatar-group column to `CandidateWorkspaceTable`; make "Unassigned" visually distinct (amber pill). Reuse the avatar-group component if one exists.
**Acceptance:** Owner/team is visible per row; unassigned stands out.
**Model:** Haiku.

---

## 5. P2 — Dead code removal & modularization

> All removals below were verified with **camelCase** Prisma greps on 2026-06-15. Still re-verify before deleting.

### R10 — Remove the `/candidates/` redirect shim
**Files:** `src/app/candidates/page.tsx`, `[id]/page.tsx`, `new/page.tsx`, plus `error.tsx`/`loading.tsx`.
**Steps:** Confirm zero inbound links (`grep -rIn 'href="/candidates"' src` and router pushes). If you want to preserve old bookmarks, add a single redirect in `next.config` instead of three page files. Otherwise delete the directory.
**Acceptance:** Directory gone (or replaced by one config redirect); `npm test` + tsc clean; no broken links.
**Model:** Haiku.

### R11 — Decide & execute HRMS removal vs. feature-flag
**Why:** `Employee`, `PerformanceReview`, `EmployeeGoal`, `GoalCheckIn`, `EmployeeActivityEvent` models + `/people/employees`, `/api/employees/**` (all 404) + `src/lib/employees|reviews|goals/queries.ts` and `src/components/employees/*` are **unimported dead weight**. They are explicitly "outside v1."
**Decision (resolved 2026-06-15):** Delete the dead **app routes, lib query files, and components** (verified zero imports). **Keep** the `Employee`/`PerformanceReview`/`EmployeeGoal`/`GoalCheckIn`/`EmployeeActivityEvent` schema models — add a one-line comment above each marking them as deferred HRMS. **No destructive migration.**
**Acceptance:** No unimported employee/review/goal code remains in `src/`; schema decision recorded.
**Verify:** `grep -rIn "from.*employees/queries\|from.*reviews/queries\|from.*goals/queries" src` → 0; tsc clean.
**Model:** Sonnet (judgment on schema), Haiku for the deletions.

### R12 — Remove orphaned `OfferApprovalChainStep` model
**Why:** **0 references** (`prisma.offerApprovalChainStep` verified absent). It is a leftover duplicate of `OfferApprovalStep`/`OfferApprovalChain.steps`.
**Steps:** Remove the model from `schema.prisma`, add an additive migration that drops the (presumably empty) table. Run `npx prisma generate`. Confirm `OfferApprovalChain` and `OfferApprovalStep` (both used) are untouched.
**Acceptance:** Model gone; `prisma generate` clean; tsc + tests pass.
**Model:** Sonnet (touches schema/migration).

### R13 — Audit permission consistency end-to-end
**Why:** Docs flagged `manage_candidates` used where `hire_candidate` belongs. `hire/route.ts` already uses `hire_candidate`; confirm no finalize/offer/promote path still gates on the wrong permission, and that the catalog/UI match.
**Steps:** grep every `requirePermission*` call in candidate finalization/offer/promote routes; align each with the intended action; ensure the permission appears in the role catalog UI.
**Acceptance:** Each privileged candidate action gates on the semantically correct permission; no orphan permission in the catalog.
**Model:** Sonnet.

### R14 — Extract a shared overlay/modal contract
**Why:** `ENTERPRISE_ATS_EXECUTION_PLAN` Batch C: modal behavior (backdrop, blur, z-index, focus trap, scroll lock) is inconsistent across `EmailComposerModal`, `InterviewSchedulingModal`, `CandidateAssessmentBuilderOverlay`, anonymize modal, etc.
**Steps:** Create one `OverlayShell` (or `Dialog`) primitive with standardized backdrop/blur/z-index/focus-trap/scroll-lock. Migrate existing modals to wrap it **one at a time**, each its own commit. Do not change modal *content/behavior* — only the shell.
**Acceptance:** All ATS modals share one shell; no overlay bleed-through or clipped dropdowns.
**Model:** Sonnet (first migration), Haiku (subsequent mechanical migrations).

### R15 — `listJobPostings` DB-aggregate counts
**Why:** Plan A4 said replace in-memory applicant counting with `_count`. Verify it was done; if `listJobPostings` still pulls application rows to count, switch to `_count: { select: { applications: true } }`.
**Steps:** Read `src/lib/db/jobs.ts` `listJobPostings`. If counting in JS, convert to Prisma `_count`.
**Acceptance:** No fetch-all-to-count; counts come from DB aggregate.
**Model:** Haiku.

---

## 6. P3 — Terminology & UX standardization (real-ATS conventions)

**Why:** The user wants vocabulary and UX aligned with how real ATS products (Greenhouse, Lever, Ashby, Workable, Workday) speak — direct, sober, specific. These are industry-standard terms, not proprietary copy. Centralize all of it in the existing copy module (`src/components/navigation/nav-config.ts` already imports a `copy` object — find that copy source and make it the single dictionary).

### Canonical vocabulary (do not introduce synonyms)
| Concept | Use this term | Not |
|---|---|---|
| Person who applied to a specific job, pre-pipeline | **Applicant** | "lead", "submission" |
| Person being actively evaluated in the pipeline | **Candidate** | "applicant" (once advanced) |
| Sourced/future person, not on an active req | **Prospect** / **Talent Pool** | "lead" |
| Pipeline phase | **Stage** | "step", "phase" (UI), "status" |
| Structured interview evaluation form | **Scorecard** | "feedback form", "review" |
| Template of competencies for a stage | **Interview Kit** | "rubric set", "template" |
| Job opening | **Job** (public) / **Requisition / Req** (internal admin, optional) | "posting" inconsistently |
| Group responsible for a candidate | **Hiring Team** | "responsible team", "owners" (pick one — prefer **Hiring Team**) |
| Where applications came from | **Source** | "channel", "origin" |
| Formal employment proposal | **Offer** | — |
| People with approval authority on offers | **Approvers** | "reviewers" |

### R20 — Build/centralize the copy dictionary
**Steps:** Locate the `copy` object imported by `nav-config.ts`. Ensure every user-facing ATS label routes through it. Replace ad-hoc inline strings in workspace views, modals, and empty states with dictionary keys. This is what makes future relabeling a one-file change.
**Acceptance:** Grep shows primary nav/labels/status copy sourced from the dictionary, not inline literals.
**Model:** Sonnet (first pass), Haiku (sweep).

### R21 — Standardize status/state copy vocabulary
**Why:** Plan demands consistent state language. Adopt exactly: **Current state**, **Pending items**, **Needs attention**, **Blocked by**, **Waiting on**, **Approved by**. No "sent for approval" without naming the next approver.
**Steps:** Find offer/candidate/milestone state banners; rewrite to the fixed vocabulary; always name the owner/blocker.
**Acceptance:** No vague approval/state strings remain; every "waiting" state names who/what.
**Model:** Sonnet.

### R22 — Candidate profile tab parity with real ATS
**Target tab set (Greenhouse/Ashby convention):** Overview · Journey · Assessments · Scorecards · Notes · Files · Emails · Activity · Offer. Confirm the profile exposes these (or a justified subset) with consistent naming. Don't add empty tabs — only standardize names/order of what exists, and note any genuinely missing must-have tab.
**Model:** Sonnet.

### R23 — Public careers / apply page brand consistency
**Steps:** Align `src/app/(marketing)/page.tsx`, `src/app/jobs/**`, footer/legal (`privacy`, `terms`) to consistent, sober enterprise copy. Add a security/trust statement link if absent (Batch D intent). No marketing fluff.
**Model:** Haiku.

### R24–R30 — Reserved for follow-ups the executor discovers
Append new tasks here with the same shape (Why / Files / Steps / Acceptance / Verify / Model). Do not create separate ad-hoc docs.

---

## 6A. UI/UX polish & branding (measured against the existing design system)

> Design system already exists: tokens in `src/app/globals.css` (`--app-brand: #0aa6a0` teal, navy, `--pill-*`), primitives in `src/components/primitives/` (Button, Card, **Modal**, DataTable, DropdownMenu, StatusPill, FormInput, NotificationBanner), `WorkspaceEmptyState`, motion components. The work below is **adoption + consistency**, not building new systems. File:line evidence verified 2026-06-15.

**UX1 (high) — Unify modal shell, backdrop, z-index, focus trap.** Hand-rolled overlays bypass the `Modal` primitive and disagree on backdrop + z-index: `EmailComposerModal.tsx:234-248` (`z-50`, `bg-black/60`), `InterviewSchedulingModal.tsx:201-215` (`z-40`/`z-50`, `bg-black/40`), `CandidateAssessmentBuilderOverlay.tsx:70-79` (`z-[1200]`), `CreateRoleModal.tsx:123` (`bg-black/50`); the `Modal` primitive uses `z-[999]` + `--app-modal-overlay`. Fix: define a z-index scale (`--z-dropdown:50; --z-modal:100; --z-modal-critical:999`), migrate every modal onto the `Modal` primitive (or at minimum use `--app-modal-overlay`), guarantee focus trap + scroll lock. One modal per commit. (Concrete form of R14.) **Sonnet** first, **Haiku** for repeats.

**UX2 (high) — Reduced-motion coverage.** `globals.css:561-567` gates only 3 brand animations. `.scene-fade-up`, `.scene-chapter-reveal`, `.loading-bar`, `.system-online`, `.system-online-dot`, `.typed-caret` are NOT gated; framer-motion modals (`EmailComposerModal.tsx:242-254`) don't call `useReducedMotion()` (pattern exists in `SceneTransition.tsx:19-22`). Fix: extend the `@media (prefers-reduced-motion: reduce)` block; wrap modal motion in `useReducedMotion()`. **Haiku.**

**UX3 (medium) — Loading/skeleton states.** No `loading.tsx` for `/people/candidates`, `/people/candidates/[id]`, analytics; `results/loading.tsx` is plain text. Fix: add skeleton-table / skeleton-profile `loading.tsx` using the existing `.loading-bar` shimmer. **Haiku.**

**UX4 (medium) — Off-token colors.** `NotificationBanner.tsx:5-18` hardcodes `emerald-*/red-*` (poor dark-theme contrast); `CandidateWorkspaceView.tsx:51-54` repeats it. Fix: add `--notification-*` tokens; sweep for `bg-[#…]`/arbitrary values. **Haiku.**

**UX5 (medium) — Empty states use the shared component.** `WorkspaceEmptyState` exists but bare strings remain: `TalentPoolWorkspaceView.tsx:34-40`, `results/page.tsx:141`, notifications drawer, offer panel, sourcing. Fix: route all through `WorkspaceEmptyState` with context + CTA. (Pairs with R5.) **Haiku.**

**UX6 (medium) — Pill semantic drift.** `CandidatePills.tsx`: emerald means both milestone "done" and assessment "passed". Fix: reserve emerald for final positive outcomes, teal for in-progress, blue for pending; document the mapping. **Sonnet.**

**UX7 (medium) — A11y on icon-only controls.** Missing `aria-label`: `EmailComposerModal.tsx:272` close button; `CandidateWorkspaceTable.tsx` row-action buttons. Fix: add labels; verify focus-visible + keyboard nav on `DropdownMenu`/`CommandPalette`. **Haiku.**

**UX8 (medium) — Table scroll cue + row affordance.** `CandidateWorkspaceTable.tsx:293`, `ApplicantsTable`, `CandidateWorkspaceBoard.tsx:72` use `overflow-x-auto` with no cue; rows lack `cursor-pointer`. Fix: mask-gradient scroll cue + `cursor-pointer`/stronger hover. **Haiku.**

**UX9 (low) — Avatars in tables + truncation tooltips.** Board shows initials avatars; table does not. Truncated text (`TalentPoolWorkspaceView.tsx:72`) lacks `title=`. Fix: initials-avatar in table first column; `title` on truncated text. **Haiku.**

**UX10 (low) — Spacing rhythm + header redundancy.** Modal padding/gaps vary (`Modal.tsx` vs `EmailComposerModal.tsx:258` vs `CandidateAssessmentBuilderOverlay.tsx:90`). Fix: shared padding/gap constants; standardize; consider dropping redundant header icon-badges. **Haiku.**

---

## 6B. Scalability & modular architecture (file:line verified)

**SC1 (high) — Cap unbounded `findMany`.** `api/access-grants/route.ts:110`, `api/departments/[id]/team-users/route.ts:22` query with no `take`. Fix: add caps + pagination; grep `src/lib/db/**` for other uncapped `findMany`. **Haiku.**

**SC2 (high) — N+1 in team-assignment loop.** `src/lib/db/candidacy-team-assignments.ts:149-210` issues per-assignment `findUnique` (100 assigns ≈ 2000 queries). Fix: batch `findMany({ where:{ id:{ in: ids } } })` into a Map; loop in memory. **Sonnet.**

**SC3 (high) — In-memory applicant counting.** `src/lib/db/jobs.ts:57-59` + `listPublicJobPostings` (~332) fetch all applications to count in JS. Fix: Prisma `_count` with status filter; drop the row fetch. (Completes R15.) **Sonnet.**

**SC4 (medium) — Missing composite indexes** (additive migration): `CandidateActivityEvent @@index([candidateId, event, createdAt])`, `EmailLog @@index([status, sentAt])`, `InterviewFeedback @@index([panelId, submittedAt])`; review `Candidate (stage, departmentId, orgStage)`; confirm `AppNotification (userId, readAt, createdAt)` fits the unread query. **Sonnet.**

**SC5 (medium) — Resilient fire-and-forget.** Calendar/notification side-effects are `.catch(()=>undefined)` with no log/status (`src/lib/db/candidates/milestones.ts`, `calendar-sync.ts:99-185`). Fix: log + persist `interviewEventSync.lastSyncStatus="failed"`/`lastError`; surface in UI; never block parent. **Sonnet.**

**SC6 (medium) — Validate JSON blob fields.** `InterviewFeedback.competencyJson`, `InterviewKitCompetency.anchors`, screening `answerJson` (`jobs.ts:227-234`) stored/read without validation. Fix: Zod schemas, parse on write/read. **Sonnet.**

**SC7 (medium) — Thin fat route handlers.** `api/candidacies/route.ts:18-79` mixes validation+permission+fetch+create. Fix: move logic to `src/lib/**`; route = parse→call→respond. Apply to offer/apply/promote. **Sonnet.**

**SC8 (medium) — Standardize API error shape.** Mixed `{ok:false,message}` vs `{error}`; inconsistent logging (`access-grants/route.ts:74-79`). Fix: one `apiError()` helper `{ok:false,errorCode,message,requestId}` + typed error classes; adopt everywhere. **Sonnet.**

**SC9 (medium) — Caching strategy.** No `revalidate`/`React.cache()`. Analytics groupBy + nav counts recompute every load. Fix: `React.cache()` per-request for analytics/catalog; tag-based revalidation. **Sonnet.**

**SC10 (low) — De-duplicate stage labels.** `board/page.tsx` `STAGE_LABELS` + `analytics.ts:27-34` `labels` duplicate the canonical map. Fix: single source in `src/lib/candidates/stage.ts`; route through `getCandidateStageLabel()`. **Haiku.**

---

## 6C. Content, displayed data & copy (file:line verified)

**CT1 (critical) — Persist real source on public apply.** `src/lib/db/jobs.ts` `candidateApplication.create` (~1150-1159) never sets `source`. Fix with R2's captured value; at minimum set a non-null default so analytics isn't empty. **Sonnet (with R2).**

**CT2 (high) — Unify "Hiring team" vs "Responsible team".** `ResponsibleTeamCard.tsx:165,276` say "Responsible team"; `CandidateSidebar.tsx:173` says "Hiring team". Fix: standardize on **Hiring team** via the copy dictionary (R20). **Haiku.**

**CT3 (high) — Days-in-stage on cards/rows.** `CandidateWorkspaceBoard.tsx:25-63` cards show name/title/email only. Fix: render "N days in stage", flag >14d amber; add as a table column. **Sonnet.**

**CT4 (high) — Source pill** on `ApplicantsTable.tsx:160-164` + candidate header (after CT1/R2). **Haiku.**

**CT5 (medium) — Application date + offer status in sidebar.** `CandidateSidebar.tsx:155-167` lacks applied-date; offer status only inside the Offer tab. Fix: add "Applied {date}" + offer-status pill to sidebar. **Haiku.**

**CT6 (medium) — Contact-completeness hint.** `CandidateSidebar.tsx:114-134` silently omits missing phone/location. Fix: subtle "Phone missing · Location missing" line. **Haiku.**

**CT7 (medium) — Specific error/empty copy.** Generic "Something went wrong…" (`candidates/error.tsx:26`, `results/error.tsx:26`). Fix: context-specific message + next action via copy dictionary. **Haiku.**

**CT8 (medium) — Public candidate experience.** `jobs/[slug]/page.tsx:95-144` lacks clear location/work-type + thin confirmation; `jobs/application-status/page.tsx:34` doesn't explain statuses. Fix: work-type/location, "what's next + timeline" confirmation, per-status explanations. **Sonnet.**

**CT9 (medium) — Hiring-team visibility in lists.** `ApplicantsTable` "Owner" shows only primary. Fix: rename "Assigned to", show role summary + "+N", tooltip. **Sonnet.**

---

## 6D. Commercial readiness — gap vs world-class ATS ("can I sell this?")

**Verdict (honest):** The *hiring-workflow feature surface* is genuinely competitive with mid-market ATS (Greenhouse/Lever/Ashby/Workable) — pipeline, scorecards/interview kits, offers + approvals, talent pool, analytics, Microsoft 365 calendar/Teams/mailbox, self-scheduling, search, notifications, GDPR tooling. That hard part is largely done. What blocks "I can sell this," ordered by how fast a buyer or security reviewer hits it:

### Tier 0 — Business model (DECIDED 2026-06-15: single-tenant per customer)
- **CR0 — Ship single-tenant; do NOT build multi-tenant SaaS now.** The only `tenantId` in schema is the **Microsoft Azure tenant** on `IntegrationProviderApp`; there is no Organization/Tenant entity. **Decision: one isolated deployment + database per customer.** What this requires (instead of multi-tenancy): a reproducible per-customer deploy (env template, DB provisioning, Blob bucket, integration credentials per instance), proven staging↔prod isolation, and a documented bootstrap/seed for a fresh customer instance. **Do not add `organizationId` or query-level tenant isolation** — that is multi-tenant SaaS (CR0(b)), explicitly deferred until a design partner validates the workflow, because it re-touches every query. Any task that proposes a tenant column should stop and confirm with the user first.

### Tier 1 — Enterprise buyers require to even pilot
- **CR1 — SSO/SAML + SCIM.** Absent. Add SAML/OIDC login + JIT/SCIM provisioning (Okta/Entra/Google).
- **CR2 — MFA** for non-SSO accounts. Absent. At least TOTP.
- **CR3 — Secret hygiene & KMS.** R0 (tracked `.env`) + verify `clientSecretEncrypted` is truly encrypted at rest, not just named so. Security review fails instantly on committed secrets.
- **CR4 — Audit-trail completeness.** `AuditLog` is written (`lib/auth/audit.ts`) — good. Verify it covers every privileged action (permission/role changes, export, anonymize/delete, offer decisions, integration changes) and is exportable.

### Tier 2 — Reliability/operability for a paid product
- **CR5 — Background jobs/queue.** Calendar sync, notifications, retention cron, email are inline fire-and-forget (SC5). Needs a durable queue with retry/backoff/dead-letter.
- **CR6 — Observability.** No Sentry/OTel. Add error tracking + structured logs (request IDs partly exist via `logRouteError`) + uptime/funnels. No SLA without it.
- **CR7 — Email deliverability.** Resend works, but selling needs per-customer SPF/DKIM/DMARC alignment, bounce/complaint handling, compliant footers.
- **CR8 — Scale hardening.** SC1–SC4, SC9. 10k+ candidate customers will hit the in-memory counts / uncapped queries.
- **CR9 — Backups/DR + data residency.** Documented backup/restore + (EU) residency story. Currently unproven.

### Tier 3 — Parity expectations that close deals
- **CR10 — Configurable pipelines & custom fields.** Pipeline is **fixed** (Registration→Screener→Interview→Review→Final). Many orgs need per-job stages + custom fields. Decide if fixed-pipeline is the wedge or a blocker.
- **CR11 — Job-board distribution.** No LinkedIn/Indeed syndication. At least a careers feed + "apply with".
- **CR12 — Reporting/exports + EEO/OFCCP.** On-screen analytics exist; add CSV/scheduled exports and US diversity (EEO/OFCCP) reporting. GDPR (batch I) covers EU.
- **CR13 — Public API + outbound webhooks.** Inbound provider webhooks exist; a documented customer-facing API + outbound events do not.
- **CR14 — Resume parsing.** Resumes stored, not parsed to structured fields.
- **CR15 — Accessibility (WCAG 2.1 AA).** UX2/UX7 gaps; procurement often needs a VPAT.
- **CR16 — Google Calendar + Zoom parity.** Microsoft is real; Google/Zoom return 501 (R20). Many orgs are Google-first.

**Recommended sell path:** Choose **CR0(a) single-tenant** to reach paid pilots fast → ship Tier 1 (SSO/MFA/secrets/audit), the real enterprise-pilot gate → harden Tier 2 before any SLA → add Tier 3 items the specific buyer demands. Do **not** start multi-tenant SaaS (CR0(b)) until a design partner validates the workflow — it re-touches every query.

---

## 7. Definition of "release-ready" (exit criteria)

There are three distinct bars. Be explicit about which one you are shipping to.

**Bar A — "internal release-ready" (this repo can ship to its own org):**
1. P0 (R0–R4) complete and verified.
2. P1 (R5–R9) complete OR explicitly deferred with the limitation labeled in-product (R6 style).
3. No unimported dead code in `src/` (R10–R12, R15).
4. Permissions semantically correct (R13).
5. One overlay shell; no bleed-through (UX1/R14). Reduced-motion + a11y labels (UX2, UX7).
6. Terminology centralized and consistent (R20–R22, CT2).
7. Source attribution real (R2/CT1); days-in-stage + source pill visible (CT3/CT4).
8. `npx tsc --noEmit` clean, `npm test` green, `npm run lint` clean, `npm run build` succeeds.
9. No tracked secrets; rotation note delivered (R0).

**Bar B — "sellable to a first paid pilot" (single-tenant):** Bar A **plus** CR0(a) single-tenant deployment proven, CR1 SSO, CR3 secret hygiene, CR4 audit coverage, CR8 scale hardening (SC1–SC4).

**Bar C — "enterprise/SaaS-grade":** Bar B **plus** CR0(b) multi-tenancy (if SaaS), CR2 MFA, CR5 queue, CR6 observability, CR7 deliverability, CR9 DR/residency, and the Tier-3 parity items (CR10–CR16) the target buyer demands.

## 8. How to run this as a cheaper model

For each task, in order:
1. Re-read the task's "Files" and confirm the described state still matches (code may have moved).
2. Make the change following "Steps", matching surrounding code style.
3. Run: `npx tsc --noEmit && npm test` (and `npm run lint` for UI tasks).
4. Commit: `<type>(R#): <summary>`.
5. If a task needs a product decision flagged "Decision needed from user", **stop and ask** — do not guess.
6. Move to the next task. Do not start a new priority tier until the current tier is green.
