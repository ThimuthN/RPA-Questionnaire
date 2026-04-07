import Link from "next/link";
import { RuntimeClient } from "@/features/runtime/RuntimeClient";
import { requireRuntimeAttemptPageAccess } from "@/lib/auth/guards";
import { getAttempt } from "@/lib/db/repositories";
import { sanitizeBlueprintForClient } from "@/lib/exams/client-blueprint";
import { carriesRoleContext } from "@/lib/exams/catalog";
import { StagePanel } from "@/components/scene/StagePanel";
import { copy } from "@/lib/design/copy";

export const dynamic = "force-dynamic";

export default async function AttemptRuntimePage({
  params
}: {
  params: Promise<{ slug: string; attemptId: string }>;
}) {
  const { attemptId, slug } = await params;
  await requireRuntimeAttemptPageAccess({ attemptId, slug });
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
    return (
      <section className="space-y-4">
        <StagePanel>
          <h1 className="text-3xl text-white">{copy.runtime.submittedTitle}</h1>
          <p className="mt-2 text-slate-300">{copy.runtime.submittedBody}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/">
              <button className="rounded-[12px] bg-brand-500 px-4 py-2 text-white">{copy.runtime.finish}</button>
            </Link>
          </div>
        </StagePanel>
      </section>
    );
  }
  return (
    <RuntimeClient
      slug={slug}
      attemptId={attempt.id}
      integrityPreset={attempt.integrityPreset}
      roleId={
        (attempt.blueprint.exams.find(
          (exam) => carriesRoleContext(exam.definitionId)
        )?.config?.roleLabel as string | undefined) ?? attempt.roleId
      }
      stacks={attempt.stacks}
      blueprint={sanitizeBlueprintForClient(attempt.blueprint)}
      initialStage={attempt.stage}
      initialExamState={attempt.examState ?? {}}
      initialIntegrity={attempt.integrity}
      initialStateVersion={attempt.stateVersion}
      watermarkLabel={attempt.candidateEmail || attempt.candidateName || `Attempt ${attempt.id.slice(0, 12)}`}
    />
  );
}
