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
import { requirePageSession } from "@/lib/auth/guards";
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

function filterFieldClassName() {
  return "rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/50 focus:bg-[color:var(--app-control-bg-strong)]";
}

const tableShellClassName =
  "overflow-hidden rounded-[24px] bg-[color:var(--app-surface)] shadow-[var(--app-shadow-soft)] ring-1 ring-[color:var(--app-border)]";

const tableHeadClassName =
  "bg-[color:var(--app-surface-soft)] text-left text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--app-muted)]";

const tableCellClassName =
  "px-4 py-4 text-sm text-[color:var(--app-text)] align-middle border-t border-[color:var(--app-border)]";

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
  const nextPath = `/people/employees${query.toString() ? `?${query.toString()}` : ""}`;
  await requirePageSession(nextPath);
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
        tone="page"
        eyebrow="People"
        title="Employees"
        subtitle="Track assessments, certifications, and recent results."
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
            <div className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  <StatusPill label={`${page.summary.activeEmployees} employees`} tone="neutral" />
                  <StatusPill label={`${page.summary.withCompletedResults} with results`} tone="teal" />
                  <StatusPill label={`${page.summary.certifications} certifications`} tone="amber" />
                </div>
              </div>

              <form className="grid gap-3 rounded-[24px] bg-[color:var(--app-surface)] p-4 shadow-[var(--app-shadow-soft)] ring-1 ring-[color:var(--app-border)] xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
                <input type="hidden" name="pageSize" value={params.pageSize ?? String(page.pageSize)} />
                <input
                  name="q"
                  defaultValue={params.q ?? ""}
                  placeholder="Search name, email, ID, or assessment"
                  className={filterFieldClassName()}
                />
                <select
                  name="contextType"
                  defaultValue={params.contextType ?? ""}
                  className={filterFieldClassName()}
                >
                  <option value="">Context</option>
                  {page.contextOptions.map((option) => (
                    <option key={option} value={option}>
                      {contextLabel(option)}
                    </option>
                  ))}
                </select>
                <select
                  name="reviewState"
                  defaultValue={params.reviewState ?? ""}
                  className={filterFieldClassName()}
                >
                  <option value="">Review</option>
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
            </div>
          </StaggerItem>

          {page.rows.length === 0 ? (
            <StaggerItem>
              <StagePanel className="space-y-3">
                <h2 className="text-2xl text-[color:var(--app-heading)]">No employees match this view</h2>
                <p className="text-sm text-[color:var(--app-muted)]">Employees appear here after using internal access for assessments or certifications.</p>
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
              <div className={tableShellClassName}>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className={tableHeadClassName}>
                      <tr>
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Email</th>
                        <th className="px-4 py-3 font-medium">Role / ID</th>
                        <th className="px-4 py-3 font-medium">Assessment</th>
                        <th className="px-4 py-3 font-medium">Latest result</th>
                        <th className="px-4 py-3 font-medium">Completed</th>
                        <th className="px-4 py-3 font-medium">Submitted</th>
                        <th className="px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {page.rows.map((employee) => (
                        <tr key={employee.id} className="transition hover:bg-[color:var(--app-surface-soft)]/70">
                          <td className={tableCellClassName}>
                            <div className="min-w-[180px]">
                              <p className="font-medium text-[color:var(--app-heading)]">{employee.fullName}</p>
                              <p className="mt-0.5 text-xs text-[color:var(--app-muted)]">
                                {employee.latestReviewState ? contextLabel(employee.latestReviewState) : contextLabel(employee.latestStatus)}
                              </p>
                            </div>
                          </td>
                          <td className={tableCellClassName}>{employee.email}</td>
                          <td className={tableCellClassName}>
                            <div className="min-w-[170px]">
                              <p>{contextLabel(employee.latestContextType)}</p>
                              <p className="mt-0.5 text-xs text-[color:var(--app-muted)]">
                                {employee.employeeId || "ID not set"}
                              </p>
                            </div>
                          </td>
                          <td className={tableCellClassName}>{employee.latestAssessmentLabel ?? "Not attached"}</td>
                          <td className={tableCellClassName}>
                            <div className="flex items-center gap-2">
                              <StatusPill label={employee.latestStatus.replaceAll("_", " ")} tone={statusTone(employee.latestStatus)} />
                              <span className="text-xs text-[color:var(--app-muted)]">
                                {typeof employee.latestScore === "number" ? `${employee.latestScore.toFixed(1)} / 100` : "In progress"}
                              </span>
                            </div>
                          </td>
                          <td className={tableCellClassName}>{employee.completedCount}</td>
                          <td className={tableCellClassName}>
                            {employee.latestSubmittedAt ? new Date(employee.latestSubmittedAt).toLocaleDateString() : "—"}
                          </td>
                          <td className={tableCellClassName}>
                            <div className="flex justify-end">
                              {employee.latestAttemptId ? (
                                <Link href={`/results/${employee.latestAttemptId}`}>
                                  <Button variant="secondary">View result</Button>
                                </Link>
                              ) : (
                                <span className="text-xs text-[color:var(--app-muted)]">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
