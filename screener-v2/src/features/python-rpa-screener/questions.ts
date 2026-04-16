import type { PromptBlock, Question } from "@/lib/assessment-engine/types";

export type PythonRpaScreenerLevel = "Senior" | "Lead";

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
    prompt: "A submit times out and duplicate posting is possible. What is the best next action?",
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
    prompt: "Which of these failures should usually stop automatic retry for that item?",
    options: [
      "A page load times out before any action is taken",
      "A session expires during navigation",
      "The target system rejects the transaction based on business rules",
      "A stale element appears after the grid refreshes"
    ],
    correctAnswer: "C",
    explanation: "A business rule rejection is usually terminal for that transaction rather than something to retry automatically.",
    rationale: "Tests business-vs-technical exception judgment."
  }),
  choiceQuestion({
    id: "python_rpa_senior_q3",
    category: "Queue design",
    difficulty: 4,
    prompt: "If line 28 fails, the first 27 successful updates must not repeat. What design is best?",
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
    prompt: "A bot reads data from the UI, but the same data is available from a supported API. What is the best design direction?",
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
    prompt: "The following is a snapshot from a Python automation script. What is the biggest design flaw?",
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
    prompt: "The following is a snapshot from a Python automation script being prepared for production use. What is the main issue?",
    options: [
      "Keep the values in code, but restrict repository access to the delivery team",
      "Move the values to config / environment or approved secrets storage",
      "Leave the endpoint in code and externalize only the API key",
      "Keep the values in source for now and rotate them more frequently"
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
    prompt: "The following is a snapshot from a Python automation script that builds a database query from incoming input. What is the main problem?",
    options: [
      "Validate the input format and keep the same query construction",
      "Escape the input before building the SQL string",
      "Use parameterized execution instead of injecting input into SQL directly",
      "Move the query into a helper so the logic is easier to reuse"
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
    prompt: "The following runtime log was captured during an unattended run. What is the most likely issue?",
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
    prompt: "The following runtime log was captured during an unattended run. What is the best conclusion?",
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
    prompt: "A submit times out. Which checks should happen before deciding what to do next? Select all that apply.",
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
    prompt: 'A team says its Python automation is "well tested." Which expectations are strongest for production-grade testing? Select all that apply.',
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
    prompt: "Match each situation to the best handling.",
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
  choiceQuestion({
    id: "python_rpa_senior_q13",
    category: "File integrity",
    difficulty: 3,
    prompt:
      "An inbound file has the required columns, but the row count is far lower than normal and the control total does not match the handoff summary. What is the best next action?",
    options: [
      "Process the file because the structure is valid and let downstream checks catch issues",
      "Hold the file, capture evidence, and route it through the agreed exception path",
      "Retry the pickup after a short delay in case the file was still being finalized",
      "Process only the rows that pass local validation and isolate the rest"
    ],
    correctAnswer: "B",
    explanation: "Mismatched counts and totals should stop unattended processing until the file is reviewed through the agreed exception path.",
    rationale: "Tests data-integrity judgment beyond basic schema validation."
  }),
  orderingQuestion({
    id: "python_rpa_senior_q14",
    category: "Completion safety",
    difficulty: 4,
    prompt: "After a submit timeout, what is the best order of actions?",
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
    prompt: "Before processing an inbound file, what is the best order of checks?",
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
    prompt: "Match each scenario to the best next action.",
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
    prompt: "Match each codebase situation to the best improvement.",
    leftItems: [
      "1. main.py contains all business logic",
      "2. A class creates its own DB and email dependencies",
      "3. The same helper is copied across three projects"
    ],
    rightItems: [
      "a. Move business logic into modules and keep main as orchestration only",
      "b. Inject dependencies instead of hardcoding them",
      "c. Promote reusable logic into a shared utility/module"
    ],
    correctPairs: {
      "1. main.py contains all business logic":
        "a. Move business logic into modules and keep main as orchestration only",
      "2. A class creates its own DB and email dependencies":
        "b. Inject dependencies instead of hardcoding them",
      "3. The same helper is copied across three projects":
        "c. Promote reusable logic into a shared utility/module"
    },
    explanation: "The best improvement depends on the structural problem being addressed.",
    rationale: "Tests pragmatic code-quality judgment."
  }),
  choiceQuestion({
    id: "python_rpa_senior_q18",
    category: "Observability",
    difficulty: 3,
    prompt:
      'A Python bot fails after posting one of several transactions. The logs only show "started", "working", and "failed", with no transaction ID or last confirmed step. What is the biggest weakness?',
    options: [
      "The logs are too high-level to support safe recovery decisions",
      "The script should log less often to reduce noise in production",
      "The failure should have been handled by a global exception wrapper",
      "Screenshots are missing, which matters more than transaction-level logs"
    ],
    correctAnswer: "A",
    explanation: "Support needs transaction-level evidence to decide whether work already completed and what can be replayed safely.",
    rationale: "Tests recovery-oriented observability."
  }),
  choiceQuestion({
    id: "python_rpa_senior_q19",
    category: "Input validation",
    difficulty: 2,
    prompt: "A required amount field contains `(1,250.00)`. What matters most?",
    options: [
      "The column exists",
      "The value is parsed and validated correctly",
      "The file opens",
      "The target system can reject it"
    ],
    correctAnswer: "B",
    explanation: "Presence alone is not enough; unattended processing depends on correct parsing and validation of the business value.",
    rationale: "Tests input validation beyond schema presence."
  }),
  choiceQuestion({
    id: "python_rpa_senior_q20",
    category: "Observability",
    difficulty: 2,
    prompt: "Support cannot tell which record may already have posted. What is most important?",
    options: [
      "More screenshots",
      "A stable transaction ID in logs and recovery steps",
      "Longer retry delays",
      "Separate log files per run"
    ],
    correctAnswer: "B",
    explanation: "A stable transaction identifier is what ties logs, recovery actions, and target-system evidence back to the specific record.",
    rationale: "Tests transaction correlation."
  }),
  choiceQuestion({
    id: "python_rpa_senior_q21",
    category: "Error handling",
    difficulty: 2,
    prompt: "Which pattern is worst in production code?",
    options: [
      'except Exception: logger.error("failed")',
      "except TimeoutError: retry()",
      "except ValueError as exc: raise InputError(...) from exc",
      "except Exception: pass"
    ],
    correctAnswer: "D",
    explanation: "Bare exception swallowing creates silent failures with no safe recovery path.",
    rationale: "Tests awareness of silent-failure risk."
  })
];

const leadQuestions: Question[] = [
  choiceQuestion({
    id: "python_rpa_lead_q1",
    category: "Completion safety",
    difficulty: 4,
    prompt: "A submit times out and duplicate posting is possible. What is the best next action?",
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
    prompt: "Which of these failures should usually stop automatic retry for that item?",
    options: [
      "A page load times out before any action is taken",
      "A session expires during navigation",
      "The target system rejects the transaction based on business rules",
      "A stale element appears after the grid refreshes"
    ],
    correctAnswer: "C",
    explanation: "Business-rule rejections are usually terminal for the transaction, not candidates for automatic retry.",
    rationale: "Carries over core business-vs-technical exception judgment."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q3",
    category: "Queue design",
    difficulty: 4,
    prompt: "If line 28 fails, the first 27 successful updates must not repeat. What design is best?",
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
    prompt: "The following is a snapshot from a Python automation script. What is the biggest design flaw?",
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
    prompt: "The following is a snapshot from a Python automation script that builds a database query from incoming input. What is the main problem?",
    options: [
      "Validate the input format and keep the same query construction",
      "Escape the input before building the SQL string",
      "Use parameterized execution instead of injecting input into SQL directly",
      "Move the query into a helper so the logic is easier to reuse"
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
    prompt: "The following runtime log was captured during an unattended run. What is the best conclusion?",
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
    prompt: "A submit times out. Which checks should happen before deciding what to do next? Select all that apply.",
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
    prompt: "A stakeholder wants all submit timeouts retried automatically. What should the lead do?",
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
    prompt: "A process still uses UI for several steps, but submit and status checks are now available by API. What is the strongest recommendation?",
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
    prompt: "A visible defect is fixed, but unsafe replay is still unresolved. What is the best release decision?",
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
    prompt: "Pre-processing is stable, but final submit is unreliable. What is the best temporary model?",
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
    prompt: "Which review finding should concern a lead the most from a production-risk perspective?",
    options: [
      "A retry wrapper is used around all portal actions, including submit",
      "Important failures are logged without transaction IDs",
      "A decorator retries all exceptions around non-idempotent actions",
      "One module still has repeated imports"
    ],
    correctAnswer: "C",
    explanation: "Retrying all exceptions around non-idempotent work is the highest-risk flaw here.",
    rationale: "Tests production-risk prioritization in code review."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q13",
    category: "Architecture",
    difficulty: 3,
    prompt: "Several automations use the same portal, but not the same recovery model. What should actually be shared?",
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
    prompt: "Unknown failures, weak evidence, and duplicates followed manual replay. What is the strongest conclusion?",
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
    prompt: "A post-submit HTTP 500 may still mean the transaction committed. What policy is best?",
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
    prompt: "Failures are hard to diagnose and support cannot replay safely. What should the lead prioritize first?",
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
    prompt: "A process is becoming more fragile after UI changes. Which lead responses are strongest? Select all that apply.",
    options: [
      "Reassess whether some steps should move to API or service integration",
      "Add broader wait coverage across the framework while a longer-term fix is discussed",
      "Revisit locator strategy and transaction boundaries",
      "Define retriable, terminal, and completion-uncertain failure classes",
      "Ask support to keep replaying failed items until backlog drops"
    ],
    correctAnswer: ["A", "C", "D"],
    explanation: "Strong responses reduce fragility and clarify control models rather than adding global sleeps or unsafe replay pressure.",
    rationale: "Tests lead-level responses to growing UI fragility."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q18",
    category: "Checkpointing",
    difficulty: 3,
    prompt:
      "A bot crashes mid-batch after updating several records. On restart, it only knows the batch name because progress was stored in memory. What is the strongest improvement?",
    options: [
      "Increase retry count so the restarted batch is more likely to finish",
      "Persist item-level checkpoint state at a verified safe boundary",
      "Capture screenshots before each record update",
      "Route restarted batches to manual review unless the batch is very small"
    ],
    correctAnswer: "B",
    explanation: "Restart safety depends on persisted item-level checkpoint state, not memory-only progress.",
    rationale: "Tests checkpoint design for unattended runs."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q19",
    category: "Prioritization",
    difficulty: 3,
    prompt:
      "Two production issues appear at the same time. One bot is creating duplicate financial postings; another internal reporting bot is down for one department with a manual workaround. What should the lead contain first?",
    options: [
      "The reporting bot, because the number of user complaints is higher",
      "The duplicate-posting bot, because active financial impact is still occurring",
      "The easier rollback first, then reassess the second issue",
      "The reporting bot first, then the posting issue once communications are sent"
    ],
    correctAnswer: "B",
    explanation: "Active duplicate financial impact should be contained before a reporting outage that already has a manual workaround.",
    rationale: "Tests lead prioritization under competing incidents."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q20",
    category: "Locator strategy",
    difficulty: 3,
    prompt:
      "A dynamic claims grid changes row order and regenerates element IDs after every refresh. What is the strongest locator strategy?",
    options: [
      "Filter the grid first, then click the first visible matching row",
      "Re-read the regenerated IDs after each refresh and keep using them",
      "Anchor selection to a stable business value near the intended action",
      "Use a longer XPath that follows the current column layout more precisely"
    ],
    correctAnswer: "C",
    explanation: "Stable business values survive reordering and regenerated element IDs better than positional or generated selectors.",
    rationale: "Tests robust locator strategy in dynamic UIs."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q21",
    category: "Supportability",
    difficulty: 4,
    prompt:
      'A production bot keeps failing at the submit step. The shared framework catches the exception, logs "submit failed," and moves on, but support cannot tell which transactions may already have been posted. What is the strongest fix?',
    options: [
      "Add more screenshots around the submit step",
      "Retry failed submits automatically after a delay",
      "Capture transaction identity and external-state evidence before routing recovery decisions",
      "Move submit logic into a separate shared helper"
    ],
    correctAnswer: "C",
    explanation: "Support needs transaction identity plus external-state evidence before anyone can make safe recovery decisions.",
    rationale: "Tests recovery-oriented observability design."
  }),
  orderingQuestion({
    id: "python_rpa_lead_q22",
    category: "Incident response",
    difficulty: 4,
    prompt: "During an unsafe replay incident, what is the best order of lead actions?",
    items: [
      "Gather evidence and determine impact scope",
      "Block unsafe replay paths",
      "Define a temporary operating model",
      "Approve a long-term design fix"
    ],
    correctOrder: [0, 1, 2, 3],
    explanation: "Scope and evidence come first, then immediate containment, then the temporary model, then the long-term fix.",
    rationale: "Tests lead incident sequencing."
  }),
  orderingQuestion({
    id: "python_rpa_lead_q23",
    category: "Release judgment",
    difficulty: 4,
    prompt: "Before approving deployment of a risky automation fix, what is the best order of steps?",
    items: [
      "Confirm the unsafe scenario is addressed or isolated",
      "Define rollback or containment path",
      "Communicate support handling expectations",
      "Approve deployment"
    ],
    correctOrder: [0, 1, 2, 3],
    explanation: "First confirm the risk is addressed or isolated, then define containment, communicate support expectations, and only then approve deployment.",
    rationale: "Tests disciplined release gating."
  }),
  matchingQuestion({
    id: "python_rpa_lead_q24",
    category: "Stakeholder management",
    difficulty: 3,
    prompt: "Match each stakeholder request to the best lead response.",
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
    prompt: "Match each architecture or team-standard situation to the best lead response.",
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
  }),
  choiceQuestion({
    id: "python_rpa_lead_q26",
    category: "Input validation",
    difficulty: 2,
    prompt: "A required amount field contains `(1,250.00)`. What matters most?",
    options: [
      "The column exists",
      "The value is parsed and validated correctly",
      "The file opens",
      "The target system can reject it"
    ],
    correctAnswer: "B",
    explanation: "A required field still needs correct parsing and validation before unattended posting can be trusted.",
    rationale: "Tests input-validation depth."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q27",
    category: "Observability",
    difficulty: 2,
    prompt: "Support cannot tell which record may already have posted. What is most important?",
    options: [
      "More screenshots",
      "A stable transaction ID in logs and recovery steps",
      "Longer retry delays",
      "Separate log files per run"
    ],
    correctAnswer: "B",
    explanation: "Without a stable transaction identifier, support cannot tie evidence and recovery decisions back to a specific record.",
    rationale: "Tests transaction correlation."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q28",
    category: "Error handling",
    difficulty: 2,
    prompt: "Which pattern is worst in production code?",
    options: [
      'except Exception: logger.error("failed")',
      "except TimeoutError: retry()",
      "except ValueError as exc: raise InputError(...) from exc",
      "except Exception: pass"
    ],
    correctAnswer: "D",
    explanation: "Silently swallowing exceptions is the least safe pattern because it hides failures completely.",
    rationale: "Tests awareness of silent-failure risk."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q29",
    category: "Testability",
    difficulty: 2,
    prompt: "What most improves testability?",
    options: [
      "Creating DB and email clients inside the class",
      "Passing dependencies into the class",
      "Adding more comments",
      "Splitting one function into two"
    ],
    correctAnswer: "B",
    explanation: "Passing dependencies in makes external effects easier to control and mock in tests.",
    rationale: "Tests dependency-injection judgment."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q30",
    category: "Testing",
    difficulty: 2,
    prompt: "A bot passed a few manual runs. What is still required before release?",
    options: [
      "Deterministic tests for core logic",
      "More support coverage",
      "A README warning",
      "Higher retry count"
    ],
    correctAnswer: "A",
    explanation: "A few successful manual runs do not replace deterministic tests for core logic before release.",
    rationale: "Tests release-readiness discipline."
  }),
  choiceQuestion({
    id: "python_rpa_lead_q31",
    category: "Security",
    difficulty: 2,
    prompt: "What should never appear in logs?",
    options: [
      "Retry count",
      "Record ID",
      "API key or password",
      "Start timestamp"
    ],
    correctAnswer: "C",
    explanation: "Sensitive credentials should never be written to logs.",
    rationale: "Tests logging hygiene for sensitive data."
  })
];

export function buildPythonRpaScreenerQuestions(level: PythonRpaScreenerLevel): Question[] {
  return level === "Lead" ? leadQuestions : seniorQuestions;
}

export function normalizePythonRpaScreenerLevel(value: unknown): PythonRpaScreenerLevel {
  return String(value || "").toLowerCase() === "lead" ? "Lead" : "Senior";
}
