import { redirect } from "next/navigation";
import { RuntimeClient } from "@/features/runtime/RuntimeClient";
import { getAttempt } from "@/lib/db/repositories";
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
    return (
      <section className="space-y-4">
        <StagePanel>
          <h1 className="text-3xl text-white">This attempt is complete.</h1>
          <p className="mt-2 text-slate-300">Viewing results... you cannot resume the assessment.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`/a/${slug}/result/${attempt.id}`}>
              <button className="rounded-[12px] bg-brand-500 px-4 py-2 text-white">Continue to results</button>
            </a>
            <a href="/">
              <button className="rounded-[12px] border border-white/20 bg-white/5 px-4 py-2 text-white">Return home</button>
            </a>
          </div>
        </StagePanel>
      </section>
    );
  }
  return (
    <RuntimeClient
      slug={slug}
      attemptId={attempt.id}
      roleId={attempt.roleId}
      stacks={attempt.stacks}
      blueprint={attempt.blueprint}
      initialExamState={attempt.examState ?? {}}
      initialIntegrity={attempt.integrity}
      watermarkLabel={attempt.candidateEmail || attempt.candidateName || `Attempt ${attempt.id.slice(0, 12)}`}
    />
  );
}
