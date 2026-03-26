import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { ChoicePills } from "@/components/primitives/ChoicePills";
import { RolePicker } from "@/components/roles/RolePicker";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { resumeSourceOptions } from "@/lib/candidates/types";

export default async function NewCandidatePage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; existingId?: string; existingName?: string; existingEmail?: string }>;
}) {
  const params = await searchParams;

  return (
    <SceneShell
      variant="create"
      eyebrow="Candidates"
      title="Register candidate"
      subtitle="Add the basics first."
      utility={
        <Link href={"/candidates" as Route}>
          <Button variant="secondary">Back</Button>
        </Link>
      }
    >
      <div className="max-w-2xl">
        <StagePanel className="space-y-5">
          {params.existingId ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/72 p-4 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(22,27,40,0.98),rgba(14,19,30,0.98))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-amber-300">Email already used</p>
                  <h2 className="text-2xl text-white">This candidate already exists</h2>
                  <p className="text-sm leading-6 text-slate-300">
                    {params.existingName || "An existing candidate"} is already registered with{" "}
                    <span className="text-white">{params.existingEmail || "this email"}</span>.
                  </p>
                  <div className="rounded-[18px] border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                    Use the existing record instead of creating a duplicate entry.
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/candidates/${params.existingId}` as Route}>
                      <Button>Open existing candidate</Button>
                    </Link>
                    <Link href={"/candidates" as Route}>
                      <Button variant="secondary">Back to candidates</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

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

            <RolePicker
              name="roleId"
              label="Role"
              defaultValue={null}
              placeholder="Optional"
              helperText="Choose from the managed role catalog. Use Manage roles to add titles or departments."
            />

            <div className="grid gap-2">
              <span className="text-sm text-slate-200">Source</span>
              <ChoicePills
                name="resumeSource"
                idPrefix="new-candidate-source"
                defaultValue=""
                options={[
                  { value: "", label: "Skip" },
                  ...resumeSourceOptions.map((option) => ({ value: option, label: option }))
                ]}
              />
            </div>

            <label className="grid gap-1">
              <span className="text-sm text-slate-200">Owner</span>
              <input
                name="hrOwner"
                placeholder="Optional"
                className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              />
            </label>

            {params.error && !params.existingId ? <p className="text-sm text-red-200">{params.error}</p> : null}

            <p className="text-sm text-slate-300">You can upload the resume and send the screener after this.</p>

            <div className="flex flex-wrap gap-3">
              <Button type="submit">Save candidate</Button>
              <Link href={"/candidates" as Route}>
                <Button type="button" variant="secondary">Cancel</Button>
              </Link>
            </div>
          </form>
        </StagePanel>
      </div>
    </SceneShell>
  );
}
