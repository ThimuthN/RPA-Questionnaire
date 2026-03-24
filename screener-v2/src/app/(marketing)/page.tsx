import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  PlayCircle
} from "lucide-react";
import { SceneTransition } from "@/components/motion/SceneTransition";
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
          <div className="space-y-5">
            <StagePanel tone="summary" className="py-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-brand-300">Today</p>
                  <p className="text-sm text-slate-200">
                    {candidateWorkspace.summary.needsResume} candidates need setup,{" "}
                    {candidateWorkspace.summary.readyForReview} are ready for review, and{" "}
                    {candidateWorkspace.summary.stalled} have gone quiet.
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

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <StagePanel className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <BriefcaseBusiness className="h-4 w-4 text-amber-300" />
                    <p className="text-sm text-slate-300">Needs resume</p>
                  </div>
                  <StatusPill label={String(candidateWorkspace.summary.needsResume)} tone="amber" />
                </div>
                <p className="text-2xl text-white">{candidateWorkspace.summary.needsResume}</p>
                <p className="text-sm text-slate-400">Candidates blocked before screening can start.</p>
              </StagePanel>

              <StagePanel className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-300" />
                    <p className="text-sm text-slate-300">Ready for review</p>
                  </div>
                  <StatusPill label={String(candidateWorkspace.summary.readyForReview)} tone="blue" />
                </div>
                <p className="text-2xl text-white">{candidateWorkspace.summary.readyForReview}</p>
                <p className="text-sm text-slate-400">Candidates with submitted screeners that need a decision.</p>
              </StagePanel>

              <StagePanel className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-rose-300" />
                    <p className="text-sm text-slate-300">Stalled</p>
                  </div>
                  <StatusPill label={String(candidateWorkspace.summary.stalled)} tone="red" />
                </div>
                <p className="text-2xl text-white">{candidateWorkspace.summary.stalled}</p>
                <p className="text-sm text-slate-400">Candidates untouched for 7+ days.</p>
              </StagePanel>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
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
                <div className="space-y-3">
                  {candidateWorkspace.rows.map((candidate) => (
                    <Link
                      key={candidate.id}
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
                  ))}
                </div>
              </StagePanel>

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
                <div className="space-y-3">
                  {resultWorkspace.rows.map((row) => (
                    <Link
                      key={row.attemptId}
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
                  ))}
                </div>
              </StagePanel>
            </div>
          </div>
        </SceneShell>
      </SceneTransition>
    );
  }

  return (
    <SceneTransition>
      <SceneShell
        variant="create"
        eyebrow="Technical assessment platform"
        title="Create, run, and review assessments in one place"
        subtitle="Give candidates a polished experience and keep hiring decisions moving with one shared workspace."
      >
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-5">
              <div className="space-y-3">
                <h2 className="max-w-2xl font-display text-5xl leading-[0.95] text-white md:text-6xl">
                  A calmer way to manage screening from invite to decision.
                </h2>
                <p className="max-w-2xl text-base leading-7 text-slate-300">
                  Launch role-aware assessments, give candidates a clear front door, and review outcomes in a workspace built for day-to-day hiring work.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-brand-300">Create quickly</p>
                  <p className="mt-2 text-sm text-slate-200">Build assessments with role-aware sections and a cleaner share flow.</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-teal-300">Run smoothly</p>
                  <p className="mt-2 text-sm text-slate-200">Guide candidates through a polished runtime with automatic saving.</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-amber-300">Review clearly</p>
                  <p className="mt-2 text-sm text-slate-200">Compare recent results and move hiring decisions forward faster.</p>
                </div>
              </div>
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
            </div>
            <HeroScene className="min-h-[440px]" />
          </div>
        </div>
      </SceneShell>
    </SceneTransition>
  );
}
