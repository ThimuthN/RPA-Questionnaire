import Link from "next/link";
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
          title="Hiring ops workspace"
          subtitle="Review open work, move candidates forward, and jump into the next action from one place."
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <StagePanel className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-300">Needs resume</p>
                  <StatusPill label={String(candidateWorkspace.summary.needsResume)} tone="amber" />
                </div>
                <p className="text-2xl text-white">{candidateWorkspace.summary.needsResume}</p>
                <p className="text-sm text-slate-400">Candidates blocked before screening can start.</p>
              </StagePanel>
              <StagePanel className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-300">Ready for review</p>
                  <StatusPill label={String(candidateWorkspace.summary.readyForReview)} tone="blue" />
                </div>
                <p className="text-2xl text-white">{candidateWorkspace.summary.readyForReview}</p>
                <p className="text-sm text-slate-400">Candidates with submitted screeners that need a decision.</p>
              </StagePanel>
              <StagePanel className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-300">Stalled</p>
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
                            {candidate.positionAppliedFor || "Role not set"}{candidate.hrOwner ? ` | Owner: ${candidate.hrOwner}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusPill label={candidate.uiStatus.replace(/_/g, " ")} tone={candidate.uiStatus === "need_review" ? "amber" : candidate.uiStatus === "moved_forward" ? "emerald" : candidate.uiStatus === "rejected" ? "red" : "blue"} />
                          <StatusPill label={`${candidate.staleDays}d stale`} tone={candidate.staleDays >= 7 ? "red" : "neutral"} />
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
                            {row.candidateOwner || "No owner"}{row.candidateStage ? ` | ${row.candidateStage}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusPill label={row.resultStatus} tone={row.resultStatus === "pass" ? "emerald" : row.resultStatus === "review" ? "amber" : "red"} />
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
        eyebrow="Role-aware technical assessment"
        title={copy.landing.headline}
        subtitle={copy.landing.subtext}
      >
        <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Link href={createHref}>
                <Button>{copy.landing.primaryCta}</Button>
              </Link>
              <Link href="/run-test">
                <Button variant="secondary">{copy.landing.secondaryCta}</Button>
              </Link>
            </div>
          </div>
          <HeroScene className="min-h-[320px]" />
        </div>
      </SceneShell>
    </SceneTransition>
  );
}
