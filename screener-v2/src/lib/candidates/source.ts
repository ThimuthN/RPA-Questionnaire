export type SourceGroup = {
  label: string;
  sources: Array<{ value: string; label: string }>;
};

export const SOURCE_GROUPS: SourceGroup[] = [
  {
    label: "Professional Networks",
    sources: [
      { value: "linkedin", label: "LinkedIn" },
      { value: "linkedin_job_posting", label: "LinkedIn Job Posting" },
      { value: "indeed", label: "Indeed" },
      { value: "glassdoor", label: "Glassdoor" },
      { value: "ziprecruiter", label: "ZipRecruiter" },
      { value: "monster", label: "Monster" }
    ]
  },
  {
    label: "Direct & Internal",
    sources: [
      { value: "direct", label: "Company website" },
      { value: "referral", label: "Employee referral" },
      { value: "internal_transfer", label: "Internal transfer" }
    ]
  },
  {
    label: "Agencies & Search",
    sources: [
      { value: "agency", label: "Staffing agency" },
      { value: "executive_search", label: "Executive search" },
      { value: "campus", label: "Campus recruiting" }
    ]
  },
  {
    label: "Social Media",
    sources: [
      { value: "facebook", label: "Facebook" },
      { value: "instagram", label: "Instagram" },
      { value: "twitter_x", label: "Twitter / X" }
    ]
  },
  {
    label: "Tech & Portfolio",
    sources: [
      { value: "github", label: "GitHub" },
      { value: "stack_overflow", label: "Stack Overflow Jobs" },
      { value: "behance", label: "Behance" },
      { value: "dribbble", label: "Dribbble" }
    ]
  },
  {
    label: "Events",
    sources: [
      { value: "career_fair", label: "Career fair" },
      { value: "conference", label: "Conference" },
      { value: "networking_event", label: "Networking event" }
    ]
  },
  {
    label: "Other",
    sources: [
      { value: "job_board", label: "Job board (other)" },
      { value: "headhunted", label: "Headhunted / outbound" },
      { value: "email_campaign", label: "Email campaign" },
      { value: "community", label: "Community group / forum" },
      { value: "other", label: "Other / unknown" }
    ]
  }
];

/** Flat map of value → display label for quick lookups */
export const SOURCE_LABEL_MAP: Record<string, string> = Object.fromEntries(
  SOURCE_GROUPS.flatMap((g) => g.sources.map((s) => [s.value, s.label]))
);

export function getSourceLabel(value: string | undefined | null): string {
  if (!value) return "Not recorded";
  return SOURCE_LABEL_MAP[value] ?? value;
}

export function isReferralSource(value: string | undefined | null): boolean {
  return value === "referral";
}
