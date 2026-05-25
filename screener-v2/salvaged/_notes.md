# Salvaged Reference Material

This directory is quarantine, not live product code.

Use it to recover ideas later, then rebuild against the current schema, routes, UI system, and tests. Do not import directly from `salvaged/`.

## Code Worth Reconsidering Later

### `api/response.ts`
Typed API response helpers. Useful if we decide to standardize route responses, but only after auditing all active route contracts.

### `email/send.ts` and `email/templates/`
Transactional email wrapper and templates for:
- application received
- interview scheduled
- screener invite

Bring back only when email delivery is intentionally wired. Re-add a mail dependency at that time.

### `exports/results-export.ts`
CSV serialization with escaping. Rebuild or restore when result export routes are part of the product again.

### `jobs/screener-dispatch.ts`
Candidate screener dispatch flow. Potentially useful for a later background job or explicit send-invite workflow.

### `lib/interviews/`
Complete backend for structured interview panels:
- `types.ts` — InterviewPanel, member, feedback, and consensus types; RecommendationLevels/Labels/Tones
- `consensus.ts` — `deriveInterviewConsensus()` weighted-average algorithm (strong_yes…strong_no → numeric levels → aggregate)
- `queries.ts` — Full CRUD: create panel, add/remove members, submit feedback, get panel with consensus

Restore together as a unit when the interviews feature is intentionally rebuilt. The Prisma models (`InterviewPanel`, `InterviewPanelMember`, `InterviewFeedback`) remain in the schema.

### `features/interviews/`
Interview UI pieces worth mining for structure:
- interview round card
- scheduling modal
- feedback form
- status pill

Restore only as part of a cohesive interviews feature pass.

### `lib/offers/`
Complete backend for candidate offer management:
- `types.ts` — OfferStatus, CompensationType, CandidateOfferRecord; status labels/tones; `formatCompensation()` and `daysUntilExpiry()` helpers
- `queries.ts` — getCandidateOffer, createOrUpdateOffer, updateOfferStatus, deleteOffer, getOffersAboutToExpire

Restore together with the offer UI when the offers feature is intentionally rebuilt. The `CandidateOffer` Prisma model remains in the schema.

### `features/offers/`
Offer UI pieces worth mining for structure:
- offer form
- offer card
- hire confirmation modal
- status pill

Restore only as part of a cohesive offers feature pass.

### `features/employees/ReviewFormModal.tsx`
Performance review form moved out of active UI because the only live caller submitted to `console.log` instead of a real API.

Use as rough form reference only when the reviews workflow is rebuilt with persistence, validation, success/error states, and tests.

## Product Collateral

### `docs/`
Generated product-update/user-guide collateral and screenshots moved out of active `docs/`.

Use as UX reference later, not as current operating documentation.

### `components.json`
Old shadcn config moved here as reference only. If we adopt shadcn, re-run setup intentionally and add only the components we actually use.

## Not Salvaged

- Brand/animation-only components such as `HeroScene`, `ScoreReveal`, and `OrbitMascot`.
- Generic old primitives such as `ActionRow` and `ActionRail`.
- Broken test infrastructure and route tests that did not match the current helper/schema contract.
- Old recovery scripts and schema-audit docs that referenced removed database fields.
