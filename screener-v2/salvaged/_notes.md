# Salvaged Code

Code pulled from the cleanup pass on staging-dev (May 2026).
These are NOT live. They are reference implementations to rebuild from — cleaner, modular, wired correctly.

---

## What's here and why

### api/response.ts
**Verdict: use this NOW, not later**
Typed API response helpers: `ApiError`, `successResponse`, `errorResponse`, `notFoundError`, etc.
This should replace raw `NextResponse.json` calls everywhere. Every route should use this.

### email/send.ts
**Verdict: good, needs `resend` added to package.json**
Clean wrapper around Resend. One function, handles missing key gracefully.
Note: `resend` is not currently in package.json dependencies.

### email/templates/
**Verdict: good HTML, bring back when email is wired**
Three complete transactional emails: application received, interview scheduled, screener invite.
All have `escapeHtml` XSS protection. Proper inline CSS for email clients.
Use as starting points — don't rewrite from scratch.

### exports/results-export.ts
**Verdict: solid, wire it back when export routes are rebuilt**
Clean CSV serialization with proper RFC-4180 escaping. No external deps. Works.

### jobs/screener-dispatch.ts
**Verdict: good business logic, bring back in Phase 2**
Creates an assessment invite + sends the invite email in one atomic step.
Handles APP_URL correctly, logs errors without throwing to caller.
This is the right pattern for background job functions.

### features/interviews/
**Verdict: good component structure, rebuild in interviews feature module**
`InterviewRoundCard` — the best component in the bunch. Framer Motion, expandable, consensus display, feedback rollup. Bring this back.
`InterviewScheduleModal` — clean form, good prop interface.
`InterviewFeedbackForm` — competency scoring, private notes, good structure.
`InterviewStatusPill` — simple status display utility.
Dependencies it needs: `@/lib/interviews/types`, `@/lib/interviews/consensus` (rebuild these too).

### features/offers/
**Verdict: good structure, rebuild in offers feature module**
`OfferForm` — stores compensation in cents (correct). Clean controlled form.
`OfferCard` — displays offer summary, handles expiry countdown.
`HireConfirmModal` — confirm hire with offer summary. Has a Phase 3 note baked in (auto-create employee record).
`OfferStatusPill` — status display utility.
Dependencies: `@/lib/offers/types` (rebuild with proper TS enums).

---

## What was NOT salvaged and why

| File | Reason skipped |
|---|---|
| `HeroScene.tsx`, `ScoreReveal.tsx`, `OrbitMascot.tsx` | Brand/animation components, not current direction |
| `UserFilters.tsx`, `UsersTable.tsx` | Superseded by active user management UI |
| `DeptCandidacyPanel.tsx`, `OrgStatusControl.tsx` | Tied to dual-membership mess, rebuild after schema consolidation |
| `ActionRow.tsx`, `ActionRail.tsx` | Generic primitives, easier to rebuild clean |
| `role-service.ts` | `Date.now()` slug generation is bad pattern, `any` types, rewrite from scratch |
| `employee-workspace.ts` | Entire employee module is TBD, not worth salvaging pre-decision |
| `test-utils.ts` | Broken test infrastructure, needs full rewrite with new schema |
| `screener-dispatch.ts` deps | `screener-invite.ts` template is salvaged; dispatch is here too |

---

## Framework decision (May 2026)

**Keep:** Next.js 15 App Router, React 19, Prisma 6, PostgreSQL, Tailwind CSS, Zod, Framer Motion, Lucide React

**Add: shadcn/ui**
- Not a dependency — it's YOUR code, built on Radix UI primitives
- Accessible by default (Radix handles all keyboard/ARIA)
- Tailwind-native, works with your CSS variables
- Every component is fully overridable
- The missing piece: right now custom primitives (Modal, Button, ChoicePills) are inconsistent; shadcn replaces them with a single coherent system
- Run: `npx shadcn@latest init` then add components as needed
