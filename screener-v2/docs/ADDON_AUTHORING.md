# Add-On Authoring Workflow

This repo now treats the **authored add-on definition** as the source of truth for normal assessment modules.

The common path should now be:

1. Scaffold the feature
2. Add question content
3. Finalize the add-on definition
4. Register it once in the authored add-on registry
5. Add library entries
6. Sync and verify

## 0. Scaffold the feature module

Start here for a normal new add-on:

```powershell
npm run addon:scaffold -- --slug coding-exam --id coding_exam --label "Coding Assessment"
```

This creates:

- `src/features/<slug>/questions.ts`
- `src/features/<slug>/definition.ts`
- `src/features/<slug>/README.md`

It also prints:

- the import to add to `src/lib/addons/definitions.ts`
- the registration entry to add to `orderedAddonDefinitions`
- the `libraryEntries` stub to finalize in `definition.ts`
- the validation/bootstrap commands

## 1. Add the question content

Put the authored question content in:

- `src/features/<slug>/questions.ts`

Use an existing format wherever possible.

- If the add-on is fixed, return a static `ExamQuestion[]`
- If the add-on varies by config, export a small builder that reads the config and returns `ExamQuestion[]`

## 2. Finalize the authored add-on definition

Each add-on-backed assessment should own its metadata close to the feature:

- `src/features/<slug>/definition.ts`

That definition should own:

- `id`
- `label`
- `description`
- `accentTone`
- `configFields`
- `defaultConfig`
- `defaultWeight`
- `buildDurationMinutes`
- `buildConfigSummary`
- `buildRequiredPercent`
- `libraryEntries`
- `resolveItems(config)`

Current supported config field types are:

- `single_select`
- `multi_select`
- `text`
- `number`
- `boolean`

That gives us more flexibility for normal add-ons without needing a dynamic form engine.

## 3. Register the add-on once

Add the feature definition into:

- `src/lib/addons/definitions.ts`

That registry is the authored source of truth.

Safest path:

- finish the authored question content and definition first
- then either register it manually in `src/lib/addons/definitions.ts`
- or run:

```powershell
npm run addon:scaffold -- --slug coding-exam --id coding_exam --label "Coding Assessment" --register
```

The `--register` step only updates the authored registry. Keep using it after the add-on content is ready so an incomplete scaffold does not become part of the real add-on registry.

From there, the runtime compatibility layers derive:

- exam definition ids
- exam catalog metadata
- server-side exam resolution
- add-on assessment type metadata for the editor/builder

## 4. Add the add-on to the library

Each authored add-on definition can expose one or more library variants via:

- `libraryEntries` in `src/features/<slug>/definition.ts`

Each library entry can override:

- `label`
- `description`
- `defaultConfig`
- `defaultDurationMinutes`
- `defaultRequiredPercent`
- `defaultWeight`
- `isActive`
- `sortOrder`

Any omitted values fall back to the authored add-on definition.

Then sync it:

```powershell
npm run addons:sync
```

If you want curated presets too:

- add to `src/lib/addons/preset-seeds.json`
- run `npm run addon-presets:sync`

Or run both together:

```powershell
npm run addons:bootstrap
```

Important:

- the DB column is still named `engineType`
- the app-facing contract is `assessmentTypeId`
- authored library entries and presets are now source-controlled

## 5. If you need a new question format

Only add a new format if the interaction is truly different.

Start with:

```powershell
npm run format:scaffold -- --id coding_editor --label "Coding Editor"
```

Then follow:

- `docs/QUESTION_FORMAT_AUTHORING.md`

## 6. Truth checks

Always run:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

## Practical rule

For new normal add-ons:

- feature content lives under `src/features/<slug>/`
- authored registration lives in `src/lib/addons/definitions.ts`
- library availability lives in `libraryEntries` inside the authored definition

That is the paved road.
