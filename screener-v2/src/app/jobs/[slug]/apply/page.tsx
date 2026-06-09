import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { JobApplicationForm } from "@/components/jobs/JobApplicationForm";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { getPublicJobPostingBySlug } from "@/lib/db/jobs";
import { PUBLIC_JOBS_ENABLED } from "@/lib/jobs/public-access";

export const dynamic = "force-dynamic";

export default async function ApplyPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  if (!PUBLIC_JOBS_ENABLED) notFound();

  const { slug } = await params;
  const { error } = await searchParams;
  const job = await getPublicJobPostingBySlug(slug);

  if (!job) notFound();

  const orgName = process.env.NEXT_PUBLIC_ORG_NAME ?? "Northstar";
  const subtitle = job.roleDepartment ?? job.roleLabel ?? orgName;

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="Application"
      title={`Apply to ${job.title}`}
      subtitle={`${orgName} · ${subtitle}`}
      utility={
        <Link href={`/jobs/${slug}`}>
          <Button variant="secondary">Back to role</Button>
        </Link>
      }
    >
      <div className="max-w-2xl space-y-6">
        {error ? (
          <div className="rounded-[18px] border border-red-400/30 bg-red-500/10 p-5 text-sm text-red-100">
            {error}
          </div>
        ) : null}
        <StagePanel className="space-y-5">
          <JobApplicationForm jobSlug={slug} />
        </StagePanel>
      </div>
    </SceneShell>
  );
}
