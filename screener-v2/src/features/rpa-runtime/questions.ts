import type { Question } from "@/lib/assessment-engine/types";

export type RpaRuntimeLevel = "Senior" | "Lead";

type DifficultyTier = "medium" | "mediumHard" | "hard";

const difficultyMeta: Record<DifficultyTier, { difficulty: 2 | 3 | 4; points: 1 | 2 | 3 }> = {
  medium: { difficulty: 2, points: 1 },
  mediumHard: { difficulty: 3, points: 2 },
  hard: { difficulty: 4, points: 3 }
};

function sharedProps(args: {
  id: string;
  category: string;
  tier: DifficultyTier;
  format: Question["format"];
  prompt: string;
  explanation: string;
  rationale: string;
  techStack?: Question["techStack"];
  seniorOnly?: boolean;
  leadOnly?: boolean;
  roleLevelMin?: Question["roleLevelMin"];
  roleLevelMax?: Question["roleLevelMax"];
}) {
  const meta = difficultyMeta[args.tier];
  return {
    id: args.id,
    roleLevelMin: args.roleLevelMin ?? "SeniorSE",
    roleLevelMax: args.roleLevelMax ?? null,
    seniorOnly: args.seniorOnly,
    leadOnly: args.leadOnly,
    techStack: args.techStack ?? "General",
    category: args.category,
    difficulty: meta.difficulty,
    format: args.format,
    points: meta.points,
    prompt: args.prompt,
    explanation: args.explanation,
    rationale: args.rationale
  };
}

function choiceQuestion(args: {
  id: string;
  category: string;
  tier: DifficultyTier;
  format: Extract<
    Question["format"],
    "single_select" | "best_next_step" | "log_analysis_single_select" | "trace_execution" | "case_triage"
  >;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  rationale: string;
  logSnippet?: string;
  techStack?: Question["techStack"];
  seniorOnly?: boolean;
  leadOnly?: boolean;
  roleLevelMin?: Question["roleLevelMin"];
  roleLevelMax?: Question["roleLevelMax"];
}): Question {
  return {
    ...sharedProps(args),
    scoringMethod: "all_or_nothing",
    options: args.options,
    correctAnswer: [args.correctAnswer],
    logSnippet: args.logSnippet
  } as Question;
}

function multiSelectQuestion(args: {
  id: string;
  category: string;
  tier: DifficultyTier;
  prompt: string;
  options: string[];
  correctAnswer: string[];
  explanation: string;
  rationale: string;
  logSnippet?: string;
  techStack?: Question["techStack"];
  seniorOnly?: boolean;
  leadOnly?: boolean;
  roleLevelMin?: Question["roleLevelMin"];
  roleLevelMax?: Question["roleLevelMax"];
}): Question {
  return {
    ...sharedProps({ ...args, format: "multi_select" }),
    scoringMethod: "partial_with_penalty",
    options: args.options,
    correctAnswer: args.correctAnswer,
    logSnippet: args.logSnippet
  } as Question;
}

function orderingQuestion(args: {
  id: string;
  category: string;
  tier: DifficultyTier;
  prompt: string;
  items: string[];
  correctOrder: number[];
  explanation: string;
  rationale: string;
  techStack?: Question["techStack"];
  seniorOnly?: boolean;
  leadOnly?: boolean;
  roleLevelMin?: Question["roleLevelMin"];
  roleLevelMax?: Question["roleLevelMax"];
}): Question {
  return {
    ...sharedProps({ ...args, format: "ordering" }),
    scoringMethod: "partial_position",
    items: args.items,
    correctOrder: args.correctOrder
  } as Question;
}

function matchingQuestion(args: {
  id: string;
  category: string;
  tier: DifficultyTier;
  prompt: string;
  leftItems: string[];
  rightItems: string[];
  correctPairs: Record<string, string>;
  explanation: string;
  rationale: string;
  techStack?: Question["techStack"];
  seniorOnly?: boolean;
  leadOnly?: boolean;
  roleLevelMin?: Question["roleLevelMin"];
  roleLevelMax?: Question["roleLevelMax"];
}): Question {
  return {
    ...sharedProps({ ...args, format: "matching" }),
    scoringMethod: "partial_pairs_with_penalty",
    leftItems: args.leftItems,
    rightItems: args.rightItems,
    correctPairs: args.correctPairs
  } as Question;
}

const rpaRuntimeBaseQuestions: Question[] = [
  choiceQuestion({
    id: "rpa_runtime_base_q1",
    category: "RPA Runtime Safety",
    tier: "mediumHard",
    format: "single_select",
    prompt:
      "A bot clicks Submit on a portal. The request times out, but the action may already have gone through. What should the bot do first?",
    options: [
      "Retry once with a longer wait because the portal often recovers on the second try",
      "Check whether the action already completed before deciding whether to retry",
      "Route it to manual review immediately because the result is uncertain",
      "Mark the item failed and let the next scheduled run pick it up"
    ],
    correctAnswer: "B",
    explanation: "The bot should confirm whether the first action already completed before replaying it.",
    rationale: "Tests replay safety when completion is uncertain."
  }),
  choiceQuestion({
    id: "rpa_runtime_base_q3",
    category: "Queue Discipline",
    tier: "mediumHard",
    format: "single_select",
    prompt:
      "A queue item is marked Successful immediately after the bot sends an update, before the target system confirms the result. What is the strongest correction?",
    options: [
      "Keep the current logic but alert if confirmation is delayed",
      "Mark success after the request is accepted so the queue keeps moving faster",
      "Mark success only after final completion is confirmed and enough evidence is recorded for safe recovery",
      "Mark success early for low-value items and late for high-value items"
    ],
    correctAnswer: "C",
    explanation: "Queue success should line up with true completion, not just request submission.",
    rationale: "Tests commit-boundary discipline."
  }),
  choiceQuestion({
    id: "rpa_runtime_base_q5",
    category: "Runtime Diagnosis",
    tier: "hard",
    format: "log_analysis_single_select",
    prompt: "What is the real flaw in this flow?",
    logSnippet:
      "Sent invoice INV-402\nTimed out after send\nRetry queued\nOriginal request later succeeded\nRetry rejected as duplicate",
    options: [
      "Timeout was too short",
      "The queue should never retry timed-out items",
      "The bot retried before checking whether the first attempt already worked",
      "The target system should not reject duplicates"
    ],
    correctAnswer: "C",
    explanation: "The design retried before proving whether the original submission had already worked.",
    rationale: "Tests log-based duplicate diagnosis."
  }),
  choiceQuestion({
    id: "rpa_runtime_base_q8",
    category: "Cross-System Recovery",
    tier: "hard",
    format: "log_analysis_single_select",
    prompt: "What is the strongest next move?",
    logSnippet:
      "Customer record updated\nBilling request timed out after send\nAudit step not reached\nWorker restarted",
    options: [
      "Re-run the whole transaction so both systems stay aligned",
      "Retry the billing action immediately",
      "Check whether billing already happened before deciding whether to retry",
      "Treat it as bad source data"
    ],
    correctAnswer: "C",
    explanation: "The billing step may already have completed, so the process has to check before retrying it.",
    rationale: "Tests safe handling of partial completion across systems."
  }),
  choiceQuestion({
    id: "rpa_runtime_base_q11",
    category: "Run Control",
    tier: "hard",
    format: "trace_execution",
    prompt: "What control is missing from this run flow?",
    logSnippet:
      "Run A starts\nRun B starts before A ends\nBoth read the same pending work\nBoth write results",
    options: [
      "Stronger retry rules",
      "More detailed logs",
      "Overlap prevention or locking before run start",
      "A longer timeout on file saves"
    ],
    correctAnswer: "C",
    explanation: "Concurrent runs need an overlap-prevention control before they start processing shared work.",
    rationale: "Tests duplicate-run prevention."
  }),
  orderingQuestion({
    id: "rpa_runtime_base_q12",
    category: "Crash Recovery",
    tier: "hard",
    prompt:
      "A bot crashes after sending an external update but before saving its own final state. Arrange the strongest recovery steps in order.",
    items: [
      "Check what happened in the external system",
      "Capture enough recovery evidence to support a safe next action",
      "Decide whether to continue, retry, or stop the item",
      "Resume processing with the chosen action"
    ],
    correctOrder: [0, 1, 2, 3],
    explanation: "Recovery should start with checking external state, then recording evidence, then choosing a safe path.",
    rationale: "Tests recovery sequencing under uncertainty."
  })
];

const seniorQuestions: Question[] = [
  choiceQuestion({
    id: "rpa_runtime_senior_q2",
    category: "Duplicate Prevention",
    tier: "mediumHard",
    format: "single_select",
    prompt:
      "A bot sometimes restarts after failure and posts the same invoice twice. What is the strongest preventive control?",
    options: [
      "Add a longer delay before posting",
      "Reduce retry count",
      "Check a business-unique identifier before posting",
      "Clean up duplicates at the end of the day"
    ],
    correctAnswer: "C",
    explanation: "A stable business identifier is the strongest direct control against duplicate posting.",
    rationale: "Tests duplicate prevention design."
  }),
  choiceQuestion({
    id: "rpa_runtime_senior_q4",
    category: "Business Data Handling",
    tier: "mediumHard",
    format: "single_select",
    prompt:
      "A record arrives without a required customer ID. The source team says the value sometimes appears later in the day, but the bot is running now. What is the best treatment?",
    options: [
      "Retry it a few times because the value may still arrive in time for today's run",
      "Treat it as a data problem, stop this item from posting, and route it through the agreed business path",
      "Treat it as a temporary system issue because the source might still update",
      "Mark it successful with a warning so the queue can keep moving"
    ],
    correctAnswer: "B",
    explanation: "The item should not proceed without required data; it should follow the agreed business exception path.",
    rationale: "Tests business-data judgment under pressure."
  }),
  choiceQuestion({
    id: "rpa_runtime_senior_q6",
    category: "Queue Exception Handling",
    tier: "mediumHard",
    format: "single_select",
    prompt:
      "One queue item keeps failing because one field is invalid. The rest of the queue is fine. What should happen?",
    options: [
      "Retry it for a while in case the source fixes itself",
      "Pause the queue until the item is corrected",
      "Route that item for review and keep the rest moving",
      "Mark it successful with a warning"
    ],
    correctAnswer: "C",
    explanation: "A bad item should be isolated so healthy work can continue.",
    rationale: "Tests poison-item handling."
  }),
  choiceQuestion({
    id: "rpa_runtime_senior_q7",
    category: "File Readiness",
    tier: "mediumHard",
    format: "single_select",
    prompt:
      "A CSV appears in the input folder before the upstream export is fully complete. Upstream will not add a done-file or handoff step. What is the strongest protection?",
    options: [
      "Wait a fixed amount of time based on average export duration",
      "Retry opening the file until it is no longer locked, then process it",
      "Move the file to a bot-owned folder first and validate it after processing starts",
      "Check for strong signs that the file is complete, such as stable file size over time and expected structure, before processing"
    ],
    correctAnswer: "D",
    explanation: "When no explicit handoff exists, the bot should rely on strong readiness signals before processing.",
    rationale: "Tests robust file-readiness handling."
  }),
  choiceQuestion({
    id: "rpa_runtime_senior_q9",
    category: "Queue Integrity",
    tier: "hard",
    format: "trace_execution",
    prompt: "What is the core flaw in this flow?",
    logSnippet:
      "Read item\nSend update\nMark queue item successful\nWrite audit note\nLater discover the target system never confirmed the update",
    options: [
      "Audit note should have been written first",
      "Queue should not be used for this process",
      "Success was marked before true completion was known",
      "Logging should happen only after success"
    ],
    correctAnswer: "C",
    explanation: "The process marked success before the business outcome was confirmed.",
    rationale: "Tests false-success detection."
  }),
  choiceQuestion({
    id: "rpa_runtime_senior_q10",
    category: "Output Safety",
    tier: "mediumHard",
    format: "single_select",
    prompt:
      "Two unattended bots write to the same Excel file at the same time. What is the strongest fix?",
    options: [
      "Add a schedule gap between the two bots",
      "Let both write and reconcile later",
      "Give each run its own output file or merge results in a controlled step",
      "Increase machine resources so saves finish faster"
    ],
    correctAnswer: "C",
    explanation: "Separate outputs or a controlled merge are safer than concurrent writes to one workbook.",
    rationale: "Tests shared-output corruption controls."
  }),
  choiceQuestion({
    id: "rpa_runtime_senior_q15",
    category: "Browser Automation",
    tier: "mediumHard",
    format: "single_select",
    prompt:
      "A button is visible in the DOM, but clicks fail because a loading layer still covers it. What is the strongest fix?",
    options: [
      "Retry the click three times",
      "Wait until the element exists, then click",
      "Wait until the element is actually interactable and the blocker is gone",
      "Add a fixed sleep before all clicks"
    ],
    correctAnswer: "C",
    explanation: "Element presence is not enough when another overlay is still blocking interaction.",
    rationale: "Tests click-readiness judgment."
  }),
  choiceQuestion({
    id: "rpa_runtime_senior_q16",
    category: "Browser Automation",
    tier: "hard",
    format: "single_select",
    prompt:
      "After the page refreshes, the old element reference throws a stale element exception. What is the strongest fix?",
    logSnippet:
      "button = driver.find_element(By.ID, \"submit\")\ndriver.find_element(By.ID, \"refresh\").click()\nbutton.click()",
    options: [
      "Wrap the old reference in a retry loop and click it again after a short wait",
      "Re-find the element after the re-render and wait for the new element state before clicking",
      "Increase implicit wait so Selenium has more time to recover the old reference",
      "Use JavaScript click on the old reference to bypass Selenium state checks"
    ],
    correctAnswer: "B",
    explanation: "A stale reference must be reacquired after the page re-renders.",
    rationale: "Tests stale-element recovery."
  }),
  choiceQuestion({
    id: "rpa_runtime_senior_q17",
    category: "Browser Automation",
    tier: "mediumHard",
    format: "single_select",
    prompt:
      "A bot keeps selecting the wrong claim because it clicks row 3 after the table re-sorts. What is the strongest fix?",
    options: [
      "Add a longer delay before clicking row 3",
      "Retry if the wrong row opens",
      "Find the row using a business identifier like claim number",
      "Disable sorting in the browser"
    ],
    correctAnswer: "C",
    explanation: "The row should be targeted by business identity, not by visual position.",
    rationale: "Tests dynamic-grid targeting."
  }),
  multiSelectQuestion({
    id: "rpa_runtime_senior_q18",
    category: "Browser Automation",
    tier: "mediumHard",
    prompt: "Which practices are stronger than scattering time.sleep() everywhere? Select all that apply.",
    options: [
      "Explicit waits tied to real conditions in the page or app",
      "Waiting for blockers to disappear or targets to become interactable",
      "Polling for business-visible evidence, like the expected row or status appearing",
      "Using short sleeps before every page action and keeping implicit wait as a fallback",
      "Replacing most explicit waits with one longer implicit wait everywhere"
    ],
    correctAnswer: ["A", "B", "C"],
    explanation: "Application-state waits are more reliable than fixed sleeps.",
    rationale: "Tests practical wait strategy."
  }),
  multiSelectQuestion({
    id: "rpa_runtime_senior_q19",
    category: "Browser Automation",
    tier: "hard",
    prompt: "A Selenium run crashes mid-transaction. What evidence is most valuable? Select all that apply.",
    options: [
      "Screenshot",
      "DOM or HTML snapshot if available",
      "Transaction ID and last completed step in logs",
      "Developer guess after the incident",
      "Driver or browser error details"
    ],
    correctAnswer: ["A", "B", "C", "E"],
    explanation: "The most useful evidence helps support reconstruct the state and recovery options.",
    rationale: "Tests browser failure evidence quality."
  }),
  choiceQuestion({
    id: "rpa_runtime_senior_q20",
    category: "Remote UI Automation",
    tier: "hard",
    format: "single_select",
    prompt:
      "The app runs in a remote desktop where DOM-level selectors are unreliable. What is the strongest approach?",
    options: [
      "Use coordinate clicks for everything",
      "Use image or CV actions only where needed and verify the result",
      "Convert the whole process to manual",
      "Use image matching for every step regardless of risk"
    ],
    correctAnswer: "B",
    explanation: "Remote screens often require image or CV fallback, but the results still need validation.",
    rationale: "Tests Citrix-style automation judgment."
  }),
  choiceQuestion({
    id: "rpa_runtime_senior_q21",
    category: "Browser Automation",
    tier: "mediumHard",
    format: "single_select",
    prompt:
      "A claim table can re-sort, rows move, and element IDs change each refresh. The bot needs to click the Approve button for one specific claim. Which locator approach is strongest?",
    options: [
      "Use the third row because the right claim is usually near the top",
      "Use a locator anchored to the claim number, then find the related action button in that same row",
      "Use screen coordinates because they are faster once recorded",
      "Use the shortest XPath available so it is easier to maintain"
    ],
    correctAnswer: "B",
    explanation: "A stable business value is the safest anchor in a dynamic grid.",
    rationale: "Tests locator strategy in changing tables."
  }),
  choiceQuestion({
    id: "rpa_runtime_senior_q22",
    category: "Browser Automation",
    tier: "mediumHard",
    format: "single_select",
    prompt:
      "A Selenium bot can see a Login button on screen, but find_element fails. The page source shows the button is inside an embedded frame that loads after the main page shell. What is the strongest fix?",
    options: [
      "Add a longer wait and keep searching from the top page until the frame finishes loading",
      "Switch into the correct frame, then locate and interact with the button from that context",
      "Use JavaScript click from the top page once the button is visible on screen",
      "Switch this step to image-based clicking because frame content is too unreliable"
    ],
    correctAnswer: "B",
    explanation: "The bot has to switch into the frame before locating elements inside it.",
    rationale: "Tests frame-context handling."
  }),
  choiceQuestion({
    id: "rpa_runtime_senior_q25",
    category: "Python Automation",
    tier: "hard",
    format: "single_select",
    prompt: "What is the biggest problem with this error handling?",
    logSnippet: "try:\n    post_payment(row)\nexcept Exception:\n    logger.error(\"payment failed\")",
    options: [
      "The log message is too short",
      "It catches everything without context and hides what should be handled differently",
      "post_payment should never be in a try block",
      "All payment failures should be ignored and reviewed later"
    ],
    correctAnswer: "B",
    explanation: "A broad catch-all hides important differences between recoverable and non-recoverable failures.",
    rationale: "Tests Python exception hygiene in automation code."
  }),
  choiceQuestion({
    id: "rpa_runtime_senior_q26",
    category: "Python Automation",
    tier: "hard",
    format: "single_select",
    prompt: "What is the biggest problem with this retry logic?",
    logSnippet: "try:\n    send_invoice(row)\nexcept TimeoutError:\n    send_invoice(row)",
    options: [
      "It retries too quickly and should sleep longer first",
      "It catches too narrow an exception type",
      "It retries without checking whether the first attempt may already have worked",
      "It should log before the second call, not after it"
    ],
    correctAnswer: "C",
    explanation: "A timeout does not prove the first call failed, so retrying blindly can duplicate work.",
    rationale: "Tests replay safety in Python automation code."
  }),
  choiceQuestion({
    id: "rpa_runtime_senior_q27",
    category: "Python Automation",
    tier: "mediumHard",
    format: "single_select",
    prompt: "What is the strongest criticism of these logs?",
    logSnippet: "logger.info(\"started\")\nlogger.info(\"working\")\nlogger.error(\"failed\")",
    options: [
      "These should all be DEBUG logs, not INFO or ERROR",
      "The logs should include item identity, step context, and useful recovery evidence",
      "Browser automations should prefer screenshots instead of logs",
      "Only the final status should be logged to avoid noise"
    ],
    correctAnswer: "B",
    explanation: "Useful automation logs need item identity, step context, and recovery clues.",
    rationale: "Tests logging quality for automated recovery and support."
  }),
  choiceQuestion({
    id: "rpa_runtime_senior_q29",
    category: "Python Automation",
    tier: "hard",
    format: "single_select",
    prompt: "What is the biggest risk in this batch-processing pattern?",
    logSnippet:
      "for claim in claims:\n    try:\n        submit_claim(claim)\n    except Exception:\n        submit_claim(claim)",
    options: [
      "It retries without checking whether the first attempt may already have completed",
      "It should retry more than once before failing",
      "It should process claims in parallel so one bad claim does not slow the batch",
      "It should only catch network-related exceptions"
    ],
    correctAnswer: "A",
    explanation: "Blindly replaying on every exception can create duplicate external actions.",
    rationale: "Tests risky retry behavior in Python loops."
  })
];

const leadQuestions: Question[] = [
  choiceQuestion({
    id: "rpa_runtime_lead_q13",
    category: "Operational Triage",
    tier: "hard",
    format: "single_select",
    prompt:
      "A finance queue is running twice because of a scheduler overlap, and duplicate payment actions are still being created. At the same time, a separate customer-service bot is fully down and 40 users are blocked. What should be contained first?",
    options: [
      "The customer-service outage, because more users are affected immediately",
      "The finance overlap, because active financial duplication is still happening",
      "Both equally, so wait for management to decide which team acts first",
      "The issue with the faster rollback path, so support can show quick progress"
    ],
    correctAnswer: "B",
    explanation: "Active financial duplication is the highest-risk live issue to stop first.",
    rationale: "Tests production prioritization under competing incidents."
  }),
  choiceQuestion({
    id: "rpa_runtime_lead_q14",
    category: "Runtime Diagnosis",
    tier: "hard",
    format: "log_analysis_single_select",
    prompt: "What is the strongest interpretation of this incident?",
    logSnippet:
      "dependency response times rising\nretry count rising sharply\nqueue depth rising\nsame item IDs appear multiple times\nwrites per item doubling",
    options: [
      "Queue depth is the root cause and retries are only noise",
      "Dependency slowdown is real, but retry behavior is amplifying repeated work and load",
      "Database tuning alone will solve it",
      "More workers are the main fix"
    ],
    correctAnswer: "B",
    explanation: "The dependency slowdown is real, but the retry pattern is now amplifying load and repeated work.",
    rationale: "Tests diagnosis of retry storms."
  }),
  matchingQuestion({
    id: "rpa_runtime_lead_q23",
    category: "Browser Diagnostics",
    tier: "mediumHard",
    prompt: "Match each symptom to the strongest first diagnosis.",
    leftItems: [
      "Element present but click intercepted",
      "Same reference works, then becomes stale",
      "Wrong row chosen after data load",
      "Works locally, fails only in the CI browser"
    ],
    rightItems: [
      "DOM re-render or stale reference",
      "Blocking overlay or readiness issue",
      "Row position is unreliable",
      "Environment, browser, or runtime difference"
    ],
    correctPairs: {
      "Element present but click intercepted": "Blocking overlay or readiness issue",
      "Same reference works, then becomes stale": "DOM re-render or stale reference",
      "Wrong row chosen after data load": "Row position is unreliable",
      "Works locally, fails only in the CI browser": "Environment, browser, or runtime difference"
    },
    explanation: "Each symptom points to a different first-line diagnosis path.",
    rationale: "Tests diagnostic mapping across browser failure modes."
  }),
  choiceQuestion({
    id: "rpa_runtime_lead_q24",
    category: "Design Quality",
    tier: "mediumHard",
    format: "single_select",
    prompt:
      "A browser bot has locators, waits, retries, and recovery steps copied across many scripts. A UI change now requires the same fix in five places. What is the strongest improvement?",
    options: [
      "Move shared browser actions into one reusable layer so locator and wait changes are fixed in one place",
      "Keep the scripts separate, but document the repeated logic more clearly",
      "Replace all explicit waits with one global implicit wait",
      "Add more screenshots so support can tell which script failed"
    ],
    correctAnswer: "A",
    explanation: "Shared browser logic should live in one place when the behavior is truly shared.",
    rationale: "Tests maintainability decisions in browser automation."
  }),
  matchingQuestion({
    id: "rpa_runtime_lead_q28",
    category: "Reuse Boundaries",
    tier: "mediumHard",
    prompt: "Match each situation to the best design choice.",
    leftItems: [
      "Same login helper used across five automations",
      "One client-specific report naming rule",
      "Same retry wrapper used across multiple portal actions",
      "One helper with no real reuse yet"
    ],
    rightItems: [
      "Promote to shared component",
      "Keep project-specific",
      "Keep local for now"
    ],
    correctPairs: {
      "Same login helper used across five automations": "Promote to shared component",
      "One client-specific report naming rule": "Keep project-specific",
      "Same retry wrapper used across multiple portal actions": "Promote to shared component",
      "One helper with no real reuse yet": "Keep local for now"
    },
    explanation: "Only truly reused behavior should move into shared components.",
    rationale: "Tests maintainability and abstraction boundaries."
  }),
  multiSelectQuestion({
    id: "rpa_runtime_lead_q30",
    category: "Python Recovery",
    tier: "hard",
    prompt:
      "A Python bot posts claims and sometimes fails mid-run. Which log details are most useful for safe recovery? Select all that apply.",
    options: [
      "Claim ID or transaction ID",
      "Last confirmed completed step",
      "Retry attempt number and reason",
      "Developer laptop name",
      "Target-system response or lookup result when available"
    ],
    correctAnswer: ["A", "B", "C", "E"],
    explanation: "Recovery depends on item identity, last confirmed state, retry history, and external-state evidence.",
    rationale: "Tests recovery-ready logging."
  }),
  choiceQuestion({
    id: "rpa_runtime_lead_q31",
    category: "Runtime Judgment",
    tier: "hard",
    format: "single_select",
    prompt:
      "A bot sends an update to a payer portal. The browser freezes after clicking Submit. The queue item is still marked In Progress. The portal session is gone after restart, and there is no internal audit write yet. What is the strongest next step?",
    options: [
      "Retry once because the queue item is still In Progress and no completion was recorded",
      "Mark failed and let support compare portal records later to avoid creating another duplicate",
      "Verify in the external system whether the action already happened, then choose retry, skip, or stop from that result",
      "Restart from the first screen, but stop before final submit if a related record already appears"
    ],
    correctAnswer: "C",
    explanation: "The process should confirm portal state before deciding whether the item is safe to replay.",
    rationale: "Tests lead-level recovery judgment."
  }),
  multiSelectQuestion({
    id: "rpa_runtime_lead_q32",
    category: "Recovery Evidence",
    tier: "hard",
    prompt:
      "A support team wants to replay failed items faster. Which evidence should be considered mandatory before replaying a transaction where partial completion is possible? Select all that apply.",
    options: [
      "Last confirmed internal step",
      "Whether the external system already changed state",
      "A screenshot of the final screen only",
      "Correlated transaction ID across logs",
      "Retry history and timestamps"
    ],
    correctAnswer: ["A", "B", "D", "E"],
    explanation: "Replay decisions need step evidence, external-state proof, correlation, and retry history.",
    rationale: "Tests operational evidence requirements before replay."
  }),
  choiceQuestion({
    id: "rpa_runtime_lead_q33",
    category: "Browser Diagnostics",
    tier: "hard",
    format: "log_analysis_single_select",
    prompt: "What is the strongest conclusion from this browser failure artifact?",
    logSnippet:
      "element found\nelement_to_be_clickable passed\nclick still fails intermittently\nscreenshot shows a cookie banner overlapping the lower page",
    options: [
      "The locator is wrong",
      "The explicit wait is useless",
      "Clickability of the target alone was not enough because another overlay still blocked interaction",
      "Selenium is unreliable for production automation"
    ],
    correctAnswer: "C",
    explanation: "The banner is still intercepting the action even though the element itself appears clickable.",
    rationale: "Tests artifact-based diagnosis of intercepted clicks."
  }),
  choiceQuestion({
    id: "rpa_runtime_lead_q34",
    category: "Browser Automation",
    tier: "hard",
    format: "single_select",
    prompt:
      "Which locator strategy is strongest for a claim row in a dynamic grid where column order may change, row order may change, and IDs are regenerated each refresh?",
    options: [
      "Use row and column indexes together, because layout usually changes less often than IDs",
      "Use a locator anchored to the claim number text or another stable business value near the action button",
      "Use the generated row ID but refresh it every run before clicking",
      "Use a short XPath to the first visible Approve button after filtering"
    ],
    correctAnswer: "B",
    explanation: "A stable business value is safer than position- or refresh-driven locators.",
    rationale: "Tests selector tradeoff judgment."
  }),
  choiceQuestion({
    id: "rpa_runtime_lead_q35",
    category: "Supportability and Privacy",
    tier: "hard",
    format: "single_select",
    prompt:
      "A developer argues that severe incidents justify temporarily logging full request payloads, credentials, and patient details so debugging is faster. What is the strongest response?",
    options: [
      "Allow it in UAT only if retention is short",
      "Allow it behind a temporary debug flag for senior responders only",
      "Reject it; logs must remain useful without exposing secrets or PHI",
      "Allow it only for failed transactions, since those are the ones support must inspect"
    ],
    correctAnswer: "C",
    explanation: "Logs still need to stay diagnosable without exposing secrets or protected data.",
    rationale: "Tests security and supportability judgment."
  }),
  choiceQuestion({
    id: "rpa_runtime_lead_q36",
    category: "Release Judgment",
    tier: "hard",
    format: "single_select",
    prompt:
      "A bug causing duplicate postings is fixed. Business wants same-day production release because backlog is growing. Tests cover the duplicate path, but one low-volume downstream reporting path was not revalidated yet. What is the strongest decision?",
    options: [
      "Release immediately because the duplicate bug is higher risk than reporting gaps",
      "Delay everything until the full regression pack is complete, regardless of impact",
      "Release only if the unvalidated path is isolated, rollback is ready, and monitoring is tightened for the affected areas",
      "Release to production and let support watch manually"
    ],
    correctAnswer: "C",
    explanation: "A controlled release can be acceptable if the remaining risk is isolated, monitored, and reversible.",
    rationale: "Tests lead-level release decision-making."
  }),
  orderingQuestion({
    id: "rpa_runtime_lead_q37",
    category: "Recovery Reasoning",
    tier: "hard",
    prompt:
      "A bot posts a payment, then crashes before saving local completion status. Arrange the strongest recovery steps in order.",
    items: [
      "Check whether the payment already posted in the target system",
      "Capture recovery evidence in logs, ticket, or audit trail",
      "Decide whether to retry, skip, or stop the item",
      "Resume queue processing with the decided action"
    ],
    correctOrder: [0, 1, 2, 3],
    explanation: "Good recovery starts with the target-system state, then evidence, then the decision, then resumption.",
    rationale: "Tests recovery sequencing at lead level."
  }),
  choiceQuestion({
    id: "rpa_runtime_lead_q38",
    category: "Browser Automation",
    tier: "mediumHard",
    format: "single_select",
    prompt:
      "A Selenium flow uses sleep(2) after login, sleep(3) after search, and sleep(5) before submit. It still fails randomly in production. What is the strongest criticism?",
    options: [
      "The sleeps are simply too short for production and should be increased",
      "All sleeps should be replaced with one implicit wait to reduce tuning",
      "Fixed delays are guessing; waits should be tied to real application states and blockers",
      "The sleeps are fine, but the final submit step needs a retry wrapper"
    ],
    correctAnswer: "C",
    explanation: "Fixed delays guess about readiness instead of waiting for meaningful application states.",
    rationale: "Tests lead-level wait strategy judgment."
  }),
  matchingQuestion({
    id: "rpa_runtime_lead_q39",
    category: "Root Cause Analysis",
    tier: "hard",
    prompt: "Match each evidence pattern to the most likely root issue.",
    leftItems: [
      "Same item ID appears twice with two different run IDs",
      "Screenshot shows target button visible but banner overlaps page bottom",
      "Logs show success marked before downstream confirmation exists",
      "DOM refresh occurs between locate and click"
    ],
    rightItems: [
      "Stale element risk",
      "False completion logic",
      "Overlap or concurrency problem",
      "Click interception or overlay problem"
    ],
    correctPairs: {
      "Same item ID appears twice with two different run IDs": "Overlap or concurrency problem",
      "Screenshot shows target button visible but banner overlaps page bottom": "Click interception or overlay problem",
      "Logs show success marked before downstream confirmation exists": "False completion logic",
      "DOM refresh occurs between locate and click": "Stale element risk"
    },
    explanation: "Each evidence pattern points to a different failure family.",
    rationale: "Tests mapping from evidence to root cause."
  }),
  multiSelectQuestion({
    id: "rpa_runtime_lead_q40",
    category: "Supportability",
    tier: "mediumHard",
    prompt:
      "Which design choices most improve supportability in unattended browser automation? Select all that apply.",
    options: [
      "Transaction IDs carried through all logs",
      "Step names before and after critical actions",
      "Screenshots only on fatal crashes, never on handled exceptions",
      "Evidence that supports replay or skip decisions after partial completion",
      "Summary logging instead of spam inside tight loops"
    ],
    correctAnswer: ["A", "B", "D", "E"],
    explanation: "Support needs traceability, step context, replay evidence, and readable logs.",
    rationale: "Tests supportability by design."
  }),
  choiceQuestion({
    id: "rpa_runtime_lead_q41",
    category: "Ambiguity Handling",
    tier: "hard",
    format: "single_select",
    prompt:
      "A stakeholder says, 'If the portal says pending for too long, just resubmit.' There is no exact time threshold, no duplicate-safe rule, and no exception path defined. What is the strongest response?",
    options: [
      "Use a default threshold now, but make it configurable so support can tune it later",
      "Resubmit once after a reasonable delay and treat any second pending state as manual review",
      "Stop and get the rule clarified, including the delay threshold, duplicate-safe behavior, exception path, and decision owner",
      "Build a pending-age report first, then let production behavior guide the resubmit rule"
    ],
    correctAnswer: "C",
    explanation: "The rule needs to be clarified before implementation because retry timing and duplicate prevention are still undefined.",
    rationale: "Tests lead-level requirement clarification."
  }),
  choiceQuestion({
    id: "rpa_runtime_lead_q42",
    category: "Code Review",
    tier: "hard",
    format: "single_select",
    prompt: "What is the most dangerous combination of flaws in this automation code?",
    logSnippet:
      "for claim in claims:\n    try:\n        driver.find_element(By.ID, \"search\").send_keys(claim[\"id\"])\n        driver.find_element(By.ID, \"submit\").click()\n        time.sleep(5)\n        logger.info(\"done\")\n    except Exception:\n        pass",
    options: [
      "The loop is too short and the logger message is too small",
      "Broad exception swallowing, fixed sleep, and no transaction-level evidence make failures invisible and unsafe to recover",
      "Selenium should not be used inside loops",
      "send_keys should be replaced with JavaScript"
    ],
    correctAnswer: "B",
    explanation: "The code hides failures, guesses with sleeps, and records no usable recovery evidence.",
    rationale: "Tests code-review judgment for automation safety."
  })
];

export function buildRpaRuntimeQuestions(level: RpaRuntimeLevel): Question[] {
  return [...rpaRuntimeBaseQuestions, ...(level === "Lead" ? leadQuestions : seniorQuestions)];
}

export function normalizeRpaRuntimeLevel(value: unknown): RpaRuntimeLevel {
  return String(value || "").toLowerCase() === "lead" ? "Lead" : "Senior";
}
