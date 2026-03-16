import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { SceneTransition } from "@/components/motion/SceneTransition";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { validateInvite } from "@/lib/db/repositories";
import { getTotalDurationMinutes, sectionRegistry } from "@/lib/sections/registry";
import type { SectionId } from "@/lib/sections/types";

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
  const roleId = inviteCheck.ok && inviteCheck.invite?.roleId ? inviteCheck.invite.roleId : "Associate";
  const sections: SectionId[] =
    inviteCheck.ok && inviteCheck.invite?.sections ? inviteCheck.invite.sections : ["core", "practical"];
  const totalMinutes = getTotalDurationMinutes(sections, roleId);
  const sectionLabels = sections.map((sectionId) => sectionRegistry[sectionId]?.label ?? sectionId);

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
            <p className="text-slate-200">{sectionLabels.join(" + ")}. Autosave is enabled.</p>
            <div className="flex flex-wrap gap-2">
              {sections.map((sectionId) => (
                <StatusPill
                  key={sectionId}
                  label={sectionRegistry[sectionId]?.label ?? sectionId}
                  tone={sectionId === "core" ? "blue" : "teal"}
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
