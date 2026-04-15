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
    category: "Dependency Load Control",
    tier: "hard",
    format: "log_analysis_single_select",
    prompt: "A dependency is slow, queue depth is rising, and retries are stacking up. What is the best immediate control?",
    logSnippet:
      "Latency rising\nQueue depth increasing\nRetries rising\nNo hard outage declared",
    options: [
      "Add more workers so the queue clears faster",
      "Keep retries unchanged because the dependency is still responding",
      "Slow or gate retries so the bot does not amplify load while the dependency is degraded",
      "Mark timed-out items successful and reconcile them later"
    ],
    correctAnswer: "C",
    explanation: "When a dependency is degraded, the bot should avoid turning retry pressure into even more load.",
    rationale: "Tests runtime control during dependency slowdown."
  }),
  choiceQuestion({
    id: "rpa_runtime_base_q8",
    category: "Input Quality Control",
    tier: "hard",
    format: "log_analysis_single_select",
    prompt: "A source file has valid headers, but its row count is far below normal and totals do not match the upstream summary. What should the bot do?",
    logSnippet:
      "Headers valid\nRow count 40% below normal\nControl total mismatch\nFile not locked",
    options: [
      "Process the file because the structure is valid",
      "Wait ten minutes and process it if the file is unchanged",
      "Raise a data-quality exception and stop automated posting for that file",
      "Process only rows that pass local validation"
    ],
    correctAnswer: "C",
    explanation: "A structurally valid file can still be unsafe when counts and control totals disagree with the expected business handoff.",
    rationale: "Tests handling of malformed-but-parseable input."
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
    category: "Input Exception Handling",
    tier: "hard",
    prompt:
      "A bot receives a file with valid columns, but totals do not match the control report. Arrange the strongest handling steps in order.",
    items: [
      "Prevent the bot from posting items from that file",
      "Capture counts, totals, and file details as evidence",
      "Route the file through the agreed exception path",
      "Resume only after corrected input is confirmed"
    ],
    correctOrder: [0, 1, 2, 3],
    explanation: "The bot should stop harm first, record evidence, route the issue properly, and only resume after corrected input is confirmed.",
    rationale: "Tests sequencing for input anomalies."
  })
];

const seniorQuestions: Question[] = [
  choiceQuestion({
    id: "rpa_runtime_senior_q2",
    category: "Duplicate Prevention",
    tier: "mediumHard",
    format: "single_select",
    prompt:
      "Invoice duplicates are rare but expensive. Which control gives the strongest protection?",
    options: [
      "Retry only once before stopping the item",
      "Add a fixed delay before each submit",
      "Check a business-unique identifier before posting and log the same value for recovery",
      "Run a daily duplicate report and reverse anything extra"
    ],
    correctAnswer: "C",
    explanation: "The safest direct control is to prevent replay against the same business transaction in the first place.",
    rationale: "Tests duplicate-prevention design."
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
      "A button is present and enabled, but a sliding panel sometimes passes over it during load. What is the best fix?",
    options: [
      "Retry the click three times",
      "Add a fixed delay before the step",
      "Use JavaScript click for this page",
      "Wait for both the blocker to disappear and the target to become interactable"
    ],
    correctAnswer: "D",
    explanation: "The real requirement is not just element presence; it is a state where the blocker is gone and the action is truly safe to perform.",
    rationale: "Tests blocker-aware click readiness."
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
      "A claims grid can show both an original claim and an adjustment with the same claim number. What locator strategy is best?",
    options: [
      "Use the first row with that claim number",
      "Sort by date and use the top matching row",
      "Match the claim number and a second business field that uniquely identifies the target row",
      "Use screen position because the adjustment row is usually lower"
    ],
    correctAnswer: "C",
    explanation: "When one business value is not unique enough, the locator needs another stable business clue to separate similar rows.",
    rationale: "Tests robust grid targeting."
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
    category: "Automation Environment",
    tier: "mediumHard",
    format: "single_select",
    prompt:
      "A Selenium flow passes locally but fails in CI because the app opens in a mobile-style layout and hides the target action in another menu. What is the best correction?",
    options: [
      "Add more waits around the hidden action",
      "Set a deterministic viewport and target the intended layout explicitly",
      "Retry after page refresh in case the menu appears",
      "Run headed only so the CI browser behaves more like local"
    ],
    correctAnswer: "B",
    explanation: "The more reliable fix is to remove layout drift between environments instead of treating it as a timing issue.",
    rationale: "Tests environment consistency for browser automation."
  }),
  choiceQuestion({
    id: "rpa_runtime_senior_q22",
    category: "Browser Automation",
    tier: "mediumHard",
    format: "single_select",
    prompt:
      "A target control sits inside a frame, but the frame name changes between releases. What is the best approach?",
    options: [
      "Hardcode the current frame name and update it when needed",
      "Try frames by index until the click works",
      "Identify the correct frame using stable page context, then switch into it before locating the control",
      "Replace the step with image automation so frame context no longer matters"
    ],
    correctAnswer: "C",
    explanation: "The bot still needs the correct frame context, but the route to that frame should depend on stable cues instead of brittle names.",
    rationale: "Tests frame handling under release drift."
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
    prompt: "Before retrying a timed-out transaction, what must the bot do?",
    logSnippet: "try:\n    send_invoice(row)\nexcept TimeoutError:\n    retry_if_needed(row)",
    options: [
      "Sleep longer so the dependency has time to recover",
      "Check whether the first attempt may already have completed using business or system evidence",
      "Lower the retry count so duplicates become less likely",
      "Restart the session before any replay"
    ],
    correctAnswer: "B",
    explanation: "A timeout does not prove failure, so replay should start with evidence about the first attempt, not just another call.",
    rationale: "Tests safe recovery in Python automation."
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
    prompt: "A batch bot logs every failure as just 'failed' and keeps moving. What is the biggest design weakness?",
    logSnippet:
      "for claim in claims:\n    try:\n        submit_claim(claim)\n    except Exception:\n        logger.error(\"failed\")\n        continue",
    options: [
      "It should log at WARN instead of ERROR for item-level issues",
      "Item-level try/except should never be used in batch automations",
      "It does not classify failures into retryable, business-exception, and terminal handling paths",
      "The batch should be parallelized so failed items do not slow the run"
    ],
    correctAnswer: "C",
    explanation: "Good batch handling depends on different failure types taking different paths instead of collapsing everything into one generic outcome.",
    rationale: "Tests failure classification in batch bots."
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
      "Shared browser logic now exists across multiple automations, but some flows still have client-specific rules. What is the best design decision?",
    options: [
      "Move every browser action into one shared layer immediately so the team has one standard",
      "Keep everything local because shared layers create too much coupling",
      "Extract only the clearly repeated browser behavior and leave client-specific logic local",
      "Delay any refactor until another incident proves the need"
    ],
    correctAnswer: "C",
    explanation: "The best shared layer is small, intentional, and limited to behavior that is truly reused.",
    rationale: "Tests practical reuse boundaries."
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
      "Finance wants ambiguous portal submits auto-replayed to reduce backlog. Support wants every ambiguous item routed manually. What is the best lead decision?",
    options: [
      "Route every ambiguous item manually because duplication is always the bigger risk",
      "Auto-replay every ambiguous item after a fixed delay so backlog stays under control",
      "Use evidence-based replay rules for low-risk verifiable cases and manual handling for the rest",
      "Let each support shift decide based on the queue pressure that day"
    ],
    correctAnswer: "C",
    explanation: "The strongest policy is neither fully automatic nor fully manual; it depends on what can actually be verified safely.",
    rationale: "Tests policy design for ambiguous recovery."
  }),
  choiceQuestion({
    id: "rpa_runtime_lead_q32",
    category: "Recovery Governance",
    tier: "hard",
    format: "single_select",
    prompt: "A team wants a production replay tool for failed items. What guardrail matters most before approval?",
    options: [
      "Only senior support users may open the tool",
      "The tool must require proof of current external state before replay",
      "The tool must run only outside business hours",
      "The tool must take a screenshot before each replay"
    ],
    correctAnswer: "B",
    explanation: "Access control helps, but the most important guardrail is forcing the replay decision to rely on actual current-state evidence.",
    rationale: "Tests safe replay governance."
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
  choiceQuestion({
    id: "rpa_runtime_lead_q39",
    category: "Root Cause Analysis",
    tier: "hard",
    format: "single_select",
    prompt:
      "An incident shows item overlap across run IDs, success marked before downstream confirmation, and too little evidence to decide whether replay is safe. What is the strongest conclusion?",
    options: [
      "The main issue was poor logging only",
      "The dependency outage was the true root cause of everything else",
      "The design failed across concurrency control, commit boundary, and recovery evidence",
      "The retry count was simply too high"
    ],
    correctAnswer: "C",
    explanation: "This is not one isolated bug; multiple safety boundaries failed at the same time.",
    rationale: "Tests system-level root-cause judgment."
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
      "A stakeholder says, 'If pending takes too long, just resubmit.' What most needs clarification before build approval?",
    options: [
      "Who should receive the daily pending-age report",
      "The exact threshold, replay rule, exception path, and decision owner",
      "Whether the bot should log pending items at INFO or WARN",
      "Whether the queue should show amber or red while items are pending"
    ],
    correctAnswer: "B",
    explanation: "The missing problem is not monitoring polish; it is the business rule that determines when replay is allowed at all.",
    rationale: "Tests requirement clarification for risky automation."
  }),
  choiceQuestion({
    id: "rpa_runtime_lead_q42",
    category: "Code Review",
    tier: "hard",
    format: "single_select",
    prompt: "Which flaw is most dangerous from a production-risk perspective?",
    logSnippet:
      "for claim in claims:\n    try:\n        driver.find_element(By.ID, \"search\").send_keys(claim[\"id\"])\n        driver.find_element(By.ID, \"submit\").click()\n        time.sleep(5)\n        logger.info(\"done\")\n    except Exception:\n        pass",
    options: [
      "Fixed sleeps, because they make the browser flow flaky",
      "Missing transaction correlation, because support will search logs less efficiently",
      "Writing success before downstream confirmation, because it can permanently misstate business completion",
      "Broad exception swallowing, because developers will miss errors during debugging"
    ],
    correctAnswer: "C",
    explanation: "Flaky waits and weak logs matter, but false success is the error that most directly corrupts business truth and makes recovery unsafe.",
    rationale: "Tests production-risk prioritization in code review."
  })
];

export function buildRpaRuntimeQuestions(level: RpaRuntimeLevel): Question[] {
  return [...rpaRuntimeBaseQuestions, ...(level === "Lead" ? leadQuestions : seniorQuestions)];
}

export function normalizeRpaRuntimeLevel(value: unknown): RpaRuntimeLevel {
  return String(value || "").toLowerCase() === "lead" ? "Lead" : "Senior";
}
