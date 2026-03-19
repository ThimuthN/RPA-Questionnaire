import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { SceneTransition } from "@/components/motion/SceneTransition";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { validateInvite } from "@/lib/db/repositories";

export default async function InviteLandingPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const token = typeof query.t === "string" ? query.t : "";
  const passcode = typeof query.passcode === "string" ? query.passcode : "";
  const startNow = typeof query.startNow === "string" ? query.startNow : "";

  const nextQuery = new URLSearchParams();
  if (token) nextQuery.set("t", token);
  if (passcode) nextQuery.set("passcode", passcode);
  const startHref = nextQuery.toString() ? `/a/${slug}/start?${nextQuery.toString()}` : `/a/${slug}/start`;
  const inviteCheck = await validateInvite(token ? { token, passcode: passcode || undefined } : { slug, passcode: passcode || undefined });
  const exams = inviteCheck.ok ? inviteCheck.invite?.blueprint.exams ?? [] : [];
  const totalMinutes = exams.reduce((sum, exam) => sum + exam.durationMinutes, 0);
  const passTarget = inviteCheck.ok && inviteCheck.invite ? inviteCheck.invite.passTargetPercent : 60;

  if (startNow === "1") {
    redirect(startHref as Route);
  }

  return (
    <SceneTransition>
      <SceneShell
        variant="run"
        eyebrow="Assessment Briefing"
        title={`This assessment takes about ${totalMinutes} minutes, and your answers will be saved automatically as you go`}
      >
        <div className="mx-auto max-w-3xl">
          <StagePanel className="space-y-5">
            <p className="text-slate-200">
              {exams.map((exam) => `${exam.label}${exam.configSummary ? ` (${exam.configSummary})` : ""}`).join(" + ")}.
              Pass target: {passTarget}%. Autosave is enabled.
            </p>
            <div className="flex flex-wrap gap-2">
              {exams.map((exam) => (
                <StatusPill
                  key={exam.instanceId}
                  label={`${exam.label} ${exam.durationMinutes}m`}
                  tone={
                    exam.definitionId === "core_exam"
                      ? "blue"
                      : exam.definitionId === "practical_exam"
                        ? "teal"
                        : exam.definitionId === "general_capability_exam"
                          ? "amber"
                          : "purple"
                  }
                />
              ))}
              <StatusPill label="Autosave on" tone="emerald" />
            </div>
            <Link href={startHref as Route}>
              <Button>Begin check-in</Button>
            </Link>
          </StagePanel>
        </div>
      </SceneShell>
    </SceneTransition>
  );
}
