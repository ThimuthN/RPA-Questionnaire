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
import { copy } from "@/lib/design/copy";

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

  if (session) {
    const [candidateWorkspace, resultWorkspace] = await Promise.all([
      listCandidateWorkspacePage({ sort: "inbox", pageSize: 5 }),
      listResultWorkspacePage({ pageSize: 5 })
    ]);

    return (
      <SceneTransition>
        <SceneShell
          variant="results"
          eyebrow="Workspace"
          title="Hiring workspace"
          subtitle="Review candidates, check recent results, and keep the next hiring decision moving."
          utility={
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
          }
        >
          <StaggerGroup className="space-y-5">
            <StaggerItem>
              <StagePanel tone="summary" className="py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-brand-300">Today</p>
                    <p className="text-sm text-slate-200">
                      {candidateWorkspace.summary.needsResume} candidates need setup,{" "}
                      {candidateWorkspace.summary.readyForReview} are ready for review, and{" "}
                      {candidateWorkspace.summary.stalled} have been inactive.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill label={`${candidateWorkspace.rows.length} inbox items`} tone="blue" />
                    <StatusPill label={`${resultWorkspace.rows.length} recent results`} tone="neutral" />
                    <StatusPill
                      label={`${resultWorkspace.rows.filter((row) => row.resultStatus === "review").length} needs review`}
                      tone="amber"
                    />
                  </div>
                </div>
              </StagePanel>
            </StaggerItem>

            <StaggerGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" delay={0.06}>
              <StaggerItem hover>
                <StagePanel className="space-y-3 transition-transform">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <BriefcaseBusiness className="h-4 w-4 text-amber-300" />
                      <p className="text-sm text-slate-300">Needs resume</p>
                    </div>
                    <StatusPill label={String(candidateWorkspace.summary.needsResume)} tone="amber" />
                  </div>
                  <CountUpValue
                    value={candidateWorkspace.summary.needsResume}
                    className="font-display text-3xl text-white"
                  />
                  <p className="text-sm text-slate-400">Candidates blocked before screening can start.</p>
                </StagePanel>
              </StaggerItem>

              <StaggerItem hover>
                <StagePanel className="space-y-3 transition-transform">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-brand-300" />
                      <p className="text-sm text-slate-300">Ready for review</p>
                    </div>
                    <StatusPill label={String(candidateWorkspace.summary.readyForReview)} tone="blue" />
                  </div>
                  <CountUpValue
                    value={candidateWorkspace.summary.readyForReview}
                    className="font-display text-3xl text-white"
                  />
                  <p className="text-sm text-slate-400">Candidates with submitted screeners that need a decision.</p>
                </StagePanel>
              </StaggerItem>

              <StaggerItem hover>
                <StagePanel className="space-y-3 transition-transform">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-rose-300" />
                      <p className="text-sm text-slate-300">Stalled</p>
                    </div>
                    <StatusPill label={String(candidateWorkspace.summary.stalled)} tone="red" />
                  </div>
                  <CountUpValue
                    value={candidateWorkspace.summary.stalled}
                    className="font-display text-3xl text-white"
                  />
                  <p className="text-sm text-slate-400">Candidates untouched for 7+ days.</p>
                </StagePanel>
              </StaggerItem>
            </StaggerGroup>

            <StaggerGroup className="grid gap-4 xl:grid-cols-2" delay={0.1}>
              <StaggerItem>
                <StagePanel className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h2 className="text-2xl text-white">Open work</h2>
                      <p className="text-sm text-slate-300">Inbox-sorted candidates that need attention first.</p>
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
                                  {candidate.positionAppliedFor || "Role not set"}
                                  {candidate.hrOwner ? ` | Owner: ${candidate.hrOwner}` : ""}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <StatusPill
                                  label={candidate.uiStatus.replace(/_/g, " ")}
                                  tone={candidateStatusTone(candidate.uiStatus)}
                                />
                                <StatusPill
                                  label={`${candidate.staleDays}d stale`}
                                  tone={candidate.staleDays >= 7 ? "red" : "neutral"}
                                />
                              </div>
                            </div>
                          </Link>
                        </StaggerItem>
                      ))}
                    </StaggerGroup>
                  ) : (
                    <WorkspaceEmptyState
                      title="No candidates need attention right now."
                      description="New candidates or review work will show up here when something needs attention."
                    />
                  )}
                </StagePanel>
              </StaggerItem>

              <StaggerItem>
                <StagePanel className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h2 className="text-2xl text-white">Latest results</h2>
                      <p className="text-sm text-slate-300">Recent submissions with candidate context attached.</p>
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
                      description="Completed assessments will show up here with scores and review status."
                    />
                  )}
                </StagePanel>
              </StaggerItem>
            </StaggerGroup>
          </StaggerGroup>
        </SceneShell>
      </SceneTransition>
    );
  }

  return (
    <SceneTransition>
      <SceneShell
        variant="create"
        eyebrow="Technical assessments"
        title="Create assessments, invite candidates, and review results in one place."
        subtitle="A simple workspace for running role-based screening and keeping hiring decisions moving."
      >
        <StaggerGroup className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <StaggerGroup className="space-y-5" delay={0.04}>
              <StaggerGroup className="grid gap-3 sm:grid-cols-3" delay={0.1}>
                <StaggerItem hover>
                  <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-brand-300">Create assessments</p>
                    <p className="mt-2 text-sm text-slate-200">Set up role-based assessments and share them quickly.</p>
                  </div>
                </StaggerItem>
                <StaggerItem hover>
                  <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-teal-300">Run smoothly</p>
                    <p className="mt-2 text-sm text-slate-200">Give candidates a clear test flow with automatic saving.</p>
                  </div>
                </StaggerItem>
                <StaggerItem hover>
                  <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-amber-300">Review results</p>
                    <p className="mt-2 text-sm text-slate-200">Check outcomes, compare submissions, and move faster.</p>
                  </div>
                </StaggerItem>
              </StaggerGroup>
              <StaggerItem>
                <div className="flex flex-wrap gap-3">
                  <Link href={createHref}>
                    <Button className="gap-2">
                      {copy.landing.primaryCta}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/run-test">
                    <Button variant="secondary" className="gap-2">
                      <PlayCircle className="h-4 w-4" />
                      {copy.landing.secondaryCta}
                    </Button>
                  </Link>
                </div>
              </StaggerItem>
            </StaggerGroup>
            <StaggerItem>
              <HeroScene className="min-h-[440px]" />
            </StaggerItem>
          </div>
        </StaggerGroup>
      </SceneShell>
    </SceneTransition>
  );
}
