import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { SceneTransition } from "@/components/motion/SceneTransition";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { validateInvite } from "@/lib/db/repositories";
import { examCatalog } from "@/lib/exams/catalog";
import {
  integrityPresetMeta,
  normalizeIntegrityPreset
} from "@/lib/integrity/policy";
import { isInviteBlockedState } from "@/lib/invites/validation";

function blockedTitle(state: Awaited<ReturnType<typeof validateInvite>>["state"]) {
  if (state === "expired") return "This assessment link has expired";
  if (state === "attempt_limit_reached") return "This assessment link has already been used";
  return "This assessment link is not available";
}

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
  const inviteCheck = await validateInvite(
    token ? { token, passcode: passcode || undefined } : { slug, passcode: passcode || undefined }
  );
  const exams = inviteCheck.invite?.blueprint.exams ?? [];
  const totalMinutes = exams.reduce((sum, exam) => sum + exam.durationMinutes, 0);
  const passTarget = inviteCheck.invite?.passTargetPercent ?? 60;
  const preset = inviteCheck.invite
    ? integrityPresetMeta[normalizeIntegrityPreset(inviteCheck.invite.integrityPreset, "strict")]
    : null;

  if (startNow === "1" && !isInviteBlockedState(inviteCheck.state)) {
    redirect(startHref as Route);
  }

  return (
    <SceneTransition>
      <SceneShell
        variant="run"
        eyebrow="Assessment Briefing"
        title={
          isInviteBlockedState(inviteCheck.state)
            ? blockedTitle(inviteCheck.state)
            : `This assessment takes about ${totalMinutes} minutes, and your answers will be saved automatically as you go`
        }
      >
        <div className="mx-auto max-w-3xl">
          <StagePanel className="space-y-5">
            {isInviteBlockedState(inviteCheck.state) ? (
              <>
                <p className="text-slate-200">{inviteCheck.message} If you expected access, contact the hiring team.</p>
                <div className="flex flex-wrap gap-2">
                  <StatusPill label="Unavailable" tone="red" />
                  <StatusPill label="Candidate-safe message" tone="neutral" />
                </div>
                <Link href="/">
                  <Button variant="secondary">Return home</Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-slate-200">
                  {exams.map((exam) => `${exam.label}${exam.configSummary ? ` (${exam.configSummary})` : ""}`).join(" + ")}.
                  {" "}Pass target: {passTarget}%. Autosave is enabled.
                </p>
                <div className="flex flex-wrap gap-2">
                  {exams.map((exam) => (
                    <StatusPill
                      key={exam.instanceId}
                      label={`${exam.label} ${exam.durationMinutes}m`}
                      tone={examCatalog[exam.definitionId].accentTone}
                    />
                  ))}
                  {preset ? (
                    <StatusPill
                      label={preset.shortLabel}
                      tone={preset.id === "strict" ? "red" : preset.id === "standard" ? "amber" : "emerald"}
                    />
                  ) : null}
                  <StatusPill label="Autosave on" tone="emerald" />
                </div>
                {inviteCheck.state === "passcode_required" ? (
                  <p className="rounded-[18px] border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    This assessment is protected by a passcode. Continue to check-in and enter it there.
                  </p>
                ) : null}
                <Link href={startHref as Route}>
                  <Button>Begin check-in</Button>
                </Link>
              </>
            )}
          </StagePanel>
        </div>
      </SceneShell>
    </SceneTransition>
  );
}
