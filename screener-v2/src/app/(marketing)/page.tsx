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
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";
import { HeroScene } from "@/components/motion/HeroScene";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { getSession } from "@/lib/auth/session";
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
  const session = await getSession();
  const createHref = session ? "/create-test" : "/login?next=/create-test";
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
        title="Build assessments that hold up."
        subtitle="Create, run, and review in one system."
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
                <p className="max-w-lg text-base leading-8 text-slate-300 sm:text-lg">
                  A sharper way to build assessments, run them smoothly, and review outcomes without the usual clutter.
                </p>
              </StaggerItem>
            </StaggerGroup>
            <StaggerItem>
              <HeroScene className="min-h-[560px]" />
            </StaggerItem>
          </div>

          <StaggerGroup className="space-y-4" delay={0.08}>
            <StaggerItem>
              <p className="text-[11px] uppercase tracking-[0.28em] text-brand-300">Build. Run. Review.</p>
            </StaggerItem>
            <div className="grid gap-4 md:grid-cols-3">
              <StaggerItem hover>
                <StagePanel className="min-h-[170px] space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-brand-300">Build</p>
                  <h2 className="text-2xl text-white">Shape the assessment.</h2>
                  <p className="max-w-xs text-sm leading-7 text-slate-300">Start clean, mix the right add-ons, and keep the structure intentional.</p>
                </StagePanel>
              </StaggerItem>
              <StaggerItem hover>
                <StagePanel className="min-h-[170px] space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-teal-300">Run</p>
                  <h2 className="text-2xl text-white">Keep the experience clear.</h2>
                  <p className="max-w-xs text-sm leading-7 text-slate-300">Calm runtime, autosave, and focused flows that stay out of the way.</p>
                </StagePanel>
              </StaggerItem>
              <StaggerItem hover>
                <StagePanel className="min-h-[170px] space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-amber-300">Review</p>
                  <h2 className="text-2xl text-white">Move faster with better signal.</h2>
                  <p className="max-w-xs text-sm leading-7 text-slate-300">See what matters, trust the scoring, and make decisions with less noise.</p>
                </StagePanel>
              </StaggerItem>
            </div>
          </StaggerGroup>

          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <StaggerItem>
              <StagePanel className="space-y-5">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-brand-300">Designed to be reliable</p>
                  <h2 className="text-3xl text-white">Trust the system under pressure.</h2>
                  <p className="max-w-2xl text-sm leading-7 text-slate-300">Scoring, runtime, and review are built to stay clear when the stakes go up.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-brand-300">Scoring</p>
                    <p className="mt-2 text-lg text-white">Accurate scoring</p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-teal-300">Runtime</p>
                    <p className="mt-2 text-lg text-white">Stable runtime</p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-amber-300">Review</p>
                    <p className="mt-2 text-lg text-white">Clean review flow</p>
                  </div>
                </div>
              </StagePanel>
            </StaggerItem>
            <StaggerItem>
              <StagePanel className="space-y-5">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-brand-300">Works across assessment use cases</p>
                  <h2 className="text-3xl text-white">One platform, many contexts.</h2>
                  <p className="max-w-xl text-sm leading-7 text-slate-300">Hiring, internal growth, certification, and focused evaluation.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill label="Hiring" tone="blue" />
                  <StatusPill label="Internal growth" tone="emerald" />
                  <StatusPill label="Certification" tone="amber" />
                  <StatusPill label="Evaluation" tone="purple" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-4"><p className="text-sm text-white">Screen with confidence.</p></div>
                  <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-4"><p className="text-sm text-white">Measure progression clearly.</p></div>
                  <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-4"><p className="text-sm text-white">Set a higher standard.</p></div>
                  <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-4"><p className="text-sm text-white">Test for real judgment.</p></div>
                </div>
              </StagePanel>
            </StaggerItem>
          </div>

          <StaggerItem>
            <StagePanel className="space-y-5 text-center">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.28em] text-brand-300">Start here</p>
                <h2 className="text-3xl text-white sm:text-4xl">Start with one strong assessment.</h2>
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
          </StaggerItem>

          {session && candidateWorkspace && resultWorkspace ? (
            <StaggerGroup className="space-y-5" delay={0.12}>
              <StaggerItem>
                <StagePanel tone="summary" className="py-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-brand-300">Workspace overview</p>
                      <p className="text-sm text-slate-200">
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
                    description="Create an assessment, add a candidate, and send the first invite when you’re ready to begin."
                  />
                </StaggerItem>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <StaggerItem hover>
                  <StagePanel className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <BriefcaseBusiness className="h-4 w-4 text-amber-300" />
                        <p className="text-sm text-slate-300">Needs setup</p>
                      </div>
                      <StatusPill label={String(candidateWorkspace.summary.needsResume)} tone="amber" />
                    </div>
                    <CountUpValue value={candidateWorkspace.summary.needsResume} className="font-display text-3xl text-white" />
                    <p className="text-sm text-slate-400">Candidates blocked before the first assessment can start.</p>
                  </StagePanel>
                </StaggerItem>

                <StaggerItem hover>
                  <StagePanel className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-brand-300" />
                        <p className="text-sm text-slate-300">Ready for review</p>
                      </div>
                      <StatusPill label={String(candidateWorkspace.summary.readyForReview)} tone="blue" />
                    </div>
                    <CountUpValue value={candidateWorkspace.summary.readyForReview} className="font-display text-3xl text-white" />
                    <p className="text-sm text-slate-400">Submitted assessments waiting for a decision.</p>
                  </StagePanel>
                </StaggerItem>

                <StaggerItem hover>
                  <StagePanel className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-rose-300" />
                        <p className="text-sm text-slate-300">Stalled</p>
                      </div>
                      <StatusPill label={String(candidateWorkspace.summary.stalled)} tone="red" />
                    </div>
                    <CountUpValue value={candidateWorkspace.summary.stalled} className="font-display text-3xl text-white" />
                    <p className="text-sm text-slate-400">Work that has been inactive and needs attention.</p>
                  </StagePanel>
                </StaggerItem>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <StaggerItem>
                  <StagePanel className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <h2 className="text-2xl text-white">Open work</h2>
                        <p className="text-sm text-slate-300">What needs attention first.</p>
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
                              className="block rounded-[20px] border border-white/10 bg-black/20 p-4 transition hover:border-white/20 hover:bg-white/[0.04]"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <p className="text-base text-white">{candidate.fullName}</p>
                                  <p className="text-sm text-slate-300">
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
                        <h2 className="text-2xl text-white">Recent results</h2>
                        <p className="text-sm text-slate-300">Latest outcomes at a glance.</p>
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
                              className="block rounded-[20px] border border-white/10 bg-black/20 p-4 transition hover:border-white/20 hover:bg-white/[0.04]"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <p className="text-base text-white">{row.candidateName || "Unnamed candidate"}</p>
                                  <p className="text-sm text-slate-300">
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
