# Question Format Authoring

New question formats are still **engineering-built** in this repo.

That is intentional.

The common case should be:

- add a new add-on
- reuse an existing format

Only add a new format when the interaction itself is different.

## Start with the scaffold

```powershell
npm run format:scaffold -- --id coding_editor --label "Coding Editor"
```

This creates stubs for:

- a question-type definition module
- a runtime renderer component
- a test skeleton
- a format checklist / scoring stub / review checklist doc

## Reuse vs create

Reuse an existing format when the new question can still be expressed as:

- `single_select`
- `multi_select`
- `ordering`
- `matching`
- `fill_blank_constrained`
- `log_analysis_single_select`
- `trace_execution`
- `best_next_step`
- `case_triage`
- `practical_task`
- `logic_reasoning`

Create a new format only when you need a genuinely new interaction, for example:

- code editor input
- spreadsheet-like grid interaction
- drag/drop relationship building
- simulation canvas
- multi-step custom stateful interaction

## Exact seams to touch

When adding a new format, update these seams:

1. `src/lib/assessment-engine/types.ts`
   - add the new `QuestionFormatId`

2. `src/lib/question-types/<format>.ts`
   - define the question type
   - question schema
   - answer schema
   - validation
   - review model

3. `src/lib/question-types/index.ts`
   - register the question type definition

4. `src/components/runtime/renderers/registry.tsx`
   - register:
     - label
     - hint
     - renderer

5. `src/lib/question-types/scoring-registry.ts`
   - register scoring if the format is auto-scored

6. tests
   - add format-specific tests
   - keep consistency tests passing

## What can stay unimplemented

For manual or composite formats, it is acceptable to leave some things out initially if that is deliberate:

- no auto-scoring entry in `scoring-registry.ts`
- custom review handling later, if the first version uses a basic review model
- richer renderer polish after the first safe interaction is working

What should not be skipped:

- stable format id
- runtime renderer registration
- answer validation
- at least one targeted test
- consistency tests passing

## Guardrails

The repo includes consistency checks for:

- registered question formats vs runtime renderer formats
- scoring-supported formats being a valid subset
- format aliases only pointing at known formats

If those tests fail, one of the registration seams was missed.
