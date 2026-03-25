import type { Question } from "@/lib/assessment-engine/types";

export const businessAnalysisQuestions: Question[] = [
  {
    id: "ba_q1",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Workflow Design",
    difficulty: 4,
    format: "single_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "A stakeholder says, 'The report should be fast and easy to use.' Which acceptance criterion is strongest?",
    options: [
      "Users should like the report",
      "The report should open quickly on most laptops",
      "The report loads in under 3 seconds for the standard monthly dataset",
      "The report should feel more efficient than the current one"
    ],
    correctAnswer: ["C"],
    explanation: "A strong criterion is specific, measurable, and testable.",
    rationale: "Tests whether vague stakeholder language can be converted into a valid requirement."
  } as Question,
  {
    id: "ba_q2",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Data Handling & Validation",
    difficulty: 4,
    format: "multi_select",
    points: 1,
    scoringMethod: "partial_with_penalty",
    prompt: "Which signs suggest the requirement set is still unsafe to build from? Select all that apply.",
    options: [
      "Different stakeholders use the same term to mean different things",
      "The current-state process has one known workaround",
      "A required decision path has no business owner",
      "An output field has no agreed source of truth",
      "The delivery date is ambitious"
    ],
    correctAnswer: ["A", "C", "D"],
    explanation: "Terminology conflicts, owner gaps, and missing source-of-truth definitions create requirements risk.",
    rationale: "Tests BA risk detection before solutioning starts."
  } as Question,
  {
    id: "ba_q3",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Workflow Design",
    difficulty: 4,
    format: "best_next_step",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "Two stakeholders disagree on whether a request should auto-approve above $5,000. Delivery is blocked. What is the best next step?",
    options: [
      "Build the lower-risk rule and let users complain if it is wrong",
      "Document the conflict, identify the final decision owner, and force a resolution before locking the rule",
      "Average the two positions and use $7,500 as a compromise",
      "Delay the entire project until both stakeholders agree informally"
    ],
    correctAnswer: ["B"],
    explanation: "A blocked business rule needs explicit ownership and resolution, not assumption or compromise by guesswork.",
    rationale: "Tests decision governance under conflicting inputs."
  } as Question,
  {
    id: "ba_q4",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Workflow Design",
    difficulty: 3,
    format: "matching",
    points: 1,
    scoringMethod: "partial_pairs_with_penalty",
    prompt: "Match each BA artifact to its strongest primary purpose.",
    leftItems: [
      "Process map",
      "User story",
      "Acceptance criteria",
      "Data mapping"
    ],
    rightItems: [
      "Describe how work flows across steps and decisions",
      "Capture a unit of user value and intent",
      "Define how to verify the requirement is met",
      "Map fields between source and target structures"
    ],
    correctPairs: {
      "Process map": "Describe how work flows across steps and decisions",
      "User story": "Capture a unit of user value and intent",
      "Acceptance criteria": "Define how to verify the requirement is met",
      "Data mapping": "Map fields between source and target structures"
    },
    explanation: "Each artifact solves a different analysis problem and should not be conflated.",
    rationale: "Tests core BA toolkit clarity."
  } as Question,
  {
    id: "ba_q5",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Workflow Design",
    difficulty: 4,
    format: "ordering",
    points: 1,
    scoringMethod: "partial_position",
    prompt: "Put these BA activities in the strongest order for a net-new workflow feature.",
    items: [
      "Clarify objective, scope, and decision owner",
      "Map the current state and pain points",
      "Define future-state rules and exceptions",
      "Write acceptance criteria and data rules",
      "Validate with stakeholders before build"
    ],
    correctOrder: [0, 1, 2, 3, 4],
    explanation: "Good analysis moves from purpose to current state, then future-state rules, then verification detail, then validation.",
    rationale: "Tests structured analysis flow."
  } as Question,
  {
    id: "ba_q6",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Debugging & Logs",
    difficulty: 4,
    format: "log_analysis_single_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "What is the most likely analysis gap from this UAT defect log?",
    logSnippet: "Case\tInput\tExpected\tActual\n1021\tAmount=7500, Contract=Yes\tNeeds approval\tAuto-approved\n1022\tAmount=7500, Contract=No\tAuto-approved\tAuto-approved\n1023\tAmount=12000, Contract=Yes\tNeeds approval\tNeeds approval",
    options: [
      "The data type for amount is wrong",
      "The rule interaction between contract status and approval threshold was not fully specified",
      "The users were not trained on UAT execution",
      "The environment has stale test data"
    ],
    correctAnswer: ["B"],
    explanation: "The defect pattern points to a missing or ambiguous business rule combination, not random execution noise.",
    rationale: "Tests defect diagnosis from rule behavior."
  } as Question,
  {
    id: "ba_q7",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Workflow Design",
    difficulty: 4,
    format: "case_triage",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "Which change should be prioritized first by business impact?",
    options: [
      "A typo in an internal dashboard label",
      "A missing audit field on customer approvals",
      "A one-click shortcut requested by a power user",
      "A color update to match the design system"
    ],
    correctAnswer: ["B"],
    explanation: "Missing audit data creates stronger operational and compliance risk than cosmetic or convenience changes.",
    rationale: "Tests business-impact prioritization."
  } as Question,
  {
    id: "ba_q8",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Data Handling & Validation",
    difficulty: 3,
    format: "trace_execution",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "A rule says: reject if country is blank; otherwise if tax ID is blank, send for review; otherwise approve. What happens for Country = 'US', Tax ID = blank?",
    options: [
      "Reject",
      "Send for review",
      "Approve",
      "Cannot determine"
    ],
    correctAnswer: ["B"],
    explanation: "The country passes the first rule, then the missing tax ID triggers review.",
    rationale: "Tests clean rule tracing."
  } as Question,
  {
    id: "ba_q9",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Workflow Design",
    difficulty: 3,
    format: "fill_blank_constrained",
    points: 1,
    scoringMethod: "partial_by_blank",
    prompt: "A good acceptance criterion should be measurable and ____.",
    blank: "Select the missing word.",
    choices: ["popular", "testable", "flexible", "broad"],
    acceptedAnswers: ["testable"],
    explanation: "Requirements should be verifiable, not just well worded.",
    rationale: "Tests fundamentals of requirement quality."
  } as Question,
  {
    id: "ba_q10",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Workflow Design",
    difficulty: 4,
    format: "single_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "A stakeholder asks for 'one export button' but there are three export destinations with different field rules. What is the strongest BA response?",
    options: [
      "Keep one story and let developers decide the differences later",
      "Split the requirement by export destination and define the data rules for each path",
      "Assume the most common export path is enough for version one",
      "Reject the request until a future phase"
    ],
    correctAnswer: ["B"],
    explanation: "Different rules across destinations usually mean separate requirements and explicit mapping.",
    rationale: "Tests decomposition of overloaded requests."
  } as Question,
  {
    id: "ba_q11",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Data Handling & Validation",
    difficulty: 4,
    format: "multi_select",
    points: 1,
    scoringMethod: "partial_with_penalty",
    prompt: "When validating a data mapping, which questions matter most? Select all that apply.",
    options: [
      "What is the source of truth for each target field?",
      "What transformation or default rule applies when the source is blank?",
      "Who requested the mapping first?",
      "How are duplicates detected or prevented?",
      "Whether the target screen color will change later"
    ],
    correctAnswer: ["A", "B", "D"],
    explanation: "Mappings need source ownership, transformation behavior, and duplicate logic.",
    rationale: "Tests seriousness around data integrity."
  } as Question,
  {
    id: "ba_q12",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Workflow Design",
    difficulty: 4,
    format: "best_next_step",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "Mid-sprint, a stakeholder asks for one extra field and 'just a tiny rule change,' but the new rule affects three downstream outputs. What is the best next step?",
    options: [
      "Accept it immediately because the request sounds small",
      "Assess downstream impact, update scope explicitly, and decide through change control",
      "Reject it because no sprint changes should ever be allowed",
      "Add the field now and leave the outputs for a later fix"
    ],
    correctAnswer: ["B"],
    explanation: "Small inputs can have large downstream impact, so the change needs impact analysis and explicit scope control.",
    rationale: "Tests disciplined scope handling."
  } as Question
];
