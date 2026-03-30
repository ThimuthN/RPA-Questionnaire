import dynamic from "next/dynamic";
import { SceneTransition } from "@/components/motion/SceneTransition";
import { listAddonCatalog, listAssessmentPresets } from "@/lib/addons/catalog";
import { requirePageSession } from "@/lib/auth/guards";

const CreateAssessmentBuilder = dynamic(
  () => import("@/components/assessments/CreateAssessmentBuilder").then((mod) => mod.CreateAssessmentBuilder),
  {
    loading: () => (
      <div className="rounded-[24px] border border-white/12 bg-white/[0.04] p-6 text-sm text-slate-300">
        Loading assessment builder...
      </div>
    )
  }
);

export default async function CreateTestPage({
  searchParams
}: {
  searchParams: Promise<{ candidateId?: string; milestoneId?: string }>;
}) {
  await requirePageSession("/create-test");

  const params = await searchParams;
  const [addons, presets] = await Promise.all([listAddonCatalog(), listAssessmentPresets()]);

  return (
    <SceneTransition>
      <CreateAssessmentBuilder
        initialAddons={addons}
        initialPresets={presets}
        linkedCandidateId={params.candidateId?.trim() || undefined}
        linkedCandidateMilestoneId={params.milestoneId?.trim() || undefined}
      />
    </SceneTransition>
  );
}
