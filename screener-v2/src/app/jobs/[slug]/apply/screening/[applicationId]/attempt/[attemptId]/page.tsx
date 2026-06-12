import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { RuntimeClient } from "@/features/runtime/RuntimeClient";
import { sanitizeBlueprintForClient } from "@/lib/exams/client-blueprint";
import { carriesRoleContext } from "@/lib/exams/catalog";
import { getAttempt } from "@/lib/db/repositories";
import {
  getPublicApplicationScreeningContext,
  publicApplicationScreeningFinishHref
} from "@/lib/db/jobs";
import { PUBLIC_JOBS_ENABLED } from "@/lib/jobs/public-access";
import {
  getRuntimeSession,
  runtimeSessionMatchesAttempt
} from "@/lib/auth/runtime-session";

export const dynamic = "force-dynamic";

export default async function PublicApplicationScreeningAttemptPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string; applicationId: string; attemptId: string }>;
  searchParams: Promise<{ resumeError?: string }>;
}) {
  if (!PUBLIC_JOBS_ENABLED) {
    notFound();
  }

  const { slug, applicationId, attemptId } = await params;
  const pageState = await searchParams;
  const context = await getPublicApplicationScreeningContext({
    applicationId,
    jobSlug: slug
  });

  if (!context || context.attemptId !== attemptId) {
    notFound();
  }

  const finishHref = publicApplicationScreeningFinishHref({
    jobSlug: slug,
    applicationId,
    resumeError: pageState.resumeError === "1"
  });
  const recoveryHref = `/jobs/${slug}/apply?error=${encodeURIComponent(
    "Your screening session expired. Submit the application again to reopen it."
  )}`;
  const restartHref = `/jobs/${slug}/apply/screening/${applicationId}${
    pageState.resumeError === "1" ? "?resumeError=1" : ""
  }`;

  const runtimeSession = await getRuntimeSession();
  if (!runtimeSessionMatchesAttempt(runtimeSession, {
    attemptId,
    slug: context.runtimeSlug
  })) {
    redirect(recoveryHref as Route);
  }

  const attempt = await getAttempt(attemptId);
  if (!attempt) {
    notFound();
  }

  return (
    <RuntimeClient
      slug={context.runtimeSlug}
      attemptId={attempt.id}
      integrityPreset={attempt.integrityPreset}
      roleId={
        (attempt.blueprint.exams.find(
          (exam) => carriesRoleContext(exam.definitionId)
        )?.config?.roleLabel as string | undefined) ?? attempt.roleId
      }
      blueprint={sanitizeBlueprintForClient(attempt.blueprint)}
      initialStage={attempt.stage}
      initialExamState={attempt.examState ?? {}}
      initialIntegrity={attempt.integrity}
      initialStateVersion={attempt.stateVersion}
      watermarkLabel={attempt.candidateEmail || attempt.candidateName || `Attempt ${attempt.id.slice(0, 12)}`}
      completionHref={finishHref}
      completionLabel="Return to application"
      restartHref={restartHref}
      submittedTitle="Screening completed"
      submittedBody="Your assessment responses are now attached to this application for the hiring team to review."
    />
  );
}
