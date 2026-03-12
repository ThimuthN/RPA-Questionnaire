"use client";

import { useMemo, useState } from "react";
import type { RoleId, StackId } from "@/lib/assessment-engine/types";
import { configV2 } from "@/lib/data/question-bank";
import { Button } from "@/components/primitives/Button";
import { StepRail } from "@/components/primitives/StepRail";
import { StatusPill } from "@/components/primitives/StatusPill";
import { BlueprintPresetPicker } from "@/components/studio/BlueprintPresetPicker";
import { InviteCredentialsPanel, type InviteCredentials } from "@/components/access/InviteCredentialsPanel";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { copy } from "@/lib/design/copy";

const stackOptions: StackId[] = ["UiPath", "AutomationAnywhere", "Python", "PowerAutomate"];

interface CreateInviteSuccess extends InviteCredentials {
  ok: true;
  inviteId: string;
  slug: string;
}

interface CreateInviteError {
  ok: false;
  message?: string;
}

export default function CreateTestPage() {
  const [roleId, setRoleId] = useState<RoleId>("Associate");
  const [selectedStacks, setSelectedStacks] = useState<StackId[]>(["UiPath"]);
  const [passTarget, setPassTarget] = useState(configV2.roles.Associate.pass_percentage);
  const [invite, setInvite] = useState<(InviteCredentials & { slug: string; inviteId: string }) | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const roleConfig = configV2.roles[roleId];
  const testId = useMemo(() => (invite?.slug ? invite.slug.toUpperCase() : "--"), [invite?.slug]);
  const primaryStack = selectedStacks[0] || "None";

  async function onGenerateAccess() {
    if (selectedStacks.length === 0) {
      setError("Select at least one tech stack.");
      return;
    }
    setLoading(true);
    setError("");
    setInvite(null);
    const response = await fetch("/api/invites/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assessmentVersionId: "v1-default",
        mode: "candidate",
        roleLocked: true,
        stackLocked: true,
        roleId,
        stacks: selectedStacks,
        withPasscode: true,
        maxAttempts: 1
      })
    });
    const data = (await response.json()) as CreateInviteSuccess | CreateInviteError;
    if (data.ok) {
      setInvite({
        entryUrl: data.entryUrl,
        token: data.token,
        passcode: data.passcode,
        slug: data.slug,
        inviteId: data.inviteId
      });
    } else {
      setError(data.message || "Could not generate access.");
    }
    setLoading(false);
  }

  function onStartNow() {
    if (!invite) return;
    const separator = invite.entryUrl.includes("?") ? "&" : "?";
    const pass = invite.passcode ? `&passcode=${encodeURIComponent(invite.passcode)}` : "";
    window.location.assign(`${invite.entryUrl}${separator}startNow=1${pass}`);
  }

  function toggleStack(stack: StackId) {
    setSelectedStacks((prev) => (prev.includes(stack) ? prev.filter((item) => item !== stack) : [...prev, stack]));
  }

  return (
    <SceneShell
      variant="create"
      eyebrow={copy.create.eyebrow}
      title={copy.create.title}
      subtitle={copy.create.subtitle}
      utility={
        <div className="flex flex-wrap gap-2">
          <StatusPill label={`${roleConfig.question_count} questions`} tone="blue" />
          <StatusPill label={`${roleConfig.time_limit_minutes}m core`} tone="neutral" />
          <StatusPill label="10m practical" tone="teal" />
        </div>
      }
    >
      <div className="space-y-4">
        <StepRail
          activeId={invite ? "access" : "setup"}
          steps={[
            { id: "setup", label: "Setup" },
            { id: "calibration", label: "Settings" },
            { id: "access", label: "Share" }
          ]}
        />

        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.85fr]">
          <div className="space-y-4">
            <StagePanel className="overflow-hidden p-0">
              <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-5 p-5 md:p-6">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.22em] text-brand-300">{copy.create.role}</p>
                  </div>

                  <BlueprintPresetPicker
                    roleId={roleId}
                    onRoleChange={(next) => {
                      setRoleId(next);
                      setPassTarget(configV2.roles[next].pass_percentage);
                    }}
                  />

                  <div className="space-y-3">
                    <p className="text-sm text-slate-200">{copy.create.stack}</p>
                    <div className="flex flex-wrap gap-2">
                      {stackOptions.map((stack) => (
                        <button
                          key={stack}
                          type="button"
                          onClick={() => toggleStack(stack)}
                          className={`rounded-full border px-4 py-2 text-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 ${
                            selectedStacks.includes(stack)
                              ? "border-brand-300 bg-brand-500/18 text-white shadow-[0_14px_32px_rgba(31,111,255,0.18)]"
                              : "border-white/16 bg-white/[0.05] text-slate-200 hover:border-brand-300/50 hover:bg-white/[0.08]"
                          }`}
                        >
                          {stack}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex min-h-full flex-col justify-between border-t border-white/10 bg-black/15 p-5 md:p-6 lg:border-l lg:border-t-0">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <StatusPill label={roleId} tone="blue" />
                      <StatusPill label={`${selectedStacks.length} stacks`} tone="teal" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{copy.create.summary}</p>
                    </div>
                    <div className="grid gap-3">
                      <div className="rounded-[20px] border border-white/10 bg-white/[0.05] p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Pass target</p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-3xl text-white">{passTarget}%</p>
                        </div>
                        <input
                          type="range"
                          min={40}
                          max={90}
                          value={passTarget}
                          onChange={(event) => setPassTarget(Number(event.target.value))}
                          className="mt-3 w-full accent-[rgb(47,134,255)]"
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[18px] border border-white/10 bg-white/[0.05] p-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Questions</p>
                          <p className="mt-1 text-lg text-white">{roleConfig.question_count}</p>
                        </div>
                        <div className="rounded-[18px] border border-white/10 bg-white/[0.05] p-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Core time</p>
                          <p className="mt-1 text-lg text-white">{roleConfig.time_limit_minutes} min</p>
                        </div>
                        <div className="rounded-[18px] border border-white/10 bg-white/[0.05] p-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Primary stack</p>
                          <p className="mt-1 text-lg text-white">{primaryStack}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </StagePanel>

            <StagePanel className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{copy.create.advanced}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill label={`Role ${roleId}`} tone="neutral" />
                  <StatusPill label={`Stacks ${selectedStacks.join(", ") || "None"}`} tone="blue" className="normal-case tracking-normal text-[11px]" />
                </div>
              </div>
              <details className="rounded-[18px] border border-white/10 bg-black/20">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm text-slate-200">{copy.create.advanced}</summary>
                <div className="border-t border-white/10 p-4">
                  <pre className="max-h-56 overflow-auto rounded-[18px] border border-white/10 bg-black/40 p-3 text-xs text-slate-100">
                    <code>{JSON.stringify({ roleId, selectedStacks, passTarget, roleConfig }, null, 2)}</code>
                  </pre>
                </div>
              </details>
            </StagePanel>
          </div>

          <StagePanel className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.22em] text-brand-300">{copy.create.share}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[20px] border border-white/10 bg-white/[0.05] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{copy.create.testId}</p>
                <p className="mt-2 font-mono text-xl text-white">{testId}</p>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/[0.05] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{copy.create.summary}</p>
                <p className="mt-2 text-lg text-white">{roleId} | {selectedStacks.join(", ")}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={onGenerateAccess} disabled={loading}>
                {loading ? "Generating..." : copy.create.generate}
              </Button>
              <Button variant="secondary" onClick={onStartNow} disabled={!invite}>
                {copy.create.startNow}
              </Button>
            </div>

            {error ? <p className="text-sm text-red-200">{error}</p> : null}

            {invite ? (
              <div className="space-y-3 scene-fade-up">
                <InviteCredentialsPanel invite={invite} testId={testId} openLabel={copy.create.startTest} />
              </div>
            ) : (
              <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-slate-300">No test yet. Generate access to continue.</p>
              </div>
            )}
          </StagePanel>
        </div>
      </div>
    </SceneShell>
  );
}
