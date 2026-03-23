import Link from "next/link";
import { AttemptTable } from "@/components/results/AttemptTable";
import { listResults } from "@/lib/db/repositories";
import { StatusPill } from "@/components/primitives/StatusPill";
import { Button } from "@/components/primitives/Button";
import { SceneShell } from "@/components/scene/SceneShell";
import type { RoleId } from "@/lib/assessment-engine/types";
import { copy } from "@/lib/design/copy";
import { filterAndSortResults, type IntegrityRiskLevel, type ResultSortKey, type ResultStatusFilter } from "@/lib/results/triage";

export const dynamic = "force-dynamic";

const statusOptions: ResultStatusFilter[] = ["pass", "review", "fail"];
const integrityOptions: IntegrityRiskLevel[] = ["clean", "watch", "review"];
const roleOptions: RoleId[] = ["Intern", "Associate", "SE", "SeniorSE", "TechLead"];
const sortOptions: ResultSortKey[] = ["newest", "score_desc", "score_asc", "risk_desc"];

export default async function ResultsPage({
  searchParams
}: {
  searchParams: Promise<{
    deleted?: string;
    error?: string;
    q?: string;
    status?: string;
    integrity?: string;
    role?: string;
    sort?: string;
  }>;
}) {
  const pageState = await searchParams;
  const allRows = await listResults();
  const filters = {
    q: pageState.q?.trim() || undefined,
    status: statusOptions.includes(pageState.status as ResultStatusFilter)
      ? (pageState.status as ResultStatusFilter)
      : undefined,
    integrity: integrityOptions.includes(pageState.integrity as IntegrityRiskLevel)
      ? (pageState.integrity as IntegrityRiskLevel)
      : undefined,
    role: roleOptions.includes(pageState.role as RoleId) ? (pageState.role as RoleId) : undefined,
    sort: sortOptions.includes(pageState.sort as ResultSortKey)
      ? (pageState.sort as ResultSortKey)
      : "newest"
  };
  const rows = filterAndSortResults(allRows, filters);
  const passCount = allRows.filter((row) => row.pass).length;
  const reviewCount = allRows.filter((row) => row.borderline).length;
  const failCount = allRows.filter((row) => !row.pass && !row.borderline).length;

  return (
    <SceneShell
      variant="results"
      eyebrow={copy.results.eyebrow}
      title={copy.results.title}
      subtitle={copy.results.subtitle}
      utility={
        <div className="flex flex-wrap gap-2">
          <StatusPill label={`Pass ${passCount}`} tone="emerald" />
          <StatusPill label={`Review ${reviewCount}`} tone="amber" />
          <StatusPill label={`Fail ${failCount}`} tone="red" />
        </div>
      }
    >
      <div className="space-y-5">
        {pageState.deleted || pageState.error ? (
          <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
            {pageState.deleted ? <p className="text-sm text-emerald-200">Result deleted.</p> : null}
            {pageState.error ? <p className="text-sm text-red-200">{pageState.error}</p> : null}
          </div>
        ) : null}
        <form className="grid gap-3 rounded-[24px] border border-white/10 bg-white/[0.05] p-4 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,0.8fr))_auto_auto]">
          <input
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Search candidate name or email"
            className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition focus:border-brand-300/60"
          />
          <select
            name="status"
            defaultValue={filters.status ?? ""}
            className="rounded-[18px] border border-white/16 bg-ink-950 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-300/60"
          >
            <option value="">All statuses</option>
            <option value="pass">Pass</option>
            <option value="review">Review</option>
            <option value="fail">Fail</option>
          </select>
          <select
            name="integrity"
            defaultValue={filters.integrity ?? ""}
            className="rounded-[18px] border border-white/16 bg-ink-950 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-300/60"
          >
            <option value="">All integrity</option>
            <option value="clean">Clean</option>
            <option value="watch">Watch</option>
            <option value="review">Review</option>
          </select>
          <select
            name="role"
            defaultValue={filters.role ?? ""}
            className="rounded-[18px] border border-white/16 bg-ink-950 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-300/60"
          >
            <option value="">All roles</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={filters.sort ?? "newest"}
            className="rounded-[18px] border border-white/16 bg-ink-950 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-300/60"
          >
            <option value="newest">Newest</option>
            <option value="score_desc">Score high to low</option>
            <option value="score_asc">Score low to high</option>
            <option value="risk_desc">Integrity risk</option>
          </select>
          <Button>Apply</Button>
          <Link href="/results">
            <Button type="button" variant="secondary">Clear</Button>
          </Link>
        </form>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
          <div className="flex flex-wrap gap-2">
            <StatusPill label={`Showing ${rows.length}/${allRows.length}`} tone="neutral" />
            {filters.status ? <StatusPill label={`Status ${filters.status}`} tone="neutral" /> : null}
            {filters.integrity ? <StatusPill label={`Integrity ${filters.integrity}`} tone="neutral" /> : null}
            {filters.role ? <StatusPill label={`Role ${filters.role}`} tone="neutral" /> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/api/results/export.csv">
              <Button variant="secondary">Export CSV</Button>
            </a>
            <a href="/api/results/export.json">
              <Button variant="secondary">Export JSON</Button>
            </a>
          </div>
        </div>
        <AttemptTable rows={rows} />
      </div>
    </SceneShell>
  );
}
