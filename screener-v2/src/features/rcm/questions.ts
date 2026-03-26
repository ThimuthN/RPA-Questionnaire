import type { Question } from "@/lib/assessment-engine/types";

export const revenueCycleManagementQuestions: Question[] = [
  {
    id: "rcm_q1",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Denials & Follow-up",
    difficulty: 5,
    format: "single_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "A claim is denied for missing authorization, but the scheduler notes show authorization was approved two days before the date of service. What is the strongest first action?",
    options: [
      "Rebill the claim immediately with the same authorization field because payer data is often delayed",
      "Validate whether the approved authorization covered the rendered CPT, servicing location, and DOS span before appeal or corrected claim action",
      "Transfer the balance to patient responsibility because the payer rejected the claim after adjudication",
      "Void the claim and ask registration to create a new account with the authorization attached"
    ],
    correctAnswer: ["B"],
    explanation: "Authorization denials should be reconciled against scope, dates, and service details before choosing appeal versus correction.",
    rationale: "Tests disciplined first-pass denial analysis."
  } as Question,
  {
    id: "rcm_q2",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Claim Quality",
    difficulty: 5,
    format: "multi_select",
    points: 1,
    scoringMethod: "partial_with_penalty",
    prompt: "Which signals suggest a front-end issue is likely driving downstream claim rejections? Select all that apply.",
    options: [
      "The same payer rejects multiple claims for subscriber ID formatting across one registration team",
      "ERA balances post correctly but secondary claims remain in suspense for COB review",
      "Medical necessity denials spike only for one imaging CPT family after a payer bulletin change",
      "Eligibility verifies as active, but claims deny for invalid patient demographic combinations captured at check-in",
      "Claims hold because charge review has not finalized one provider's documentation"
    ],
    correctAnswer: ["A", "D"],
    explanation: "Patterned subscriber and demographic failures point to registration quality issues rather than coding or documentation alone.",
    rationale: "Tests ability to localize upstream root cause."
  } as Question,
  {
    id: "rcm_q3",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Denials & Follow-up",
    difficulty: 5,
    format: "best_next_step",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "A payer denies a high-value outpatient surgery claim as non-covered. The contract matrix shows the procedure is covered only when billed with one of two diagnosis families. What is the best next step?",
    options: [
      "Appeal immediately with the operative note because high-dollar claims should skip corrected-claim review",
      "Verify whether diagnosis coding and medical necessity documentation actually support one of the covered diagnosis families before selecting rebill or appeal",
      "Write off the balance to contractual adjustment because coverage denials are rarely overturned",
      "Split the claim into professional and facility components so at least one side can be paid"
    ],
    correctAnswer: ["B"],
    explanation: "Coverage issues must be reconciled against coded diagnoses and supporting documentation before deciding the recovery path.",
    rationale: "Tests contract-guided denial triage."
  } as Question,
  {
    id: "rcm_q4",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Workqueues & Controls",
    difficulty: 5,
    format: "matching",
    points: 1,
    scoringMethod: "partial_pairs_with_penalty",
    prompt: "Match the RCM control to its strongest primary purpose.",
    leftItems: [
      "Charge router edit",
      "Timely filing watchlist",
      "Zero-pay remittance queue",
      "Credit balance review"
    ],
    rightItems: [
      "Prevent late filing risk from aging silently past payer deadlines",
      "Catch encounter issues before claim generation or release",
      "Separate adjudicated claims that need underpayment, denial, or carve-out review",
      "Detect situations where cash or adjustments may exceed the true account liability",
      "Auto-close all self-pay accounts below a small balance threshold"
    ],
    correctPairs: {
      "Charge router edit": "Catch encounter issues before claim generation or release",
      "Timely filing watchlist": "Prevent late filing risk from aging silently past payer deadlines",
      "Zero-pay remittance queue": "Separate adjudicated claims that need underpayment, denial, or carve-out review",
      "Credit balance review": "Detect situations where cash or adjustments may exceed the true account liability"
    },
    explanation: "Each control targets a different failure point in the revenue cycle.",
    rationale: "Tests control-framework clarity in RCM."
  } as Question,
  {
    id: "rcm_q5",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Appeals & Recovery",
    difficulty: 5,
    format: "ordering",
    points: 1,
    scoringMethod: "partial_position",
    prompt: "Put these appeal-prep steps in the strongest order for a complex denial.",
    items: [
      "Confirm the payer denial reason and filing deadline",
      "Validate account facts, coding, authorization, and supporting documentation",
      "Choose the correct recovery path: corrected claim, reconsideration, or formal appeal",
      "Assemble evidence tied directly to the payer's stated reason",
      "Submit and track the case against the payer follow-up date"
    ],
    correctOrder: [0, 1, 2, 3, 4],
    explanation: "Good recovery work starts with the denial and deadline, then validates facts before choosing and executing the right path.",
    rationale: "Tests structured denial recovery discipline."
  } as Question,
  {
    id: "rcm_q6",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Remittance Analysis",
    difficulty: 5,
    format: "log_analysis_single_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "What is the strongest conclusion from this ERA pattern?",
    logSnippet: "Claim\tAllowed\tPaid\tPR\tCO\tRemark\nA102\t850\t0\t0\t850\tN30\nA103\t850\t0\t0\t850\tN30\nA104\t850\t0\t0\t850\tN30",
    options: [
      "The payer likely treated these claims as bundled or included in another service, so pure patient balance follow-up would be wrong",
      "The payer probably misapplied the patient deductible and the balances should transfer to self-pay",
      "The claims were denied for eligibility and need registration correction before rebill",
      "This is a late-charge issue because allowed and paid amounts cannot both be zero on first pass"
    ],
    correctAnswer: ["A"],
    explanation: "Repeated contractual zero-pay patterns with remark logic point to payer adjudication behavior, not automatic patient billing.",
    rationale: "Tests remittance reading beyond surface balance movement."
  } as Question,
  {
    id: "rcm_q7",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Eligibility & COB",
    difficulty: 5,
    format: "trace_execution",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "A primary payer ERA posts, but the secondary crossover never occurs. Notes show the primary claim carried subscriber information for the patient, while the secondary policy is under the spouse. What is the most likely next outcome if the account is left untouched?",
    options: [
      "The secondary payer will auto-adjudicate after a nightly eligibility refresh",
      "The account will likely stall because COB data needed for secondary billing is incomplete or mismatched",
      "The balance will transfer to self-pay after the next statement cycle with no revenue impact",
      "The payer will reverse the primary payment because spouse policies cannot follow a primary adjudication"
    ],
    correctAnswer: ["B"],
    explanation: "Secondary billing often stalls when crossover or COB data does not support the true dependent relationship and subscriber details.",
    rationale: "Tests COB failure tracing."
  } as Question,
  {
    id: "rcm_q8",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Claim Quality",
    difficulty: 5,
    format: "fill_blank_constrained",
    points: 1,
    scoringMethod: "partial_by_blank",
    prompt: "A strong RCM workqueue should prioritize by financial risk, filing risk, and ____ clarity rather than simple account age alone.",
    blank: "Select the missing word.",
    choices: ["liability", "denial", "ownership", "productivity"],
    acceptedAnswers: ["ownership"],
    explanation: "Workqueues are safer when ownership is explicit, not just aged broadly.",
    rationale: "Tests operational queue design."
  } as Question,
  {
    id: "rcm_q9",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Authorization & Medical Necessity",
    difficulty: 5,
    format: "case_triage",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "Which issue should be escalated first because delay most directly threatens collectible revenue?",
    options: [
      "A low-balance self-pay statement template has outdated contact-center hours",
      "A prior-authorization workqueue contains tomorrow's scheduled high-dollar cases with unresolved clinical documentation",
      "A payment plan report is missing one cosmetic dashboard filter",
      "A registrar requests a shorter insurance-verification note template"
    ],
    correctAnswer: ["B"],
    explanation: "Unresolved prior auth on imminent high-dollar cases puts preventable collectible revenue at immediate risk.",
    rationale: "Tests escalation judgment by revenue impact and timing."
  } as Question,
  {
    id: "rcm_q10",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Denials & Follow-up",
    difficulty: 5,
    format: "single_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "A payer denies for duplicate claim, but claim history shows only one submission from your system. What is the strongest first hypothesis to test?",
    options: [
      "Another provider or clearinghouse path may have already submitted a materially identical claim under the same billable identifiers",
      "The payer is applying the claim to a prior authorization and duplicate denials usually self-resolve",
      "The patient likely has secondary coverage and the denial means the balance should cross over automatically",
      "The charges were probably entered twice and should be reversed before any payer follow-up"
    ],
    correctAnswer: ["A"],
    explanation: "Duplicate denials often require checking payer receipt history, clearinghouse resubmissions, and claim identity, not assuming an internal double-charge.",
    rationale: "Tests nuanced duplicate-denial thinking."
  } as Question,
  {
    id: "rcm_q11",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Remittance Analysis",
    difficulty: 5,
    format: "multi_select",
    points: 1,
    scoringMethod: "partial_with_penalty",
    prompt: "When an underpayment is suspected, which checks matter most before escalating to payer recovery? Select all that apply.",
    options: [
      "Whether the posted allowed amount matches contract terms for that payer-product and service combination",
      "Whether modifiers, units, and contractual carve-outs could explain the variance",
      "Whether the patient has already received a statement for the remaining balance",
      "Whether coordination of benefits or prior payments changed expected liability",
      "Whether the registration rep documented the copay collection conversation"
    ],
    correctAnswer: ["A", "B", "D"],
    explanation: "Underpayment review starts with contract logic, claim details, and prior payer coordination, not downstream patient-contact steps.",
    rationale: "Tests disciplined underpayment analysis."
  } as Question,
  {
    id: "rcm_q12",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Charge Capture",
    difficulty: 5,
    format: "best_next_step",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "A provider repeatedly closes encounters without one ancillary charge that is later added after claim release. What is the best next step?",
    options: [
      "Rebill corrected claims case by case and accept the delayed cash impact as operational noise",
      "Add a front-end claim edit or encounter completion control so claims cannot release until the required charge relationship is resolved",
      "Increase follow-up staffing so late charges are worked faster after denial",
      "Move the ancillary charge to a monthly manual adjustment process outside the encounter workflow"
    ],
    correctAnswer: ["B"],
    explanation: "Late-charge recurrence is best addressed with a release-blocking control at the source, not more downstream rework.",
    rationale: "Tests preference for upstream control over follow-up volume."
  } as Question,
  {
    id: "rcm_q13",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Workqueues & Controls",
    difficulty: 5,
    format: "matching",
    points: 1,
    scoringMethod: "partial_pairs_with_penalty",
    prompt: "Match the workqueue signal to the most likely operational risk.",
    leftItems: [
      "No owner and high dollar",
      "Past payer filing threshold",
      "Repeated zero-pay after rebill",
      "Credit balance after refund request"
    ],
    rightItems: [
      "Recovery risk is turning into write-off risk because filing rights may already be lost",
      "Root-cause correction probably has not been identified and rework is repeating",
      "Escalation can stall because accountability for action is unclear despite material exposure",
      "Cash, adjustment, or refund sequencing may create compliance and patient-liability risk",
      "The account should be moved automatically to bad debt"
    ],
    correctPairs: {
      "No owner and high dollar": "Escalation can stall because accountability for action is unclear despite material exposure",
      "Past payer filing threshold": "Recovery risk is turning into write-off risk because filing rights may already be lost",
      "Repeated zero-pay after rebill": "Root-cause correction probably has not been identified and rework is repeating",
      "Credit balance after refund request": "Cash, adjustment, or refund sequencing may create compliance and patient-liability risk"
    },
    explanation: "High-performing RCM operations distinguish ownership, deadline, recurrence, and liability risks clearly.",
    rationale: "Tests queue interpretation maturity."
  } as Question,
  {
    id: "rcm_q14",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Appeals & Recovery",
    difficulty: 5,
    format: "ordering",
    points: 1,
    scoringMethod: "partial_position",
    prompt: "Put these reimbursement-recovery actions in the strongest order after a payer underpays a clean claim.",
    items: [
      "Validate the variance against contract logic and claim detail",
      "Confirm whether posting, COB, or prior-payment issues explain the difference",
      "Select the right recovery path and collect supporting evidence",
      "Submit the payer dispute or reconsideration within deadline",
      "Track follow-up and resolution to final disposition"
    ],
    correctOrder: [0, 1, 2, 3, 4],
    explanation: "Good recovery work validates the variance first, then chooses and executes the right path with support.",
    rationale: "Tests disciplined recovery sequencing."
  } as Question,
  {
    id: "rcm_q15",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Eligibility & COB",
    difficulty: 5,
    format: "single_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "Registration verified eligibility three days before service, but the claim denies for coverage terminated on the date of service. What is the strongest operational lesson?",
    options: [
      "Eligibility checks are only useful on high-dollar encounters and can be skipped elsewhere",
      "Coverage-sensitive workflows may need date-of-service or near-real-time revalidation, not only pre-service verification",
      "The denial should be appealed first because earlier eligibility proof overrides the payer's adjudication date",
      "The patient should automatically be billed because terminated coverage is always patient liability"
    ],
    correctAnswer: ["B"],
    explanation: "Eligibility timing matters; a pre-service check may not protect the actual DOS coverage state.",
    rationale: "Tests practical understanding of eligibility timing risk."
  } as Question,
  {
    id: "rcm_q16",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Authorization & Medical Necessity",
    difficulty: 5,
    format: "log_analysis_single_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "What is the strongest conclusion from this pre-service workqueue log?",
    logSnippet: "Case\tScheduled\tAuth status\tClinical docs\tOutcome\nP401\tTomorrow\tPending\tIncomplete\tStill scheduled\nP402\tTomorrow\tApproved\tComplete\tCleared\nP403\tTomorrow\tPending\tComplete\tStill scheduled",
    options: [
      "The queue is prioritizing documentation correctly because complete cases remain scheduled",
      "There is likely a control gap because unresolved authorization cases are not being blocked or escalated before service",
      "The real issue is that too many cases were scheduled for the same date",
      "The clinical team should stop sending complete documentation until authorization is guaranteed"
    ],
    correctAnswer: ["B"],
    explanation: "Pending auth on imminent cases without stop/escalation behavior signals a preventable control failure.",
    rationale: "Tests operational reading of pre-service controls."
  } as Question,
  {
    id: "rcm_q17",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Claim Quality",
    difficulty: 5,
    format: "multi_select",
    points: 1,
    scoringMethod: "partial_with_penalty",
    prompt: "Which controls most directly reduce corrected-claim churn? Select all that apply.",
    options: [
      "Pre-bill edits for high-frequency payer requirements and known documentation dependencies",
      "Clear ownership for charge review, coding validation, and claim release exceptions",
      "A general expectation that billers should work rebills within 30 days",
      "Feedback loops that trace repeat denial patterns back to the originating workflow",
      "More statement cycles so patient cash offsets delayed payer payment"
    ],
    correctAnswer: ["A", "B", "D"],
    explanation: "Corrected-claim churn falls when upstream defects are blocked, owned, and traced back to source workflows.",
    rationale: "Tests system-level RCM improvement thinking."
  } as Question,
  {
    id: "rcm_q18",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Denials & Follow-up",
    difficulty: 5,
    format: "best_next_step",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "A claim is denied for medical necessity, but coding confirms the billed CPT and diagnosis are technically valid. What is the best next step?",
    options: [
      "Escalate to coding only, because medical necessity denials always mean the wrong diagnosis code was chosen",
      "Review payer policy and supporting clinical documentation to determine whether the service was documented strongly enough for the payer's coverage rule",
      "Write off the denial if the claim was coded correctly because payer policy is outside RCM scope",
      "Send the full balance to patient responsibility because medical necessity is a non-covered service issue"
    ],
    correctAnswer: ["B"],
    explanation: "Medical necessity often turns on payer policy and clinical support, not just code correctness.",
    rationale: "Tests deeper denial interpretation."
  } as Question,
  {
    id: "rcm_q19",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Remittance Analysis",
    difficulty: 5,
    format: "case_triage",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "Which queue should be worked first if you want the strongest near-term cash protection?",
    options: [
      "A low-dollar self-pay cleanup queue with many old statement accounts",
      "A zero-pay commercial remittance queue containing recently adjudicated high-balance surgical claims still inside all appeal windows",
      "A patient-address cleanup queue for returned mail",
      "A dashboard-reconciliation queue where reporting totals are off by less than 1%"
    ],
    correctAnswer: ["B"],
    explanation: "High-balance, recently adjudicated zero-pay claims inside appeal windows usually represent the strongest immediate cash-recovery opportunity.",
    rationale: "Tests queue prioritization by collectible value and timing."
  } as Question,
  {
    id: "rcm_q20",
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Denials & Follow-up",
    difficulty: 5,
    format: "single_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt: "A team keeps resubmitting denied claims with slightly different notes, but the denial rate on the same root issue is unchanged. What is the strongest interpretation?",
    options: [
      "The team is doing the right thing because persistence is the main driver of payer recovery",
      "The operation is likely treating follow-up as repetitive volume work instead of isolating and fixing the true denial cause",
      "The payer probably needs a longer turnaround time before claim notes are recognized",
      "The denials should be pushed to patient balance more quickly to reduce rebill inventory"
    ],
    correctAnswer: ["B"],
    explanation: "Repeated rebills without root-cause correction signal process churn, not recovery strength.",
    rationale: "Tests whether the candidate distinguishes activity from recovery effectiveness."
  } as Question
];
