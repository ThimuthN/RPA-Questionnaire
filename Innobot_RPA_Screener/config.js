window.ASSESSMENT_CONFIG = {
  appVersion: "1.3.0",
  timeLimitSeconds: 1800,
  questionsPerAttempt: 12,
  passPercent: 70,
  blueprintCounts: {
    exception_handling: 8,
    retry_boundaries: 6,
    idempotency_rerun: 4,
    logging_observability: 4,
    scalability_rate_limits: 3
  },
  minLogAnalysisInLogging: 2,
  scoringPointsByType: {
    single_choice: 1,
    log_analysis_single_choice: 1,
    multi_select: 2,
    ordering: 2
  },
  showAttentionMetricsOnResults: true,
  practiceModeEnabled: true,
  localStorageKey: "innobot_rpa_screener_state_v1"
};

window.ASSESSMENT_CONFIG_V2 = {
  schemaVersion: "2.2.0",
  questionBankVersion: "2.7.0",
  localStorageKey: "innobot_rpa_screener_state_v2_2",
  practiceModeEnabled: true,
  showAttentionMetricsOnResults: true,
  candidateModeDefault: false,
  candidateModeFromToken: true,
  inviteTokenParam: "token",
  candidateProfile: {
    enabled: true,
    requireName: true,
    requireEmail: true,
    requirePhone: false
  },
  resultSubmission: {
    enabled: false,
    endpoint: "",
    timeoutMs: 10000,
    includePerQuestion: true,
    noCors: false,
    headers: {}
  },
  inviteValidation: {
    enabled: false,
    endpoint: "",
    timeoutMs: 10000,
    requiredInCandidateMode: false,
    passCandidateProfile: true
  },
  practicalSection: {
    enabled: true,
    scoring_model: "assertion_v2",
    title: "Practical Scenario (Structured Role Task)",
    instructions: "Respond using clear section headings. Keep it practical and production-safe.",
    prompt: "Role track practical will appear here.",
    time_limit_minutes: 20,
    weight_percent: 30,
    minimum_words: 160,
    structured_tasks: {
      enabled: false
    },
    rubric: [
      {
        id: "structured_response",
        label: "Structured response quality",
        max_points: 5,
        must_include: ["section", "plan"],
        should_include: ["risk", "metric", "rollback"],
        must_avoid: ["ignore error", "manual only"]
      },
      {
        id: "technical_depth",
        label: "Technical depth and realism",
        max_points: 5,
        must_include: ["root cause", "control"],
        should_include: ["queue", "retry", "monitoring"],
        must_avoid: ["guess", "maybe"]
      }
    ],
    packs: [
      {
        id: "core_role_practical",
        audience: "core",
        stack: "General",
        title: "Core Role Practical: Incident-to-Stability Design Brief",
        instructions: "Write one structured practical response with these exact headings: Failure Map, Target Workflow, Guardrails & Observability, Rollout Plan. Focus on a realistic implementation your team can execute next sprint.",
        prompts: [
          "Scenario: A production bot processes customer refund requests from email into ERP. Since last week, 14% of transactions fail due to intermittent API schema drift and timeout spikes. During retries, a few requests are duplicated, creating financial risk and rework pressure. SLA is 4 hours and operations needs a same-week fix. Task: Propose the production-safe design and rollout approach using the required headings."
        ],
        time_limit_minutes: 20,
        minimum_words: 170,
        weight_percent: 30,
        rubric: [
          { id: "core_structure", label: "Structured completion", max_points: 6, must_include: ["failure map", "target workflow", "guardrails", "rollout plan"], should_include: ["section", "step"], must_avoid: ["single paragraph"] },
          { id: "core_diagnosis", label: "Root-cause and failure analysis", max_points: 6, must_include: ["schema", "timeout"], should_include: ["root cause", "classification", "duplicate"], must_avoid: ["blame user"] },
          { id: "core_resilience", label: "Resilience and data safety", max_points: 6, must_include: ["retry", "idempotent"], should_include: ["dedupe key", "dead letter", "validation"], must_avoid: ["infinite retry", "ignore error"] },
          { id: "core_operations", label: "Observability and rollout realism", max_points: 6, must_include: ["monitor", "rollback"], should_include: ["alert", "kpi", "uat", "runbook"], must_avoid: ["direct prod", "no testing"] }
        ]
      },
      {
        id: "senior_lead_practical",
        audience: "senior_lead",
        stack: "General",
        title: "Senior/Lead Practical: Platform Reliability and Governance Charter",
        instructions: "Write one structured practical response with these exact headings: Operating Model, Reference Architecture, Governance & Risk, 90-Day Execution Plan. Treat this as a real proposal to engineering leadership.",
        prompts: [
          "Scenario: Your automation estate will grow from 9 to 40+ bots in 2 quarters across Finance, HR, and Operations. Current pain points: recurring queue backlogs, inconsistent exception taxonomy, weak ownership of incident response, and release risk due to ad-hoc deployment. Leadership wants a plan that improves reliability without slowing delivery. Task: Produce a practical blueprint using the required headings."
        ],
        time_limit_minutes: 20,
        minimum_words: 220,
        weight_percent: 30,
        rubric: [
          { id: "sl_structure", label: "Structured executive-quality response", max_points: 8, must_include: ["operating model", "reference architecture", "governance", "90-day"], should_include: ["owner", "decision"], must_avoid: ["single paragraph"] },
          { id: "sl_architecture", label: "Architecture depth and platform standards", max_points: 8, must_include: ["orchestrator", "queue"], should_include: ["reusable component", "idempotent", "slo"], must_avoid: ["tool-specific only"] },
          { id: "sl_governance", label: "Governance and risk controls", max_points: 8, must_include: ["risk", "security"], should_include: ["access", "audit", "change control", "compliance"], must_avoid: ["no ownership"] },
          { id: "sl_execution", label: "Execution realism and leadership signal", max_points: 8, must_include: ["roadmap", "kpi"], should_include: ["incident", "runbook", "cadence", "rollback"], must_avoid: ["boil the ocean"] }
        ]
      }
    ]
  },
  leakControl: {
    hideCorrectAnswersInCandidateMode: true,
    hideExplanationsInCandidateMode: true
  },
  timedWarnings: {
    enabled: true,
    warningSeconds: 300,
    criticalSeconds: 60
  },
  recruiterView: {
    enabled: false,
    modeParamValue: "recruiter",
    keyParam: "rk",
    accessKey: "",
    storageKey: "innobot_rpa_screener_reports_v1"
  },
  borderlineReviewBandPercent: 10,
  stackSelectionRequired: true,
  allowAdminOverride: false,
  defaultRoleId: "Associate",
  canonicalRoleOrder: ["Intern", "Associate", "SE", "SeniorSE", "TechLead"],
  stacks: ["UiPath", "AutomationAnywhere", "Python", "PowerAutomate"],
  stackLabels: {
    UiPath: "UiPath",
    AutomationAnywhere: "Automation Anywhere (AA)",
    Python: "Python",
    PowerAutomate: "Power Automate"
  },
  stackCategoryMap: {
    UiPath: "UiPath Specific",
    AutomationAnywhere: "Automation Anywhere Specific",
    Python: "Python Automation",
    PowerAutomate: "Power Automate Specific"
  },
  validCategories: [
    "Core RPA Concepts",
    "Workflow Design",
    "Data Handling & Validation",
    "UI Automation Reliability (Selectors/Waits)",
    "Exception Handling & Retries",
    "Debugging & Logs",
    "Queues / Work Items",
    "Performance & Stability",
    "Deployment & Configuration",
    "UiPath Specific",
    "Automation Anywhere Specific",
    "Python Automation",
    "Power Automate Specific",
    "Framework & Maintainability (Senior+)",
    "Architecture & Design (Senior+)",
    "Operations & Monitoring (Senior+)",
    "Governance & Security (Lead-only)",
    "CI/CD & Release Strategy (Lead-only or Senior+)"
  ],
  validFormats: [
    "single_choice",
    "multi_select",
    "ordering",
    "log_analysis_single_choice",
    "match_pairs",
    "best_next_step",
    "trace_execution",
    "fill_in_blank_constrained",
    "case_triage"
  ],
  validScoringMethods: [
    "all_or_nothing",
    "partial_with_penalty",
    "partial_position",
    "partial_pairs_with_penalty",
    "partial_by_blank"
  ],
  minPerStackRules: [
    { maxQuestions: 20, min: 3 },
    { maxQuestions: 35, min: 5 },
    { maxQuestions: 9999, min: 7 }
  ],
  roles: {
    Intern: {
      label: "Intern",
      time_limit_minutes: 30,
      question_count: 12,
      log_analysis_minimum: 1,
      pass_percentage: 55,
      general_minimum: 10,
      stack_minimum: 2,
      senior_only_minimum: 0,
      lead_only_minimum: 0,
      format_targets: {
        single_or_best_next_step: 4,
        log_analysis_single_choice: 1,
        multi_select: 2,
        ordering: 1,
        match_pairs: 1,
        trace_execution: 1,
        fill_in_blank_constrained: 1,
        case_triage: 1
      },
      difficulty_targets: { 2: 12 }
    },
    Associate: {
      label: "Associate",
      time_limit_minutes: 30,
      question_count: 12,
      log_analysis_minimum: 1,
      pass_percentage: 60,
      general_minimum: 10,
      stack_minimum: 2,
      senior_only_minimum: 0,
      lead_only_minimum: 0,
      format_targets: {
        single_or_best_next_step: 4,
        log_analysis_single_choice: 1,
        multi_select: 2,
        ordering: 1,
        match_pairs: 1,
        trace_execution: 1,
        fill_in_blank_constrained: 1,
        case_triage: 1
      },
      difficulty_targets: { 3: 12 }
    },
    SE: {
      label: "Software Engineer (SE)",
      time_limit_minutes: 30,
      question_count: 12,
      pass_percentage: 66,
      log_analysis_minimum: 1,
      general_minimum: 10,
      stack_minimum: 2,
      senior_only_minimum: 0,
      lead_only_minimum: 0,
      format_targets: {
        single_or_best_next_step: 4,
        log_analysis_single_choice: 1,
        multi_select: 2,
        ordering: 1,
        match_pairs: 1,
        trace_execution: 1,
        fill_in_blank_constrained: 1,
        case_triage: 1
      },
      difficulty_targets: { 3: 12 }
    },
    SeniorSE: {
      label: "Senior Software Engineer",
      time_limit_minutes: 30,
      question_count: 12,
      pass_percentage: 72,
      log_analysis_minimum: 2,
      general_minimum: 10,
      stack_minimum: 2,
      senior_only_minimum: 0,
      lead_only_minimum: 0,
      format_targets: {
        single_or_best_next_step: 3,
        log_analysis_single_choice: 2,
        multi_select: 2,
        ordering: 1,
        match_pairs: 1,
        trace_execution: 1,
        fill_in_blank_constrained: 1,
        case_triage: 1
      },
      difficulty_targets: { 4: 12 }
    },
    TechLead: {
      label: "Tech Lead",
      time_limit_minutes: 30,
      question_count: 12,
      pass_percentage: 78,
      log_analysis_minimum: 2,
      general_minimum: 10,
      stack_minimum: 2,
      senior_only_minimum: 0,
      lead_only_minimum: 0,
      format_targets: {
        single_or_best_next_step: 3,
        log_analysis_single_choice: 2,
        multi_select: 2,
        ordering: 1,
        match_pairs: 1,
        trace_execution: 1,
        fill_in_blank_constrained: 1,
        case_triage: 1
      },
      difficulty_targets: { 4: 12 }
    }
  }
};
