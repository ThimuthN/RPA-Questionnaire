# Innobot_RPA_Screener

Offline, zero-install RPA candidate screener.
No Node.js, no Python, no server, no build step, no internet required.

## HR Quick Start (5 Steps)
1. Unzip the `Innobot_RPA_Screener` folder.
2. Double-click `index.html` (use Chrome or Edge).
3. Select the target `Assignment Role` and at least one `Tech Stack`.
4. Click `Diagnostics` to verify bank/blueprint health (optional but recommended), then click `Start Assessment` (or enable `Practice Mode` first if needed).
5. After completion, click `Download Result JSON` and save the file.

## Candidate Instructions
- Questions, timer, and pass mark are based on the selected role.
- Stack selection is required. Select at least one stack before starting.
- The generated paper includes both General and selected-stack questions.
- If the active question bank has no stack-specific items, diagnostics will warn and start may be blocked by blueprint rules.
- Time limit is fixed at `30 minutes` for all roles.
- Each attempt includes mixed formats (single/best-next-step, multi-select, ordering, match, trace execution, fill-in-blank, case triage, and log interpretation).
- Timer starts when `Start Assessment` is clicked.
- At `00:00`, the test auto-submits immediately.
- You can navigate with `Previous`, `Next`, or the question grid.
- Keyboard shortcuts in assessment:
  - `Alt + Left` = Previous question
  - `Alt + Right` = Next question
  - `Ctrl + Enter` = Submit confirmation
- You can submit early with `Submit` (confirmation required).
- If browser/tab is refreshed or closed, progress can be resumed (if localStorage is available).

## Configuration (`config.js`)
Primary config is `window.ASSESSMENT_CONFIG_V2`:
- `roles`: simplified role blueprints (time, count, pass, and minimum quotas)
- `stacks`: allowed candidate stack choices (`UiPath`, `AutomationAnywhere`, `Python`, `PowerAutomate`)
- `stackCategoryMap`: stack -> category mapping used in authoring and diagnostics
- `stackLabels`: UI labels for stack names
- `allowAdminOverride`: allow start with diagnostics warnings
- `showAttentionMetricsOnResults`: show tab/copy/paste metrics in results
- `localStorageKey`: autosave/resume key

Each role uses:
- `question_count`
- `pass_percentage`
- `log_analysis_minimum`
- `general_minimum`
- `stack_minimum`
- `senior_only_minimum`
- `lead_only_minimum`
- `format_targets`
- `difficulty_targets`

`window.ASSESSMENT_CONFIG` is kept only for migration compatibility with legacy question shapes.

## Editing Questions (`questions.js`)
Use v2 question schema:
```javascript
{
  id: "RPA-0001",
  role_level_min: "SE",
  role_level_max: null,
  senior_only: false,
  lead_only: false,
  tech_stack: "UiPath", // General | UiPath | AutomationAnywhere | Python | PowerAutomate
  category: "Exception Handling & Retries",
  difficulty: 3, // 1..5
  format: "log_analysis_single_choice",
  points: 2,
  time_estimate_seconds: 120,
  question_text: "Scenario text...",
  options: ["A", "B", "C", "D"],
  correct_answer: ["B"],
  scoring_method: "all_or_nothing",
  explanation: "1-3 sentence explanation.",
  rationale: "Capability being tested."
}
```

Current curated bank size is `100` questions.
Current blueprint requires stack coverage (`stack_minimum` is 2 and `general_minimum` is 10 for each role).

Common mistakes to avoid:
- Duplicate `id` values.
- Overly specific wording that needs hidden business context.
- `ordering` question missing full `correct_order`.
- `multi_select` with weak distractors or ambiguous correct choices.
- Missing `senior_only`/`lead_only` flags for exclusive pools.

## Troubleshooting
- If the file does not open correctly, use latest Chrome or Edge.
- If drag/drop ordering is difficult, use the `^` and `v` buttons for each item.
- If resume/autosave is not working, localStorage may be blocked:
  - Turn off strict privacy blocking for local files.
  - Ensure InPrivate/Incognito mode is OFF.
- If assessment cannot start, open `Diagnostics` to see blocking metadata/blueprint issues.
- Start is blocked only for hard issues (insufficient eligible questions, minimum quota shortages, invalid schema).

## Seed Usage
Deterministic runs for debugging:
- `index.html?seed=123`
- `index.html#seed=123`

With the same seed and unchanged question bank/config, selection and shuffles are deterministic.

## Notes
- No network calls are made.
- Data files are local JS (`config.js`, `questions.js`) to avoid `fetch()` issues on `file://`.
- Results page includes role/seed/start/end metadata for debugging and audit traceability.
- Exported JSON includes diagnostics snapshot and deterministic selection metadata.
- Exports support both file download and `Copy JSON to Clipboard` (clipboard support depends on browser permissions).
- Export filenames include the role slug to simplify HR filing.
- Results include anti-cheat counters in exported JSON:
  - `tabHiddenCount`
  - `copyEventCount`
  - `pasteEventCount`
