import { CreateAssessmentBuilder } from "@/components/assessments/CreateAssessmentBuilder";
import { SceneTransition } from "@/components/motion/SceneTransition";
import { listAddonCatalog, listAssessmentPresets } from "@/lib/addons/catalog";

export default async function CreateTestPage({
  searchParams
}: {
  searchParams: Promise<{ candidateId?: string; milestoneId?: string }>;
}) {
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
