import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { resumeSourceOptions } from "@/lib/candidates/types";

export default async function NewCandidatePage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <SceneShell
      variant="create"
      eyebrow="Candidates"
      title="Register candidate"
      subtitle="Start with the essentials. You can add details, notes, status changes, and the resume after the candidate record exists."
      utility={
        <Link href={"/candidates" as Route}>
          <Button variant="secondary">Back to tracker</Button>
        </Link>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <StagePanel className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-2xl text-white">Quick registration</h2>
            <p className="text-sm text-slate-300">This is intentionally lightweight so adding a candidate feels fast.</p>
          </div>

          <form action="/api/candidates" method="post" className="space-y-4">
            <label className="grid gap-1">
              <span className="text-sm text-slate-200">Full name</span>
              <input
                name="fullName"
                required
                className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-slate-200">Email</span>
              <input
                name="email"
                type="email"
                required
                className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-slate-200">Position applied for</span>
              <input
                name="positionAppliedFor"
                placeholder="Optional"
                className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-slate-200">Resume source</span>
              <select
                name="resumeSource"
                defaultValue=""
                className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              >
                <option value="">Optional</option>
                {resumeSourceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-slate-200">HR owner</span>
              <input
                name="hrOwner"
                placeholder="Optional"
                className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              />
            </label>

            {params.error ? <p className="text-sm text-red-200">{params.error}</p> : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit">Create candidate</Button>
              <Link href={"/candidates" as Route}>
                <Button type="button" variant="secondary">Cancel</Button>
              </Link>
            </div>
          </form>
        </StagePanel>

        <StagePanel className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl text-white">What happens next</h2>
            <p className="text-sm text-slate-300">Defaults are applied automatically so you only add more detail when it becomes useful.</p>
          </div>

          <div className="space-y-3">
            <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white">Stage starts as <span className="text-brand-200">New</span>.</p>
            </div>
            <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white">Decision starts as <span className="text-brand-200">In Process</span>.</p>
            </div>
            <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white">After creation, you can upload the resume directly from the candidate page.</p>
            </div>
            <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white">When you create a test from that page, the assessment result flows back automatically.</p>
            </div>
          </div>
        </StagePanel>
      </div>
    </SceneShell>
  );
}
