export const candidateMilestoneTypeValues = [
  "registration",
  "screener",
  "interview",
  "review_round",
  "advanced_test",
  "decision"
] as const;

export type CandidateMilestoneType = (typeof candidateMilestoneTypeValues)[number];

export const candidateMilestoneStatusValues = [
  "not_started",
  "in_progress",
  "done",
  "failed",
  "skipped"
] as const;

export type CandidateMilestoneStatus = (typeof candidateMilestoneStatusValues)[number];

export const candidateMilestoneModeValues = ["manual", "platform"] as const;

export type CandidateMilestoneMode = (typeof candidateMilestoneModeValues)[number];

export const candidateMilestoneResultValues = ["pass", "fail", "review", "accept", "decline", "on_hold"] as const;

export type CandidateMilestoneResult = (typeof candidateMilestoneResultValues)[number];

export const candidateMilestoneTypeLabels: Record<CandidateMilestoneType, string> = {
  registration: "Registered",
  screener: "Screener",
  interview: "Interview",
  review_round: "Review round",
  advanced_test: "Advanced test",
  decision: "Decision"
};

export const candidateMilestoneStatusLabels: Record<CandidateMilestoneStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
  failed: "Failed",
  skipped: "Skipped"
};

export const candidateMilestoneModeLabels: Record<CandidateMilestoneMode, string> = {
  manual: "Manual",
  platform: "Platform"
};

export const candidateMilestoneResultLabels: Record<CandidateMilestoneResult, string> = {
  pass: "Pass",
  fail: "Fail",
  review: "Review",
  accept: "Accept",
  decline: "Decline",
  on_hold: "On hold"
};

export function isCandidateMilestoneType(value: string): value is CandidateMilestoneType {
  return (candidateMilestoneTypeValues as readonly string[]).includes(value);
}

export function isCandidateMilestoneStatus(value: string): value is CandidateMilestoneStatus {
  return (candidateMilestoneStatusValues as readonly string[]).includes(value);
}

export function isCandidateMilestoneMode(value: string): value is CandidateMilestoneMode {
  return (candidateMilestoneModeValues as readonly string[]).includes(value);
}

export function isCandidateMilestoneResult(value: string): value is CandidateMilestoneResult {
  return (candidateMilestoneResultValues as readonly string[]).includes(value);
}

export type CheckType =
  | 'resume_upload'
  | 'resume_review'
  | 'screener_test'
  | 'interview_notes'
  | 'review_assessment'
  | 'review_notes'
  | 'final_decision';

export const checkTypeValues: CheckType[] = [
  'resume_upload',
  'resume_review',
  'screener_test',
  'interview_notes',
  'review_assessment',
  'review_notes',
  'final_decision'
];

export interface CheckDefinition {
  type: CheckType;
  label: string;
  required: boolean;
}

export const milestoneCheckDefs: Record<CandidateMilestoneType, CheckDefinition[]> = {
  registration: [
    { type: 'resume_upload', label: 'Resume', required: true }
  ],
  screener: [
    { type: 'resume_review', label: 'Resume review', required: true },
    { type: 'screener_test', label: 'Screener test', required: true }
  ],
  interview: [
    { type: 'interview_notes', label: 'Interview', required: true }
  ],
  review_round: [
    { type: 'review_assessment', label: 'Assessment', required: false },
    { type: 'review_notes', label: 'Interview notes', required: false }
  ],
  advanced_test: [
    { type: 'review_notes', label: 'Notes', required: false }
  ],
  decision: [
    { type: 'final_decision', label: 'Final decision', required: true }
  ]
};

export function deriveMilestoneStatus(
  checks: Array<{ type?: CheckType; status: string }>,
  defs: CheckDefinition[]
): CandidateMilestoneStatus {
  if (!defs || defs.length === 0) {
    return checks.length > 0 ? 'in_progress' : 'not_started';
  }

  if (checks.length === 0) {
    return 'not_started';
  }

  for (const def of defs) {
    if (def.required) {
      const check = checks.find((c) => c.type === def.type);
      if (check?.status === 'failed') {
        return 'failed';
      }
    }
  }

  const requiredDefs = defs.filter((def) => def.required);
  const allRequiredPassed = requiredDefs.length === 0
    ? false
    : requiredDefs.every((def) => {
        const check = checks.find((c) => c.type === def.type);
        return check?.status === 'passed';
      });

  if (allRequiredPassed && requiredDefs.length > 0) {
    return 'done';
  }

  const hasAnyStarted = checks.some((check) => check.status !== 'not_started');
  if (hasAnyStarted) {
    return 'in_progress';
  }

  return 'not_started';
}

export function defaultCandidateMilestones() {
  return [
    {
      type: "registration" as const,
      title: "Registered",
      status: "done" as const,
      sortOrder: 10,
      mode: "manual" as const
    },
    {
      type: "screener" as const,
      title: "Screener",
      status: "not_started" as const,
      sortOrder: 20,
      mode: "platform" as const
    },
    {
      type: "interview" as const,
      title: "Interview",
      status: "not_started" as const,
      sortOrder: 30,
      mode: "manual" as const
    },
    {
      type: "review_round" as const,
      title: "Review round",
      status: "not_started" as const,
      sortOrder: 40,
      mode: "manual" as const
    },
    {
      type: "decision" as const,
      title: "Decision",
      status: "not_started" as const,
      sortOrder: 9999,
      mode: "manual" as const
    }
  ];
}
