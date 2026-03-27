import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { SceneTransition } from "@/components/motion/SceneTransition";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";
import { PaginationBar } from "@/components/workspace/PaginationBar";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { PeopleViewSwitch } from "@/components/people/PeopleViewSwitch";
import { listEmployeeWorkspacePage } from "@/lib/db/employee-workspace";

export const dynamic = "force-dynamic";

type PageState = {
  q?: string;
  contextType?: string;
  reviewState?: string;
  page?: string;
  pageSize?: string;
};

function buildHref(params: URLSearchParams, overrides: Record<string, string | undefined>): Route {
  const next = new URLSearchParams(params.toString());
  for (const [key, value] of Object.entries(overrides)) {
    if (!value) next.delete(key);
    else next.set(key, value);
  }
  return `/people/employees${next.toString() ? `?${next.toString()}` : ""}` as Route;
}

function statusTone(status: string): "neutral" | "emerald" | "teal" {
  if (status === "submitted") return "emerald";
  if (status === "in_progress") return "teal";
  return "neutral";
}

function reviewTone(status?: string): "amber" | "emerald" | "red" {
  if (status === "flagged") return "red";
  if (status === "reviewed") return "emerald";
  return "amber";
}

function contextLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function PeopleEmployeesPage({
  searchParams
}: {
  searchParams: Promise<PageState>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => typeof value === "string" && value.length > 0)
      .map(([key, value]) => [key, value as string])
  );
  const page = await listEmployeeWorkspacePage({
    q: params.q?.trim() || undefined,
    contextType: params.contextType?.trim() || undefined,
    reviewState: params.reviewState?.trim() || undefined,
    page: Number(params.page ?? 1),
    pageSize: Number(params.pageSize ?? 12)
  });

  return (
    <SceneTransition>
      <SceneShell
        variant="results"
        eyebrow="People workspace"
        title="Employees"
        subtitle="Internal tracking stays here. Follow assessments, certifications, and recent outcomes without the hiring layer around it."
        utility={
          <div className="flex flex-wrap items-center gap-2">
            <PeopleViewSwitch current="employees" />
            <Link href="/employee">
              <Button variant="secondary">Internal access</Button>
            </Link>
          </div>
        }
      >
        <StaggerGroup className="space-y-5" delay={0.04}>
          <StaggerItem>
            <StagePanel className="space-y-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl text-white">Employee view</h2>
                  <p className="text-sm text-slate-300">Track internal assessments and certifications without the hiring workflow noise.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill label={`${page.summary.activeEmployees} employees`} tone="neutral" />
                  <StatusPill label={`${page.summary.withCompletedResults} with results`} tone="teal" />
                  <StatusPill label={`${page.summary.certifications} certifications`} tone="amber" />
                </div>
              </div>

              <form className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
                <input type="hidden" name="pageSize" value={params.pageSize ?? String(page.pageSize)} />
                <input
                  name="q"
                  defaultValue={params.q ?? ""}
                  placeholder="Search name, email, employee ID, assessment"
                  className="rounded-[16px] border border-white/12 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-300/60"
                />
                <select
                  name="contextType"
                  defaultValue={params.contextType ?? ""}
                  className="rounded-[16px] border border-white/12 bg-ink-950 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-300/60"
                >
                  <option value="">All contexts</option>
                  {page.contextOptions.map((option) => (
                    <option key={option} value={option}>
                      {contextLabel(option)}
                    </option>
                  ))}
                </select>
                <select
                  name="reviewState"
                  defaultValue={params.reviewState ?? ""}
                  className="rounded-[16px] border border-white/12 bg-ink-950 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-300/60"
                >
                  <option value="">All review states</option>
                  {page.reviewStateOptions.map((option) => (
                    <option key={option} value={option}>
                      {contextLabel(option)}
                    </option>
                  ))}
                </select>
                <Button>Apply</Button>
                <Link href="/people/employees">
                  <Button type="button" variant="secondary">
                    Reset
                  </Button>
                </Link>
              </form>
            </StagePanel>
          </StaggerItem>

          {page.rows.length === 0 ? (
            <StaggerItem>
              <StagePanel className="space-y-3">
                <h2 className="text-2xl text-white">No employees match this view</h2>
                <p className="text-sm text-slate-300">Employees appear here after using internal access for assessments or certifications.</p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/employee">
                    <Button>Open internal access</Button>
                  </Link>
                  <Link href="/people/employees">
                    <Button variant="secondary">Reset filters</Button>
                  </Link>
                </div>
              </StagePanel>
            </StaggerItem>
          ) : (
            <StaggerItem>
              <div className="space-y-3">
                {page.rows.map((employee) => (
                  <div key={employee.id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <StatusPill label={employee.latestStatus.replaceAll("_", " ")} tone={statusTone(employee.latestStatus)} />
                          <StatusPill label={contextLabel(employee.latestContextType)} tone="blue" />
                          {employee.latestReviewState ? (
                            <StatusPill label={contextLabel(employee.latestReviewState)} tone={reviewTone(employee.latestReviewState)} />
                          ) : null}
                        </div>
                        <div className="space-y-1">
                          <p className="text-lg text-white">{employee.fullName}</p>
                          <p className="text-sm text-slate-300">{employee.email}</p>
                        </div>
                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
                          <span>{employee.employeeId ? `Employee ID: ${employee.employeeId}` : "Employee ID not set"}</span>
                          <span>{employee.latestAssessmentLabel ?? "No assessment attached yet"}</span>
                          <span>{employee.completedCount} completed</span>
                          <span>{employee.latestSubmittedAt ? `Latest submit ${new Date(employee.latestSubmittedAt).toLocaleDateString()}` : "No completed attempt yet"}</span>
                        </div>
                        <p className="text-sm text-slate-300">
                          Latest result: {typeof employee.latestScore === "number" ? `${employee.latestScore.toFixed(1)} / 100` : "Still in progress"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        {employee.latestAttemptId ? (
                          <Link href={`/results/${employee.latestAttemptId}`}>
                            <Button variant="secondary">View result</Button>
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </StaggerItem>
          )}

          <StaggerItem>
            <PaginationBar
              page={page.page}
              pageSize={page.pageSize}
              total={page.total}
              makeHref={(nextPage) => buildHref(query, { page: String(nextPage) })}
            />
          </StaggerItem>
        </StaggerGroup>
      </SceneShell>
    </SceneTransition>
  );
}
