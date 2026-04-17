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
import { HeroScene } from "@/components/motion/HeroScene";
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
  const createHref = session ? "/create-test" : buildLoginHref("/create-test");
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
        eyebrow="Assessment platform"
        title="Build assessments without the mess."
        subtitle="Create, run, and review in one place."
        utility={
          session ? (
            <div className="flex flex-wrap gap-2">
              <Link href="/candidates">
                <Button>Candidates</Button>
              </Link>
              <Link href="/results">
                <Button variant="secondary">Results</Button>
              </Link>
              <Link href="/assessments">
                <Button variant="secondary">Assessments</Button>
              </Link>
            </div>
          ) : null
        }
      >
        <StaggerGroup className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
            <StaggerGroup className="space-y-6" delay={0.04}>
              <StaggerItem>
                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-brand-300">Build. Run. Review.</p>
                  <div className="max-w-lg space-y-3">
                    <h2 className="font-display text-5xl leading-[0.94] text-white sm:text-6xl">Build a better</h2>
                    <div className="font-display text-5xl leading-[0.94] sm:text-6xl">
                      <TypedWordCycle
                        prefix=""
                        words={["assessment.", "screener.", "test."]}
                        className="text-white"
                      />
                    </div>
                  </div>
                </div>
              </StaggerItem>
              <StaggerItem>
                <div className="flex flex-wrap gap-3">
                  <Link href={createHref}>
                    <Button className="gap-2">
                      Create assessment
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/run-test">
                    <Button variant="secondary" className="gap-2">
                      <PlayCircle className="h-4 w-4" />
                      Explore platform
                    </Button>
                  </Link>
                </div>
              </StaggerItem>
              <StaggerItem>
                <p className="max-w-lg text-base leading-8 text-[color:var(--app-scene-text)] sm:text-lg">
                  Build the assessment, send it out, and review the result without fighting the system.
                </p>
              </StaggerItem>
              <StaggerItem>
                <SignalMarquee
                  items={["Hiring", "Internal growth", "Certification", "Evaluation", "Live review", "Autosave"]}
                  className="max-w-[36rem]"
                />
              </StaggerItem>
            </StaggerGroup>
            <StaggerItem>
              <HeroScene className="min-h-[560px]" />
            </StaggerItem>
          </div>

          <ViewportReveal delay={0.06}>
            <StagePanel className="overflow-hidden">
              <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-brand-300">Build. Run. Review.</p>
                  <h2 className="text-4xl leading-[0.96] text-[color:var(--app-heading)]">
                    <ScrambleReveal text="One flow, start to finish." className="text-scramble-glow" />
                  </h2>
                  <p className="max-w-md text-sm leading-7 text-[color:var(--app-muted)]">
                    From setup to results, it should stay simple and easy to follow.
                  </p>
                </div>
                <div className="relative space-y-5">
                  <div className="absolute left-[18px] top-2 bottom-2 w-px bg-[linear-gradient(180deg,rgba(138,184,255,0.55),rgba(18,179,168,0.45),rgba(255,196,87,0.32))]" />
                  {[
                    ["01", "Build", "Start with the right setup.", "Pick the add-ons you need and keep the structure tidy.", "text-brand-300"],
                    ["02", "Run", "Keep the test experience calm.", "Autosave, timing, and navigation stay out of the way.", "text-teal-300"],
                    ["03", "Review", "See the answer faster.", "Scores, flags, and results stay easy to scan.", "text-amber-300"]
                  ].map(([step, label, title, body, tone], index) => (
                    <ViewportReveal key={step} delay={0.08 + index * 0.06}>
                      <div className="relative rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] p-5 pl-12 shadow-[var(--app-shadow-soft)]">
                        <div className="absolute left-[6px] top-6 grid h-7 w-7 place-items-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-[10px] text-[color:var(--app-heading)]">
                          {step}
                        </div>
                        <p className={`text-[11px] uppercase tracking-[0.24em] ${tone}`}>{label}</p>
                        <h3 className="mt-2 text-2xl text-[color:var(--app-heading)]">{title}</h3>
                        <p className="mt-2 max-w-xl text-sm leading-7 text-[color:var(--app-muted)]">{body}</p>
                      </div>
                    </ViewportReveal>
                  ))}
                </div>
              </div>
            </StagePanel>
          </ViewportReveal>

          <ViewportReveal delay={0.08}>
            <StagePanel className="space-y-6">
              <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-brand-300">Designed to be reliable</p>
                    <h2 className="text-4xl leading-[0.96] text-[color:var(--app-heading)]">
                      <ScrambleReveal text="Built to stay steady." className="text-scramble-glow" />
                    </h2>
                    <p className="max-w-2xl text-sm leading-7 text-[color:var(--app-muted)]">Scoring, runtime, and review stay clear when things get busy.</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <StatusPill label="Reliable scoring" tone="blue" />
                    <StatusPill label="Smooth runtime" tone="emerald" />
                    <StatusPill label="Clear review" tone="amber" />
                  </div>
                </div>
                <div className="rounded-[26px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-5 shadow-[var(--app-shadow-soft)]">
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-brand-300">Works across use cases</p>
                    <h3 className="text-3xl leading-[0.98] text-[color:var(--app-heading)]">Works across different teams.</h3>
                    <p className="text-sm leading-7 text-[color:var(--app-muted)]">Hiring, internal growth, certification, and focused evaluation.</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusPill label="Hiring" tone="blue" />
                    <StatusPill label="Internal growth" tone="emerald" />
                    <StatusPill label="Certification" tone="amber" />
                    <StatusPill label="Evaluation" tone="purple" />
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] px-4 py-4"><p className="text-sm text-[color:var(--app-heading)]">Screen with confidence.</p></div>
                    <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] px-4 py-4"><p className="text-sm text-[color:var(--app-heading)]">Measure progression clearly.</p></div>
                    <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] px-4 py-4"><p className="text-sm text-[color:var(--app-heading)]">Set a higher standard.</p></div>
                    <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] px-4 py-4"><p className="text-sm text-[color:var(--app-heading)]">Test for real judgment.</p></div>
                  </div>
                </div>
              </div>
            </StagePanel>
          </ViewportReveal>

          <ViewportReveal delay={0.1}>
            <StagePanel className="space-y-5 text-center">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.28em] text-brand-300">Start here</p>
                <h2 className="text-3xl text-[color:var(--app-heading)] sm:text-4xl">
                  <ScrambleReveal text="Start with one good assessment." className="text-scramble-glow" />
                </h2>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href={createHref}>
                  <Button className="gap-2">
                    Create assessment
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/run-test">
                  <Button variant="secondary">View demo</Button>
                </Link>
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
                    description="Create an assessment, add a candidate, and send the first invite when you're ready to begin."
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
                    <p className="text-sm text-[color:var(--app-muted)]">Candidates blocked before the first assessment can start.</p>
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
                    <p className="text-sm text-[color:var(--app-muted)]">Submitted assessments waiting for a decision.</p>
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
                    <p className="text-sm text-[color:var(--app-muted)]">Work that has been inactive and needs attention.</p>
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
                        description="Completed assessments will show up here with score and review status."
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
