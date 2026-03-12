import { AttemptTable } from "@/components/results/AttemptTable";
import { listResults } from "@/lib/db/repositories";
import { StatusPill } from "@/components/primitives/StatusPill";
import { Button } from "@/components/primitives/Button";
import { SceneShell } from "@/components/scene/SceneShell";
import { copy } from "@/lib/design/copy";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const rows = await listResults();
  const passCount = rows.filter((row) => row.pass).length;
  const reviewCount = rows.filter((row) => row.borderline).length;
  const failCount = rows.filter((row) => !row.pass && !row.borderline).length;

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
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
          <div className="flex flex-wrap gap-2">
            <StatusPill label={`Total ${rows.length}`} tone="neutral" />
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
