import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  PlayCircle
} from "lucide-react";
import { WorkspaceEmptyState } from "@/components/brand/WorkspaceEmptyState";
import { CountUpValue } from "@/components/motion/CountUpValue";
import { SceneTransition } from "@/components/motion/SceneTransition";
import { ScrambleReveal } from "@/components/motion/ScrambleReveal";
import { SignalMarquee } from "@/components/motion/SignalMarquee";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";
import { TypedWordCycle } from "@/components/motion/TypedWordCycle";
import { ViewportReveal } from "@/components/motion/ViewportReveal";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { buildLoginHref, getAppSession } from "@/lib/auth/app-session";
import { listCandidateWorkspacePage } from "@/lib/db/candidates";
import { listResultWorkspacePage } from "@/lib/db/repositories";

function candidateStatusTone(status: string) {
  if (status === "need_review") return "amber";
  if (status === "moved_forward") return "emerald";
  if (status === "rejected") return "red";
  return "blue";
}

function resultStatusTone(status: string) {
  if (status === "pass") return "emerald";
  if (status === "review") return "amber";
  return "red";
}

export default async function MarketingHomePage() {
  const session = await getAppSession();
  const workspaceHref = session ? "/people/candidates" : buildLoginHref("/people/candidates");
  const secondaryHeroHref = session ? "/results" : "/run-test";
  const secondaryHeroLabel = session ? "Open results" : "View demo";
  const [candidateWorkspace, resultWorkspace] = session
    ? await Promise.all([
        listCandidateWorkspacePage({ sort: "inbox", pageSize: 5 }),
        listResultWorkspacePage({ pageSize: 5 })
      ])
    : [null, null];

  return (
    <SceneTransition>
      <SceneShell
        variant="create"
        eyebrow="Northstar"
        title={<span className="sr-only">Northstar</span>}
        hideHeader
      >
        <StaggerGroup className="space-y-10">
          <StaggerGroup className="space-y-6" delay={0.04}>
            <StaggerItem>
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-brand-300">Tracking trajectory</p>
                </div>
                <div className="max-w-4xl space-y-3">
                  <h1 className="font-display text-5xl leading-[0.94] text-white sm:text-6xl md:text-7xl">Track every</h1>
                  <div className="font-display text-5xl leading-[0.94] text-white sm:text-6xl md:text-7xl" aria-hidden="true">
                    <TypedWordCycle
                      prefix=""
                      words={["candidate.", "review.", "goal.", "decision."]}
                      className="text-white"
                    />
                  </div>
                </div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <p className="max-w-2xl text-base leading-8 text-[color:var(--app-scene-text)] sm:text-lg">
                Northstar helps teams track people, run reviews, and move with the full picture in view.
              </p>
            </StaggerItem>
            <StaggerItem>
              <div className="flex flex-wrap gap-3">
                <Link href={workspaceHref}>
                  <Button className="gap-2">
                    Open workspace
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={secondaryHeroHref}>
                  <Button variant="secondary" className="gap-2">
                    <PlayCircle className="h-4 w-4" />
                    {secondaryHeroLabel}
                  </Button>
                </Link>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="max-w-4xl">
                <SignalMarquee
                  items={["Hiring", "Internal growth", "Audits", "Role standards", "Goals", "Reviews"]}
                  className="max-w-[40rem]"
                />
              </div>
            </StaggerItem>
          </StaggerGroup>

          <ViewportReveal delay={0.06}>
            <StagePanel className="space-y-6">
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.28em] text-brand-300">How it works</p>
                <h2 className="text-4xl leading-[0.96] text-[color:var(--app-heading)]">
                  <ScrambleReveal text="From signal to next step." className="text-scramble-glow" />
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-[color:var(--app-muted)]">
                  Northstar keeps the person, the review, and the decision in one working flow.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["01", "Track", "Start with the role, history, and ownership already in view.", "text-brand-300"],
                  ["02", "Review", "Run assessments, audits, and check-ins without splitting the work.", "text-teal-300"],
                  ["03", "Decide", "Keep results, notes, and next steps together when it is time to move.", "text-amber-300"]
                ].map(([step, label, body, tone], index) => (
                  <ViewportReveal key={step} delay={0.08 + index * 0.06}>
                    <div className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] p-5 shadow-[var(--app-shadow-soft)]">
                      <div className="flex items-center justify-between gap-3">
                        <p className={`text-[11px] uppercase tracking-[0.24em] ${tone}`}>{label}</p>
                        <span className="grid h-7 w-7 place-items-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-[10px] text-[color:var(--app-heading)]">
                          {step}
                        </span>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-[color:var(--app-muted)]">{body}</p>
                    </div>
                  </ViewportReveal>
                ))}
              </div>
            </StagePanel>
          </ViewportReveal>

          <ViewportReveal delay={0.08}>
            <StagePanel className="space-y-6">
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.28em] text-brand-300">Where it fits</p>
                <h2 className="text-4xl leading-[0.96] text-[color:var(--app-heading)]">
                  <ScrambleReveal text="Built for hiring and growth." className="text-scramble-glow" />
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-[color:var(--app-muted)]">
                  Use the same system for candidates, employees, and the reviews that guide movement.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["People", "Keep candidates and employees tied to the right role, owner, and history."],
                  ["Reviews", "Bring assessments, audits, and check-ins into the same working trail."],
                  ["Progress", "Follow goals, movement, and next steps without losing the full picture."]
                ].map(([title, body]) => (
                  <div
                    key={title}
                    className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-5 shadow-[var(--app-shadow-soft)]"
                  >
                    <h3 className="text-2xl text-[color:var(--app-heading)]">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--app-muted)]">{body}</p>
                  </div>
                ))}
              </div>
            </StagePanel>
          </ViewportReveal>

          {session && candidateWorkspace && resultWorkspace ? (
            <StaggerGroup className="space-y-5" delay={0.12}>
              <StaggerItem>
                <StagePanel tone="summary" className="py-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-brand-300">Workspace overview</p>
                      <p className="text-sm text-[color:var(--app-text)]">
                        {candidateWorkspace.summary.needsResume} need setup, {candidateWorkspace.summary.readyForReview} are ready for review, and {candidateWorkspace.summary.stalled} are stalled.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill label={`${candidateWorkspace.rows.length} active candidates`} tone="blue" />
                      <StatusPill label={`${resultWorkspace.rows.length} recent results`} tone="neutral" />
                      <StatusPill
                        label={`${resultWorkspace.rows.filter((row) => row.resultStatus === "review").length} review needed`}
                        tone="amber"
                      />
                    </div>
                  </div>
                </StagePanel>
              </StaggerItem>

              {candidateWorkspace.total === 0 && resultWorkspace.total === 0 ? (
                <StaggerItem>
                  <WorkspaceEmptyState
                    title="Your workspace is ready."
                    description="Add people, define the role, and start the first review when you're ready."
                  />
                </StaggerItem>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <StaggerItem hover>
                  <StagePanel className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <BriefcaseBusiness className="h-4 w-4 text-amber-300" />
                        <p className="text-sm text-[color:var(--app-text)]">Needs setup</p>
                      </div>
                      <StatusPill label={String(candidateWorkspace.summary.needsResume)} tone="amber" />
                    </div>
                    <CountUpValue value={candidateWorkspace.summary.needsResume} className="font-display text-3xl text-[color:var(--app-heading)]" />
                    <p className="text-sm text-[color:var(--app-muted)]">People who still need the basics in place before review can move.</p>
                  </StagePanel>
                </StaggerItem>

                <StaggerItem hover>
                  <StagePanel className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-brand-300" />
                        <p className="text-sm text-[color:var(--app-text)]">Ready for review</p>
                      </div>
                      <StatusPill label={String(candidateWorkspace.summary.readyForReview)} tone="blue" />
                    </div>
                    <CountUpValue value={candidateWorkspace.summary.readyForReview} className="font-display text-3xl text-[color:var(--app-heading)]" />
                    <p className="text-sm text-[color:var(--app-muted)]">Reviews or submitted work waiting on a decision.</p>
                  </StagePanel>
                </StaggerItem>

                <StaggerItem hover>
                  <StagePanel className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-rose-300" />
                        <p className="text-sm text-[color:var(--app-text)]">Stalled</p>
                      </div>
                      <StatusPill label={String(candidateWorkspace.summary.stalled)} tone="red" />
                    </div>
                    <CountUpValue value={candidateWorkspace.summary.stalled} className="font-display text-3xl text-[color:var(--app-heading)]" />
                    <p className="text-sm text-[color:var(--app-muted)]">Work that has been quiet for too long and needs attention.</p>
                  </StagePanel>
                </StaggerItem>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <StaggerItem>
                  <StagePanel className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <h2 className="text-2xl text-[color:var(--app-heading)]">Open work</h2>
                        <p className="text-sm text-[color:var(--app-muted)]">What needs attention first.</p>
                      </div>
                      <Link href="/candidates?sort=inbox">
                        <Button variant="secondary">Open inbox</Button>
                      </Link>
                    </div>
                    {candidateWorkspace.rows.length > 0 ? (
                      <StaggerGroup className="space-y-3" delay={0.16}>
                        {candidateWorkspace.rows.map((candidate) => (
                          <StaggerItem key={candidate.id} hover>
                            <Link
                              href={`/candidates/${candidate.id}`}
                              className="block rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 transition hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-muted)]"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <p className="text-base text-[color:var(--app-heading)]">{candidate.fullName}</p>
                                  <p className="text-sm text-[color:var(--app-muted)]">
                                    {candidate.roleLabel || "Role not set"}
                                    {candidate.hrOwner ? ` | Owner: ${candidate.hrOwner}` : ""}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <StatusPill label={candidate.uiStatus.replace(/_/g, " ")} tone={candidateStatusTone(candidate.uiStatus)} />
                                  <StatusPill label={`${candidate.staleDays}d stale`} tone={candidate.staleDays >= 7 ? "red" : "neutral"} />
                                </div>
                              </div>
                            </Link>
                          </StaggerItem>
                        ))}
                      </StaggerGroup>
                    ) : (
                      <WorkspaceEmptyState
                        title="No candidates need attention."
                        description="New candidates or review work will show up here when something needs action."
                      />
                    )}
                  </StagePanel>
                </StaggerItem>

                <StaggerItem>
                  <StagePanel className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <h2 className="text-2xl text-[color:var(--app-heading)]">Recent results</h2>
                        <p className="text-sm text-[color:var(--app-muted)]">Latest outcomes at a glance.</p>
                      </div>
                      <Link href="/results">
                        <Button variant="secondary">Open results</Button>
                      </Link>
                    </div>
                    {resultWorkspace.rows.length > 0 ? (
                      <StaggerGroup className="space-y-3" delay={0.18}>
                        {resultWorkspace.rows.map((row) => (
                          <StaggerItem key={row.attemptId} hover>
                            <Link
                              href={`/results/${row.attemptId}`}
                              className="block rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 transition hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-muted)]"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <p className="text-base text-[color:var(--app-heading)]">{row.candidateName || "Unnamed candidate"}</p>
                                  <p className="text-sm text-[color:var(--app-muted)]">
                                    {row.candidateOwner || "No owner"}
                                    {row.candidateStage ? ` | ${row.candidateStage}` : ""}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <StatusPill label={row.resultStatus} tone={resultStatusTone(row.resultStatus)} />
                                  <StatusPill label={`${row.finalPercent.toFixed(1)} / 100`} tone="blue" />
                                </div>
                              </div>
                            </Link>
                          </StaggerItem>
                        ))}
                      </StaggerGroup>
                    ) : (
                      <WorkspaceEmptyState
                        title="No results yet."
                        description="Completed reviews and results will show up here with status and outcome."
                      />
                    )}
                  </StagePanel>
                </StaggerItem>
              </div>
            </StaggerGroup>
          ) : null}
        </StaggerGroup>
      </SceneShell>
    </SceneTransition>
  );
}
