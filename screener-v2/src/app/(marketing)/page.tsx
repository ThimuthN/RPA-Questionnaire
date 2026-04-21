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
  const primaryHeroLabel = session ? "Open workspace" : "See the workspace";
  const secondaryHeroLabel = session ? "Open results" : "Watch demo";
  const [candidateWorkspace, resultWorkspace] = session
      ? await Promise.all([
        listCandidateWorkspacePage({ intakeBucket: "pipeline", sort: "inbox", pageSize: 5 }),
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
        tone="page"
      >
        <StaggerGroup className="space-y-10">
          <section className="relative max-w-5xl overflow-hidden rounded-[34px] border border-[color:var(--app-border)] bg-[radial-gradient(circle_at_top_left,rgba(47,134,255,0.18),transparent_30%),radial-gradient(circle_at_78%_14%,rgba(157,140,255,0.10),transparent_22%),linear-gradient(180deg,rgba(16,39,73,0.84),rgba(5,11,22,0.96))] px-7 py-8 shadow-[var(--app-shadow)] md:px-10 md:py-10">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_36%,transparent_60%,rgba(111,215,255,0.03))]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50" />
            <div className="pointer-events-none absolute inset-0 rounded-[34px] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_0_0_1px_rgba(255,255,255,0.02)]" />
            <StaggerGroup className="relative z-10 space-y-6" delay={0.04}>
              <StaggerItem>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-brand-300">Tracking trajectory</p>
                  </div>
                  <div className="max-w-4xl space-y-3">
                    <h1 className="font-display text-5xl leading-[0.94] text-white sm:text-6xl md:text-7xl">Track people.</h1>
                    <div className="font-display text-5xl leading-[0.94] text-white sm:text-6xl md:text-7xl" aria-hidden="true">
                      <TypedWordCycle
                        prefix=""
                        words={["Review clearly.", "Follow progress.", "Decide faster."]}
                        className="text-white"
                      />
                    </div>
                  </div>
                </div>
              </StaggerItem>
              <StaggerItem>
              <p className="max-w-2xl text-base leading-8 text-[color:var(--app-scene-text)] sm:text-lg">
                Northstar helps hiring teams and people ops manage people, reviews, and next steps in one place.
              </p>
            </StaggerItem>
            <StaggerItem>
              <div className="flex flex-wrap gap-3">
                <Link href={workspaceHref}>
                  <Button className="gap-2">
                    {primaryHeroLabel}
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
                    items={["Hiring teams", "People ops", "Internal growth", "Audits", "Progress reviews"]}
                    className="max-w-[40rem]"
                  />
                </div>
              </StaggerItem>
            </StaggerGroup>
          </section>

          <ViewportReveal delay={0.06}>
            <section className="relative overflow-hidden px-1 py-2">
              <div className="pointer-events-none absolute left-0 top-0 h-px w-28 bg-[linear-gradient(90deg,rgba(138,184,255,0.95),transparent)]" />
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.28em] text-brand-300">How it works</p>
                <h2 className="text-4xl leading-[0.96] text-[color:var(--app-heading)]">
                  <ScrambleReveal text="Know who to review. Know what to do next." className="text-scramble-glow" />
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-[color:var(--app-muted)]">
                  Northstar keeps people, reviews, and decisions tied together so nothing gets lost between steps.
                </p>
              </div>
              <div className="mt-8 grid gap-5 md:grid-cols-3 md:gap-8">
                {[
                  ["01", "Track", "See the person, role, owner, and history right away.", "text-brand-300"],
                  ["02", "Review", "Run assessments, audits, and check-ins in the same workflow.", "text-teal-300"],
                  ["03", "Decide", "Use the full picture to move forward, hold, or follow up.", "text-amber-300"]
                ].map(([step, label, body, tone], index) => (
                  <ViewportReveal key={step} delay={0.08 + index * 0.06}>
                    <div className="border-t border-[color:var(--app-border)] pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0 first:md:border-l-0 first:md:pl-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className={`text-[11px] uppercase tracking-[0.24em] ${tone}`}>{label}</p>
                        <span className="text-[11px] text-[color:var(--app-muted)]">{step}</span>
                      </div>
                      <p className="mt-4 max-w-sm text-sm leading-7 text-[color:var(--app-muted)]">{body}</p>
                    </div>
                  </ViewportReveal>
                ))}
              </div>
            </section>
          </ViewportReveal>

          <ViewportReveal delay={0.08}>
            <section className="relative overflow-hidden px-1 py-2">
              <div className="pointer-events-none absolute left-0 top-0 h-px w-28 bg-[linear-gradient(90deg,rgba(18,179,168,0.8),transparent)]" />
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.28em] text-brand-300">Where it fits</p>
                <h2 className="text-4xl leading-[0.96] text-[color:var(--app-heading)]">
                  <ScrambleReveal text="Built for hiring teams and people ops." className="text-scramble-glow" />
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-[color:var(--app-muted)]">
                  Use Northstar for hiring, internal growth, audits, and progression reviews.
                </p>
              </div>
              <div className="mt-8 grid gap-5 md:grid-cols-3 md:gap-8">
                {[
                  ["Hiring", "Track candidates, reviews, and next steps without juggling separate tools."],
                  ["Internal growth", "Review employees for new roles, readiness, and movement."],
                  ["Audits", "Keep standards, check-ins, and outcomes tied to the right person."]
                ].map(([title, body], index) => (
                  <ViewportReveal key={title} delay={0.08 + index * 0.06}>
                    <div className="border-t border-[color:var(--app-border)] pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0 first:md:border-l-0 first:md:pl-0">
                      <h3 className="text-2xl text-[color:var(--app-heading)]">{title}</h3>
                      <p className="mt-3 max-w-sm text-sm leading-7 text-[color:var(--app-muted)]">{body}</p>
                    </div>
                  </ViewportReveal>
                ))}
              </div>
            </section>
          </ViewportReveal>

          {session && candidateWorkspace && resultWorkspace ? (
            <StaggerGroup className="space-y-5" delay={0.12}>
              <StaggerItem>
                <section className="relative overflow-hidden px-1 py-2">
                  <div className="pointer-events-none absolute left-0 top-0 h-px w-28 bg-[linear-gradient(90deg,rgba(255,255,255,0.45),transparent)]" />
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-brand-300">Inside the workspace</p>
                      <p className="max-w-3xl text-sm leading-7 text-[color:var(--app-text)]">
                        See what needs setup, what is ready for review, and what has gone quiet.
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
                </section>
              </StaggerItem>

              {candidateWorkspace.total === 0 && resultWorkspace.total === 0 ? (
                <StaggerItem>
                  <WorkspaceEmptyState
                    title="Your workspace is ready."
                    description="Add people, define the role, and start the first review when you're ready."
                  />
                </StaggerItem>
              ) : null}

              <div className="grid gap-5 border-t border-[color:var(--app-border)] pt-6 md:grid-cols-3 md:gap-8">
                <StaggerItem hover>
                  <section className="space-y-3 border-t border-[color:var(--app-border)] pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0 first:md:border-l-0 first:md:pl-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <BriefcaseBusiness className="h-4 w-4 text-amber-300" />
                        <p className="text-sm text-[color:var(--app-text)]">Needs setup</p>
                      </div>
                      <StatusPill label={String(candidateWorkspace.summary.needsResume)} tone="amber" />
                    </div>
                    <CountUpValue value={candidateWorkspace.summary.needsResume} className="font-display text-4xl text-[color:var(--app-heading)]" />
                    <p className="max-w-sm text-sm leading-7 text-[color:var(--app-muted)]">People who still need the basics in place before review can move.</p>
                  </section>
                </StaggerItem>

                <StaggerItem hover>
                  <section className="space-y-3 border-t border-[color:var(--app-border)] pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-brand-300" />
                        <p className="text-sm text-[color:var(--app-text)]">Ready for review</p>
                      </div>
                      <StatusPill label={String(candidateWorkspace.summary.readyForReview)} tone="blue" />
                    </div>
                    <CountUpValue value={candidateWorkspace.summary.readyForReview} className="font-display text-4xl text-[color:var(--app-heading)]" />
                    <p className="max-w-sm text-sm leading-7 text-[color:var(--app-muted)]">Reviews or submitted work waiting on a decision.</p>
                  </section>
                </StaggerItem>

                <StaggerItem hover>
                  <section className="space-y-3 border-t border-[color:var(--app-border)] pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-rose-300" />
                        <p className="text-sm text-[color:var(--app-text)]">Stalled</p>
                      </div>
                      <StatusPill label={String(candidateWorkspace.summary.stalled)} tone="red" />
                    </div>
                    <CountUpValue value={candidateWorkspace.summary.stalled} className="font-display text-4xl text-[color:var(--app-heading)]" />
                    <p className="max-w-sm text-sm leading-7 text-[color:var(--app-muted)]">Work that has been quiet for too long and needs attention.</p>
                  </section>
                </StaggerItem>
              </div>

              <div className="grid gap-8 border-t border-[color:var(--app-border)] pt-6 xl:grid-cols-2">
                <StaggerItem>
                  <section className="space-y-4">
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
                              className="block border-t border-[color:var(--app-border)] pt-4 transition hover:translate-x-[2px]"
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
                  </section>
                </StaggerItem>

                <StaggerItem>
                  <section className="space-y-4">
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
                              className="block border-t border-[color:var(--app-border)] pt-4 transition hover:translate-x-[2px]"
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
                  </section>
                </StaggerItem>
              </div>
            </StaggerGroup>
          ) : null}
        </StaggerGroup>
      </SceneShell>
    </SceneTransition>
  );
}
