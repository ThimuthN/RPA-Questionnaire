import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import {
  candidateFinalDecisionLabels,
  candidateFinalDecisionValues,
  candidateNextActionLabels,
  candidateNextActionValues,
  candidateScreeningStatusLabels,
  candidateScreeningStatusValues,
  candidateStageLabels,
  candidateStageValues,
  resumeSourceOptions
} from "@/lib/candidates/types";

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
      subtitle="Create a candidate record, then optionally upload the resume immediately."
      utility={
        <Link href={"/candidates" as Route}>
          <Button variant="secondary">Back to tracker</Button>
        </Link>
      }
    >
      <StagePanel className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-2xl text-white">Candidate profile</h2>
          <p className="text-sm text-slate-300">This keeps the hiring workflow separate from the assessment engine while still linking the two.</p>
        </div>

        <form
          action="/api/candidates"
          method="post"
          encType="multipart/form-data"
          className="grid gap-4 lg:grid-cols-2"
        >
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
            <span className="text-sm text-slate-200">Phone</span>
            <input
              name="phone"
              className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-slate-200">Position applied for</span>
            <input
              name="positionAppliedFor"
              className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-slate-200">Batch ID</span>
            <input
              name="batchId"
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
              <option value="">Select source</option>
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
              className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-slate-200">Stage</span>
            <select
              name="stage"
              defaultValue="new"
              className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
            >
              {candidateStageValues.map((value) => (
                <option key={value} value={value}>
                  {candidateStageLabels[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-slate-200">Final decision</span>
            <select
              name="finalDecision"
              defaultValue="in_process"
              className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
            >
              {candidateFinalDecisionValues.map((value) => (
                <option key={value} value={value}>
                  {candidateFinalDecisionLabels[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-slate-200">Next action</span>
            <select
              name="nextAction"
              defaultValue="none"
              className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
            >
              {candidateNextActionValues.map((value) => (
                <option key={value} value={value}>
                  {candidateNextActionLabels[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-slate-200">Screening status</span>
            <select
              name="screeningStatus"
              defaultValue=""
              className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
            >
              <option value="">Not set</option>
              {candidateScreeningStatusValues.map((value) => (
                <option key={value} value={value}>
                  {candidateScreeningStatusLabels[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-slate-200">Candidate folder link</span>
            <input
              name="candidateFolderUrl"
              placeholder="https://..."
              className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
            />
          </label>

          <label className="grid gap-1 lg:col-span-2">
            <span className="text-sm text-slate-200">Notes summary</span>
            <textarea
              name="notesSummary"
              rows={4}
              className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
            />
          </label>

          <label className="grid gap-1 lg:col-span-2">
            <span className="text-sm text-slate-200">Resume upload (optional)</span>
            <input
              name="resume"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="rounded-[18px] border border-dashed border-white/16 bg-white/[0.05] px-4 py-3 text-sm text-slate-200"
            />
            <span className="text-xs text-slate-400">Accepted: PDF or DOCX, up to 10 MB.</span>
          </label>

          {params.error ? <p className="text-sm text-red-200 lg:col-span-2">{params.error}</p> : null}

          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <Button type="submit">Create candidate</Button>
            <Link href={"/candidates" as Route}>
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
          </div>
        </form>
      </StagePanel>
    </SceneShell>
  );
}
