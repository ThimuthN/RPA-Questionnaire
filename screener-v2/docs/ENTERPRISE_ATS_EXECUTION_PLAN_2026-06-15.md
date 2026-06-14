# Enterprise ATS Execution Plan

Last updated: 2026-06-15

Classification: `Patch`

Status: active execution plan for the next product batches

## Objective

Bring this repo closer to a credible enterprise ATS by prioritizing the highest-value missing product pillars without broad rewrites:

- department-backed communications and scheduling
- structured decisioning
- workflow-aware UI/UX cleanup
- trust, branding, and compliance surfaces
- operational analytics

Explicitly out of scope for now:

- candidate portal
- embedded Teams / Zoom product UI
- AI summary features
- CRM campaign/nurture tooling
- broad architecture rewrites

## Real-world product direction

This plan is anchored to real ATS patterns used by products such as Ashby, Greenhouse, and Lever:

- one hiring record, not disconnected tools
- one truthful workflow state
- mailbox-backed communication
- calendar-backed scheduling
- structured interview and decision workflows
- visible trust, permissions, and auditability

The goal is not to imitate vendor marketing. The goal is to converge on the product behavior those systems consistently enforce.

## Repo truth on 2026-06-15

### What already exists

- Provider app registration and department connection foundation:
  - `src/app/integrations/page.tsx`
  - `src/components/integrations/SystemIntegrationsClient.tsx`
  - `src/components/integrations/DepartmentIntegrationsSection.tsx`
  - `src/lib/integrations/service.ts`
- Prisma schema already includes:
  - `IntegrationProviderApp`
  - `DepartmentIntegrationConnection`
  - `DepartmentIntegrationResource`
  - `IntegrationWebhookSubscription`
  - `IntegrationSyncCursor`
  - `CandidateEmailThread`
  - `CandidateEmailMessage`
  - `InterviewEventSync`
- Microsoft Graph helpers already exist:
  - `src/lib/integrations/graph.ts`
  - `src/lib/integrations/calendar-sync.ts`
- Hidden Microsoft mailbox send fallback already exists in:
  - `src/lib/email/send.ts`
- Candidate emails and manual interview scheduling already exist:
  - `src/app/api/candidates/[id]/emails/route.ts`
  - `src/components/candidates/EmailComposerModal.tsx`
  - `src/components/candidates/EmailLogPanel.tsx`
  - `src/components/candidates/InterviewSchedulingModal.tsx`
  - `src/app/api/candidates/[id]/milestones/[milestoneId]/route.ts`

### What is still half-finished

- The repo has integration schema and primitives ahead of actual workflow usage.
- Candidate email sending still behaves primarily like a direct send form plus `EmailLog`.
- Candidate email thread/message tables exist but are not the main UI or source of truth yet.
- Calendar sync exists, but the scheduling UI is still manual-first and does not clearly expose connected vs manual mode.
- Offer approvals exist, but the decision model is still not explicit enough for enterprise-grade trust.
- Overlay behavior, action hierarchy, and state messaging are still inconsistent across the ATS.

### Critical implementation rule

Do not add more ad hoc workflow behavior directly into modals and route handlers without first clarifying the execution boundary.

Thin transport is required.

## Product contract

The ATS should converge on this operating model:

### 1. One hiring record

- Applicant intake
- candidate profile
- assessments
- interviews
- offer
- communication history
- activity trail

All of these must describe the same lifecycle, not parallel partial truths.

### 2. One truthful workflow state

At any time the system must answer:

- current stage
- current owner
- pending dependencies
- blockers
- final decision state

No ambiguous labels like "sent for approval" without naming the next approver and current blocker.

### 3. One communication system

- each department can use its own mailbox identity
- ATS can tell users whether a message will send through a connected mailbox or fallback delivery
- email actions are logged in one durable communication timeline

### 4. One scheduling system

- interview scheduling should prefer a connected department calendar
- video meetings should be created by provider-backed scheduling where supported
- manual meeting-link fallback remains available when no provider connection exists

### 5. One structured decision chain

- interview plan
- scorecards
- debrief outcome
- approval routing
- final decision evidence

### 6. One trust surface

- legal pages
- privacy wording
- security/trust page
- clear enterprise copy
- consistent role and permission expectations

### 7. One analytics layer

- funnel health
- time in stage
- source quality
- interviewer load
- assessment pass-through
- offer conversion

## Execution order

## Batch A — Communications and scheduling core

Classification: `Patch`

Goal:

Make connected department channels real and visible before adding more automation.

### Target outcomes

- a department-connected Microsoft mailbox is actually used when available
- the UI tells the operator whether they are using a connected mailbox or fallback delivery
- the UI tells the operator whether interview scheduling is calendar-backed or manual fallback
- scheduling sync is resilient to active department context, not only the legacy candidate department field
- communication and scheduling surfaces stop pretending all records are equivalent when connection state differs

### Current repo entry points

- `src/lib/email/send.ts`
- `src/app/api/candidates/[id]/emails/route.ts`
- `src/components/candidates/EmailComposerModal.tsx`
- `src/components/candidates/EmailLogPanel.tsx`
- `src/lib/integrations/calendar-sync.ts`
- `src/components/candidates/InterviewSchedulingModal.tsx`
- `src/components/candidates/CandidateMilestoneTimeline.tsx`
- `src/app/people/candidates/[id]/page.tsx`

### Required changes

#### A1. Make department mail send path explicit

- ensure candidate email route resolves effective department context from active department candidacy before falling back to `candidate.departmentId`
- pass `departmentId` into `sendEmail`
- preserve Resend fallback when no provider mailbox is connected

#### A2. Surface connected channel state in UI

- email tab should show whether delivery is:
  - connected department mailbox
  - manual/fallback provider
  - not fully configured
- interview scheduling UI should show whether scheduling is:
  - connected Microsoft calendar / Teams-backed mode
  - manual meeting-link mode

#### A3. Strengthen scheduling sync ownership

- `calendar-sync.ts` should derive active department context from active department candidacy if `candidate.departmentId` is stale or empty
- manual interview creation must remain available
- sync failure must not block saving interview records

#### A4. Prepare the communication model for later thread UI

- keep `EmailLog` as the visible compatibility layer for now
- do not yet replace `EmailLogPanel`
- if durable thread/message dual-write is introduced, it must be real and reviewable, not fake placeholder syncing

### UI/UX direction

The feel should resemble real ATS systems:

- operator sees channel ownership before acting
- connected status is explicit and readable
- fallback mode is honest, not hidden
- no fake "smart" behavior
- no giant warning walls; use compact operational context panels

### Acceptance criteria

- sending email from a candidate with an active department candidacy actually attempts the department mailbox path first
- the user can tell which mail channel is in effect before sending
- scheduling modal clearly states whether provider-backed meeting creation is available
- interview scheduling still works when no provider is connected
- existing candidate email and scheduling flows do not regress

## Batch B — Structured decisioning

Classification: `Patch`

Goal:

Make decisions deterministic and auditable.

### Target outcomes

- interview plans tied to role workflow
- scorecard expectations visible by stage
- debrief record with recommendation
- explicit offer approver ownership
- deterministic final decision state
- consistent activity events for decision transitions

### Required changes

- define decision ownership UI:
  - current owner
  - waiting on
  - blocked by
  - approved by
- eliminate vague approval state copy
- align final stage truth, milestone truth, and offer truth
- make scorecard/debrief/approval chain clearly discoverable from the candidate workflow

### Acceptance criteria

- users can always identify the next decision owner
- offer approval no longer feels implicit or hidden
- final state and pending dependencies can be understood from the candidate profile header

### Current execution slice

This repo already persists offer approval chains and per-offer approval steps. The current gap is execution truth, not raw capability.

The next implementation slice must do all of the following:

- remove direct send bypass from draft offers
- require an approved offer before the send action can succeed
- show the actual current approver and remaining approval count inside the candidate offer UI
- allow the active approver to approve or reject from the candidate offer surface
- log approval progression as explicit candidate activity, not only final approval completion

This slice is intentionally limited. It does not redesign scorecards, debrief kits, or candidate header state yet.

## Batch C — Workflow-aware UI system cleanup

Classification: `Patch`

Goal:

Stop shipping isolated modal fixes and establish workflow-grade interaction rules.

### Target outcomes

- one overlay shell standard
- consistent backdrop, blur, opacity, z-index, focus trap, and scroll locking
- less cramped record action surfaces
- menu and dropdown placement aware of viewport space
- clearer state banners and empty states

### Required changes

- create a shared modal/overlay contract for ATS surfaces
- move record-level secondary actions away from overloaded row menus where appropriate
- standardize status copy:
  - `Current state`
  - `Pending items`
  - `Needs attention`
  - `Blocked by`

### Acceptance criteria

- no overlay bleed-through
- no clipped or unusable dropdowns
- less action cramming on workspace rows

## Batch D — Trust, branding, compliance, analytics

Classification: `Patch`

Goal:

Make the product operationally credible.

### Target outcomes

- stronger public careers/public jobs brand consistency
- security/trust page
- better footer/legal/operational framing
- clearer enterprise copy and empty states
- practical analytics for TA leadership

### Required changes

- add trust/security surface
- improve public site framing without marketing noise
- define analytics entry points and core metrics
- surface data-retention/compliance footing where it already exists in schema

## Deferred

Classification: `Defer`

- candidate portal
- self-scheduling rollout beyond existing token flow
- Google/Zoom parity beyond foundation wiring
- aggressive abstraction around providers
- broad DB model rewrite

## Implementation principles

### Provider strategy

- Microsoft 365 first
- Google second
- Zoom later for meeting-host support

### UI strategy

- resemble enterprise ATS behavior, not generic dashboard SaaS
- prefer operational context panels and workflow tabs over dense action clusters
- copy must be direct, sober, and specific

### Code strategy

- no new fake enterprise service layer
- keep provider logic in the existing integration modules
- keep route handlers thin
- prefer extending current boundaries over inventing new wrapper stacks

## Immediate next executable slice

This is the next safe coding slice after this document lands:

1. formalize communication/scheduling channel state on the candidate detail page
2. pass effective department context into the email send boundary
3. harden calendar sync to active department candidacy fallback
4. add targeted tests for department-backed email dispatch behavior

## File ownership map for the next slice

- page composition:
  - `src/app/people/candidates/[id]/page.tsx`
- email UI:
  - `src/components/candidates/EmailComposerModal.tsx`
  - `src/components/candidates/EmailLogPanel.tsx`
- interview scheduling UI:
  - `src/components/candidates/InterviewSchedulingModal.tsx`
  - `src/components/candidates/CandidateMilestoneTimeline.tsx`
- email dispatch:
  - `src/app/api/candidates/[id]/emails/route.ts`
  - `src/lib/email/send.ts`
- integration state:
  - `src/lib/integrations/service.ts`
  - `src/lib/integrations/types.ts`
- calendar sync:
  - `src/lib/integrations/calendar-sync.ts`

## Carry-forward notes for another agent

- Do not restart from abstract product ideas. The repo already contains integration schema and partial Microsoft send/calendar logic.
- The current priority is to make the existing foundation truthful and visible before expanding scope.
- Keep `EmailLog` and manual meeting URL fallback during the transition.
- Do not replace working flows with incomplete provider-only flows.
- If token budget gets tight, finish the communications/scheduling batch before touching broader branding or analytics work.
