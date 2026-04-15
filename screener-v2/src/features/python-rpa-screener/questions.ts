import type { PromptBlock, Question } from "@/lib/assessment-engine/types";

export type PythonRpaScreenerLevel = "Senior" | "Lead";

function paragraph(text: string): PromptBlock {
  return { type: "paragraph", text };
}

function prompt(text: string): PromptBlock {
  return { type: "prompt", text };
}

function table(headers: string[], rows: string[][]): PromptBlock {
  return { type: "table", headers, rows };
}

function list(heading: string, items: string[]): PromptBlock {
  return { type: "list", heading, items, style: "plain" };
}

function sharedProps(args: {
  id: string;
  category: string;
  difficulty: 2 | 3 | 4;
  format: Question["format"];
  prompt: string;
  explanation: string;
  rationale: string;
  promptBlocks?: PromptBlock[];
}) {
  return {
    id: args.id,
    roleLevelMin: "SeniorSE" as const,
    roleLevelMax: null,
    techStack: "Python" as const,
    category: args.category,
    difficulty: args.difficulty,
    format: args.format,
    points: 1,
    prompt: args.prompt,
    promptBlocks: args.promptBlocks,
    explanation: args.explanation,
    rationale: args.rationale
  };
}

function choiceQuestion(args: {
  id: string;
  category: string;
  difficulty: 2 | 3 | 4;
  format?: Extract<
    Question["format"],
    "single_select" | "best_next_step" | "log_analysis_single_select" | "trace_execution" | "case_triage"
  >;
  prompt: string;
  promptBlocks?: PromptBlock[];
  options: string[];
  correctAnswer: string;
  explanation: string;
  rationale: string;
  logSnippet?: string;
}): Question {
  return {
    ...sharedProps({
      id: args.id,
      category: args.category,
      difficulty: args.difficulty,
      format: args.format ?? "single_select",
      prompt: args.prompt,
      explanation: args.explanation,
      rationale: args.rationale,
      promptBlocks: args.promptBlocks
    }),
    scoringMethod: "all_or_nothing",
    options: args.options,
    correctAnswer: [args.correctAnswer],
    logSnippet: args.logSnippet
  } as Question;
}

function multiSelectQuestion(args: {
  id: string;
  category: string;
  difficulty: 2 | 3 | 4;
  prompt: string;
  promptBlocks?: PromptBlock[];
  options: string[];
  correctAnswer: string[];
  explanation: string;
  rationale: string;
  logSnippet?: string;
}): Question {
  return {
    ...sharedProps({
      id: args.id,
      category: args.category,
      difficulty: args.difficulty,
      format: "multi_select",
      prompt: args.prompt,
      explanation: args.explanation,
      rationale: args.rationale,
      promptBlocks: args.promptBlocks
    }),
    scoringMethod: "partial_with_penalty",
    options: args.options,
    correctAnswer: args.correctAnswer,
    logSnippet: args.logSnippet
  } as Question;
}

function orderingQuestion(args: {
  id: string;
  category: string;
  difficulty: 2 | 3 | 4;
  prompt: string;
  promptBlocks?: PromptBlock[];
  items: string[];
  correctOrder: number[];
  explanation: string;
  rationale: string;
}): Question {
  return {
    ...sharedProps({
      id: args.id,
      category: args.category,
      difficulty: args.difficulty,
      format: "ordering",
      prompt: args.prompt,
      explanation: args.explanation,
      rationale: args.rationale,
      promptBlocks: args.promptBlocks
    }),
    scoringMethod: "partial_position",
    items: args.items,
    correctOrder: args.correctOrder
  } as Question;
}

function matchingQuestion(args: {
  id: string;
  category: string;
  difficulty: 2 | 3 | 4;
  prompt: string;
  promptBlocks?: PromptBlock[];
  leftItems: string[];
  rightItems: string[];
  correctPairs: Record<string, string>;
  explanation: string;
  rationale: string;
}): Question {
  return {
    ...sharedProps({
      id: args.id,
      category: args.category,
      difficulty: args.difficulty,
      format: "matching",
      prompt: args.prompt,
      explanation: args.explanation,
      rationale: args.rationale,
      promptBlocks: args.promptBlocks
    }),
    scoringMethod: "partial_pairs_with_penalty",
    leftItems: args.leftItems,
    rightItems: args.rightItems,
    correctPairs: args.correctPairs
  } as Question;
}

const seniorQuestions: Question[] = [
  choiceQuestion({
    id: "python_rpa_senior_q1",
    category: "Completion safety",
    difficulty: 4,
    prompt: "Uncertain completion",
    promptBlocks: [
      paragraph(
        "A bot clicks Submit, then the portal times out. Duplicate posting is possible if the transaction already completed. What is the best next action?"
      )
    ],
    options: [
      "Retry the transaction once, then escalate if it fails again",
      "Refresh the page and repeat the submit step",
      "Verify completion state using external identifiers before replaying",
      "Route the item for manual review without checking target-system state"
    ],
    correctAnswer: "C",
    explanation: "The safest next step is to verify whether the first submit already completed before any replay.",
    rationale: "Tests replay safety when completion is uncertain."
  }),
  choiceQuestion({
    id: "python_rpa_senior_q2",
    category: "Failure handling",
    difficulty: 3,
    prompt: "Failure classification",
    promptBlocks: [
      paragraph("Which failure should usually be treated as non-retriable at the transaction level?")
    ],
    options: [
      "Temporary network timeout while loading a page",
      "Session expired during navigation",
      "Business rule rejection from the target system",
      "Stale element after a grid refresh"
    ],
    correctAnswer: "C",
    explanation: "A business rule rejection is usually terminal for that transaction rather than something to retry automatically.",
    rationale: "Tests business-vs-technical exception judgment."
  }),
  choiceQuestion({
    id: "python_rpa_senior_q3",
    category: "Queue design",
    difficulty: 4,
    prompt: "Queue boundary design",
    promptBlocks: [
      paragraph(
        "An invoice has 30 line items. If line 28 fails, the first 27 successful updates should not be repeated. What design is best?"
      )
    ],
    options: [
      "Keep one queue item per invoice and restart the full item on any failure",
      "Split work so completed line-item progress can be preserved safely",
      "Keep one queue item and increase retry count for line-item failures",
      "Route all partial-failure invoices directly to manual handling"
    ],
    correctAnswer: "B",
    explanation: "The boundary should preserve proven progress so completed line items are not replayed.",
    rationale: "Tests safe transaction boundary design."
  }),
  choiceQuestion({
    id: "python_rpa_senior_q4",
    category: "Architecture",
    difficulty: 3,
    prompt: "Headless-first design",
    promptBlocks: [
      paragraph(
        "A process currently scrapes a portal UI for data that is also available through a supported API. What is the best design direction?"
      )
    ],
    options: [
      "Keep the UI flow because it is already working",
      "Use the API for the data retrieval and isolate UI automation only where still required",
      "Use both API and UI for the same step every time",
      "Keep the UI flow and add more waits"
    ],
    correctAnswer: "B",
    explanation: "A supported API is a stronger integration point than scraping the same data from UI.",
    rationale: "Tests API-first thinking in RPA design."
  }),
  choiceQuestion({
    id: "python_rpa_senior_q5",
    category: "Code review",
    difficulty: 4,
    prompt: "Code review - retry misuse",
    promptBlocks: [paragraph("What is the biggest design flaw?")],
    options: [
      "time.sleep(2) should be replaced with an explicit wait",
      "The loop may repeat external side effects after partial success",
      "login() should be called after open_case()",
      "mark_success() should be moved into the except block"
    ],
    correctAnswer: "B",
    explanation: "Retrying a block that may already have caused an external side effect can create duplicates or corrupted state.",
    rationale: "Tests recognition of replay-unsafe retry logic.",
    logSnippet: [
      "for _ in range(3):",
      "    try:",
      "        login()",
      "        open_case(case_id)",
      "        submit_adjustment(case_id, amount)",
      "        mark_success(case_id)",
      "        break",
      "    except Exception:",
      "        time.sleep(2)"
    ].join("\n")
  }),
  choiceQuestion({
    id: "python_rpa_senior_q6",
    category: "Security and configuration",
    difficulty: 2,
    prompt: "Code review - config/secrets",
    promptBlocks: [paragraph("What is the main issue?")],
    options: [
      "Constants should use camelCase",
      "These values should be externalized to config / environment or secrets storage",
      "MAX_RETRY must always be 5",
      "BASE_URL should be a class variable instead"
    ],
    correctAnswer: "B",
    explanation: "Production URLs and API keys should not be hardcoded in source code.",
    rationale: "Tests configuration and secrets hygiene.",
    logSnippet: ['BASE_URL = "https://prod.portal.local"', 'API_KEY = "sk-live-123"', "MAX_RETRY = 3"].join(
      "\n"
    )
  }),
  choiceQuestion({
    id: "python_rpa_senior_q7",
    category: "Security and data access",
    difficulty: 3,
    prompt: "Code review - injection safety",
    promptBlocks: [paragraph("What is the main problem?")],
    options: [
      "The query should use double quotes",
      "The SQL is too long for one line",
      "External input is being injected into SQL directly",
      "claim_id should be cast to str first"
    ],
    correctAnswer: "C",
    explanation: "Concatenating untrusted input into SQL is an injection risk.",
    rationale: "Tests secure query handling.",
    logSnippet: [`query = f"SELECT * FROM claims WHERE claim_id = '{claim_id}'"`, "cursor.execute(query)"].join(
      "\n"
    )
  }),
  choiceQuestion({
    id: "python_rpa_senior_q8",
    category: "Selenium diagnostics",
    difficulty: 3,
    format: "log_analysis_single_select",
    prompt: "Log interpretation - stale element",
    promptBlocks: [paragraph("What is the most likely cause?")],
    options: [
      "The login session expired before the click",
      "The row reference was captured before the grid finished re-rendering",
      "The locator was too short to be stable",
      "The browser version is incompatible with the application"
    ],
    correctAnswer: "B",
    explanation: "The stale element followed a grid refresh, so the row reference was likely captured before the DOM settled.",
    rationale: "Tests runtime diagnosis from Selenium artifacts.",
    logSnippet: [
      "10:14:21 Search results loaded",
      "10:14:22 Found 8 rows",
      "10:14:22 Clicking selected row",
      "10:14:22 StaleElementReferenceException",
      "10:14:23 Grid refreshed after sort completed"
    ].join("\n")
  }),
  choiceQuestion({
    id: "python_rpa_senior_q9",
    category: "Selenium diagnostics",
    difficulty: 3,
    format: "log_analysis_single_select",
    prompt: "Log interpretation - blocked click",
    promptBlocks: [paragraph("What is the best conclusion?")],
    options: [
      "The selector is invalid",
      "The click happened before the UI was fully ready",
      "The element is inside the wrong frame",
      "The browser lost authentication state"
    ],
    correctAnswer: "B",
    explanation: "A loading mask intercepting the click means the UI was not truly ready for interaction.",
    rationale: "Tests diagnosis of intercepted clicks.",
    logSnippet: [
      "11:08:10 Button located: Submit",
      "11:08:10 element_to_be_clickable passed",
      "11:08:10 Click attempted",
      "11:08:10 ElementClickInterceptedException",
      "11:08:11 Screenshot shows loading mask over form"
    ].join("\n")
  }),
  multiSelectQuestion({
    id: "python_rpa_senior_q10",
    category: "Completion safety",
    difficulty: 4,
    prompt: "Before replaying",
    promptBlocks: [
      paragraph("Select all that apply."),
      paragraph(
        "A timeout occurs after clicking Submit. Which actions are appropriate before deciding to replay?"
      )
    ],
    options: [
      "Search the target system using transaction identifiers",
      "Check for persisted confirmation or reference numbers",
      "Re-run immediately to protect SLA",
      "Review logs and screenshots for post-submit evidence",
      "Mark success because the click happened"
    ],
    correctAnswer: ["A", "B", "D"],
    explanation: "Replay decisions should use external-state checks and supporting evidence, not assumptions or SLA pressure.",
    rationale: "Tests safe replay decision basics."
  }),
  multiSelectQuestion({
    id: "python_rpa_senior_q11",
    category: "Testing",
    difficulty: 3,
    prompt: "Strong test expectations",
    promptBlocks: [
      paragraph("Select all that apply."),
      paragraph("Which are strong expectations for testing Python RPA code?")
    ],
    options: [
      "Edge cases should be explicitly tested",
      "Tests should be deterministic and not depend on live external services",
      "Retries and idempotency should be covered for critical logic",
      "Manual validation can replace unit tests for business logic",
      "External dependencies should be mocked where appropriate"
    ],
    correctAnswer: ["A", "B", "C", "E"],
    explanation: "Strong RPA testing covers deterministic logic, edge cases, retries, and controlled mocks.",
    rationale: "Tests engineering discipline for Python automation."
  }),
  matchingQuestion({
    id: "python_rpa_senior_q12",
    category: "Failure handling",
    difficulty: 3,
    prompt: "Match failure to handling class",
    promptBlocks: [
      table(
        ["Situation", "Handling class"],
        [
          ["1. Validation error shown before submit", "a. Business exception"],
          ["2. Timeout immediately after submit click", "b. Completion uncertain"],
          ["3. Session expired before any external action", "c. Retriable technical failure"]
        ]
      )
    ],
    leftItems: [
      "1. Validation error shown before submit",
      "2. Timeout immediately after submit click",
      "3. Session expired before any external action"
    ],
    rightItems: [
      "a. Business exception",
      "b. Completion uncertain",
      "c. Retriable technical failure"
    ],
    correctPairs: {
      "1. Validation error shown before submit": "a. Business exception",
      "2. Timeout immediately after submit click": "b. Completion uncertain",
      "3. Session expired before any external action": "c. Retriable technical failure"
    },
    explanation: "Each scenario maps to a distinct handling class based on whether the external side effect is safe to retry.",
    rationale: "Tests correct exception classification."
  }),
  matchingQuestion({
    id: "python_rpa_senior_q13",
    category: "Controls",
    difficulty: 2,
    prompt: "Match risk to best control",
    promptBlocks: [
      table(
        ["Risk", "Best control"],
        [
          ["1. File may still be writing", "a. Readiness signal"],
          ["2. Grid rows change order after refresh", "b. Stable business-key locator"],
          ["3. Hardcoded production URL in code", "c. Externalized config"]
        ]
      )
    ],
    leftItems: [
      "1. File may still be writing",
      "2. Grid rows change order after refresh",
      "3. Hardcoded production URL in code"
    ],
    rightItems: [
      "a. Readiness signal",
      "b. Stable business-key locator",
      "c. Externalized config"
    ],
    correctPairs: {
      "1. File may still be writing": "a. Readiness signal",
      "2. Grid rows change order after refresh": "b. Stable business-key locator",
      "3. Hardcoded production URL in code": "c. Externalized config"
    },
    explanation: "The best control depends on the specific risk being contained.",
    rationale: "Tests fit-for-purpose control selection."
  }),
  orderingQuestion({
    id: "python_rpa_senior_q14",
    category: "Completion safety",
    difficulty: 4,
    prompt: "Safe replay sequence",
    promptBlocks: [prompt("Put these steps in the best order after a submit timeout:")],
    items: [
      "Search the target system for evidence",
      "Decide whether replay is safe",
      "Collect logs, screenshots, and reference data",
      "Classify the outcome as success, failure, or uncertain"
    ],
    correctOrder: [2, 0, 3, 1],
    explanation: "Collect evidence first, search for completion signals, classify the state, then decide whether replay is safe.",
    rationale: "Tests safe post-timeout recovery sequencing."
  }),
  orderingQuestion({
    id: "python_rpa_senior_q15",
    category: "File ingestion",
    difficulty: 2,
    prompt: "File ingestion sequence",
    promptBlocks: [prompt("Put these steps in the best order before processing an inbound file:")],
    items: [
      "Check readiness signal",
      "Validate required columns",
      "Confirm control totals or record counts if available",
      "Enqueue transactions"
    ],
    correctOrder: [0, 1, 2, 3],
    explanation: "The file should be proven ready and valid before work is enqueued.",
    rationale: "Tests safe inbound-file handling order."
  }),
  matchingQuestion({
    id: "python_rpa_senior_q16",
    category: "Scenario mapping",
    difficulty: 3,
    prompt: "Scenario mapping - next action",
    promptBlocks: [
      table(
        ["Scenario", "Best next action"],
        [
          ["1. Session expired before submit", "a. Rebuild session and retry from a verified safe point"],
          ["2. Validation error after entering data", "b. Route as business exception with evidence"],
          ["3. Timeout after submit click", "c. Verify completion state before replay"]
        ]
      )
    ],
    leftItems: [
      "1. Session expired before submit",
      "2. Validation error after entering data",
      "3. Timeout after submit click"
    ],
    rightItems: [
      "a. Rebuild session and retry from a verified safe point",
      "b. Route as business exception with evidence",
      "c. Verify completion state before replay"
    ],
    correctPairs: {
      "1. Session expired before submit": "a. Rebuild session and retry from a verified safe point",
      "2. Validation error after entering data": "b. Route as business exception with evidence",
      "3. Timeout after submit click": "c. Verify completion state before replay"
    },
    explanation: "Each scenario needs a next action aligned with side-effect risk and business ownership.",
    rationale: "Tests practical response mapping."
  }),
  matchingQuestion({
    id: "python_rpa_senior_q17",
    category: "Code quality",
    difficulty: 2,
    prompt: "Scenario mapping - code quality",
    promptBlocks: [
      table(
        ["Situation", "Best improvement"],
        [
          ["1. main.py contains all business logic", "a. Move business logic into modules and keep main as orchestration only"],
          ["2. Class creates its own DB and email dependencies", "b. Inject dependencies instead of hardcoding them"],
          ["3. Same helper copied across three projects", "c. Promote reusable logic into a shared utility/module"]
        ]
      )
    ],
    leftItems: [
      "1. main.py contains all business logic",
      "2. Class creates its own DB and email dependencies",
      "3. Same helper copied across three projects"
    ],
    rightItems: [
      "a. Move business logic into modules and keep main as orchestration only",
      "b. Inject dependencies instead of hardcoding them",
      "c. Promote reusable logic into a shared utility/module"
    ],
    correctPairs: {
      "1. main.py contains all business logic":
        "a. Move business logic into modules and keep main as orchestration only",
      "2. Class creates its own DB and email dependencies":
        "b. Inject dependencies instead of hardcoding them",
      "3. Same helper copied across three projects": "c. Promote reusable logic into a shared utility/module"
    },
    explanation: "The best improvement depends on the structural problem being addressed.",
    rationale: "Tests pragmatic code-quality judgment."
  }),
  matchingQuestion({
    id: "python_rpa_senior_q18",
    category: "Security and compliance",
    difficulty: 2,
    prompt: "Scenario mapping - security/compliance",
    promptBlocks: [
      table(
        ["Situation", "Best response"],
        [
          ["1. API key hardcoded in source", "a. Move to env / secrets manager"],
          ["2. PHI included in an error email draft", "b. Remove PHI and follow secure-sharing rules"],
          ["3. Raw password written to logs", "c. Mask/omit sensitive data entirely"]
        ]
      )
    ],
    leftItems: [
      "1. API key hardcoded in source",
      "2. PHI included in an error email draft",
      "3. Raw password written to logs"
    ],
    rightItems: [
      "a. Move to env / secrets manager",
      "b. Remove PHI and follow secure-sharing rules",
      "c. Mask/omit sensitive data entirely"
    ],
    correctPairs: {
      "1. API key hardcoded in source": "a. Move to env / secrets manager",
      "2. PHI included in an error email draft": "b. Remove PHI and follow secure-sharing rules",
      "3. Raw password written to logs": "c. Mask/omit sensitive data entirely"
    },
    explanation: "Each issue needs the response that removes the specific security or compliance risk.",
    rationale: "Tests basic security and compliance handling."
  })
];

const leadQuestions: Question[] = [
  choiceQuestion({
    id: "python_rpa_lead_q1",
    category: "Completion safety",
    difficulty: 4,
    prompt: "Uncertain completion",
    promptBlocks: [
      paragraph(
        "A bot clicks Submit, then the portal times out. Duplicate posting is possible if the transaction already completed. What is the best next action?"
      )
    ],
    options: [
      "Retry the transaction once, then escalate if it fails again",
      "Refresh the page and repeat the submit step",
      "Verify completion state using external identifiers before replaying",
      "Route the item for manual review without checking target-system state"
    ],
    correctAnswer: "C",
    explanation: "A lead should still expect external-state verification before any replay under uncertain completion.",
    rationale: "Carries over the required floor on replay safety."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q2",
    category: "Failure handling",
    difficulty: 3,
    prompt: "Failure classification",
    promptBlocks: [
      paragraph("Which failure should usually be treated as non-retriable at the transaction level?")
    ],
    options: [
      "Temporary network timeout while loading a page",
      "Session expired during navigation",
      "Business rule rejection from the target system",
      "Stale element after a grid refresh"
    ],
    correctAnswer: "C",
    explanation: "Business-rule rejections are usually terminal for the transaction, not candidates for automatic retry.",
    rationale: "Carries over core business-vs-technical exception judgment."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q3",
    category: "Queue design",
    difficulty: 4,
    prompt: "Queue boundary design",
    promptBlocks: [
      paragraph(
        "An invoice has 30 line items. If line 28 fails, the first 27 successful updates should not be repeated. What design is best?"
      )
    ],
    options: [
      "Keep one queue item per invoice and restart the full item on any failure",
      "Split work so completed line-item progress can be preserved safely",
      "Keep one queue item and increase retry count for line-item failures",
      "Route all partial-failure invoices directly to manual handling"
    ],
    correctAnswer: "B",
    explanation: "The design should preserve safe progress rather than replay proven work.",
    rationale: "Carries over queue-boundary discipline expected from leads."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q4",
    category: "Code review",
    difficulty: 4,
    prompt: "Code review - retry misuse",
    promptBlocks: [paragraph("What is the biggest design flaw?")],
    options: [
      "time.sleep(2) should be replaced with an explicit wait",
      "The loop may repeat external side effects after partial success",
      "login() should be called after open_case()",
      "mark_success() should be moved into the except block"
    ],
    correctAnswer: "B",
    explanation: "Leads should recognize replay-unsafe retries as the most serious flaw here.",
    rationale: "Carries over critical code-review judgment on non-idempotent retries.",
    logSnippet: [
      "for _ in range(3):",
      "    try:",
      "        login()",
      "        open_case(case_id)",
      "        submit_adjustment(case_id, amount)",
      "        mark_success(case_id)",
      "        break",
      "    except Exception:",
      "        time.sleep(2)"
    ].join("\n")
  }),
  choiceQuestion({
    id: "python_rpa_lead_q5",
    category: "Security and data access",
    difficulty: 3,
    prompt: "Code review - injection safety",
    promptBlocks: [paragraph("What is the main problem?")],
    options: [
      "The query should use double quotes",
      "The SQL is too long for one line",
      "External input is being injected into SQL directly",
      "claim_id should be cast to str first"
    ],
    correctAnswer: "C",
    explanation: "Leads should still flag direct SQL injection risk immediately.",
    rationale: "Carries over secure input-handling expectations.",
    logSnippet: [`query = f"SELECT * FROM claims WHERE claim_id = '{claim_id}'"`, "cursor.execute(query)"].join(
      "\n"
    )
  }),
  choiceQuestion({
    id: "python_rpa_lead_q6",
    category: "Selenium diagnostics",
    difficulty: 3,
    format: "log_analysis_single_select",
    prompt: "Log interpretation - blocked click",
    promptBlocks: [paragraph("What is the best conclusion?")],
    options: [
      "The selector is invalid",
      "The click happened before the UI was fully ready",
      "The element is inside the wrong frame",
      "The browser lost authentication state"
    ],
    correctAnswer: "B",
    explanation: "The artifact shows a readiness problem, not a selector or authentication issue.",
    rationale: "Carries over required Selenium runtime diagnosis.",
    logSnippet: [
      "11:08:10 Button located: Submit",
      "11:08:10 element_to_be_clickable passed",
      "11:08:10 Click attempted",
      "11:08:10 ElementClickInterceptedException",
      "11:08:11 Screenshot shows loading mask over form"
    ].join("\n")
  }),
  multiSelectQuestion({
    id: "python_rpa_lead_q7",
    category: "Completion safety",
    difficulty: 4,
    prompt: "Before replaying",
    promptBlocks: [
      paragraph("Select all that apply."),
      paragraph(
        "A timeout occurs after clicking Submit. Which actions are appropriate before deciding to replay?"
      )
    ],
    options: [
      "Search the target system using transaction identifiers",
      "Check for persisted confirmation or reference numbers",
      "Re-run immediately to protect SLA",
      "Review logs and screenshots for post-submit evidence",
      "Mark success because the click happened"
    ],
    correctAnswer: ["A", "B", "D"],
    explanation: "Leads should still require target-system checks and evidence before replaying uncertain transactions.",
    rationale: "Carries over replay-decision basics."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q8",
    category: "Governance",
    difficulty: 4,
    prompt: "Unsafe replay request",
    promptBlocks: [
      paragraph(
        "A stakeholder wants automatic retry on every timeout after Submit because backlog is increasing. Completion state is uncertain and duplicates have financial impact. What should the lead do?"
      )
    ],
    options: [
      "Approve one retry per item and monitor results",
      "Pause automatic replay until safe completion checks are defined",
      "Add screenshots and continue with the current design",
      "Retry only during off-peak hours"
    ],
    correctAnswer: "B",
    explanation: "Unsafe replay should be blocked until safe completion checks exist.",
    rationale: "Tests lead-level control over risky stakeholder requests."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q9",
    category: "Architecture",
    difficulty: 4,
    prompt: "Architecture under UI fragility",
    promptBlocks: [
      paragraph(
        "A process uses UI for login, search, submit, and status polling. Submit and status polling are now available through audited APIs. What is the strongest recommendation?"
      )
    ],
    options: [
      "Keep the whole flow in UI until a full redesign is funded",
      "Move submit and status checks to API while retaining only necessary UI steps",
      "Shift everything to API immediately and let operations adapt later",
      "Use UI submission and API submission together for resilience"
    ],
    correctAnswer: "B",
    explanation: "The strongest move is to remove fragile UI steps where supported APIs already exist.",
    rationale: "Tests architecture direction under UI fragility."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q10",
    category: "Release judgment",
    difficulty: 4,
    prompt: "Release decision under unresolved risk",
    promptBlocks: [
      paragraph(
        "A release fixes a flaky click issue, but replay after uncertain completion is still unsafe. The business wants it deployed today. What is the best decision?"
      )
    ],
    options: [
      "Release now because the most visible defect was fixed",
      "Release only if unsafe paths are blocked or routed to controlled handling",
      "Release and increase support coverage for the evening",
      "Delay the release until every open defect is fully resolved"
    ],
    correctAnswer: "B",
    explanation: "A risky release is only acceptable if the unsafe scenario is explicitly isolated or contained.",
    rationale: "Tests release gating under unresolved risk."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q11",
    category: "Operating model",
    difficulty: 3,
    prompt: "Temporary operating model",
    promptBlocks: [
      paragraph(
        "After a system change, pre-processing still works well, but final submit is unreliable and duplicate risk exists. What is the best temporary model?"
      )
    ],
    options: [
      "Keep the bot fully unattended to preserve throughput",
      "Stop the process completely until a new version is ready",
      "Automate safe steps and route uncertain completion to manual review",
      "Run the bot twice and compare outputs"
    ],
    correctAnswer: "C",
    explanation: "A temporary model should preserve safe automation while containing the unsafe completion step.",
    rationale: "Tests pragmatic temporary operating models."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q12",
    category: "Code review",
    difficulty: 4,
    prompt: "Code review risk",
    promptBlocks: [paragraph("Which code-review finding should concern a lead the most?")],
    options: [
      "One helper function is longer than team standards",
      "A decorator retries all exceptions around non-idempotent actions",
      "One module has repeated imports",
      "Variable names are inconsistent across files"
    ],
    correctAnswer: "B",
    explanation: "Retrying all exceptions around non-idempotent work is the highest-risk flaw here.",
    rationale: "Tests production-risk prioritization in code review."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q13",
    category: "Architecture",
    difficulty: 3,
    prompt: "Shared framework boundary",
    promptBlocks: [
      paragraph(
        "Five automations use the same portal, but only two share the same recovery model and transaction lifecycle. What should be shared?"
      )
    ],
    options: [
      "A single end-to-end reusable workflow for the portal",
      "Only locator files and no common behavior",
      "Common low-level components, with process-specific recovery kept separate",
      "No shared components, to avoid cross-impact"
    ],
    correctAnswer: "C",
    explanation: "Shared low-level components are appropriate, but recovery logic should stay aligned with each process.",
    rationale: "Tests practical reuse boundaries."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q14",
    category: "Incident analysis",
    difficulty: 4,
    prompt: "Incident interpretation",
    promptBlocks: [
      list("Incident details", [
        '17 queue items failed with "Unknown error"',
        "Screenshots captured at random steps",
        "No external reference IDs in logs",
        "Support replayed 9 items manually",
        "3 duplicates found next morning"
      ]),
      paragraph("What is the strongest conclusion?")
    ],
    options: [
      "The VM needs more CPU",
      "The main issue is missing observability and replay controls",
      "Support needs more screenshot training",
      "The selectors should be rewritten first"
    ],
    correctAnswer: "B",
    explanation: "The incident points most strongly to weak observability and unsafe replay control, not hardware or selector issues.",
    rationale: "Tests incident interpretation from operational evidence."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q15",
    category: "Completion safety",
    difficulty: 4,
    prompt: "Completion-uncertain policy",
    promptBlocks: [
      paragraph(
        "A portal sometimes returns HTTP 500 after submit, but the transaction may already be committed in the backend. What policy is best?"
      )
    ],
    options: [
      "Treat all HTTP 500s as retriable",
      "Treat all HTTP 500s as business failures",
      "Classify them as completion-uncertain until verified",
      "Ignore them when screenshots look normal"
    ],
    correctAnswer: "C",
    explanation: "A post-submit HTTP 500 does not prove failure when the backend may already have committed the transaction.",
    rationale: "Tests policy design for uncertain completion."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q16",
    category: "Supportability",
    difficulty: 3,
    prompt: "Support model ownership",
    promptBlocks: [
      paragraph(
        'An automation generates many "unknown error" failures. Screenshots are inconsistent and logs do not show transaction reference numbers. What should the lead prioritize first?'
      )
    ],
    options: [
      "Increase support staffing",
      "Improve failure classification and replay-relevant observability",
      "Add screenshots at every step",
      "Upgrade the robot machine specification"
    ],
    correctAnswer: "B",
    explanation: "The first priority is better failure classification and replay-relevant observability, not more staffing or screenshots alone.",
    rationale: "Tests ownership of supportability problems."
  }),
  multiSelectQuestion({
    id: "python_rpa_lead_q17",
    category: "Architecture and controls",
    difficulty: 4,
    prompt: "Strong lead responses",
    promptBlocks: [
      paragraph("Select all that apply."),
      paragraph("A process is growing more fragile after UI changes. Which lead responses are strong?")
    ],
    options: [
      "Reassess whether some steps should move to API or service integration",
      "Add global sleep statements to stabilize the framework",
      "Revisit locator strategy and transaction boundaries",
      "Define retriable, terminal, and completion-uncertain failure classes",
      "Ask support to keep replaying failed items until backlog drops"
    ],
    correctAnswer: ["A", "C", "D"],
    explanation: "Strong responses reduce fragility and clarify control models rather than adding global sleeps or unsafe replay pressure.",
    rationale: "Tests lead-level responses to growing UI fragility."
  }),
  multiSelectQuestion({
    id: "python_rpa_lead_q18",
    category: "File ingestion",
    difficulty: 3,
    prompt: "Minimum controls before unattended ingestion",
    promptBlocks: [
      paragraph("Select all that apply."),
      paragraph("Which controls are the strongest minimum set before unattended file ingestion?")
    ],
    options: [
      "Readiness signal or handoff rule",
      "Required-field/schema validation",
      "Control totals or count checks when available",
      "Automatic retry of malformed rows",
      "Clear exception routing for failed records"
    ],
    correctAnswer: ["A", "B", "C", "E"],
    explanation: "Unattended ingestion needs readiness, validation, integrity checks, and clear exception routing.",
    rationale: "Tests minimum control expectations for unattended ingestion."
  }),
  multiSelectQuestion({
    id: "python_rpa_lead_q19",
    category: "Engineering standards",
    difficulty: 3,
    prompt: "Strong engineering hygiene",
    promptBlocks: [
      paragraph("Select all that apply."),
      paragraph("Which practices should a lead expect from a production Python RPA team?")
    ],
    options: [
      "Exact dependency pinning and no preview packages in production",
      "Config/secrets externalized from source code",
      "Deterministic tests with mocked external dependencies",
      "Hardcoded URLs allowed if documented in README",
      "Linting / static analysis must pass before merge"
    ],
    correctAnswer: ["A", "B", "C", "E"],
    explanation: "Production hygiene includes pinned dependencies, externalized config, deterministic tests, and enforced quality gates.",
    rationale: "Tests lead expectations for engineering discipline."
  }),
  matchingQuestion({
    id: "python_rpa_lead_q20",
    category: "Containment",
    difficulty: 3,
    prompt: "Match issue to containment action",
    promptBlocks: [
      table(
        ["Issue", "Containment action"],
        [
          ["1. Completion state uncertain after submit timeout", "a. Block replay until verification is performed"],
          ["2. File may still be writing when picked up", "b. Enforce readiness signal before ingestion"],
          ["3. Grid rows change order after refresh", "c. Use stable business-key selection"]
        ]
      )
    ],
    leftItems: [
      "1. Completion state uncertain after submit timeout",
      "2. File may still be writing when picked up",
      "3. Grid rows change order after refresh"
    ],
    rightItems: [
      "a. Block replay until verification is performed",
      "b. Enforce readiness signal before ingestion",
      "c. Use stable business-key selection"
    ],
    correctPairs: {
      "1. Completion state uncertain after submit timeout":
        "a. Block replay until verification is performed",
      "2. File may still be writing when picked up": "b. Enforce readiness signal before ingestion",
      "3. Grid rows change order after refresh": "c. Use stable business-key selection"
    },
    explanation: "Each issue needs the containment action that removes immediate operational risk.",
    rationale: "Tests containment mapping."
  }),
  matchingQuestion({
    id: "python_rpa_lead_q21",
    category: "Architecture and design",
    difficulty: 4,
    prompt: "Match structural issue to best fix",
    promptBlocks: [
      table(
        ["Structural issue", "Best fix"],
        [
          ["1. Repeated UI submit failures on a step already available by API", "a. Move submit to API if controls allow"],
          ["2. Duplicates caused by replay after uncertain completion", "b. Add completion verification before replay"],
          ["3. Shared helpers hide business logic and swallow exceptions", "c. Separate framework utilities from process-specific control flow"]
        ]
      )
    ],
    leftItems: [
      "1. Repeated UI submit failures on a step already available by API",
      "2. Duplicates caused by replay after uncertain completion",
      "3. Shared helpers hide business logic and swallow exceptions"
    ],
    rightItems: [
      "a. Move submit to API if controls allow",
      "b. Add completion verification before replay",
      "c. Separate framework utilities from process-specific control flow"
    ],
    correctPairs: {
      "1. Repeated UI submit failures on a step already available by API":
        "a. Move submit to API if controls allow",
      "2. Duplicates caused by replay after uncertain completion":
        "b. Add completion verification before replay",
      "3. Shared helpers hide business logic and swallow exceptions":
        "c. Separate framework utilities from process-specific control flow"
    },
    explanation: "Each structural issue has a strongest design fix tied to the failure mode.",
    rationale: "Tests structural judgment at lead level."
  }),
  orderingQuestion({
    id: "python_rpa_lead_q22",
    category: "Incident response",
    difficulty: 4,
    prompt: "Incident-response order",
    promptBlocks: [prompt("Put these lead actions in the best order during an unsafe replay incident:")],
    items: [
      "Block unsafe replay paths",
      "Gather evidence and determine impact scope",
      "Define a temporary operating model",
      "Approve a long-term design fix"
    ],
    correctOrder: [1, 0, 2, 3],
    explanation: "Scope and evidence come first, then immediate containment, then the temporary model, then the long-term fix.",
    rationale: "Tests lead incident sequencing."
  }),
  orderingQuestion({
    id: "python_rpa_lead_q23",
    category: "Release judgment",
    difficulty: 4,
    prompt: "Release gating order",
    promptBlocks: [prompt("Put these steps in the best order before releasing a risky automation fix:")],
    items: [
      "Define rollback or containment path",
      "Confirm the unsafe scenario is addressed or isolated",
      "Communicate support handling expectations",
      "Approve deployment"
    ],
    correctOrder: [1, 0, 2, 3],
    explanation: "First confirm the risk is addressed or isolated, then define containment, communicate support expectations, and only then approve deployment.",
    rationale: "Tests disciplined release gating."
  }),
  matchingQuestion({
    id: "python_rpa_lead_q24",
    category: "Stakeholder management",
    difficulty: 3,
    prompt: "Scenario mapping - stakeholder request",
    promptBlocks: [
      table(
        ["Stakeholder request", "Best lead response"],
        [
          ['1. "Retry all submit timeouts automatically"', "a. Require safe completion checks before enabling replay"],
          ['2. "Process the file even if it may still be uploading"', "b. Require ingestion controls before unattended use"],
          ['3. "Keep full payloads and credentials in logs for debugging"', "c. Keep logs useful but sanitized"]
        ]
      )
    ],
    leftItems: [
      '1. "Retry all submit timeouts automatically"',
      '2. "Process the file even if it may still be uploading"',
      '3. "Keep full payloads and credentials in logs for debugging"'
    ],
    rightItems: [
      "a. Require safe completion checks before enabling replay",
      "b. Require ingestion controls before unattended use",
      "c. Keep logs useful but sanitized"
    ],
    correctPairs: {
      '1. "Retry all submit timeouts automatically"':
        "a. Require safe completion checks before enabling replay",
      '2. "Process the file even if it may still be uploading"':
        "b. Require ingestion controls before unattended use",
      '3. "Keep full payloads and credentials in logs for debugging"': "c. Keep logs useful but sanitized"
    },
    explanation: "The best lead response sets boundaries around safety, ingestion controls, and sanitized observability.",
    rationale: "Tests stakeholder-response mapping."
  }),
  matchingQuestion({
    id: "python_rpa_lead_q25",
    category: "Architecture and standards",
    difficulty: 3,
    prompt: "Scenario mapping - architecture and team standards",
    promptBlocks: [
      table(
        ["Situation", "Best lead response"],
        [
          ["1. Main script contains orchestration, DB logic, UI logic, and email logic together", "a. Split by concern and keep orchestration thin"],
          ["2. Class creates its own DB and email clients internally", "b. Move to dependency injection for testability"],
          ["3. Team wants to use an unpinned preview package in production", "c. Reject until stable, pinned dependency control exists"]
        ]
      )
    ],
    leftItems: [
      "1. Main script contains orchestration, DB logic, UI logic, and email logic together",
      "2. Class creates its own DB and email clients internally",
      "3. Team wants to use an unpinned preview package in production"
    ],
    rightItems: [
      "a. Split by concern and keep orchestration thin",
      "b. Move to dependency injection for testability",
      "c. Reject until stable, pinned dependency control exists"
    ],
    correctPairs: {
      "1. Main script contains orchestration, DB logic, UI logic, and email logic together":
        "a. Split by concern and keep orchestration thin",
      "2. Class creates its own DB and email clients internally":
        "b. Move to dependency injection for testability",
      "3. Team wants to use an unpinned preview package in production":
        "c. Reject until stable, pinned dependency control exists"
    },
    explanation: "The best lead response depends on the architectural or standards risk in each case.",
    rationale: "Tests architectural and standards judgment."
  })
];

export function buildPythonRpaScreenerQuestions(level: PythonRpaScreenerLevel): Question[] {
  return level === "Lead" ? leadQuestions : seniorQuestions;
}

export function normalizePythonRpaScreenerLevel(value: unknown): PythonRpaScreenerLevel {
  return String(value || "").toLowerCase() === "lead" ? "Lead" : "Senior";
}
