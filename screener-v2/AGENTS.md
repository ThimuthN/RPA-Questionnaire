# Repository Operating Contract

## Repo goal
Bring this repository to a stable, handoff-ready, pragmatically maintainable state.

This program is not for:
- a rewrite
- architecture beautification
- speculative hardening
- cleanup for cleanup's sake

## Change classification
Every future task must be classified as exactly one of these before implementation:

### Patch
Use when the job can be completed with a targeted fix, deletion, consolidation, or small ownership correction inside the current structure.

Default to `Patch`.

### Small local refactor
Use only when the current local shape is clearly harmful and a small, cohesive restructuring is the safest way to remove duplication, bloat, or misleading code without changing behavior.

Allowed only when all of the following are true:
- the scope is local and reviewable
- the behavior is intended to stay the same
- the refactor reduces duplication, dead code, or indirection
- the work does not create a new abstraction layer unless that is the smallest clear win

### Defer
Use when the safest answer is to not change the area yet.

Choose `Defer` when any of the following are true:
- the work pushes toward a broad rewrite
- the area is a known hotspot and the task does not explicitly target it
- the behavior is too ambiguous to preserve confidently
- the change would mix cleanup with product behavior changes
- the work needs a new layer, major decomposition, or schema redesign to feel complete

## Frozen standards

### One source of truth
- Important concepts must have one clear source of truth.
- `finalized result` means the persisted `Result`.
- Critical DB invariants should have DB backstops where feasible.
- Do not keep duplicate business logic that answers the same question differently.

### Prefer deletion over abstraction
- Delete dead code.
- Delete stale helpers.
- Delete unused props, state, and imports.
- Delete clearly dead compatibility leftovers.
- Prefer deletion and consolidation over adding wrappers, helpers, or layers.

### No repeated parsing, filtering, or validation once proven duplicated
- If the same parsing, filtering, or validation logic is repeated across routes, pages, or components, consolidate it through a small shared path.
- Do not leave multiple implementations of the same rule in active use.

### No fake sophistication
Disallow:
- fake progress or loading states
- types that imply safety without real enforcement
- placeholder branches in hot paths
- helper or service layers that add indirection without adding clarity

### Thin transport layers
- Routes and pages should parse input, call the real logic, and map output or errors.
- They should not duplicate business rules.

### Explicit boundary ownership
- Files should not mix too many unrelated responsibilities.
- Large files are tolerated only when they are still cohesive.
- Broad decomposition is deferred unless explicitly approved.

### Critical client mutation rule
Important client mutation flows must include:
- `try`
- `catch`
- `finally`
- loading reset
- a clear user-visible error path

### No runtime-generated Tailwind utility strings
- Use explicit class maps or static class names.

### No DOM-query-driven UI state when explicit state is practical
- Avoid brittle DOM querying for form or checkbox state when React state should own it.

### Trust rule
- Every future batch must improve trust, not just functionality.
- Remove ambiguity, residue, and misleading code where the task safely allows it.

## Work mode rules
- Keep changes small and reviewable.
- Preserve behavior unless the task explicitly says behavior should change.
- Prefer patch over refactor, and refactor over rewrite.
- Prefer deletion and consolidation over adding abstraction.
- Do not start broad cleanup outside the named task.
- Do not fix adjacent issues unless they are required for correctness, truth checks, or the named task.
- Keep commits small and isolated.

For structural cleanup, explain:
1. why this area was targeted
2. what changed
3. why this is better
4. why behavior is unchanged

## Banned patterns
- Broad rewrites without explicit approval
- New wrapper, helper, or service layers that mainly add indirection
- Duplicate business logic for the same decision
- Fake loading, progress, or placeholder state
- Types or guards that imply guarantees the runtime does not enforce
- Runtime-generated Tailwind utility strings
- DOM-query-driven state ownership when explicit state is practical
- Dead code, stale helpers, unused props, unused state, unused imports, or fake compatibility leftovers
- Cleanup that quietly changes behavior without calling that change out

## Truth checks
Run these standard verification commands after each approved batch:
- `npm run lint`
- `npm test`
- `npm run build`

If a task explicitly pauses before verification, say so clearly.

## Hotspot caution
These files and modules are high-risk hotspots. Do not broadly refactor them unless a task explicitly targets them:
- `src/lib/db/runtime-repository.ts`
- `src/lib/db/candidates.ts`
- `src/features/runtime/RuntimeClient.tsx`
- `src/components/assessments/CreateAssessmentBuilder.tsx`

## Batch reporting expectations
Every future batch report must include:
- classification: `Patch`, `Small local refactor`, or `Defer`
- what changed
- why this change was targeted
- why it is safe
- what was deleted
- what remains ambiguous or deferred
- truth checks run and their results
