# Innobot_RPA_Screener

Offline, zero-install RPA candidate screener.
No Node.js, no Python, no server, no build step, no internet required.

## HR Quick Start (5 Steps)
1. Unzip the `Innobot_RPA_Screener` folder.
2. Double-click `index.html` (use Chrome or Edge).
3. Fill candidate details (`Full Name`, `Email`, `Phone`), select target `Assignment Role`, and at least one `Tech Stack`.
4. Click `Diagnostics` to verify bank/blueprint health (optional but recommended), then click `Start Assessment`.
5. After completion, click `Download Result JSON` and save the file.

## Pilot Mode (No Backend Needed)
- Current config is set for frontend-only pilot:
  - `inviteValidation.enabled = false`
  - `inviteValidation.requiredInCandidateMode = false`
  - `resultSubmission.enabled = false`
  - `recruiterView.enabled = false`
- Candidate link to use now: `index.html?mode=candidate`
- This allows fast rollout today with zero server setup.
- Results are shown at the end and can be exported as JSON/CSV from candidate/HR machine.

For candidate-safe links:
- `index.html?mode=candidate`
- `index.html?token=INVITE123` (token automatically enables candidate mode by default config)

For recruiter-only ranking view:
- `index.html?mode=recruiter`
- `index.html?mode=recruiter&rk=YOUR_KEY` (if `recruiterView.accessKey` is set)

## Candidate Instructions
- Questions, timer, and pass mark are based on the selected role.
- Stack selection is required. Select at least one stack before starting.
- The generated paper includes both General and selected-stack questions.
- If the active question bank has no stack-specific items, diagnostics will warn and start may be blocked by blueprint rules.
- Time limit is fixed at `30 minutes` for all roles.
- Each attempt includes mixed formats (single/best-next-step, multi-select, ordering, match, trace execution, fill-in-blank, case triage, and log interpretation).
- Timer starts when `Start Assessment` is clicked.
- At `00:00`, the test auto-submits immediately.
- If enabled, a short practical scenario opens after MCQ section.
- Final score can be weighted (`MCQ 70% + Practical 30%` by default).
- Practical response is auto-scored by rubric/keyword rules, including timeout auto-submit.
- Practical scenario is role-track based:
  - `SeniorSE` and `TechLead`: leadership/platform practical
  - Everyone else: execution-focused practical
- Practical scoring uses assertion-style rubric checks (`must_include`, `should_include`, `must_avoid`) for stronger signal.
- Practical uses one structured written task (single response), with role-tuned rubric auto-scoring.
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
- `candidateModeDefault`: force candidate mode for all links
- `candidateModeFromToken`: enable candidate mode when invite token query param exists
- `inviteTokenParam`: token query string key (default `token`)
- `candidateProfile`: enable/require candidate identity fields
- `resultSubmission`: optional auto-submit endpoint settings for JSON result sync
- `inviteValidation`: optional server-side token validate/consume flow
- `practicalSection`: practical task prompt/rubric plus role-track `packs` (`core` vs `senior_lead`) with assertion scoring
- `practicalSection.structured_tasks`: optional advanced subtask scoring (disabled in current setup)
- `leakControl`: hide per-question correct answers/explanations in candidate mode
- `timedWarnings`: 5-minute/1-minute warning thresholds
- `recruiterView`: recruiter mode settings (access key + report storage key)

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
- Network calls are optional. By default `resultSubmission.enabled` is `false`; no auto-submit calls are made unless enabled in `config.js`.
- `inviteValidation.enabled` adds server validation before start and optional token consume on submit.
- Data files are local JS (`config.js`, `questions.js`) to avoid `fetch()` issues on `file://`.
- Results page includes role/seed/start/end metadata for debugging and audit traceability.
- Exported JSON includes diagnostics snapshot and deterministic selection metadata.
- Exported JSON now includes candidate profile metadata and result submission status metadata.
- Exported JSON also includes practical scoring and weighted totals when practical section is enabled.
- Exports support both file download and `Copy JSON to Clipboard` (clipboard support depends on browser permissions).
- Export filenames include the role slug to simplify HR filing.
- Results include anti-cheat counters in exported JSON:
  - `tabHiddenCount`
  - `copyEventCount`
  - `pasteEventCount`
