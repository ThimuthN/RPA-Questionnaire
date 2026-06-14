import { notFound } from "next/navigation";
import { requirePageSession } from "@/lib/auth/guards";
import { getInterviewKit } from "@/lib/db/interview-kits";
import { SceneShell } from "@/components/scene/SceneShell";
import { InterviewKitEditor } from "@/components/interview-kits/InterviewKitEditor";

export const dynamic = "force-dynamic";

export default async function InterviewKitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePageSession(`/assessments/kits/${id}`);
  const kit = await getInterviewKit(id);
  if (!kit) notFound();

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="Interview kits"
      title={kit.title}
      subtitle={kit.description ?? "Edit competencies and behavioral anchors."}
    >
      <InterviewKitEditor kit={kit} />
    </SceneShell>
  );
}
