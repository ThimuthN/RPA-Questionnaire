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
  searchParams: Promise<{ error?: string }>;
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

            {params.error ? <p className="text-sm text-red-200">{params.error}</p> : null}

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
