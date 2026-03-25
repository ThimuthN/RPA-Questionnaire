import type { Question, StackId } from "@/lib/assessment-engine/types";

const core2BaseQuestions: Question[] = [
  {
    id: "core2_q1",
    roleLevelMin: "SE",
    roleLevelMax: null,
    techStack: "General",
    category: "Architecture & Design (Senior+)",
    difficulty: 4,
    format: "single_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "An API call sometimes times out after the external system has already accepted the request. What is the safest retry design?",
    options: [
      "Retry immediately until a 200 response is returned",
      "Retry only after checking whether the business action already completed",
      "Disable retries for all timeout cases",
      "Add a fixed 30-second sleep before each retry"
    ],
    correctAnswer: ["B"],
    explanation: "The design has to reconcile prior side effects before replaying.",
    rationale: "Tests idempotency and duplicate-prevention thinking."
  } as Question,
  {
    id: "core2_q2",
    roleLevelMin: "SE",
    roleLevelMax: null,
    techStack: "General",
    category: "Debugging & Logs",
    difficulty: 4,
    format: "log_analysis_single_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "What is the most likely root issue?",
    logSnippet: "Txn\tAttempt\tAPI\tLedger check\tOutcome\nINV-441\t1\tTimeout after request sent\tNot checked\tRetry queued\nINV-441\t2\t201 Created\tRecord from attempt 1 exists\tPosted again",
    options: [
      "The timeout was harmless because attempt 2 succeeded",
      "Duplicate prevention is missing because replay happened before reconciliation",
      "The ERP credentials rotated during processing",
      "The logger failed to persist the first attempt"
    ],
    correctAnswer: ["B"],
    explanation: "The retry path should have verified prior completion before reposting.",
    rationale: "Tests incident diagnosis from noisy logs."
  } as Question,
  {
    id: "core2_q3",
    roleLevelMin: "SE",
    roleLevelMax: null,
    techStack: "General",
    category: "Framework & Maintainability (Senior+)",
    difficulty: 4,
    format: "multi_select",
    points: 1,
    scoringMethod: "partial_with_penalty",
    prompt: "Which controls are strong signs that a transaction process is replay-safe? Select all that apply.",
    options: [
      "Each item has a durable business key or idempotency key",
      "Checkpoint state is persisted outside process memory",
      "Recovery depends mainly on a fixed sleep before retry",
      "The process can verify whether a prior side effect already completed",
      "Failures are classified so retries differ from business exceptions"
    ],
    correctAnswer: ["A", "B", "D", "E"],
    explanation: "Replay safety comes from durable state, identity, reconciliation, and controlled failure handling.",
    rationale: "Tests mature automation reliability controls."
  } as Question,
  {
    id: "core2_q4",
    roleLevelMin: "SE",
    roleLevelMax: null,
    techStack: "General",
    category: "Architecture & Design (Senior+)",
    difficulty: 4,
    format: "matching",
    points: 1,
    scoringMethod: "partial_pairs_with_penalty",
    prompt: "Match the engineering pattern to its primary purpose.",
    leftItems: [
      "Outbox pattern",
      "Dead-letter queue",
      "Circuit breaker",
      "Checkpoint state"
    ],
    rightItems: [
      "Persist messages safely for later delivery",
      "Isolate poisoned items for review",
      "Stop hammering an unhealthy dependency",
      "Resume safely from a known progress boundary"
    ],
    correctPairs: {
      "Outbox pattern": "Persist messages safely for later delivery",
      "Dead-letter queue": "Isolate poisoned items for review",
      "Circuit breaker": "Stop hammering an unhealthy dependency",
      "Checkpoint state": "Resume safely from a known progress boundary"
    },
    explanation: "These patterns address different failure modes and should not be conflated.",
    rationale: "Tests architecture literacy with operational meaning."
  } as Question,
  {
    id: "core2_q5",
    roleLevelMin: "SE",
    roleLevelMax: null,
    techStack: "General",
    category: "CI/CD & Release Strategy (Lead-only or Senior+)",
    difficulty: 4,
    format: "ordering",
    points: 1,
    scoringMethod: "partial_position",
    prompt: "Arrange these steps for a safe production hotfix.",
    items: [
      "Reproduce and confirm the failure mode",
      "Implement the fix and add a focused regression check",
      "Deploy to a limited target first",
      "Monitor production behavior and failure signals",
      "Expand rollout after stability is confirmed"
    ],
    correctOrder: [0, 1, 2, 3, 4],
    explanation: "Hotfixes should validate, fix, pilot, observe, then broaden.",
    rationale: "Tests release discipline under pressure."
  } as Question,
  {
    id: "core2_q6",
    roleLevelMin: "SE",
    roleLevelMax: null,
    techStack: "General",
    category: "Queues / Work Items",
    difficulty: 4,
    format: "trace_execution",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "A worker posts a shipment request, crashes before marking the queue item complete, then on restart finds the carrier reference already exists. What is the safest completion path?",
    options: [
      "Repost the shipment because the worker crashed",
      "Mark the item successful after reconciling the existing carrier state",
      "Mark the item failed because the run was interrupted",
      "Skip the item and let operations resolve it manually"
    ],
    correctAnswer: ["B"],
    explanation: "Recovery should reconcile external state and avoid duplicate side effects.",
    rationale: "Tests crash recovery behavior."
  } as Question,
  {
    id: "core2_q7",
    roleLevelMin: "SE",
    roleLevelMax: null,
    techStack: "General",
    category: "Operations & Monitoring (Senior+)",
    difficulty: 4,
    format: "fill_blank_constrained",
    points: 1,
    scoringMethod: "partial_by_blank",
    prompt: "To trace one transaction across bot, queue, and API logs, emit the same ____ ID at every step.",
    blank: "Select the missing word.",
    choices: ["browser", "correlation", "delay", "temporary"],
    acceptedAnswers: ["correlation", "correlation id"],
    explanation: "A shared correlation ID is the backbone of cross-system tracing.",
    rationale: "Tests observability maturity."
  } as Question,
  {
    id: "core2_q8",
    roleLevelMin: "SE",
    roleLevelMax: null,
    techStack: "General",
    category: "Performance & Stability",
    difficulty: 4,
    format: "case_triage",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "Backlog catch-up floods a dependency, 429 errors spike, and retries make both queue depth and database load worse. What is the best next step?",
    options: [
      "Increase parallel workers so the queue drains faster",
      "Shape throughput with bounded concurrency and backoff to match dependency capacity",
      "Disable retry limits because the backlog is urgent",
      "Move all failing items to business exception immediately"
    ],
    correctAnswer: ["B"],
    explanation: "Throughput has to be limited to dependency capacity or retries amplify congestion.",
    rationale: "Tests stability control under real load."
  } as Question,
  {
    id: "core2_q9",
    roleLevelMin: "SE",
    roleLevelMax: null,
    techStack: "General",
    category: "Queues / Work Items",
    difficulty: 4,
    format: "single_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "A performer marks a queue item successful before the external business action is confirmed. What is the main problem?",
    options: [
      "The queue item may appear complete even though the business side effect never happened",
      "The queue will process slightly more slowly",
      "The dashboard percentages may round differently",
      "The item can no longer be retried automatically by the platform"
    ],
    correctAnswer: ["A"],
    explanation: "Success should be recorded only at the real business commit point.",
    rationale: "Tests commit-boundary reasoning."
  } as Question,
  {
    id: "core2_q10",
    roleLevelMin: "SE",
    roleLevelMax: null,
    techStack: "General",
    category: "Performance & Stability",
    difficulty: 4,
    format: "multi_select",
    points: 1,
    scoringMethod: "partial_with_penalty",
    prompt: "Which controls reduce corruption when multiple runners work in parallel? Select all that apply.",
    options: [
      "Use unique run-scoped working directories",
      "Write final output atomically after validation",
      "Share one intermediate temp file across all runners",
      "Use durable item IDs so retries target the same unit of work",
      "Rely on a fixed 10-second delay before every write"
    ],
    correctAnswer: ["A", "B", "D"],
    explanation: "Parallel correctness depends on isolation, identity, and controlled publish behavior.",
    rationale: "Tests concurrency-safe design."
  } as Question,
  {
    id: "core2_q11",
    roleLevelMin: "SE",
    roleLevelMax: null,
    techStack: "General",
    category: "Operations & Monitoring (Senior+)",
    difficulty: 4,
    format: "best_next_step",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "A few items always fail with the same malformed payload while healthy items continue. What is the best handling strategy?",
    options: [
      "Retry the items indefinitely until the downstream service accepts them",
      "Route the poisoned items to a dead-letter path and keep the healthy flow moving",
      "Stop the entire queue until every malformed item is fixed",
      "Drop the items silently so the queue stays green"
    ],
    correctAnswer: ["B"],
    explanation: "Poisoned items should be isolated for review rather than blocking or corrupting the main flow.",
    rationale: "Tests dead-letter handling."
  } as Question,
  {
    id: "core2_q12",
    roleLevelMin: "SE",
    roleLevelMax: null,
    techStack: "General",
    category: "Debugging & Logs",
    difficulty: 4,
    format: "log_analysis_single_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "What is the strongest conclusion from these incident notes?",
    logSnippet: "11:00 Queue depth rising\n11:02 App latency 6x normal\n11:03 Worker restarts begin\n11:05 Logs from queue, app, and runner cannot be tied to one item\n11:07 Support cannot prove whether retries or restarts are primary",
    options: [
      "The only issue is that log retention is too short",
      "The system lacks end-to-end correlation, so symptoms cannot be connected into one failure chain",
      "The workers should never restart automatically",
      "The app latency spike is definitely unrelated to queue depth"
    ],
    correctAnswer: ["B"],
    explanation: "Without shared correlation, support sees fragments instead of causality.",
    rationale: "Tests operational debugging priorities."
  } as Question,
  {
    id: "core2_q13",
    roleLevelMin: "SE",
    roleLevelMax: null,
    techStack: "General",
    category: "Architecture & Design (Senior+)",
    difficulty: 4,
    format: "case_triage",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "A process updates three systems. The first update succeeds, the second times out, and the worker crashes before writing audit state. What is the best recovery design?",
    options: [
      "Replay the full transaction from the first step every time",
      "Reconcile each side effect by transaction key and continue from the last proven safe boundary",
      "Mark the whole transaction as failed and never retry multi-system items",
      "Ignore the audit state because the business systems are the source of truth"
    ],
    correctAnswer: ["B"],
    explanation: "Multi-system recovery needs per-step reconciliation and known restart boundaries.",
    rationale: "Tests partial-commit recovery design."
  } as Question,
  {
    id: "core2_q14",
    roleLevelMin: "SE",
    roleLevelMax: null,
    techStack: "General",
    category: "Framework & Maintainability (Senior+)",
    difficulty: 4,
    format: "single_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "Which improvement gives the best long-term resilience signal?",
    options: [
      "Adding longer delays around unstable actions",
      "Replacing blind retries with explicit state checks and commit boundaries",
      "Suppressing warning logs to reduce noise",
      "Increasing VM size before understanding the failure mode"
    ],
    correctAnswer: ["B"],
    explanation: "State-aware recovery is more durable than delay-based stabilization.",
    rationale: "Tests preference for correctness over patchwork."
  } as Question
];

const core2StackQuestions: Record<StackId, Question[]> = {
  UiPath: [
    {
      id: "core2_uipath_q1",
      roleLevelMin: "SE",
      roleLevelMax: null,
      techStack: "UiPath",
      category: "UiPath Specific",
      difficulty: 4,
      format: "best_next_step",
      points: 1,
      scoringMethod: "all_or_nothing",
      prompt: "A UiPath bot clicks a virtualized grid row successfully, then after scroll acts on the wrong row because the DOM re-renders. What is the best fix?",
      options: [
        "Add a longer delay before every click",
        "Target rows by stable business data instead of visual position",
        "Retry the same positional selector three times",
        "Replace the workflow with image automation"
      ],
      correctAnswer: ["B"],
      explanation: "Dynamic grids need stable row identity, not positional selectors.",
      rationale: "Tests advanced selector strategy."
    } as Question,
    {
      id: "core2_uipath_q2",
      roleLevelMin: "SE",
      roleLevelMax: null,
      techStack: "UiPath",
      category: "UiPath Specific",
      difficulty: 4,
      format: "single_select",
      points: 1,
      scoringMethod: "all_or_nothing",
      prompt: "A UiPath performer marks a queue item successful, then the ERP crashes before the invoice is actually posted. What should change?",
      options: [
        "Move the success mark to after the ERP post is confirmed",
        "Retry successful items every hour",
        "Increase robot memory allocation",
        "Disable screenshots during the final step"
      ],
      correctAnswer: ["A"],
      explanation: "The queue success should align to the real business commit point.",
      rationale: "Tests UiPath queue discipline."
    } as Question
  ],
  AutomationAnywhere: [
    {
      id: "core2_aa_q1",
      roleLevelMin: "SE",
      roleLevelMax: null,
      techStack: "AutomationAnywhere",
      category: "Automation Anywhere Specific",
      difficulty: 4,
      format: "single_select",
      points: 1,
      scoringMethod: "all_or_nothing",
      prompt: "Two Automation Anywhere runners write intermediate files to one shared folder and overwrite each other. What is the best fix?",
      options: [
        "Increase file retry count",
        "Give each runner a unique working directory and publish final output atomically",
        "Add a fixed 10-second delay before writing files",
        "Ask operations to clear the folder between runs"
      ],
      correctAnswer: ["B"],
      explanation: "Parallel runners need isolated working state and controlled publish behavior.",
      rationale: "Tests concurrency-safe AA design."
    } as Question,
    {
      id: "core2_aa_q2",
      roleLevelMin: "SE",
      roleLevelMax: null,
      techStack: "AutomationAnywhere",
      category: "Automation Anywhere Specific",
      difficulty: 4,
      format: "best_next_step",
      points: 1,
      scoringMethod: "all_or_nothing",
      prompt: "One Automation Anywhere bot works on Runner A but fails on Runner B after a credential rotation. What is the best next step?",
      options: [
        "Hardcode the new password in the bot so both runners can proceed",
        "Check credential vault access, package version, and runner config parity before rerun",
        "Increase the bot timeout until Runner B catches up",
        "Delete the failed run history and reschedule all jobs"
      ],
      correctAnswer: ["B"],
      explanation: "Runner-specific failures after credential change usually point to environment/config parity gaps.",
      rationale: "Tests safe incident triage in AA."
    } as Question
  ],
  Python: [
    {
      id: "core2_python_q1",
      roleLevelMin: "SE",
      roleLevelMax: null,
      techStack: "Python",
      category: "Python Automation",
      difficulty: 4,
      format: "multi_select",
      points: 1,
      scoringMethod: "partial_with_penalty",
      prompt: "Which controls make a Python API-posting batch safer to replay? Select all that apply.",
      options: [
        "Persist per-record state outside process memory",
        "Use an idempotency key or business key on each POST",
        "Catch all exceptions and continue without recording them",
        "Reconcile destination state before replaying uncertain records",
        "Handle throttling, validation, and timeout failures the same way"
      ],
      correctAnswer: ["A", "B", "D"],
      explanation: "Replay safety depends on durable state, identity, and reconciliation, not silent continuation.",
      rationale: "Tests mature Python automation handling."
    } as Question,
    {
      id: "core2_python_q2",
      roleLevelMin: "SE",
      roleLevelMax: null,
      techStack: "Python",
      category: "Python Automation",
      difficulty: 4,
      format: "single_select",
      points: 1,
      scoringMethod: "all_or_nothing",
      prompt: "A batch sometimes reads an input file before the upstream process is finished writing it. What is the best protection?",
      options: [
        "Retry parsing until the JSON loads successfully",
        "Check for a reliable completion signal before processing the file",
        "Ignore the last line if parsing fails",
        "Process the file faster so the race window shrinks"
      ],
      correctAnswer: ["B"],
      explanation: "File readiness should be proven, not guessed from timing.",
      rationale: "Tests file handoff safety."
    } as Question
  ],
  PowerAutomate: [
    {
      id: "core2_pa_q1",
      roleLevelMin: "SE",
      roleLevelMax: null,
      techStack: "PowerAutomate",
      category: "Power Automate Specific",
      difficulty: 4,
      format: "best_next_step",
      points: 1,
      scoringMethod: "all_or_nothing",
      prompt: "A Power Automate flow updates a Dataverse row, which retriggers the same flow and creates duplicate downstream actions. What is the best fix?",
      options: [
        "Add a longer delay after every row update",
        "Use trigger conditions or state flags so self-generated updates do not re-enter the same path",
        "Split the flow into two identical flows",
        "Disable retries on the entire flow"
      ],
      correctAnswer: ["B"],
      explanation: "Self-trigger loops are prevented with explicit trigger guards or state transitions.",
      rationale: "Tests Power Automate re-entry control."
    } as Question,
    {
      id: "core2_pa_q2",
      roleLevelMin: "SE",
      roleLevelMax: null,
      techStack: "PowerAutomate",
      category: "Power Automate Specific",
      difficulty: 4,
      format: "single_select",
      points: 1,
      scoringMethod: "all_or_nothing",
      prompt: "Connector throttling starts returning 429 responses and overlapping runs create duplicated approvals. What is the strongest control?",
      options: [
        "Increase trigger concurrency so items finish sooner",
        "Use bounded retry/backoff and reduce concurrency to match connector capacity",
        "Turn off run history during the incident",
        "Let users manually clean up duplicate approvals afterward"
      ],
      correctAnswer: ["B"],
      explanation: "Retry pressure and concurrency have to be shaped to connector limits.",
      rationale: "Tests resilient Power Automate execution."
    } as Question
  ]
};

export function buildCore2Questions(stacks: StackId[]): Question[] {
  const primaryStack = stacks[0] ?? "UiPath";
  return [...core2BaseQuestions, ...(core2StackQuestions[primaryStack] ?? core2StackQuestions.UiPath)];
}
