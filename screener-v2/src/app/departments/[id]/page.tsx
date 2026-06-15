import Link from "next/link";
import type { Route } from "next";
import { getDepartment } from "@/lib/db/departments";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";

export default async function DepartmentDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const department = await getDepartment(id);
  if (!department) {
    notFound();
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    openJobCount,
    applicantCount,
    stageCounts,
    stalledCount,
    noAssessmentCount,
    recentlyHiredCount,
    recentActivity
  ] = await Promise.all([
    prisma.jobPosting.count({ where: { role: { departmentId: id }, isOpen: true } }),
    prisma.candidateApplication.count({
      where: { jobPosting: { role: { departmentId: id } }, status: "submitted" }
    }),
    prisma.candidate.groupBy({
      by: ["stage"],
      where: { departmentId: id, orgStage: "active" },
      _count: { id: true }
    }),
    prisma.candidate.count({
      where: { departmentId: id, orgStage: "active", updatedAt: { lt: sevenDaysAgo } }
    }),
    prisma.candidate.count({
      where: {
        departmentId: id,
        orgStage: "active",
        assessments: { none: {} }
      }
    }),
    prisma.candidate.count({
      where: { departmentId: id, orgStage: "finalized", finalizedAs: "hired", updatedAt: { gte: thirtyDaysAgo } }
    }),
    prisma.candidateActivityEvent.findMany({
      where: { candidate: { departmentId: id } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        event: true,
        detail: true,
        actorName: true,
        createdAt: true,
        candidate: { select: { id: true, fullName: true } }
      }
    }).catch(() => [])
  ]);

  const stageOrder = ["pipeline", "screening", "interview", "advanced_review", "finalized"];
  const stageLabelMap: Record<string, string> = {
    pipeline: "Pipeline",
    screening: "Screening",
    interview: "Interview",
    advanced_review: "Review",
    finalized: "Finalized"
  };
  const stageCountMap = Object.fromEntries(
    stageCounts.map((s) => [s.stage, s._count.id])
  );
  const activePipeline = stageOrder
    .filter((s) => s !== "finalized")
    .map((s) => ({ stage: s, label: stageLabelMap[s] ?? s, count: stageCountMap[s] ?? 0 }));
  const totalActive = activePipeline.reduce((sum, s) => sum + s.count, 0);
  const maxCount = Math.max(...activePipeline.map((s) => s.count), 1);

  function eventLabel(event: string, detail: string | null | undefined): string {
    if (event === "stage_changed") return `Moved to ${detail ?? "stage"}`;
    if (event === "assessment_sent") return "Assessment sent";
    if (event === "assessment_completed") return "Assessment completed";
    if (event === "note_added") return "Note added";
    if (event === "hired") return "Marked as hired";
    if (event === "rejected") return "Marked as rejected";
    if (event === "resume_uploaded") return "Resume uploaded";
    return detail ?? event;
  }

  function timeAgo(date: Date): string {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="space-y-8">
      {/* Header row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Workspace overview</p>
          <h2 className="text-2xl text-[color:var(--app-heading)]">{department.name}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/departments/${id}/candidates` as Route}
            className="inline-flex items-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-4 py-2 text-sm font-medium text-[color:var(--app-text)] shadow-[var(--app-shadow-soft)] transition hover:bg-[color:var(--app-surface-soft)]"
          >
            View candidates
          </Link>
          <Link
            href={`/departments/${id}/jobs` as Route}
            className="inline-flex items-center rounded-full border border-transparent bg-[linear-gradient(135deg,var(--app-brand),var(--app-brand-strong))] px-4 py-2 text-sm font-medium text-white shadow-[0_8px_20px_color-mix(in_srgb,var(--app-brand)_24%,transparent)] transition hover:brightness-110"
          >
            Manage jobs
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Open roles", value: openJobCount, tone: "teal", href: `/departments/${id}/jobs` as Route },
          { label: "New applicants", value: applicantCount, tone: "blue", href: `/departments/${id}/applicants` as Route },
          { label: "Active pipeline", value: totalActive, tone: "neutral", href: `/departments/${id}/candidates` as Route },
          { label: "Stalled", value: stalledCount, tone: stalledCount > 0 ? "amber" : "neutral", href: `/departments/${id}/candidates?sort=stale_desc` as Route },
          { label: "Hired (30d)", value: recentlyHiredCount, tone: "emerald", href: `/departments/${id}/candidates?stage=finalized` as Route }
        ].map((kpi) => (
          <Link key={kpi.label} href={kpi.href}>
            <div className={[
              "group rounded-[20px] border p-4 transition hover:-translate-y-[1px]",
              kpi.tone === "teal"
                ? "border-[color:var(--pill-teal-border)] bg-[color:var(--pill-teal-bg)]"
                : kpi.tone === "blue"
                ? "border-[color:var(--pill-blue-border)] bg-[color:var(--pill-blue-bg)]"
                : kpi.tone === "emerald"
                ? "border-[color:var(--pill-emerald-border)] bg-[color:var(--pill-emerald-bg)]"
                : kpi.tone === "amber"
                ? "border-[color:var(--pill-amber-border)] bg-[color:var(--pill-amber-bg)]"
                : "border-[color:var(--app-border)] bg-[color:var(--app-surface)]"
            ].join(" ")}>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">{kpi.label}</p>
              <p className={[
                "mt-1.5 text-3xl font-semibold",
                kpi.tone === "teal" ? "text-[color:var(--pill-teal-text)]"
                  : kpi.tone === "blue" ? "text-[color:var(--pill-blue-text)]"
                  : kpi.tone === "emerald" ? "text-[color:var(--pill-emerald-text)]"
                  : kpi.tone === "amber" ? "text-[color:var(--pill-amber-text)]"
                  : "text-[color:var(--app-heading)]"
              ].join(" ")}>
                {kpi.value}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Pipeline funnel + activity */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Pipeline funnel */}
        <div className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 shadow-[var(--app-shadow-soft)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[color:var(--app-heading)]">Pipeline funnel</h3>
              <p className="text-xs text-[color:var(--app-muted)]">{totalActive} active candidates</p>
            </div>
            <Link
              href={`/departments/${id}/candidates` as Route}
              className="text-xs text-[color:var(--app-brand)] transition hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {activePipeline.map((s) => (
              <Link
                key={s.stage}
                href={`/departments/${id}/candidates?stage=${s.stage}` as Route}
                className="group flex items-center gap-3"
              >
                <span className="w-[80px] flex-shrink-0 text-right text-xs text-[color:var(--app-muted)] group-hover:text-[color:var(--app-text)]">
                  {s.label}
                </span>
                <div className="min-w-0 flex-1 overflow-hidden rounded-full bg-[color:var(--app-surface-muted)]">
                  <div
                    className="h-6 rounded-full bg-[linear-gradient(90deg,var(--app-brand),var(--app-brand-strong))] transition-all duration-300"
                    style={{ width: `${Math.round((s.count / maxCount) * 100)}%`, minWidth: s.count > 0 ? "1.5rem" : "0" }}
                  />
                </div>
                <span className="w-8 flex-shrink-0 text-right text-sm font-semibold text-[color:var(--app-heading)]">
                  {s.count}
                </span>
              </Link>
            ))}
          </div>

          {noAssessmentCount > 0 ? (
            <div className="mt-5 flex items-center justify-between rounded-[14px] border border-[color:var(--pill-amber-border)] bg-[color:var(--pill-amber-bg)] px-4 py-3">
              <p className="text-xs text-[color:var(--pill-amber-text)]">
                <span className="font-semibold">{noAssessmentCount}</span> active candidate{noAssessmentCount !== 1 ? "s" : ""} without an assessment
              </p>
              <Link
                href={`/departments/${id}/candidates?assessmentStatus=none&sort=inbox` as Route}
                className="text-xs font-medium text-[color:var(--pill-amber-text)] underline transition hover:opacity-70"
              >
                Review
              </Link>
            </div>
          ) : null}
        </div>

        {/* Recent activity */}
        <div className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 shadow-[var(--app-shadow-soft)]">
          <h3 className="mb-4 text-base font-semibold text-[color:var(--app-heading)]">Recent activity</h3>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-[color:var(--app-muted)]">No activity yet.</p>
          ) : (
            <ol className="space-y-3">
              {recentActivity.map((ev) => (
                <li key={ev.id} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[color:var(--app-brand)]/60" />
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm text-[color:var(--app-text)] leading-snug">
                      <Link
                        href={`/people/candidates/${ev.candidate.id}` as Route}
                        className="font-medium text-[color:var(--app-heading)] hover:underline"
                      >
                        {ev.candidate.fullName}
                      </Link>
                      {" — "}
                      {eventLabel(ev.event, ev.detail)}
                    </p>
                    <p className="text-[11px] text-[color:var(--app-muted)]">
                      {ev.actorName ?? "System"} · {timeAgo(ev.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Candidates", description: "Active pipeline", href: `/departments/${id}/candidates` as Route },
          { label: "Jobs", description: "Open postings", href: `/departments/${id}/jobs` as Route },
          { label: "Assessments", description: "Review kits", href: `/departments/${id}/assessments` as Route },
          { label: "Team", description: "Hiring team", href: `/departments/${id}/users` as Route }
        ].map((nav) => (
          <Link key={nav.label} href={nav.href}>
            <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 transition hover:bg-[color:var(--app-surface)] hover:-translate-y-[1px]">
              <p className="text-sm font-semibold text-[color:var(--app-heading)]">{nav.label}</p>
              <p className="mt-0.5 text-xs text-[color:var(--app-muted)]">{nav.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
