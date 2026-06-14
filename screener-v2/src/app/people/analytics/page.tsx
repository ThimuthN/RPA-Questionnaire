import { requirePageSession } from "@/lib/auth/guards";
import { SceneShell } from "@/components/scene/SceneShell";
import { SceneTransition } from "@/components/motion/SceneTransition";
import { PeopleViewSwitch } from "@/components/people/PeopleViewSwitch";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function PeopleAnalyticsPage() {
  await requirePageSession("/people/analytics");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    stageGroups,
    finalizedGroups,
    activeCandidates,
    applicationsThisMonth,
    activeJobs,
    offerGroups,
    recentApplications,
  ] = await Promise.all([
    prisma.candidate.groupBy({ by: ["stage"], _count: { id: true } }),
    prisma.candidate.groupBy({
      by: ["finalizedAs"],
      where: { stage: "finalized" },
      _count: { id: true },
    }),
    // avg days: get createdAt for non-finalized, non-new candidates
    prisma.candidate.findMany({
      where: { stage: { notIn: ["finalized", "new"] } },
      select: { createdAt: true },
    }),
    prisma.candidateApplication.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.jobPosting.count({ where: { isOpen: true, isPublished: true } }),
    prisma.candidateOffer.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.candidateApplication.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Compute avg days in pipeline
  const avgDaysInPipeline =
    activeCandidates.length > 0
      ? Math.round(
          activeCandidates.reduce((sum, c) => {
            return sum + (now.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / activeCandidates.length
        )
      : 0;

  // Stage breakdown helpers
  const stageCount = (s: string) =>
    stageGroups.find((g) => g.stage === s)?._count.id ?? 0;

  const totalActiveCandidates = stageGroups
    .filter((g) => g.stage !== "finalized")
    .reduce((sum, g) => sum + g._count.id, 0);

  // Finalized breakdown
  const hiredCount =
    finalizedGroups.find((g) => g.finalizedAs === "hired")?._count.id ?? 0;
  const rejectedCount =
    finalizedGroups.find((g) => g.finalizedAs === "rejected")?._count.id ?? 0;

  // Offer funnel helpers
  const offerCount = (s: string) =>
    offerGroups.find((g) => g.status === s)?._count.id ?? 0;

  const totalOffers = offerGroups.reduce((sum, g) => sum + g._count.id, 0);

  // Applications per day (last 30 days)
  const appsByDay: Record<string, number> = {};
  for (const app of recentApplications) {
    const day = app.createdAt.toISOString().slice(0, 10);
    appsByDay[day] = (appsByDay[day] ?? 0) + 1;
  }
  const appDayEntries = Object.entries(appsByDay).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <SceneTransition>
      <SceneShell
        variant="results"
        tone="page"
        eyebrow="Hiring"
        title="Analytics"
        subtitle="Hiring pipeline overview"
        utility={<PeopleViewSwitch current="analytics" />}
      >
        <div className="space-y-8">
          {/* Key metrics row */}
          <section>
            <h2
              className="mb-4 text-sm font-semibold uppercase tracking-widest"
              style={{ color: "var(--app-muted)" }}
            >
              Key Metrics
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Active Jobs" value={activeJobs} />
              <StatCard
                label="Applications This Month"
                value={applicationsThisMonth}
              />
              <StatCard
                label="Active Candidates"
                value={totalActiveCandidates}
              />
              <StatCard label="Offers Sent" value={totalOffers} />
            </div>
          </section>

          {/* Avg days in pipeline */}
          <section>
            <h2
              className="mb-4 text-sm font-semibold uppercase tracking-widest"
              style={{ color: "var(--app-muted)" }}
            >
              Pipeline Health
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatCard
                label="Avg Days in Pipeline"
                value={avgDaysInPipeline}
                suffix="days"
              />
              <StatCard
                label="Applications (last 30 days)"
                value={recentApplications.length}
              />
            </div>
          </section>

          {/* Pipeline breakdown */}
          <section>
            <h2
              className="mb-4 text-sm font-semibold uppercase tracking-widest"
              style={{ color: "var(--app-muted)" }}
            >
              Pipeline Breakdown
            </h2>
            <div
              className="rounded-[20px] border overflow-hidden"
              style={{
                background: "var(--app-surface)",
                borderColor: "var(--app-border)",
              }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--app-border)",
                      color: "var(--app-muted)",
                    }}
                  >
                    <th className="px-5 py-3 text-left font-medium">Stage</th>
                    <th className="px-5 py-3 text-right font-medium">
                      Candidates
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Pipeline", key: "pipeline" },
                    { label: "Screening", key: "screening" },
                    { label: "Interview", key: "interview" },
                    { label: "Advanced Review", key: "advanced_review" },
                    { label: "Finalized — Hired", key: "_hired" },
                    { label: "Finalized — Rejected", key: "_rejected" },
                  ].map((row, i, arr) => {
                    const count =
                      row.key === "_hired"
                        ? hiredCount
                        : row.key === "_rejected"
                        ? rejectedCount
                        : stageCount(row.key);
                    return (
                      <tr
                        key={row.key}
                        style={{
                          borderBottom:
                            i < arr.length - 1
                              ? "1px solid var(--app-border)"
                              : undefined,
                          color: "var(--app-text)",
                        }}
                      >
                        <td className="px-5 py-3">{row.label}</td>
                        <td
                          className="px-5 py-3 text-right font-semibold tabular-nums"
                          style={{ color: "var(--app-heading)" }}
                        >
                          {count}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Offer funnel */}
          <section>
            <h2
              className="mb-4 text-sm font-semibold uppercase tracking-widest"
              style={{ color: "var(--app-muted)" }}
            >
              Offer Funnel
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Draft" value={offerCount("draft")} />
              <StatCard label="Sent" value={offerCount("sent")} />
              <StatCard label="Accepted" value={offerCount("accepted")} />
              <StatCard label="Declined" value={offerCount("rejected")} />
            </div>
          </section>

          {/* Recent applications sparkline (text) */}
          {appDayEntries.length > 0 && (
            <section>
              <h2
                className="mb-4 text-sm font-semibold uppercase tracking-widest"
                style={{ color: "var(--app-muted)" }}
              >
                Applications — Last 30 Days
              </h2>
              <div
                className="rounded-[20px] border p-5"
                style={{
                  background: "var(--app-surface)",
                  borderColor: "var(--app-border)",
                }}
              >
                <div className="flex flex-wrap gap-2">
                  {appDayEntries.map(([day, count]) => (
                    <div key={day} className="flex flex-col items-center gap-0.5">
                      <span
                        className="text-xs font-semibold tabular-nums"
                        style={{ color: "var(--app-brand)" }}
                      >
                        {count}
                      </span>
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--app-muted)" }}
                      >
                        {day.slice(5)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </SceneShell>
    </SceneTransition>
  );
}

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div
      className="rounded-[20px] border p-5"
      style={{
        background: "var(--app-surface)",
        borderColor: "var(--app-border)",
      }}
    >
      <p
        className="mb-1 text-xs font-medium uppercase tracking-wide"
        style={{ color: "var(--app-muted)" }}
      >
        {label}
      </p>
      <p
        className="text-3xl font-bold tabular-nums"
        style={{ color: "var(--app-heading)" }}
      >
        {value.toLocaleString()}
        {suffix && (
          <span
            className="ml-1.5 text-base font-normal"
            style={{ color: "var(--app-muted)" }}
          >
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}
