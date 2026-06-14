import { requirePageSession } from "@/lib/auth/guards";
import { SceneShell } from "@/components/scene/SceneShell";
import { InterviewKitForm } from "@/components/interview-kits/InterviewKitForm";

export default async function NewInterviewKitPage() {
  await requirePageSession("/assessments/kits/new");
  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="Interview kits"
      title="New kit"
      subtitle="Define a set of competencies interviewers will rate and record evidence for."
    >
      <InterviewKitForm mode="create" />
    </SceneShell>
  );
}
