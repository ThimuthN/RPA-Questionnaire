import type { Question } from "@/lib/assessment-engine/types";

export const generalCapabilityQuestions: Question[] = [
  {
    id: "gca_q1",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "logical_reasoning",
    difficulty: 3,
    format: "single_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: [
      "All Neralis are Peliks.",
      "Some Torvens are Peliks.",
      "No Peliks are Jorans.",
      "",
      "Which statement must be true?"
    ].join("\n"),
    options: [
      "No Neralis are Jorans",
      "Some Neralis are Peliks",
      "All Torvens are not Jorans",
      "Some Jorans are Torvens"
    ],
    correctAnswer: ["A"],
    explanation: "If all Neralis are Peliks and no Peliks are Jorans, then no Neralis can be Jorans.",
    rationale: "Tests deductive reasoning from linked universal statements."
  },
  {
    id: "gca_q2",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "pattern_recognition",
    difficulty: 2,
    format: "fill_blank_constrained",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "Complete the sequence:\n4, 12, 15, 45, 48, __",
    blank: "Select the missing number.",
    choices: ["132", "141", "144", "156"],
    acceptedAnswers: ["144"],
    explanation: "The pattern alternates x3, +3. So 48 x 3 = 144.",
    rationale: "Checks recognition of a simple alternating number rule."
  },
  {
    id: "gca_q3",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "data_judgment",
    difficulty: 3,
    format: "multi_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: [
      "A team dashboard shows:",
      "- Output volume up 35%",
      "- Average handling time down 20%",
      "- Rework rate up from 4% to 11%",
      "- Customer escalations up 30%",
      "",
      "Which conclusions are justified? Select all that apply."
    ].join("\n"),
    options: [
      "The team may be trading quality for speed",
      "The process clearly improved overall",
      "Rework and escalations suggest a quality issue",
      "Faster handling time alone is enough to declare success",
      "More investigation is needed before calling the change effective"
    ],
    correctAnswer: ["A", "C", "E"],
    explanation: "Speed improved, but the quality indicators worsened, so success cannot be declared yet.",
    rationale: "Measures whether throughput and quality are balanced together."
  },
  {
    id: "gca_q4",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "prioritization_under_pressure",
    difficulty: 3,
    format: "best_next_step",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: [
      "You are 45 minutes from submitting a high-visibility deliverable.",
      "At the same time:",
      "- a client reports a possible billing issue affecting a small number of accounts",
      "- your manager asks for a 2-minute status note for an upcoming leadership meeting",
      "",
      "What is the best immediate next step?"
    ].join("\n"),
    options: [
      "Pause the deliverable and investigate the billing issue in full before doing anything else",
      "Send a brief status note, gather enough information to size the billing risk, and continue the deliverable unless the risk is confirmed as severe",
      "Ignore both until the deliverable is submitted to avoid losing focus",
      "Reply to the manager first, then continue the deliverable and revisit the client issue afterward"
    ],
    correctAnswer: ["B"],
    explanation: "It balances stakeholder communication with fast risk sizing instead of overreacting or ignoring signals.",
    rationale: "Tests calm prioritization under competing time-sensitive demands."
  },
  {
    id: "gca_q5",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "impact_assessment",
    difficulty: 2,
    format: "case_triage",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: [
      "Assign priority levels using:",
      "P1 = immediate business-critical impact",
      "P2 = significant but manageable impact",
      "P3 = limited impact / workaround exists",
      "",
      "Cases:",
      "1. Incorrect invoices being sent to many customers",
      "2. Internal reporting dashboard loads slowly for staff",
      "3. One customer cannot export data, but a manual workaround exists"
    ].join("\n"),
    options: [
      "1=P1, 2=P2, 3=P3",
      "1=P2, 2=P2, 3=P1",
      "1=P1, 2=P3, 3=P2",
      "1=P2, 2=P3, 3=P3"
    ],
    correctAnswer: ["A"],
    explanation: "Widespread billing errors are critical, slow internal reporting is significant, and a workaround keeps the single export issue lower priority.",
    rationale: "Checks triage by impact and workaround availability."
  },
  {
    id: "gca_q6",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "diagnostic_reasoning",
    difficulty: 2,
    format: "log_analysis_single_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "What is the most likely primary issue?",
    logSnippet: [
      "[11:00:01] Request received",
      "[11:00:01] User authenticated",
      "[11:00:02] Billing service request sent",
      "[11:00:32] Billing service timeout",
      "[11:00:33] Retry sent",
      "[11:00:35] Billing service success",
      "[11:00:35] Response returned outside SLA"
    ].join("\n"),
    options: [
      "Authentication instability",
      "Downstream service latency causing response delays",
      "Invalid user request format",
      "UI rendering failure"
    ],
    correctAnswer: ["B"],
    explanation: "The log shows the request eventually succeeds, but a billing timeout pushes the response outside SLA.",
    rationale: "Measures diagnosis from evidence rather than guesswork."
  },
  {
    id: "gca_q7",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "problem_solving_sequence",
    difficulty: 2,
    format: "ordering",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "Put the actions in the strongest order for handling a recurring operational issue.",
    items: [
      "Confirm the issue pattern is real and repeatable",
      "Identify the most likely root cause",
      "Apply the fix",
      "Monitor whether the fix worked",
      "Document or implement prevention steps"
    ],
    correctOrder: [0, 1, 2, 3, 4],
    explanation: "The best sequence is verify, diagnose, fix, confirm, then prevent recurrence.",
    rationale: "Checks structured problem-solving order."
  },
  {
    id: "gca_q8",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "situational_judgment",
    difficulty: 3,
    format: "matching",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "Match each situation to the strongest response.",
    leftItems: [
      "Requirements are incomplete and the stakeholder is unavailable",
      "A task is urgent but no owner is clearly assigned",
      "A dependency is blocking a deadline-critical deliverable",
      "The same problem keeps returning after temporary fixes"
    ],
    rightItems: [
      "Assign explicit ownership immediately",
      "Proceed with defined assumptions and make them visible",
      "Escalate or create an alternate path quickly",
      "Stop patching and investigate root cause"
    ],
    correctPairs: {
      "Requirements are incomplete and the stakeholder is unavailable":
        "Proceed with defined assumptions and make them visible",
      "A task is urgent but no owner is clearly assigned": "Assign explicit ownership immediately",
      "A dependency is blocking a deadline-critical deliverable":
        "Escalate or create an alternate path quickly",
      "The same problem keeps returning after temporary fixes":
        "Stop patching and investigate root cause"
    },
    explanation: "The strongest responses remove ambiguity, create ownership, unblock delivery, and stop repeated patching.",
    rationale: "Tests practical judgment across common delivery situations."
  },
  {
    id: "gca_q9",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "structured_thinking",
    difficulty: 2,
    format: "trace_execution",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: [
      "Start with value = 8",
      "",
      "Step 1: multiply by 2",
      "Step 2: if result is greater than 10, subtract 5",
      "Step 3: divide by 1",
      "Step 4: add 7",
      "",
      "What is the final value?"
    ].join("\n"),
    options: ["13", "18", "23", "24"],
    correctAnswer: ["B"],
    explanation: "8 x 2 = 16, then 16 - 5 = 11, then /1 stays 11, then +7 = 18.",
    rationale: "Checks careful step-by-step execution."
  },
  {
    id: "gca_q10",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "decision_tradeoffs",
    difficulty: 2,
    format: "single_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: [
      "A task can be delivered today with moderate risk of error,",
      "or tomorrow with a high chance of being correct.",
      "",
      "The deadline is somewhat flexible, but client-facing errors would be costly.",
      "",
      "What is the best choice?"
    ].join("\n"),
    options: [
      "Deliver today because speed is usually valued more highly",
      "Deliver tomorrow because the cost of client-facing errors outweighs the modest delay",
      "Deliver today and fix any errors if customers report them",
      "Delay the decision until more pressure forces a clear answer"
    ],
    correctAnswer: ["B"],
    explanation: "When client-facing errors are costly and the deadline can flex, quality should win over small schedule gains.",
    rationale: "Measures tradeoff judgment under moderate delivery pressure."
  },
  {
    id: "gca_q11",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "integrity_and_uncertainty",
    difficulty: 3,
    format: "multi_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: [
      "You find that two internal reports show materially different numbers for the same metric,",
      "and leadership expects an update soon.",
      "",
      "Which actions are appropriate? Select all that apply."
    ].join("\n"),
    options: [
      "State that the numbers are not yet reliable and explain that validation is in progress",
      "Pick the cleaner-looking dataset so leadership has something to use",
      "Investigate the discrepancy before making strong claims",
      "Present one number confidently to avoid creating confusion",
      "Share the uncertainty clearly if an update cannot be delayed"
    ],
    correctAnswer: ["A", "C", "E"],
    explanation: "The right response is to validate, avoid false confidence, and communicate uncertainty clearly.",
    rationale: "Tests integrity when data quality and stakeholder urgency conflict."
  },
  {
    id: "gca_q12",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "ambiguity_handling",
    difficulty: 2,
    format: "best_next_step",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: [
      "You receive a request with unclear success criteria.",
      "You can either:",
      "- start now with reasonable assumptions",
      "- wait for clarification that may not arrive until late",
      "- push back and ask for the request to be reassigned",
      "",
      "What is the best next step?"
    ].join("\n"),
    options: [
      "Start with explicit assumptions, keep scope controlled, and surface the assumptions early",
      "Wait for full clarification so rework is minimized",
      "Push back because unclear requests should not be accepted",
      "Start broadly so you are more likely to cover what was intended"
    ],
    correctAnswer: ["A"],
    explanation: "Controlled assumptions with early visibility keep momentum without pretending ambiguity is gone.",
    rationale: "Measures good execution behavior under unclear requirements."
  },
  {
    id: "gca_q13",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "communication_quality",
    difficulty: 2,
    format: "single_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "Choose the strongest stakeholder update for a delayed deliverable.",
    options: [
      "We are delayed due to blockers. Will share more soon.",
      "The deliverable is delayed by one day due to dependency X. Current mitigation is Y. Next update at 4 PM.",
      "There are some challenges, but the team is working hard to solve them.",
      "The timeline slipped. We will update when we know more."
    ],
    correctAnswer: ["B"],
    explanation: "The strongest update is specific about the delay, cause, mitigation, and next communication point.",
    rationale: "Tests concise, accountable stakeholder communication."
  },
  {
    id: "gca_q14",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "criticality_detection",
    difficulty: 2,
    format: "multi_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "Select all scenarios that should be treated as P1.",
    options: [
      "Incorrect charges affecting multiple customers",
      "A small UI misalignment on one settings page",
      "Risk of production data loss",
      "Internal report takes 15 seconds longer than usual to load",
      "A single user needs a manual workaround for a non-critical export"
    ],
    correctAnswer: ["A", "C"],
    explanation: "Widespread incorrect charges and potential production data loss both meet immediate business-critical criteria.",
    rationale: "Measures whether severe impact is recognized quickly."
  },
  {
    id: "gca_q15",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "quality_of_judgment",
    difficulty: 3,
    format: "single_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: [
      "A team changed its process and now completes more work per day,",
      "but defects and follow-up corrections also increased.",
      "",
      "Which response is the weakest?"
    ].join("\n"),
    options: [
      "Compare the gain in output against the added cost of defects before deciding the change was successful",
      "Investigate where the defects are entering the process and whether speed targets changed behavior",
      "Treat the increase in completed work as the main success metric because defects can be handled separately",
      "Review both throughput and quality measures before keeping the new process"
    ],
    correctAnswer: ["C"],
    explanation: "Ignoring defects and corrections is the weakest response because it overweights throughput and misses total impact.",
    rationale: "Checks whether overall quality of judgment includes quality costs."
  }
];
