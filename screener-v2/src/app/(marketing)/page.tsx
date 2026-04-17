import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3
} from "lucide-react";
import { WorkspaceEmptyState } from "@/components/brand/WorkspaceEmptyState";
import { SceneTransition } from "@/components/motion/SceneTransition";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";
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
        eyebrow="Assessment workspace"
        title="Create, run, and review assessments."
        subtitle="Keep candidates, results, and assessments in one place."
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
        <StaggerGroup className="space-y-6">
          <StaggerItem>
            <StagePanel className="overflow-hidden">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_340px] lg:items-start">
                <div className="space-y-5">
                  <div className="space-y-3">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-brand-300">Assessment workspace</p>
                    <h2 className="max-w-2xl text-4xl leading-tight text-[color:var(--app-heading)] sm:text-5xl">
                      Create assessments and keep work moving.
                    </h2>
                    <p className="max-w-2xl text-base leading-8 text-[color:var(--app-scene-text)] sm:text-lg">
                      Build an assessment, send it out, and review the result without digging through the system.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link href={createHref}>
                      <Button className="gap-2">
                        Create assessment
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={session ? "/candidates" : "/results"}>
                      <Button variant="secondary">{session ? "Open candidates" : "View results"}</Button>
                    </Link>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-sm text-[color:var(--app-heading)]">Track candidates</p>
                      <p className="text-sm leading-6 text-[color:var(--app-muted)]">Keep the hiring flow, notes, and decisions in one place.</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-[color:var(--app-heading)]">Review results</p>
                      <p className="text-sm leading-6 text-[color:var(--app-muted)]">Open the latest submission and decide quickly.</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-[color:var(--app-heading)]">Manage assessments</p>
                      <p className="text-sm leading-6 text-[color:var(--app-muted)]">Keep add-ons, tests, and outcomes organized.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-5 shadow-[var(--app-shadow-soft)]">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-brand-300">Start here</p>
                      <h3 className="text-2xl text-[color:var(--app-heading)]">Open the right workspace.</h3>
                    </div>

                    <div className="space-y-3">
                      <Link
                        href="/candidates"
                        className="block rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] p-4 transition hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm text-[color:var(--app-heading)]">Candidates</p>
                            <p className="text-sm text-[color:var(--app-muted)]">Track progress, notes, and decisions.</p>
                          </div>
                          {session && candidateWorkspace ? (
                            <StatusPill label={`${candidateWorkspace.total}`} tone="blue" />
                          ) : null}
                        </div>
                      </Link>

                      <Link
                        href="/results"
                        className="block rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] p-4 transition hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm text-[color:var(--app-heading)]">Results</p>
                            <p className="text-sm text-[color:var(--app-muted)]">Review submissions and link them fast.</p>
                          </div>
                          {session && resultWorkspace ? (
                            <StatusPill label={`${resultWorkspace.total}`} tone="neutral" />
                          ) : null}
                        </div>
                      </Link>

                      <Link
                        href="/assessments"
                        className="block rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] p-4 transition hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)]"
                      >
                        <div className="space-y-1">
                          <p className="text-sm text-[color:var(--app-heading)]">Assessments</p>
                          <p className="text-sm text-[color:var(--app-muted)]">Create and manage the tests you want to use.</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </StagePanel>
          </StaggerItem>

          <StaggerItem>
            <StagePanel>
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-brand-300">How it works</p>
                  <h2 className="text-3xl text-[color:var(--app-heading)] sm:text-4xl">Create, send, review.</h2>
                  <p className="max-w-2xl text-sm leading-7 text-[color:var(--app-muted)]">
                    Keep the flow simple from setup to decision.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  {[
                    ["01", "Create", "Build the assessment you need without overcomplicating the setup."],
                    ["02", "Send", "Invite the candidate and keep the process moving."],
                    ["03", "Review", "Open the result, make the decision, and move on to the next step."]
                  ].map(([step, label, body]) => (
                    <div key={step} className="space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-brand-300">{step}</p>
                      <h3 className="text-xl text-[color:var(--app-heading)]">{label}</h3>
                      <p className="text-sm leading-7 text-[color:var(--app-muted)]">{body}</p>
                    </div>
                  ))}
                </div>
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

              <StaggerItem>
                <StagePanel>
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <BriefcaseBusiness className="h-4 w-4 text-amber-300" />
                        <p className="text-sm text-[color:var(--app-text)]">Needs setup</p>
                      </div>
                      <p className="font-display text-3xl text-[color:var(--app-heading)]">{candidateWorkspace.summary.needsResume}</p>
                      <p className="text-sm text-[color:var(--app-muted)]">Candidates that still need the basics before work can move.</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-brand-300" />
                        <p className="text-sm text-[color:var(--app-text)]">Ready for review</p>
                      </div>
                      <p className="font-display text-3xl text-[color:var(--app-heading)]">{candidateWorkspace.summary.readyForReview}</p>
                      <p className="text-sm text-[color:var(--app-muted)]">Submitted work waiting on a decision.</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-rose-300" />
                        <p className="text-sm text-[color:var(--app-text)]">Stalled</p>
                      </div>
                      <p className="font-display text-3xl text-[color:var(--app-heading)]">{candidateWorkspace.summary.stalled}</p>
                      <p className="text-sm text-[color:var(--app-muted)]">Candidates or tasks that have been sitting too long.</p>
                    </div>
                  </div>
                </StagePanel>
              </StaggerItem>

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
