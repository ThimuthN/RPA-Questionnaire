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
      "Retry with exponential backoff and a strict max-attempt limit",
      "Retry only after reconciling whether the business action already completed by transaction key",
      "Treat every timeout as a business exception and wait for manual confirmation",
      "Retry after a fixed delay if the upstream availability probe turns green"
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
      "The retry policy is running before the process proves whether the first side effect already committed",
      "The timeout threshold is too aggressive and is causing harmless duplicate submissions",
      "The ledger check is likely reading from an eventually consistent replica so the replay is unavoidable",
      "The first attempt should have been ignored because timeouts cannot be trusted as accepted requests"
    ],
    correctAnswer: ["A"],
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
      "Repost the shipment because internal completion state was never written",
      "Reconcile the carrier state, persist the recovery evidence, and then mark the item successful",
      "Mark the item retryable and let the platform attempt it again from the start",
      "Route the item to manual review because any crash makes the transaction ambiguous"
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
    choices: ["session", "correlation", "sequence", "browser"],
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
      "Increase worker count but reduce retry attempts so the backlog clears sooner",
      "Shape throughput with bounded concurrency, backoff, and queue pacing to match dependency capacity",
      "Pause all retries until the backlog is gone, then replay the failed items in one batch",
      "Move throttled items straight to business exception to protect the queue database"
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
      "The queue may show a completed transaction even though the real business side effect never committed",
      "The queue throughput becomes artificially limited by downstream confirmation latency",
      "The platform can no longer attach technical logs to the item after success",
      "The process loses the ability to classify failures as business exceptions"
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
      "Retry the malformed items with a longer delay so the downstream schema has time to stabilize",
      "Route the poisoned items to a dead-letter path, capture the failure reason, and keep the healthy flow moving",
      "Pause the queue and require a full data cleanse before any additional healthy items run",
      "Skip the items after three failures and monitor whether business users raise them manually"
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
      "The logging model lacks end-to-end correlation, so support cannot connect symptoms into one causal chain",
      "The worker restart policy is the main issue because it obscures whether app latency matters",
      "The queue backlog is expected and the real problem is short-term log retention",
      "The app latency spike is likely secondary because queue depth rose first"
    ],
    correctAnswer: ["A"],
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
      "Adding targeted delays around the most unstable dependency calls",
      "Replacing blind retries with explicit state checks, reconciliation, and commit boundaries",
      "Lowering warning log volume so real failures stand out more clearly",
      "Provisioning larger runners so intermittent latency no longer triggers timeouts"
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
        "Add a post-scroll wait and retry the same selector once the grid settles",
        "Target rows by stable business data or extracted row identity instead of visual position",
        "Capture the row by screen coordinates before each scroll and reapply the click",
        "Switch the final click to image automation while keeping positional row targeting"
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
        "Move the success mark to after the ERP post is confirmed and recovery state is written",
        "Keep the success mark early but add a compensating queue item when ERP posting fails",
        "Increase robot memory allocation so the ERP client is less likely to crash",
        "Keep the current success timing and retry the ERP post separately if it fails"
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
        "Increase file retry count so transient file locks resolve naturally",
        "Give each runner a unique working directory and publish final output atomically",
        "Serialize the final write step but keep shared intermediate files",
        "Ask operations to archive the shared folder before each batch window"
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
        "Hardcode the new password in the bot temporarily so both runners can proceed",
        "Check vault access, package version, and runner config parity before rerun",
        "Promote the package again so both runners definitely use the same runtime history",
        "Delete the failed run history and reschedule all affected jobs on Runner A only"
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
        "Catch all exceptions and continue only if the record can be retried safely without audit loss",
        "Reconcile destination state before replaying uncertain records",
        "Handle throttling, validation, and timeout failures with the same recovery path"
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
        "Retry parsing until the JSON loads successfully twice in a row",
        "Check for a reliable completion signal or atomic handoff before processing the file",
        "Ignore the final block if parsing fails and let downstream validation catch partial records",
        "Poll file size changes for a few seconds and assume the write is complete if growth stops"
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
        "Add a delay after every row update so the next trigger sees the final state",
        "Use trigger conditions or state flags so self-generated updates do not re-enter the same path",
        "Split the flow into two flows so each one owns half of the state transition",
        "Disable retries on the flow so duplicates do not repeat after transient errors"
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
        "Increase trigger concurrency so older approvals clear before they overlap again",
        "Use bounded retry/backoff and reduce concurrency to match connector capacity",
        "Turn off run history during the incident to reduce connector overhead",
        "Allow duplicate approvals temporarily and rely on users to reject extras"
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
