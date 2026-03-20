export const candidateMilestoneTypeValues = [
  "registration",
  "screener",
  "interview",
  "advanced_test",
  "decision"
] as const;

export type CandidateMilestoneType = (typeof candidateMilestoneTypeValues)[number];

export const candidateMilestoneStatusValues = [
  "not_started",
  "in_progress",
  "done",
  "skipped"
] as const;

export type CandidateMilestoneStatus = (typeof candidateMilestoneStatusValues)[number];

export const candidateMilestoneModeValues = ["manual", "platform"] as const;

export type CandidateMilestoneMode = (typeof candidateMilestoneModeValues)[number];

export const candidateMilestoneTypeLabels: Record<CandidateMilestoneType, string> = {
  registration: "Registered",
  screener: "Screener",
  interview: "Interview",
  advanced_test: "Advanced test",
  decision: "Offer / decision"
};

export const candidateMilestoneStatusLabels: Record<CandidateMilestoneStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
  skipped: "Skipped"
};

export const candidateMilestoneModeLabels: Record<CandidateMilestoneMode, string> = {
  manual: "Manual",
  platform: "Platform"
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
      type: "advanced_test" as const,
      title: "Advanced test",
      status: "not_started" as const,
      sortOrder: 40,
      mode: "platform" as const
    },
    {
      type: "decision" as const,
      title: "Offer / decision",
      status: "not_started" as const,
      sortOrder: 50,
      mode: "manual" as const
    }
  ];
}
