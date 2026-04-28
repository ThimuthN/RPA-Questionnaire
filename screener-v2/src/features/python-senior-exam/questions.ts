import type { Question } from "@/lib/assessment-engine/types";

function sharedProps(args: {
  id: string;
  category: string;
  difficulty: 2 | 3 | 4;
  format: Question["format"];
  prompt: string;
  explanation: string;
  rationale: string;
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
    explanation: args.explanation,
    rationale: args.rationale,
  };
}

function choiceQuestion(args: {
  id: string;
  category: string;
  difficulty: 2 | 3 | 4;
  format?: "single_select" | "log_analysis_single_select";
  prompt: string;
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
    }),
    scoringMethod: "all_or_nothing",
    options: args.options,
    correctAnswer: [args.correctAnswer],
    logSnippet: args.logSnippet,
  } as Question;
}

function multiSelectQuestion(args: {
  id: string;
  category: string;
  difficulty: 2 | 3 | 4;
  prompt: string;
  options: string[];
  correctAnswer: string[];
  explanation: string;
  rationale: string;
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
    }),
    scoringMethod: "partial_with_penalty",
    options: args.options,
    correctAnswer: args.correctAnswer,
  } as Question;
}

function orderingQuestion(args: {
  id: string;
  category: string;
  difficulty: 2 | 3 | 4;
  prompt: string;
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
    }),
    scoringMethod: "partial_position",
    items: args.items,
    correctOrder: args.correctOrder,
  } as Question;
}

function matchingQuestion(args: {
  id: string;
  category: string;
  difficulty: 2 | 3 | 4;
  prompt: string;
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
    }),
    scoringMethod: "partial_pairs_with_penalty",
    leftItems: args.leftItems,
    rightItems: args.rightItems,
    correctPairs: args.correctPairs,
  } as Question;
}

const seniorQuestions: Question[] = [
  choiceQuestion({
    id: "senior_python_exam_q01",
    category: "General",
    difficulty: 3,
    prompt: "A payment is submitted in a system. After clicking Submit, the screen times out. The payment may still have gone through in the background. Retrying right away could create a duplicate payment. What should be done next?",
    options: [
      "Retry once, then escalate if it fails again",
      "Refresh the page and submit again",
      "Check whether the payment already went through before trying again",
      "Send it for manual review immediately without checking"
    ],
    correctAnswer: "C",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  choiceQuestion({
    id: "senior_python_exam_q02",
    category: "General",
    difficulty: 3,
    prompt: "Which of these failures should usually stop automatic retry for that item?",
    options: [
      "A page load times out before any action is taken",
      "A session expires during navigation",
      "The target system rejects the transaction based on business rules",
      "A stale element appears after the grid refreshes"
    ],
    correctAnswer: "C",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  choiceQuestion({
    id: "senior_python_exam_q03",
    category: "General",
    difficulty: 3,
    prompt: "An invoice is processed line by line. The process fails at line 28, but lines 1 to 27 may already have been completed. If the process runs again, those completed lines must not be repeated. What is the best design?",
    options: [
      "Restart the whole invoice from the beginning every time",
      "Design it so completed lines are saved and not repeated on retry",
      "Keep the same design and just increase retries",
      "Send every partial failure to manual review"
    ],
    correctAnswer: "B",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  choiceQuestion({
    id: "senior_python_exam_q04",
    category: "General",
    difficulty: 3,
    prompt: "A bot reads data from the UI, but the same data is available from a supported API. What is the best design direction?",
    options: [
      "Keep the UI flow because it is already working",
      "Use the API for the data retrieval and isolate UI automation only where still required",
      "Use both API and UI for the same step every time",
      "Keep the UI flow and add more waits"
    ],
    correctAnswer: "B",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  choiceQuestion({
    id: "senior_python_exam_q05",
    category: "General",
    difficulty: 3,
    format: "log_analysis_single_select" as const,
    prompt: "What is the biggest design flaw?",
    options: [
      "time.sleep(2) should be replaced with an explicit wait",
      "The loop may repeat external side effects after partial success",
      "login() should be called after open_case()",
      "mark_success() should be moved into the except block"
    ],
    correctAnswer: "B",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
    logSnippet: "for _ in range(3):
    try:
        login()
        open_case(case_id)
        submit_adjustment(case_id, amount)
        mark_success(case_id)
        break
    except Exception:
        time.sleep(2)",
  }),
  choiceQuestion({
    id: "senior_python_exam_q06",
    category: "General",
    difficulty: 3,
    format: "log_analysis_single_select" as const,
    prompt: "What is the main issue?",
    options: [
      "Keep the values in code, but restrict repository access to the delivery team",
      "Move the values to config / environment or approved secrets storage",
      "Leave the endpoint in code and externalize only the API key",
      "Keep the values in source for now and rotate them more frequently"
    ],
    correctAnswer: "B",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
    logSnippet: "BASE_URL = 'https://prod.portal.local'
API_KEY = 'sk-live-123'
MAX_RETRY = 3",
  }),
  choiceQuestion({
    id: "senior_python_exam_q07",
    category: "General",
    difficulty: 3,
    format: "log_analysis_single_select" as const,
    prompt: "What is the main problem?",
    options: [
      "Validate the input format and keep the same query construction",
      "Escape the input before building the SQL string",
      "Use parameterized execution instead of injecting input into SQL directly",
      "Move the query into a helper so the logic is easier to reuse"
    ],
    correctAnswer: "C",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
    logSnippet: "query = f\"SELECT * FROM claims WHERE claim_id = '{claim_id}'\"
cursor.execute(query)",
  }),
  choiceQuestion({
    id: "senior_python_exam_q08",
    category: "General",
    difficulty: 3,
    format: "log_analysis_single_select" as const,
    prompt: "What is the most likely issue?",
    options: [
      "The login session expired before the click",
      "The row reference was captured before the grid finished re-rendering",
      "The locator was too short to be stable",
      "The browser version is incompatible with the application"
    ],
    correctAnswer: "B",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
    logSnippet: "10:14:21 Search results loaded
10:14:22 Found 8 rows
10:14:22 Clicking selected row
10:14:22 StaleElementReferenceException
10:14:23 Grid refreshed after sort completed",
  }),
  choiceQuestion({
    id: "senior_python_exam_q09",
    category: "General",
    difficulty: 3,
    format: "log_analysis_single_select" as const,
    prompt: "What is the best conclusion?",
    options: [
      "The selector is invalid",
      "The click happened before the UI was fully ready",
      "The element is inside the wrong frame",
      "The browser lost authentication state"
    ],
    correctAnswer: "B",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
    logSnippet: "11:08:10 Button located: Submit
11:08:10 element_to_be_clickable passed
11:08:10 Click attempted
11:08:10 ElementClickInterceptedException
11:08:11 Screenshot shows loading mask over form",
  }),
  multiSelectQuestion({
    id: "senior_python_exam_q10",
    category: "General",
    difficulty: 3,
    prompt: "A claim is submitted through a web system. The screen times out, but the claim may still have been submitted in the background. Before deciding whether to retry or stop, what should be checked? Select all that apply.",
    options: [
      "Search the target system using the claim or transaction ID",
      "Check whether a confirmation number was created",
      "Retry immediately to save time",
      "Review logs or screenshots for proof of what happened",
      "Mark it successful because the submit button was clicked"
    ],
    correctAnswer: [
      "A",
      "B",
      "D"
    ],
    explanation: "Select all correct answers.",
    rationale: "Tests comprehensive understanding.",
  }),
  multiSelectQuestion({
    id: "senior_python_exam_q11",
    category: "General",
    difficulty: 3,
    prompt: "A team says its Python automation is 'well tested.' Which expectations are strongest for production-grade testing? Select all that apply.",
    options: [
      "Edge cases should be explicitly tested",
      "Tests should be deterministic and not depend on live external services",
      "Retries and idempotency should be covered for critical logic",
      "Manual validation can replace unit tests for business logic",
      "External dependencies should be mocked where appropriate"
    ],
    correctAnswer: [
      "A",
      "B",
      "C",
      "E"
    ],
    explanation: "Select all correct answers.",
    rationale: "Tests comprehensive understanding.",
  }),
  matchingQuestion({
    id: "senior_python_exam_q12",
    category: "General",
    difficulty: 3,
    prompt: "Match each situation to the best handling.",
    leftItems: [
      "Validation error shown before submit",
      "Timeout immediately after submit click",
      "Session expired before any external action"
    ],
    rightItems: [
      "Business exception",
      "Completion uncertain",
      "Retriable technical failure"
    ],
    correctPairs: {"Validation error shown before submit": "Business exception", "Timeout immediately after submit click": "Completion uncertain", "Session expired before any external action": "Retriable technical failure"},
    explanation: "Match items correctly.",
    rationale: "Tests matching judgment.",
  }),
  choiceQuestion({
    id: "senior_python_exam_q13",
    category: "General",
    difficulty: 3,
    prompt: "An inbound file has the required columns, but the row count is far lower than normal and the control total does not match the handoff summary. What is the best next action?",
    options: [
      "Process the file because the structure is valid and let downstream checks catch issues",
      "Hold the file, capture evidence, and route it through the agreed exception path",
      "Retry the pickup after a short delay in case the file was still being finalized",
      "Process only the rows that pass local validation and isolate the rest"
    ],
    correctAnswer: "B",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  orderingQuestion({
    id: "senior_python_exam_q14",
    category: "General",
    difficulty: 3,
    prompt: "After a submit timeout, what is the best order of actions?",
    items: [
      "Search the target system for evidence",
      "Decide whether replay is safe",
      "Collect logs, screenshots, and reference data",
      "Classify the outcome as success, failure, or uncertain"
    ],
    correctOrder: [2, 0, 3, 1],
    explanation: "Order the items correctly.",
    rationale: "Tests process sequencing.",
  }),
  orderingQuestion({
    id: "senior_python_exam_q15",
    category: "General",
    difficulty: 3,
    prompt: "Before processing an inbound file, what is the best order of checks?",
    items: [
      "Check readiness signal",
      "Validate required columns",
      "Confirm control totals or record counts if available",
      "Enqueue transactions"
    ],
    correctOrder: [0, 1, 2, 3],
    explanation: "Order the items correctly.",
    rationale: "Tests process sequencing.",
  }),
  matchingQuestion({
    id: "senior_python_exam_q16",
    category: "General",
    difficulty: 3,
    prompt: "Match each scenario to the best next action.",
    leftItems: [
      "Session expired before submit",
      "Validation error after entering data",
      "Timeout after submit click"
    ],
    rightItems: [
      "Rebuild session and retry from a verified safe point",
      "Route as business exception with evidence",
      "Verify completion state before replay"
    ],
    correctPairs: {"Session expired before submit": "Rebuild session and retry from a verified safe point", "Validation error after entering data": "Route as business exception with evidence", "Timeout after submit click": "Verify completion state before replay"},
    explanation: "Match items correctly.",
    rationale: "Tests matching judgment.",
  }),
  matchingQuestion({
    id: "senior_python_exam_q17",
    category: "General",
    difficulty: 3,
    prompt: "Match each codebase situation to the best improvement.",
    leftItems: [
      "main.py contains all business logic",
      "A class creates its own DB and email dependencies",
      "The same helper is copied across three projects"
    ],
    rightItems: [
      "Move business logic into modules and keep main as orchestration only",
      "Inject dependencies instead of hardcoding them",
      "Promote reusable logic into a shared utility/module"
    ],
    correctPairs: {"main.py contains all business logic": "Move business logic into modules and keep main as orchestration only", "A class creates its own DB and email dependencies": "Inject dependencies instead of hardcoding them", "The same helper is copied across three projects": "Promote reusable logic into a shared utility/module"},
    explanation: "Match items correctly.",
    rationale: "Tests matching judgment.",
  }),
  choiceQuestion({
    id: "senior_python_exam_q18",
    category: "General",
    difficulty: 3,
    prompt: "A Python bot fails after posting one of several transactions. The logs only show 'started', 'working', and 'failed', with no transaction ID or last confirmed step. What is the biggest weakness?",
    options: [
      "The logs are too high-level to support safe recovery decisions",
      "The script should log less often to reduce noise in production",
      "The failure should have been handled by a global exception wrapper",
      "Screenshots are missing, which matters more than transaction-level logs"
    ],
    correctAnswer: "A",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  choiceQuestion({
    id: "senior_python_exam_q19",
    category: "General",
    difficulty: 3,
    prompt: "A required amount field contains (1,250.00). What matters most?",
    options: [
      "The column exists",
      "The value is parsed and validated correctly",
      "The file opens",
      "The target system can reject it"
    ],
    correctAnswer: "B",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  choiceQuestion({
    id: "senior_python_exam_q20",
    category: "General",
    difficulty: 3,
    prompt: "Support cannot tell which record may already have posted. What is most important?",
    options: [
      "More screenshots",
      "A stable transaction ID in logs and recovery steps",
      "Longer retry delays",
      "Separate log files per run"
    ],
    correctAnswer: "B",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  choiceQuestion({
    id: "senior_python_exam_q21",
    category: "General",
    difficulty: 3,
    prompt: "Which pattern is worst in production code?",
    options: [
      "except Exception: logger.error('failed')",
      "except TimeoutError: retry()",
      "except ValueError as exc: raise InputError(...) from exc",
      "except Exception: pass"
    ],
    correctAnswer: "D",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
];

export function buildSeniorPythonExamQuestions(): Question[] {
  return [...seniorQuestions];
}