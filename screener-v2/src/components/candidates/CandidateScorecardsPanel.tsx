import { Star } from "lucide-react";

type CompetencyRating = {
  id: string;
  name: string;
  rating: number | null;
  notes?: string;
};

export type ScorecardFeedbackItem = {
  id: string;
  interviewerName: string | null;
  interviewerEmail: string;
  overallRating: number | null;
  recommendation: string | null;
  competencyJson: unknown;
  strengths: string | null;
  concerns: string | null;
  submittedAt: string | null;
};

export type ScorecardPanelItem = {
  id: string;
  roundNumber: number;
  roundName: string;
  format: string;
  scheduledAt: string | null;
  status: string;
  feedbacks: ScorecardFeedbackItem[];
};

const REC_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  strong_yes: {
    label: "Strong Yes",
    bg: "var(--pill-emerald-bg)",
    text: "var(--pill-emerald-text)",
    border: "var(--pill-emerald-border)"
  },
  yes: {
    label: "Yes",
    bg: "var(--pill-teal-bg)",
    text: "var(--pill-teal-text)",
    border: "var(--pill-teal-border)"
  },
  neutral: {
    label: "Neutral",
    bg: "var(--app-surface-muted)",
    text: "var(--app-muted)",
    border: "var(--app-border)"
  },
  no: {
    label: "No",
    bg: "var(--pill-amber-bg)",
    text: "var(--pill-amber-text)",
    border: "var(--pill-amber-border)"
  },
  strong_no: {
    label: "Strong No",
    bg: "color-mix(in srgb, var(--app-danger) 12%, transparent)",
    text: "var(--app-danger)",
    border: "color-mix(in srgb, var(--app-danger) 28%, transparent)"
  }
};

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={12}
          className={i < rating ? "fill-[color:var(--app-brand)] text-[color:var(--app-brand)]" : "text-[color:var(--app-border)]"}
        />
      ))}
    </span>
  );
}

function RecommendationBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-xs text-[color:var(--app-muted)]">No recommendation</span>;
  const cfg = REC_CONFIG[value];
  if (!cfg) return <span className="text-xs text-[color:var(--app-muted)]">{value}</span>;
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
}

function safeCompetencies(json: unknown): CompetencyRating[] {
  if (!Array.isArray(json)) return [];
  return json.filter(
    (item): item is CompetencyRating =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as CompetencyRating).name === "string"
  );
}

function panelStatusLabel(status: string): string {
  if (status === "scheduled") return "Scheduled";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  if (status === "pending") return "Pending";
  return status;
}

function formatLabel(format: string): string {
  if (format === "in_person") return "In person";
  if (format === "video") return "Video";
  if (format === "phone") return "Phone";
  if (format === "panel") return "Panel";
  return format;
}

function aggregateRecommendations(feedbacks: ScorecardFeedbackItem[]) {
  const tally: Record<string, number> = {};
  for (const fb of feedbacks) {
    if (fb.recommendation) tally[fb.recommendation] = (tally[fb.recommendation] ?? 0) + 1;
  }
  return tally;
}

function averageRating(feedbacks: ScorecardFeedbackItem[]): number | null {
  const rated = feedbacks.filter((f) => f.overallRating != null);
  if (rated.length === 0) return null;
  return Math.round((rated.reduce((sum, f) => sum + (f.overallRating ?? 0), 0) / rated.length) * 10) / 10;
}

export function CandidateScorecardsPanel({ panels }: { panels: ScorecardPanelItem[] }) {
  if (panels.length === 0) {
    return (
      <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-6 py-12 text-center">
        <p className="text-sm font-medium text-[color:var(--app-heading)]">No interview scorecards yet</p>
        <p className="mt-1 text-xs text-[color:var(--app-muted)]">
          Interview panels and feedback will appear here once they are scheduled and submitted.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {panels.map((panel) => {
        const submitted = panel.feedbacks.filter((f) => f.submittedAt);
        const pending = panel.feedbacks.filter((f) => !f.submittedAt);
        const tally = aggregateRecommendations(submitted);
        const avg = averageRating(submitted);

        return (
          <div
            key={panel.id}
            className="overflow-hidden rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-[var(--app-shadow-soft)]"
          >
            {/* Panel header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-5 py-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[color:var(--app-brand)]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--app-brand)]">
                    Round {panel.roundNumber}
                  </span>
                  <h3 className="text-base font-semibold text-[color:var(--app-heading)]">
                    {panel.roundName}
                  </h3>
                </div>
                <p className="text-xs text-[color:var(--app-muted)]">
                  {formatLabel(panel.format)}
                  {panel.scheduledAt
                    ? ` · ${new Date(panel.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
                    : ""}
                  {" · "}
                  {panelStatusLabel(panel.status)}
                </p>
              </div>

              {/* Aggregate summary */}
              <div className="flex flex-wrap items-center gap-3">
                {avg !== null && (
                  <div className="flex items-center gap-1.5 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-3 py-1">
                    <StarRating rating={Math.round(avg)} />
                    <span className="text-xs font-semibold text-[color:var(--app-heading)]">{avg.toFixed(1)}</span>
                  </div>
                )}
                {Object.entries(REC_CONFIG)
                  .filter(([key]) => (tally[key] ?? 0) > 0)
                  .map(([key, cfg]) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
                    >
                      {tally[key]}× {cfg.label}
                    </span>
                  ))}
                <span className="text-xs text-[color:var(--app-muted)]">
                  {submitted.length}/{panel.feedbacks.length} submitted
                </span>
              </div>
            </div>

            {/* Feedback cards */}
            <div className="divide-y divide-[color:var(--app-border)]">
              {panel.feedbacks.length === 0 ? (
                <p className="px-5 py-4 text-sm text-[color:var(--app-muted)]">No interviewers assigned yet.</p>
              ) : (
                panel.feedbacks.map((fb) => {
                  const competencies = safeCompetencies(fb.competencyJson);
                  const isSubmitted = Boolean(fb.submittedAt);

                  return (
                    <div key={fb.id} className="px-5 py-4">
                      {/* Interviewer row */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-[color:var(--app-heading)]">
                            {fb.interviewerName ?? fb.interviewerEmail}
                          </p>
                          {fb.interviewerName && (
                            <p className="text-xs text-[color:var(--app-muted)]">{fb.interviewerEmail}</p>
                          )}
                          {fb.submittedAt ? (
                            <p className="text-[11px] text-[color:var(--app-muted)]">
                              Submitted {new Date(fb.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </p>
                          ) : (
                            <p className="text-[11px] text-[color:var(--app-warning)]">Feedback pending</p>
                          )}
                        </div>

                        {isSubmitted && (
                          <div className="flex items-center gap-3">
                            {fb.overallRating != null && (
                              <div className="flex items-center gap-1.5">
                                <StarRating rating={fb.overallRating} />
                                <span className="text-xs text-[color:var(--app-muted)]">{fb.overallRating}/5</span>
                              </div>
                            )}
                            <RecommendationBadge value={fb.recommendation} />
                          </div>
                        )}
                      </div>

                      {isSubmitted && (
                        <div className="mt-3 space-y-3">
                          {/* Competency ratings */}
                          {competencies.length > 0 && (
                            <div className="rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3">
                              <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                                Competencies
                              </p>
                              <div className="space-y-2">
                                {competencies.map((c, idx) => (
                                  <div key={c.id ?? idx} className="flex items-center justify-between gap-3">
                                    <span className="min-w-0 truncate text-xs text-[color:var(--app-text)]">{c.name}</span>
                                    <div className="flex flex-shrink-0 items-center gap-1.5">
                                      {c.rating != null ? (
                                        <StarRating rating={c.rating} />
                                      ) : (
                                        <span className="text-[11px] text-[color:var(--app-muted)]">—</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Strengths / Concerns */}
                          {(fb.strengths || fb.concerns) && (
                            <div className="grid gap-3 sm:grid-cols-2">
                              {fb.strengths && (
                                <div className="rounded-[14px] border border-[color:var(--pill-emerald-border)] bg-[color:var(--pill-emerald-bg)] px-4 py-3">
                                  <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-[color:var(--pill-emerald-text)] opacity-70">
                                    Strengths
                                  </p>
                                  <p className="text-xs leading-5 text-[color:var(--app-text)]">{fb.strengths}</p>
                                </div>
                              )}
                              {fb.concerns && (
                                <div className="rounded-[14px] border border-[color:var(--pill-amber-border)] bg-[color:var(--pill-amber-bg)] px-4 py-3">
                                  <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-[color:var(--pill-amber-text)] opacity-70">
                                    Concerns
                                  </p>
                                  <p className="text-xs leading-5 text-[color:var(--app-text)]">{fb.concerns}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {!fb.strengths && !fb.concerns && competencies.length === 0 && (
                            <p className="text-xs text-[color:var(--app-muted)]">No written notes submitted.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Pending members without feedback records */}
            {pending.length > 0 && submitted.length > 0 && (
              <div className="border-t border-[color:var(--app-border)] bg-[color:var(--pill-amber-bg)] px-5 py-3">
                <p className="text-xs text-[color:var(--pill-amber-text)]">
                  Waiting on {pending.length} interviewer{pending.length !== 1 ? "s" : ""} to submit feedback.
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
