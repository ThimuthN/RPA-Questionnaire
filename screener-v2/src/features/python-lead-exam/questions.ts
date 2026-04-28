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

const leadQuestions: Question[] = [
  choiceQuestion({
    id: "lead_python_exam_q01",
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
    id: "lead_python_exam_q02",
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
    id: "lead_python_exam_q03",
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
    id: "lead_python_exam_q04",
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
    id: "lead_python_exam_q05",
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
    id: "lead_python_exam_q06",
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
    id: "lead_python_exam_q07",
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
  choiceQuestion({
    id: "lead_python_exam_q08",
    category: "General",
    difficulty: 3,
    prompt: "A stakeholder wants all submit timeouts retried automatically. What should the lead do?",
    options: [
      "Approve one retry per item and monitor results",
      "Pause automatic replay until safe completion checks are defined",
      "Add screenshots and continue with the current design",
      "Retry only during off-peak hours"
    ],
    correctAnswer: "B",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  choiceQuestion({
    id: "lead_python_exam_q09",
    category: "General",
    difficulty: 3,
    prompt: "A process still uses UI for several steps, but submit and status checks are now available by API. What is the strongest recommendation?",
    options: [
      "Keep the whole flow in UI until a full redesign is funded",
      "Move submit and status checks to API while retaining only necessary UI steps",
      "Shift everything to API immediately and let operations adapt later",
      "Use UI submission and API submission together for resilience"
    ],
    correctAnswer: "B",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  choiceQuestion({
    id: "lead_python_exam_q10",
    category: "General",
    difficulty: 3,
    prompt: "A visible defect is fixed, but unsafe replay is still unresolved. What is the best release decision?",
    options: [
      "Release now because the most visible defect was fixed",
      "Release only if unsafe paths are blocked or routed to controlled handling",
      "Release and increase support coverage for the evening",
      "Delay the release until every open defect is fully resolved"
    ],
    correctAnswer: "B",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  choiceQuestion({
    id: "lead_python_exam_q11",
    category: "General",
    difficulty: 3,
    prompt: "A bot handles claims. The early steps work well, but the final submit step is unreliable and may fail or create duplicates. Until that final step is fixed, what is the best temporary approach?",
    options: [
      "Keep the bot fully unattended so work continues faster",
      "Stop the whole process until the fix is ready",
      "Let the bot do the safe steps, then send the final uncertain step for manual review",
      "Run the bot twice and compare the results"
    ],
    correctAnswer: "C",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  choiceQuestion({
    id: "lead_python_exam_q12",
    category: "General",
    difficulty: 3,
    prompt: "Which review finding should concern a lead the most from a production-risk perspective?",
    options: [
      "A retry wrapper is used around all portal actions, including submit",
      "Important failures are logged without transaction IDs",
      "A decorator retries all exceptions around non-idempotent actions",
      "One module still has repeated imports"
    ],
    correctAnswer: "C",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  choiceQuestion({
    id: "lead_python_exam_q13",
    category: "General",
    difficulty: 3,
    prompt: "Several automations use the same portal, but not the same recovery model. What should actually be shared?",
    options: [
      "A single end-to-end reusable workflow for the portal",
      "Only locator files and no common behavior",
      "Common low-level components, with process-specific recovery kept separate",
      "No shared components, to avoid cross-impact"
    ],
    correctAnswer: "C",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  choiceQuestion({
    id: "lead_python_exam_q14",
    category: "General",
    difficulty: 3,
    prompt: "Unknown failures, weak evidence, and duplicates followed manual replay. What is the strongest conclusion?",
    options: [
      "The VM needs more CPU",
      "The main issue is missing observability and replay controls",
      "Support needs more screenshot training",
      "The selectors should be rewritten first"
    ],
    correctAnswer: "B",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  choiceQuestion({
    id: "lead_python_exam_q15",
    category: "General",
    difficulty: 3,
    prompt: "A post-submit HTTP 500 may still mean the transaction committed. What policy is best?",
    options: [
      "Treat all HTTP 500s as retriable",
      "Treat all HTTP 500s as business failures",
      "Classify them as completion-uncertain until verified",
      "Ignore them when screenshots look normal"
    ],
    correctAnswer: "C",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  choiceQuestion({
    id: "lead_python_exam_q16",
    category: "General",
    difficulty: 3,
    prompt: "Failures are hard to diagnose and support cannot replay safely. What should the lead prioritize first?",
    options: [
      "Increase support staffing",
      "Improve failure classification and replay-relevant observability",
      "Add screenshots at every step",
      "Upgrade the robot machine specification"
    ],
    correctAnswer: "B",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  multiSelectQuestion({
    id: "lead_python_exam_q17",
    category: "General",
    difficulty: 3,
    prompt: "A process is becoming more fragile after UI changes. Which lead responses are strongest? Select all that apply.",
    options: [
      "Reassess whether some steps should move to API or service integration",
      "Add broader wait coverage across the framework while a longer-term fix is discussed",
      "Revisit locator strategy and transaction boundaries",
      "Define retriable, terminal, and completion-uncertain failure classes",
      "Ask support to keep replaying failed items until backlog drops"
    ],
    correctAnswer: [
      "A",
      "C",
      "D"
    ],
    explanation: "Select all correct answers.",
    rationale: "Tests comprehensive understanding.",
  }),
  choiceQuestion({
    id: "lead_python_exam_q18",
    category: "General",
    difficulty: 3,
    prompt: "A bot crashes mid-batch after updating several records. On restart, it only knows the batch name because progress was stored in memory. What is the strongest improvement?",
    options: [
      "Increase retry count so the restarted batch is more likely to finish",
      "Persist item-level checkpoint state at a verified safe boundary",
      "Capture screenshots before each record update",
      "Route restarted batches to manual review unless the batch is very small"
    ],
    correctAnswer: "B",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  choiceQuestion({
    id: "lead_python_exam_q19",
    category: "General",
    difficulty: 3,
    prompt: "Two production issues appear at the same time. One bot is creating duplicate financial postings; another internal reporting bot is down for one department with a manual workaround. What should the lead contain first?",
    options: [
      "The reporting bot, because the number of user complaints is higher",
      "The duplicate-posting bot, because active financial impact is still occurring",
      "The easier rollback first, then reassess the second issue",
      "The reporting bot first, then the posting issue once communications are sent"
    ],
    correctAnswer: "B",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  choiceQuestion({
    id: "lead_python_exam_q20",
    category: "General",
    difficulty: 3,
    prompt: "A dynamic claims grid changes row order and regenerates element IDs after every refresh. What is the strongest locator strategy?",
    options: [
      "Filter the grid first, then click the first visible matching row",
      "Re-read the regenerated IDs after each refresh and keep using them",
      "Anchor selection to a stable business value near the intended action",
      "Use a longer XPath that follows the current column layout more precisely"
    ],
    correctAnswer: "C",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  choiceQuestion({
    id: "lead_python_exam_q21",
    category: "General",
    difficulty: 3,
    prompt: "A production bot keeps failing at the submit step. The shared framework catches the exception, logs 'submit failed,' and moves on, but support cannot tell which transactions may already have been posted. What is the strongest fix?",
    options: [
      "Add more screenshots around the submit step",
      "Retry failed submits automatically after a delay",
      "Capture transaction identity and external-state evidence before routing recovery decisions",
      "Move submit logic into a separate shared helper"
    ],
    correctAnswer: "C",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  orderingQuestion({
    id: "lead_python_exam_q22",
    category: "General",
    difficulty: 3,
    prompt: "During an unsafe replay incident, what is the best order of lead actions?",
    items: [
      "Gather evidence and determine impact scope",
      "Block unsafe replay paths",
      "Define a temporary operating model",
      "Approve a long-term design fix"
    ],
    correctOrder: [0, 1, 2, 3],
    explanation: "Order the items correctly.",
    rationale: "Tests process sequencing.",
  }),
  orderingQuestion({
    id: "lead_python_exam_q23",
    category: "General",
    difficulty: 3,
    prompt: "Before approving deployment of a risky automation fix, what is the best order of steps?",
    items: [
      "Confirm the unsafe scenario is addressed or isolated",
      "Define rollback or containment path",
      "Communicate support handling expectations",
      "Approve deployment"
    ],
    correctOrder: [0, 1, 2, 3],
    explanation: "Order the items correctly.",
    rationale: "Tests process sequencing.",
  }),
  matchingQuestion({
    id: "lead_python_exam_q24",
    category: "General",
    difficulty: 3,
    prompt: "Match each stakeholder request to the best lead response.",
    leftItems: [
      "Retry all submit timeouts automatically",
      "Process the file even if it may still be uploading",
      "Keep full payloads and credentials in logs for debugging"
    ],
    rightItems: [
      "Require safe completion checks before enabling replay",
      "Require ingestion controls before unattended use",
      "Keep logs useful but sanitized"
    ],
    correctPairs: {"Retry all submit timeouts automatically": "Require safe completion checks before enabling replay", "Process the file even if it may still be uploading": "Require ingestion controls before unattended use", "Keep full payloads and credentials in logs for debugging": "Keep logs useful but sanitized"},
    explanation: "Match items correctly.",
    rationale: "Tests matching judgment.",
  }),
  matchingQuestion({
    id: "lead_python_exam_q25",
    category: "General",
    difficulty: 3,
    prompt: "Match each architecture or team-standard situation to the best lead response.",
    leftItems: [
      "Main script contains orchestration, DB logic, UI logic, and email logic together",
      "Class creates its own DB and email clients internally",
      "Team wants to use an unpinned preview package in production"
    ],
    rightItems: [
      "Split by concern and keep orchestration thin",
      "Move to dependency injection for testability",
      "Reject until stable, pinned dependency control exists"
    ],
    correctPairs: {"Main script contains orchestration, DB logic, UI logic, and email logic together": "Split by concern and keep orchestration thin", "Class creates its own DB and email clients internally": "Move to dependency injection for testability", "Team wants to use an unpinned preview package in production": "Reject until stable, pinned dependency control exists"},
    explanation: "Match items correctly.",
    rationale: "Tests matching judgment.",
  }),
  choiceQuestion({
    id: "lead_python_exam_q26",
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
    id: "lead_python_exam_q27",
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
    id: "lead_python_exam_q28",
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
  choiceQuestion({
    id: "lead_python_exam_q29",
    category: "General",
    difficulty: 3,
    prompt: "What most improves testability?",
    options: [
      "Creating DB and email clients inside the class",
      "Passing dependencies into the class",
      "Adding more comments",
      "Splitting one function into two"
    ],
    correctAnswer: "B",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  choiceQuestion({
    id: "lead_python_exam_q30",
    category: "General",
    difficulty: 3,
    prompt: "A bot passed a few manual runs. What is still required before release?",
    options: [
      "Deterministic tests for core logic",
      "More support coverage",
      "A README warning",
      "Higher retry count"
    ],
    correctAnswer: "A",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
  choiceQuestion({
    id: "lead_python_exam_q31",
    category: "General",
    difficulty: 3,
    prompt: "What should never appear in logs?",
    options: [
      "Retry count",
      "Record ID",
      "API key or password",
      "Start timestamp"
    ],
    correctAnswer: "C",
    explanation: "Review and select the best answer.",
    rationale: "Tests operational judgment.",
  }),
];

export function buildLeadPythonExamQuestions(): Question[] {
  return [...leadQuestions];
}