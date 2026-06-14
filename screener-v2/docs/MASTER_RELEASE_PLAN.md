# Master Release Plan — Northstar ATS

> ⚠️ **Status superseded (2026-06-15).** Batches A–L are now implemented. For the *current* "what is left to do" — verified against the actual code — read **`docs/RELEASE_READINESS_BACKLOG.md`**, not the batch list below. This document remains valid as **design rationale** (why each feature looks the way it does), but its status claims are out of date. When the two conflict, the backlog wins.

**Last updated:** 2026-06-14  
**Branch:** staging-dev  
**Current test baseline:** 96 test files / 544 tests passing  
**Current commit:** 0faf911

---

## Guiding principles

- No AI slop. Every UI decision must be traceable to a pattern in Ashby, Greenhouse, Lever, or Workable.
- No dead code. If it exists and is unused, remove it.
- Modular and centralized. One component, one data path, one permission check per concern.
- Server components by default. "use client" only when the component owns interactive state.
- Schema is truth. If a feature isn't in the schema, it doesn't exist — add the migration first.
- TypeScript strict. Zero `any`, zero `as unknown`, zero suppressed errors.

---

## Honest current state

### What works well
- Core hiring flow: apply → applicant review → pipeline → finalize
- Assessment engine: invites, attempts, results, scoring — genuine differentiator
- Evidence-backed profiles: milestones, notes, activity timeline, external assessments
- Permission model: AccessGrant + RolePermissionTemplate is real scoping
- Email system: Resend-backed with 7 templates and EmailLog audit trail
- Fixed pipeline: Registration → Screener → Interview → Review → Final — enforces discipline

### Architectural debt
1. `/candidates/` and `/people/candidates/` are duplicate route trees. `/candidates/` is dead — remove it.
2. `Employee`, `PerformanceReview`, `EmployeeGoal`, `GoalCheckIn`, `PerformanceReview` models exist in schema but are HRMS not ATS. They create schema noise and unused routes (`/people/employees/`). Defer or clearly gate behind a feature flag.
3. `PeopleViewSwitch` only has "Candidates" and "Analytics". Top-level nav is misleading.
4. No global search anywhere.
5. No notifications/inbox system.
6. `candidateStage` values include `"new"` which maps to `"pipeline"` — this creates label divergence. Normalize to `"pipeline"` everywhere.
7. `InterviewFeedback.competencyJson` is a freeform blob. No templates, no rubrics.
8. `/departments/[id]/assessments/` is a placeholder redirect, not a real page.
9. `listJobPostings()` fetches all jobs and counts applicants in-memory — needs DB aggregates at scale.

---

## Navigation structure (target — based on Ashby + Greenhouse)

### Global nav (left sidebar, admin users)

```
─ Hiring                          [Section header]
  Candidates     /people/candidates
  Applicants     /people/candidates/applicants
  Jobs           /people/candidates/jobs
  Talent Pool    /people/candidates/pool

─ Analytics                       [Section header]
  Overview       /people/analytics
  Sourcing       /people/analytics/sourcing
  Pipeline       /people/analytics/pipeline
  Interviews     /people/analytics/interviews

─ Assessments                     [Section header]
  Library        /assessments
  Results        /results

─ Admin                           [Section header, manage_users only]
  Workspaces     /departments
  Users          /users
  Access Roles   /access-roles
  Integrations   /integrations
```

### Department workspace subnav (right panel when in /departments/[id]/*)

```
Overview         /departments/[id]
Jobs             /departments/[id]/jobs
Applicants       /departments/[id]/applicants
Candidates       /departments/[id]/candidates    [expandable]
  ↳ Pipeline
  ↳ Screening
  ↳ Interview
  ↳ Review
  ↳ Final
Talent Pool      /departments/[id]/pool          [NEW]
Team             /departments/[id]/users
Access           /departments/[id]/access
```

### Candidate profile tabs (based on Greenhouse profile)

```
Overview    (default — summary, stage, responsible team, active milestone)
Journey     (milestone timeline with scorecard results)
Assessments (platform + external)
Notes
Files       (resume + attachments)
Emails      (sent + threaded inbound when connected)
Activity    (audit trail)
Offer       (if any)
```

---

## Batch plan

### BATCH A — Architecture cleanup (do first, unblocks everything)
**Goal:** Remove dead code, normalize stage values, fix route duplication.  
**No new features. Pure cleanup.**

**A1 — Remove duplicate /candidates/ route tree**
- Delete `src/app/candidates/` entirely (replaced by `/people/candidates/`)
- Verify no internal links point to `/candidates/` (grep for href="/candidates")
- Add redirect from `/candidates` → `/people/candidates` in middleware or Next.js redirects config

**A2 — Remove/gate HRMS models from active nav**
- Remove `/people/employees/` page from nav (keep the route but remove the nav link)
- Remove Employee-related items from `PeopleViewSwitch` if present
- Do NOT delete the schema models — they may be needed for v2 HRMS. Just remove nav exposure.

**A3 — Normalize `stage: "new"` to `stage: "pipeline"`**
- `src/lib/candidates/lifecycle.ts` — `getCandidateStageLabel("new")` already maps to "Pipeline". Good.
- Find every place `stage === "new"` is checked or set and replace with `"pipeline"`
- Write a migration that updates `Candidate.stage = "new"` → `"pipeline"` in the DB
- File to check: `src/lib/db/candidates/queries.ts`, `src/lib/db/jobs.ts`, `src/components/candidates/CandidatesViewSwitch.tsx`

**A4 — Fix listJobPostings to use DB aggregates**
- Currently fetches all jobs and counts applicants in JS
- Replace with `_count: { select: { applications: true } }` in the Prisma query
- File: `src/lib/db/jobs.ts` function `listJobPostings`

**Acceptance criteria:** `npm test` passes, `npx tsc --noEmit` clean, no links to `/candidates/` in codebase.

---

### BATCH B — Scorecard templates (P1 — highest hiring quality impact)
**Pattern:** Greenhouse "Interview Kit" + Workable "Scorecard template"  
**What Greenhouse does:** Every job has an interview plan. Each stage in the plan has a scorecard template: list of competencies, 1–5 rating scale with behavioral anchors per level, suggested interview questions, a focus area description. When an interviewer opens feedback, the form is pre-populated with that template — not blank.

**B1 — Schema: InterviewKit model**
```prisma
model InterviewKit {
  id           String   @id
  title        String                        // e.g. "Senior Engineer Technical"
  description  String?
  departmentId String?
  isGlobal     Boolean  @default(false)      // available to all depts
  createdById  String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  competencies InterviewKitCompetency[]
  jobPostings  JobPostingInterviewKit[]
}

model InterviewKitCompetency {
  id          String  @id
  kitId       String
  name        String                         // e.g. "Problem Solving"
  description String?                        // what this competency covers
  anchors     Json    @default("{}")         // { "1": "...", "3": "...", "5": "..." }
  sortOrder   Int     @default(0)
  kit         InterviewKit @relation(...)
}

model JobPostingInterviewKit {
  id            String  @id
  jobPostingId  String
  kitId         String
  milestoneType String                       // which milestone stage this kit applies to
  sortOrder     Int     @default(0)
  jobPosting    JobPosting @relation(...)
  kit           InterviewKit @relation(...)
}
```

**B2 — Admin UI: Interview kit builder**
- Route: `/assessments/kits` (new page) or `/departments/[id]/kits` for department-scoped
- Page shows: list of kits, create button
- Kit detail page: title, competency list (drag to reorder), per-competency: name, description, anchors for 1/3/5
- This is a CRUD page — use the existing `DataTable` + form pattern

**B3 — Wire kit to job posting**
- Job posting edit form: add "Interview plan" section
- User selects which kit applies to which milestone stage (one kit per stage)
- This replaces the blank `competencyJson` blob in `InterviewFeedback`

**B4 — Pre-populate feedback form from kit**
- When an interviewer opens the feedback form for a panel attached to a job:
  1. Load the kit associated with that panel's milestone stage
  2. Render one rating input (1–5) + notes per competency in the kit
  3. Show anchor text for selected rating inline
  4. Save as structured JSON: `{ competencies: [{ id, name, rating, notes }], overall, recommendation }`

**Acceptance criteria:** Create a kit, attach to a job, schedule an interview — feedback form shows the kit's competencies, saving stores structured data, profile shows structured scorecard results.

---

### BATCH C — Talent pool (P1)
**Pattern:** Lever "prospects" + Ashby "sourcing" stage  
**What Lever does:** Candidates in the talent pool have a separate view. They can be in a "nurture" state — periodic check-ins, re-engagement emails, sourcing notes. A prospect becomes a candidate when linked to an active opening.

**C1 — Talent pool list page**
- Route: `/people/candidates/pool` (global) + `/departments/[id]/pool` (scoped)
- Filter: `orgStatus = "talent_pool"` on Candidate
- Same `CandidateWorkspaceView` with scope overrides — just a different filter
- Add "Pool" tab to `CandidatesViewSwitch` and department subnav

**C2 — Move to pool / re-engage actions**
- On candidate profile sidebar: "Add to talent pool" button (sets `orgStatus = "talent_pool"`)
- On pool view: "Re-engage" button that opens a pre-filled email composer with `ad_hoc` template
- API: `POST /api/candidates/[id]/pool` with `action: "add" | "remove"`

**C3 — Source attribution**
- Add `source` field to `CandidateApplication`: `"referral" | "linkedin" | "job_board" | "direct" | "agency" | "other"`
- Add `referredBy` optional text field
- Show source pill on applicant card and candidate profile
- Feed into sourcing analytics

**Acceptance criteria:** Move candidate to pool, see them on pool page, re-engage with email, pool tab shows correct count.

---

### BATCH D — Duplicate candidate detection (P1)
**Pattern:** Greenhouse "merge candidates" + Ashby duplicate warning  
**What Greenhouse does:** On every candidate create or application submit, checks for existing candidates with the same normalized email. If found, shows a "Possible duplicate" banner on both profiles with a merge option.

**D1 — Detection on create/apply**
- In `createCandidateApplicationFromPublicSubmission`: already checks by email. Extend to also check normalized phone (strip non-digits, compare last 10).
- In `POST /api/candidates` (manual create): before inserting, check for email match. Return `{ warning: { duplicateId, duplicateName } }` in response (not a block — just a warning).

**D2 — "Possible duplicate" banner on profile**
- In `getCandidateDetail`, check if any other candidate shares the same email
- If yes, add `possibleDuplicateId?: string` and `possibleDuplicateName?: string` to `CandidateDetail`
- Show amber banner at top of candidate profile: "Another candidate with this email exists: [Name]. Review before proceeding."

**D3 — Merge flow (defer to later batch if complex)**
- For now: just detection and warning, not merge
- Merge requires careful cascade of assessments, applications, notes, activity — complex, high risk, defer

**Acceptance criteria:** Create two candidates with same email — both show duplicate warning on their profiles.

---

### BATCH E — Analytics depth (P1)
**Pattern:** Ashby analytics + Lever recruitment analytics  
**What Ashby shows:** Hiring funnel (applied → screened → interviewed → offered → accepted), time-in-stage averages, source quality (offer rate by source), interviewer load (panels per interviewer per week), open role aging (days since req opened).

Current `/people/analytics` has basic counts. Needs depth.

**E1 — Funnel conversion page** (`/people/analytics/pipeline`)
- Stage conversion rates: % who advance from each stage
- Average days per stage
- Bottleneck identification: which stage has the highest drop-off

**E2 — Sourcing analytics** (`/people/analytics/sourcing`)
- Applications by source (requires Batch C source attribution first)
- Offer rate by source
- Time-to-hire by source

**E3 — Interviewer load** (`/people/analytics/interviews`)
- Panels per interviewer over last 30/60/90 days
- Average scorecard submission rate (who's not submitting feedback)
- Panel completion rate

**E4 — Role aging** (add to existing analytics page)
- For each open job: days since posted, applicant count, pipeline count
- Surface jobs with 0 applicants after 14 days as "stalled"

**Acceptance criteria:** Analytics page shows funnel %, time-in-stage, interviewer load table.

---

### BATCH F — Microsoft 365 integration (P1 — highest recruiter UX impact)
**Pattern:** Ashby's "Connect your calendar" + Greenhouse's scheduling  
**What Ashby does:** After connecting Microsoft 365, every interview panel auto-generates a Teams meeting link. Interview invite emails are sent from the recruiter's connected mailbox. Candidate receives calendar invite. Recruiter sees the event in their Outlook calendar.

**F1 — Complete the webhook handlers** (currently return 501)
- `src/app/api/integrations/webhooks/microsoft/route.ts`
- Parse Microsoft Graph change notifications
- Validate HMAC signature
- Route to event handler: calendar event created/updated/deleted → sync to `InterviewPanel`

**F2 — Send via connected mailbox**
- In `sendEmail()`, check if the candidate's department has a connected Microsoft mailbox
- If yes, use Microsoft Graph API `me/sendMail` instead of Resend
- Fall back to Resend if no connection or send fails

**F3 — Teams meeting auto-creation**
- When `upsertInterviewPanelForMilestone` is called with `format: "video"`:
  - If department has Microsoft connection with calendar + meetings resource
  - Call Graph API to create Teams meeting: `POST /me/onlineMeetings`
  - Store join URL in `InterviewPanel.meetingUrl`
  - Sync event to connected calendar: `POST /me/calendars/{id}/events`
  - Store in `InterviewEventSync`

**F4 — Calendar event lifecycle**
- Update calendar event when panel is rescheduled
- Cancel calendar event when panel is deleted
- Surface sync status on interview panel UI (synced / out of sync / failed)

**Acceptance criteria:** Connect Microsoft 365, schedule an interview — Teams link auto-appears, calendar event created, interview invite email arrives from connected mailbox.

---

### BATCH G — Self-scheduling (P2)
**Pattern:** Ashby "public booking link" + Calendly-style flow  
**What Ashby does:** Recruiter generates a scheduling link. Candidate opens a page showing available slots (pulled from interviewer calendars via the connected integration). Candidate picks a slot. Calendar event and Teams link auto-created. Confirmation emails sent.

**Requires:** Batch F complete first.

**G1 — Availability model**
```prisma
model InterviewAvailabilityWindow {
  id           String   @id
  userId       String
  dayOfWeek    Int                    // 0=Sunday … 6=Saturday
  startMinute  Int                    // minutes from midnight
  endMinute    Int
  timezone     String
  validFrom    DateTime?
  validUntil   DateTime?
  user         User @relation(...)
}
```

**G2 — Scheduling token**
- `POST /api/candidates/[id]/milestones/[milestoneId]/schedule-link`
- Creates a short-lived token (48hr expiry) linked to the panel
- Returns public URL: `/schedule/[token]`

**G3 — Public scheduling page**
- `/schedule/[token]` — no auth required
- Shows: role title, interviewer names (no emails), available slots for next 14 days
- Slots computed from availability windows minus existing calendar events (via Graph API)
- Candidate picks slot → confirmation → panel updated → calendar event created → confirmation email sent

**Acceptance criteria:** Generate scheduling link, open in incognito, pick slot — Teams meeting created, both parties receive calendar invite.

---

### BATCH H — Offer approval chain (P2)
**Pattern:** Greenhouse offer approvals  
**What Greenhouse does:** Before an offer can be sent, it goes through an approval chain. The chain is defined per job or per department: e.g., "requires approval from Hiring Manager AND Finance". Each approver gets an email, approves in the system, and the offer moves to the next step. Only after all approvals does the "Send offer" button activate.

**H1 — Schema**
```prisma
model OfferApprovalChain {
  id            String  @id
  departmentId  String?
  jobPostingId  String?    // job-specific overrides department default
  steps         OfferApprovalStep[]
}

model OfferApprovalStep {
  id        String  @id
  chainId   String
  approverId String
  sortOrder Int
  status    String  @default("pending")   // pending | approved | rejected
  note      String?
  decidedAt DateTime?
  chain     OfferApprovalChain @relation(...)
  approver  User @relation(...)
}
```

**H2 — Offer workflow update**
- Offer status state machine: `draft → submitted_for_approval → approved → sent → accepted/rejected`
- When action = "submit_for_approval": create approval steps, email first approver
- Approval API: `POST /api/candidates/[id]/offer/approve` and `reject`
- "Mark as sent" only activates when offer.status === "approved"

**Acceptance criteria:** Submit offer for approval, approver receives email, approves, offer status advances, "Mark as sent" unlocks.

---

### BATCH I — Compliance hardening (P2)
**Pattern:** Workable GDPR tools + Greenhouse data retention  

**I1 — Retention policy**
```prisma
model DataRetentionPolicy {
  id                String  @id
  departmentId      String?    // null = global default
  retentionDays     Int        // e.g. 365
  actionOnExpiry    String     // "anonymize" | "delete" | "notify"
  appliesTo         String     // "rejected_candidates" | "talent_pool" | "all"
  createdAt         DateTime
  updatedAt         DateTime
}
```
- Daily cron job checks candidates against retention policy
- Candidates past retention date get anonymized or flagged for review

**I2 — Consent record**
- Add `consentGivenAt` and `consentVersion` to `CandidateApplication`
- Public job apply page: explicit GDPR consent checkbox (required, not pre-checked)
- Show consent date on candidate profile

**I3 — Data export (right-to-access)**
- `GET /api/candidates/[id]/export` → generates JSON/PDF of all data we hold about this person
- Shows: profile, applications, assessments, notes (non-deleted), emails, offers
- Requires `delete_candidate` permission (same as anonymize)

**Acceptance criteria:** Consent checkbox on apply page, export endpoint returns complete data, retention policy can be set per department.

---

### BATCH J — Global search (P2)
**Pattern:** Ashby cmd-K search + Greenhouse global search  
**What Ashby does:** Cmd+K opens a command palette. Type a candidate name → jump to profile. Type a job title → jump to job. Type "schedule interview" → quick action. Results update as you type with <100ms latency.

**J1 — Search API**
- `GET /api/search?q=...` — searches candidates (name, email), jobs (title), applicants
- Uses Postgres full-text search via `searchVector` (already exists on Candidate model)
- Returns grouped results: { candidates: [...], jobs: [...], applicants: [...] }
- Requires `view_candidates` permission

**J2 — Command palette UI**
- `CommandPalette` client component — `Cmd+K` / `Ctrl+K` opens it
- Debounced search input, grouped result list, keyboard navigation (↑↓ Enter)
- Recent searches stored in localStorage
- Quick actions: "Add candidate", "Create job", "Go to analytics"
- Add to `MainNav` — renders globally

**Acceptance criteria:** Cmd+K opens palette, type candidate name, navigate to profile with Enter.

---

### BATCH K — Kanban board view (P2)
**Pattern:** Ashby's default pipeline view — board is the primary view, table is secondary  
**What Ashby does:** The pipeline shows candidates as cards in Kanban columns (one per stage). Cards show: name, role, days in stage, responsible team avatar, last activity. Drag a card to advance the candidate. Click to open profile.

**K1 — Board component**
- `CandidateWorkspaceBoard` client component
- Fetches all active candidates grouped by stage (same data as table, different render)
- Columns: Pipeline / Screening / Interview / Review / Final
- Card: name, days in stage, owner avatar, latest milestone status, source pill
- Drag-and-drop via HTML5 drag API (no heavy library) — drop triggers `POST /api/candidates/[id]/stage`
- Toggle button in workspace header to switch table ↔ board (persist preference in localStorage)

**K2 — Stage advance API**
- `POST /api/candidates/[id]/stage` with `{ stage: "interview" }`
- Only allowed forward moves (no skipping to finalized from pipeline)
- Logs activity event

**Acceptance criteria:** Board shows all active candidates in columns, drag works, preference persists on refresh.

---

### BATCH L — Real-time notifications (P3)
**Pattern:** Greenhouse notifications + Lever inbox  
**What Greenhouse does:** Bell icon in nav shows unread notifications: "New applicant for Senior Engineer", "John Smith submitted scorecard", "Offer accepted by Jane Doe". Clicking navigates to the relevant record.

**L1 — Notification model**
```prisma
model Notification {
  id          String   @id
  userId      String
  type        String   // "new_applicant" | "scorecard_submitted" | "offer_responded" | ...
  title       String
  body        String?
  entityType  String   // "candidate" | "application" | "offer"
  entityId    String
  readAt      DateTime?
  createdAt   DateTime @default(now())
  user        User @relation(...)
}
```

**L2 — Notification generation**
- Hook into key mutations: new application, scorecard submitted, offer status change, stage advance
- Write notification row for relevant team members
- In the short term: polling via `GET /api/notifications` every 60s (no WebSocket needed initially)

**L3 — Bell UI in MainNav**
- Unread count badge on bell icon
- Dropdown shows last 10 notifications with read/unread state
- "Mark all read" button
- Click → navigate to entity

**Acceptance criteria:** Candidate applies → recruiter sees "New applicant" notification in bell within 60s.

---

## Page structure reference (world-class patterns)

### Candidate profile page
Based on Ashby's candidate profile (two-panel) + Greenhouse's evidence-driven tabs.

```
┌─ Header ─────────────────────────────────────────────────────┐
│  ← Back    [Name]  [Stage pill]  [Responsible team avatars]  │
│            [Position]  [Source pill]  [Days in pipeline]     │
└──────────────────────────────────────────────────────────────┘
┌─ Sidebar (left 280px) ─┐  ┌─ Main content ───────────────────┐
│ Contact info            │  │ Tab bar:                         │
│ Resume download         │  │ Overview | Journey | Assessments │
│ Stage actions           │  │ Notes | Files | Emails | Activity│
│ ─────────────────────── │  │ Offer                            │
│ Hiring team             │  │                                  │
│ ─────────────────────── │  │ [Tab content]                    │
│ Application history     │  │                                  │
│ ─────────────────────── │  │                                  │
│ Danger zone             │  │                                  │
│  Anonymize data         │  │                                  │
│  Delete record          │  │                                  │
└─────────────────────────┘  └──────────────────────────────────┘
```

**Overview tab** (Greenhouse-style):
- Current milestone card (active step, what's needed next)
- Responsible team (owner, recruiter, hiring manager, interviewers)
- Latest assessment result
- Recent activity (last 3 events)
- Quick actions: Advance stage, Schedule interview, Send email

**Journey tab:**
- Milestone timeline (existing `CandidateMilestoneTimeline`)
- Each milestone node: status, date, score/result, scorecard summary
- Interview panels nested under interview milestone with panelist avatars + recommendation chips

**Assessments tab:**
- Platform assessments (existing)
- External assessments with attachments (existing)
- When interview kit exists: link to scorecard for each panel

### Applicant review page
Based on Lever's applicant card view + Greenhouse two-column review.

```
┌─ Left: Application summary ──┐  ┌─ Right: Decision panel ──────┐
│ Name, applied date            │  │ Screening responses           │
│ Resume inline or download     │  │ Overall score                 │
│ Cover note                    │  │ [Move to pipeline] button     │
│ Screening score               │  │ [Reject] button               │
│ Source                        │  │                               │
└───────────────────────────────┘  └───────────────────────────────┘
```

### Jobs page (world-class)
Based on Ashby's job board view.

Every job card shows:
- Title + department
- Status (Published/Draft + Open/Closed)
- Applicant count → link to filtered applicants
- Pipeline count (candidates in active stages)
- Days open
- Screener preset attached
- Actions: Review applicants / Edit / Publish-toggle / Close-toggle

Add filtering: by status, by department.

### Analytics — Pipeline page (Ashby-inspired)
Funnel visualization (text-based, no chart library needed):

```
Applied         142  ──────────────────────────────  100%
Screening        89  ─────────────────────           62.7%
Interview        41  ───────────────                 28.9%
Review           18  ───────                         12.7%
Offer sent        6  ──                               4.2%
Accepted          4  ─                                2.8%
```

Per-stage avg days. Top drop-off stage highlighted in amber.

---

## Dead code to remove

| Item | Location | Action |
|---|---|---|
| `/candidates/` route tree | `src/app/candidates/` | Delete — fully replaced by `/people/candidates/` |
| `stage: "new"` value | Candidate model, queries | Normalize to `"pipeline"` via migration |
| `/people/employees/` nav link | `MainNav`, `PeopleViewSwitch` | Remove from nav (keep route, just hide) |
| Department assessments placeholder | `src/app/departments/[id]/assessments/page.tsx` | Replace with real scoped evidence view or remove from nav |
| `create-test` and `run-test` pages | `src/app/create-test/`, `src/app/run-test/` | Audit — likely dev-only, remove or gate |
| `DataTable` duplicate job columns | `src/app/departments/[id]/jobs/page.tsx` | Replaced by `JobsWorkspaceView` ✅ |
| Duplicate `listJobPostings` applicant counting | `src/lib/db/jobs.ts` | Fix to use DB aggregate (Batch A4) |

---

## Execution order for new AI chats

Start a new chat and say: **"Read docs/MASTER_RELEASE_PLAN.md in the screener-v2 project and implement Batch [X]. Do not start a new batch until the current one typechecks clean and all tests pass. Commit with a descriptive message."**

**Order:**
1. **Batch A** — Architecture cleanup (no new features, pure cleanup, unblocks everything)
2. **Batch B** — Scorecard templates (highest hiring quality impact)
3. **Batch C** — Talent pool (P1)
4. **Batch D** — Duplicate detection (P1, small)
5. **Batch E** — Analytics depth (P1)
6. **Batch F** — Microsoft 365 integration (P1, complex)
7. **Batch G** — Self-scheduling (requires F)
8. **Batch H** — Offer approval chain (P2)
9. **Batch I** — Compliance hardening (P2)
10. **Batch J** — Global search (P2)
11. **Batch K** — Kanban board (P2)
12. **Batch L** — Real-time notifications (P3)

---

## Current branch state checklist

Before starting any batch, verify:
```bash
npx tsc --noEmit       # must be clean
npm test               # must be 544/544 (or higher)
npm run lint           # must be clean
git status             # must be clean
```

After each batch:
```bash
npx tsc --noEmit       # clean
npm test               # all passing
git add -A && git commit -m "feat(batch-X): ..."
```

---

## Schema migration rules

- Every schema change gets its own migration file in `prisma/migrations/`
- Migration filename: `YYYYMMDD_description.sql`
- Never edit an existing migration — always add a new one
- Run `npx prisma generate` after every schema change
- Run `npx prisma migrate deploy` on staging before merging to main

---

## Component naming conventions

| Type | Pattern | Example |
|---|---|---|
| Page-level server component | PascalCase | `CandidateProfilePage` |
| Shared workspace view | `[Domain]WorkspaceView` | `JobsWorkspaceView` |
| Profile section panel | `Candidate[Section]Panel` | `CandidateAssessmentsPanel` |
| Modal/dialog | `[Action]Modal` | `EmailComposerModal` |
| Action button (client) | `[Action]Action` | `AnonymizeDataAction` |
| Form (client) | `[Domain]Form` | `LogExternalAssessmentForm` |
| List item | `[Domain]Card` | `CandidateCard` |
