import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  PlayCircle,
  Sparkles,
  Stars,
  TimerReset
} from "lucide-react";
import { OrbitMascot } from "@/components/brand/OrbitMascot";
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
          eyebrow="Ops bridge"
          title="A sharper command center for your hiring flow"
          subtitle="Keep screening momentum high with a branded workspace, clearer next actions, and a friendlier first impression for every visit."
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
            <StagePanel tone="summary" className="overflow-hidden">
              <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-brand-300/20 bg-brand-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-brand-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    Orbit overview
                  </div>
                  <div className="space-y-2">
                    <h2 className="font-display text-3xl text-white">Open the site and know what matters first.</h2>
                    <p className="max-w-2xl text-sm leading-6 text-slate-300">
                      A stronger first screen, better visual hierarchy, and a little character make the workspace feel more product-grade without slowing your workflow down.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-brand-300">Fresh triage</p>
                      <p className="mt-2 text-2xl text-white">{candidateWorkspace.rows.length}</p>
                      <p className="mt-1 text-sm text-slate-400">Inbox candidates ready to move.</p>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-teal-300">Latest result</p>
                      <p className="mt-2 text-2xl text-white">
                        {resultWorkspace.rows[0]?.finalPercent.toFixed(1) ?? "--"}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">Most recent score snapshot.</p>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-amber-300">Decision rhythm</p>
                      <p className="mt-2 text-2xl text-white">{candidateWorkspace.summary.readyForReview}</p>
                      <p className="mt-1 text-sm text-slate-400">Profiles waiting for review.</p>
                    </div>
                  </div>
                </div>
                <div className="relative flex justify-center">
                  <div className="absolute inset-0 rounded-[28px] bg-[radial-gradient(circle,rgba(47,134,255,0.22),transparent_58%)] blur-3xl" />
                  <div className="relative rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6">
                    <OrbitMascot size="xl" />
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-200">
                        <Stars className="h-4 w-4 text-brand-300" />
                        Brand layer active
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-200">
                        <TimerReset className="h-4 w-4 text-teal-300" />
                        Loading states ready
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-200">
                        <Bot className="h-4 w-4 text-amber-300" />
                        Mascot moments added
                      </div>
                    </div>
                  </div>
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
                    <TimerReset className="h-4 w-4 text-rose-300" />
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
        eyebrow="Orbit-powered assessment studio"
        title="Make your assessment platform feel like a finished product"
        subtitle="A brighter first load, a stronger landing page, and a polished runtime from invite to result."
      >
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-300/25 bg-brand-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-brand-300">
                <Sparkles className="h-3.5 w-3.5" />
                Finalize the experience
              </div>
              <div className="space-y-3">
                <h2 className="max-w-2xl font-display text-5xl leading-[0.95] text-white md:text-6xl">
                  Screening software that feels smart, branded, and ready to ship.
                </h2>
                <p className="max-w-2xl text-base leading-7 text-slate-300">
                  Launch role-aware assessments, give candidates a more memorable front door, and review results in a workspace that already feels premium.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-brand-300">Branded first load</p>
                  <p className="mt-2 text-sm text-slate-200">Mascot-led loading and motion cues that soften transitions.</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-teal-300">Better landing</p>
                  <p className="mt-2 text-sm text-slate-200">A hero section with more personality, hierarchy, and confidence.</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-amber-300">Tab + nav icons</p>
                  <p className="mt-2 text-sm text-slate-200">Sharper scanability in the browser and inside the app.</p>
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

          <div className="grid gap-4 md:grid-cols-3">
            <StagePanel className="space-y-3">
              <div className="flex items-center gap-2 text-brand-300">
                <Bot className="h-4 w-4" />
                <p className="text-[11px] uppercase tracking-[0.22em]">Cute without clutter</p>
              </div>
              <h3 className="text-2xl text-white">Mascot moments</h3>
              <p className="text-sm leading-6 text-slate-300">
                Orbit appears in loading states, hero panels, and empty-feeling surfaces to make the product feel welcoming.
              </p>
            </StagePanel>

            <StagePanel className="space-y-3">
              <div className="flex items-center gap-2 text-teal-300">
                <Sparkles className="h-4 w-4" />
                <p className="text-[11px] uppercase tracking-[0.22em]">Motion that helps</p>
              </div>
              <h3 className="text-2xl text-white">Smoother perception</h3>
              <p className="text-sm leading-6 text-slate-300">
                Loading bars, ambient backgrounds, and reveal transitions make the app feel responsive instead of abrupt.
              </p>
            </StagePanel>

            <StagePanel className="space-y-3">
              <div className="flex items-center gap-2 text-amber-300">
                <Stars className="h-4 w-4" />
                <p className="text-[11px] uppercase tracking-[0.22em]">Product polish</p>
              </div>
              <h3 className="text-2xl text-white">A stronger front door</h3>
              <p className="text-sm leading-6 text-slate-300">
                New branding, improved navigation, and a richer landing page raise trust before users touch any workflow.
              </p>
            </StagePanel>
          </div>

          <StagePanel tone="summary" className="overflow-hidden">
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div className="flex justify-center lg:justify-start">
                <OrbitMascot size="xl" />
              </div>
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.28em] text-brand-300">What this first pass adds</p>
                <h3 className="font-display text-3xl text-white">A product that immediately reads as cared for.</h3>
                <p className="text-sm leading-6 text-slate-300">
                  Start with the polished home experience, then extend the same mascot, icon, and motion language to empty states, runtime loading, and share flows.
                </p>
              </div>
            </div>
          </StagePanel>
        </div>
      </SceneShell>
    </SceneTransition>
  );
}
