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
        utility={
          session ? (
            <div className="flex flex-wrap gap-2">
              <Link href="/candidates">
                <Button>People</Button>
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
          <div className="grid gap-8 lg:grid-cols-[0.84fr_1.16fr] lg:items-center">
            <StaggerGroup className="space-y-6" delay={0.04}>
              <StaggerItem>
                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-brand-300">People. Progress. Decisions.</p>
                  <div className="max-w-lg space-y-3">
                    <h1 className="font-display text-5xl leading-[0.94] text-white sm:text-6xl">Keep every</h1>
                    <div className="font-display text-5xl leading-[0.94] sm:text-6xl" aria-hidden="true">
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
                <p className="max-w-lg text-base leading-8 text-[color:var(--app-scene-text)] sm:text-lg">
                  Northstar keeps people, reviews, goals, and next steps connected without turning the work into admin overhead.
                </p>
              </StaggerItem>
              <StaggerItem>
                <SignalMarquee
                  items={["Hiring", "Internal growth", "Audits", "Role standards", "Goals", "Reviews"]}
                  className="max-w-[36rem]"
                />
              </StaggerItem>
            </StaggerGroup>
            <StaggerItem>
              <HeroScene />
            </StaggerItem>
          </div>

          <ViewportReveal delay={0.06}>
            <StagePanel className="overflow-hidden">
              <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-brand-300">How it works</p>
                  <h2 className="text-4xl leading-[0.96] text-[color:var(--app-heading)]">
                    <ScrambleReveal text="One clear flow from first review to next step." className="text-scramble-glow" />
                  </h2>
                  <p className="max-w-md text-sm leading-7 text-[color:var(--app-muted)]">
                    Keep the person, the review, and the decision in the same place.
                  </p>
                </div>
                <div className="relative space-y-5">
                  <div className="absolute left-[18px] top-2 bottom-2 w-px bg-[linear-gradient(180deg,rgba(138,184,255,0.55),rgba(18,179,168,0.45),rgba(255,196,87,0.32))]" />
                  {[
                    ["01", "Track", "Keep people, roles, and history together.", "Start with the right context instead of piecing it together later.", "text-brand-300"],
                    ["02", "Review", "Run checks in the same working flow.", "Use assessments, audits, and check-ins without splitting the process across tools.", "text-teal-300"],
                    ["03", "Decide", "Move with the full picture in view.", "Results, notes, and progress stay close when it is time to act.", "text-amber-300"]
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-brand-300">Where it fits</p>
                  <h2 className="text-4xl leading-[0.96] text-[color:var(--app-heading)]">
                    <ScrambleReveal text="Use the same system across hiring and internal growth." className="text-scramble-glow" />
                  </h2>
                  <p className="max-w-2xl text-sm leading-7 text-[color:var(--app-muted)]">
                    Northstar works when you need to track people, run reviews, and keep the next decision moving.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    ["People", "Candidates and employees stay in one system with history, ownership, and context."],
                    ["Reviews", "Assessments, audits, and check-ins stay connected instead of living in separate tools."],
                    ["Progress", "Roles, goals, and next steps stay visible as people move forward."]
                  ].map(([title, body]) => (
                    <div
                      key={title}
                      className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-5 shadow-[var(--app-shadow-soft)]"
                    >
                      <h3 className="text-2xl text-[color:var(--app-heading)]">{title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--app-muted)]">{body}</p>
                    </div>
                  ))}
                </div>
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
