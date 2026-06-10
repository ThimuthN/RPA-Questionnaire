import { AssessmentHubView } from "@/components/assessments/AssessmentHubView";
import { SceneTransition } from "@/components/motion/SceneTransition";
import { requirePageSession } from "@/lib/auth/guards";

export default async function AssessmentsPage() {
  await requirePageSession("/assessments");

  return (
    <SceneTransition>
      <AssessmentHubView />
    </SceneTransition>
  );
}
