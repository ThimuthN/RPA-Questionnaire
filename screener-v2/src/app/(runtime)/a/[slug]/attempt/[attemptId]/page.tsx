import { redirect } from "next/navigation";
import { RuntimeClient } from "@/features/runtime/RuntimeClient";
import { pickPracticalPack } from "@/features/practical/packs";
import { getAttempt } from "@/lib/db/repositories";
import { getQuestionsByIds } from "@/lib/data/question-bank";
import { StagePanel } from "@/components/scene/StagePanel";

export const dynamic = "force-dynamic";

export default async function AttemptRuntimePage({
  params
}: {
  params: Promise<{ slug: string; attemptId: string }>;
}) {
  const { attemptId, slug } = await params;
  const attempt = await getAttempt(attemptId);
  if (!attempt) {
    return (
      <section className="space-y-4">
        <StagePanel>
          <h1 className="text-2xl text-white">Attempt Not Found</h1>
        </StagePanel>
      </section>
    );
  }
  if (attempt.status === "submitted") {
    redirect(`/a/${slug}/result/${attempt.id}`);
  }
  const questions = getQuestionsByIds(attempt.coreQuestionIds);
  const practicalPack = pickPracticalPack(attempt.roleId, attempt.stacks);
  return (
    <RuntimeClient
      slug={slug}
      attemptId={attempt.id}
      roleId={attempt.roleId}
      stacks={attempt.stacks}
      questions={questions}
      practicalPack={practicalPack}
      initialCoreSeconds={attempt.remainingCoreSeconds}
      initialPracticalSeconds={attempt.remainingPracticalSeconds}
    />
  );
}
