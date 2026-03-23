"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IntegrityPresetPicker } from "@/components/access/IntegrityPresetPicker";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { InviteCredentialsPanel, type InviteCredentials } from "@/components/access/InviteCredentialsPanel";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import type { IntegrityPresetId } from "@/lib/assessment-engine/types";
import { copy } from "@/lib/design/copy";

type RunMode = "join_link" | "test_id" | "live_call" | "employee";

interface CreateInviteSuccess extends InviteCredentials {
  ok: true;
  inviteId: string;
  slug: string;
}

interface CreateInviteError {
  ok: false;
  message?: string;
}

const modeMeta: Record<
  RunMode,
  {
    title: string;
    signal: string;
    tone: "blue" | "teal" | "emerald" | "amber";
  }
> = {
  join_link: {
    title: copy.runModes.link,
    signal: "Paste the test link.",
    tone: "blue"
  },
  test_id: {
    title: copy.runModes.testId,
    signal: "Enter Test ID and optional passcode.",
    tone: "teal"
  },
  live_call: {
    title: copy.runModes.live,
    signal: "Generate a shareable test.",
    tone: "amber"
  },
  employee: {
    title: copy.runModes.employee,
    signal: "Send a magic link.",
    tone: "emerald"
  }
};

function RunTestContent({ canManageAccess }: { canManageAccess: boolean }) {
  const searchParams = useSearchParams();
  const availableModes: RunMode[] = canManageAccess
    ? ["join_link", "test_id", "live_call", "employee"]
    : ["join_link", "test_id"];

  const [mode, setMode] = useState<RunMode>(availableModes[0] ?? "join_link");
  const [shareLink, setShareLink] = useState("");
  const [testId, setTestId] = useState("");
  const [token, setToken] = useState("");
  const [passcode, setPasscode] = useState("");
  const [liveIntegrityPreset, setLiveIntegrityPreset] = useState<IntegrityPresetId>("standard");
  const [liveInvite, setLiveInvite] = useState<(InviteCredentials & { slug?: string }) | null>(null);
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeToken, setEmployeeToken] = useState("");
  const [employeeVerifyUrl, setEmployeeVerifyUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const rawMode = searchParams.get("mode");
    const rawId = searchParams.get("id");
    if (
      (rawMode === "test_id" || rawMode === "live_call" || rawMode === "employee" || rawMode === "join_link") &&
      availableModes.includes(rawMode)
    ) {
      setMode(rawMode);
    } else {
      setMode(availableModes[0] ?? "join_link");
    }
    if (rawId) setTestId(rawId);
  }, [availableModes, searchParams]);

  const meta = useMemo(() => modeMeta[mode], [mode]);

  function onStartFromLink() {
    if (!shareLink.trim()) {
      setError("Enter a share link.");
      return;
    }
    try {
      const url = new URL(shareLink, window.location.origin);
      window.location.assign(`${url.pathname}${url.search}`);
    } catch {
      setError("Invalid link.");
    }
  }

  function onStartByTestId() {
    if (!testId.trim()) {
      setError("Enter a Test ID.");
      return;
    }
    const query = new URLSearchParams();
    if (token.trim()) query.set("t", token.trim());
    if (passcode.trim()) query.set("passcode", passcode.trim());
    const suffix = query.toString() ? `?${query.toString()}` : "";
    window.location.assign(`/a/${testId.trim().toLowerCase()}/start${suffix}`);
  }

  async function onGenerateLive() {
    setLoading(true);
    setError("");
    setLiveInvite(null);
    const response = await fetch("/api/invites/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assessmentVersionId: "v1-default",
        mode: "live",
        integrityPreset: liveIntegrityPreset,
        roleLocked: true,
        stackLocked: true,
        roleId: "Associate",
        stacks: ["UiPath"],
        withPasscode: true,
        maxAttempts: 1
      })
    });
    const data = (await response.json()) as CreateInviteSuccess | CreateInviteError;
    if (data.ok) {
      setLiveInvite({
        entryUrl: data.entryUrl,
        token: data.token,
        passcode: data.passcode,
        slug: data.slug
      });
    } else {
      setError(data.message || "Could not generate live session.");
    }
    setLoading(false);
  }

  async function onRequestEmployeeMagic() {
    if (!employeeEmail.trim()) return;
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/magic/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: employeeEmail.trim() })
    });
    const data = (await response.json()) as { ok: boolean; token?: string; verifyUrl?: string; message?: string };
    if (data.ok) {
      setEmployeeToken(data.token || "");
      setEmployeeVerifyUrl(data.verifyUrl || "");
    } else {
      setError(data.message || "Could not send magic link.");
    }
    setLoading(false);
  }

  return (
    <SceneShell
      variant="run"
      eyebrow={copy.run.eyebrow}
      title={copy.run.title}
      subtitle={copy.run.subtitle}
      utility={
        <div className="flex flex-wrap gap-2">
          <StatusPill label="30 min total" tone="blue" />
          <StatusPill label="Autosave on" tone="teal" />
        </div>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <StagePanel className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {availableModes.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item);
                  setError("");
                }}
                className={`rounded-full border px-4 py-2 text-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 ${
                  mode === item
                    ? "border-brand-300 bg-brand-500/18 text-white shadow-[0_14px_30px_rgba(31,111,255,0.16)]"
                    : "border-white/16 bg-white/[0.05] text-slate-200 hover:border-brand-300/50 hover:bg-white/[0.08]"
                }`}
              >
                {modeMeta[item].title}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill label={meta.title} tone={meta.tone} />
            </div>
            <h2 className="text-3xl text-white">{meta.title}</h2>
          </div>

          {!canManageAccess ? (
            <div className="rounded-[20px] border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-200">
              Internal creation, results, and employee/live management become available after login.
            </div>
          ) : null}

          {mode === "join_link" ? (
            <div className="space-y-3 scene-fade-up">
              <input
                className="w-full rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                placeholder="Test link"
                value={shareLink}
                onChange={(event) => setShareLink(event.target.value)}
              />
              <Button onClick={onStartFromLink}>{copy.runModes.start}</Button>
            </div>
          ) : null}

          {mode === "test_id" ? (
            <div className="space-y-3 scene-fade-up">
              <div className="grid gap-3 md:grid-cols-3">
                <input
                  className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                  placeholder="Test ID"
                  value={testId}
                  onChange={(event) => setTestId(event.target.value)}
                />
                <input
                  className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                  placeholder="Token (optional)"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                />
                <input
                  className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                  placeholder="Passcode"
                  value={passcode}
                  onChange={(event) => setPasscode(event.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={onStartByTestId}>{copy.runModes.start}</Button>
                {canManageAccess ? (
                  <Button variant="secondary" onClick={() => window.location.assign("/create-test")}>
                    Create test
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          {canManageAccess && mode === "live_call" ? (
            <div className="space-y-3 scene-fade-up">
              <IntegrityPresetPicker
                value={liveIntegrityPreset}
                onChange={setLiveIntegrityPreset}
                description="Choose the runtime guardrails before generating a live assessment link."
              />
              <Button onClick={onGenerateLive} disabled={loading}>
                {loading ? "Generating..." : copy.create.generate}
              </Button>
              {liveInvite ? (
                <InviteCredentialsPanel
                  invite={liveInvite}
                  testId={liveInvite.slug?.toUpperCase() ?? null}
                  openLabel={copy.runModes.start}
                />
              ) : null}
            </div>
          ) : null}

          {canManageAccess && mode === "employee" ? (
            <div className="space-y-3 scene-fade-up">
              <input
                className="w-full rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                placeholder="employee@company.com"
                value={employeeEmail}
                onChange={(event) => setEmployeeEmail(event.target.value)}
              />
              <Button onClick={onRequestEmployeeMagic} disabled={!employeeEmail || loading}>
                {loading ? "Sending..." : "Send Magic Link"}
              </Button>
              {employeeVerifyUrl ? (
                <div className="space-y-2 rounded-[20px] border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Verify URL</p>
                  <p className="break-all font-mono text-xs text-white">{employeeVerifyUrl}</p>
                  <p className="pt-2 text-xs uppercase tracking-[0.18em] text-slate-400">Dev token</p>
                  <p className="break-all font-mono text-xs text-white">{employeeToken}</p>
                  <Button variant="secondary" onClick={() => window.location.assign(employeeVerifyUrl)}>
                    Open Verify
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-200">{error}</p> : null}
        </StagePanel>

        <StagePanel className="space-y-5">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-300">{copy.runModes.selectedMethod}</p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{copy.runModes.selectedMethod}</p>
              <p className="mt-2 text-xl text-white">{meta.title}</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{copy.runModes.nextStep}</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">{meta.signal}</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{copy.runModes.testFlow}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-300">
                <span className="rounded-full border border-white/10 px-2 py-1">Briefing</span>
                <span className="rounded-full border border-white/10 px-2 py-1">Check-in</span>
                <span className="rounded-full border border-white/10 px-2 py-1">Core</span>
                <span className="rounded-full border border-white/10 px-2 py-1">Practical</span>
                <span className="rounded-full border border-white/10 px-2 py-1">Outcome</span>
              </div>
            </div>
          </div>
        </StagePanel>
      </div>
    </SceneShell>
  );
}

export function RunTestClient({ canManageAccess }: { canManageAccess: boolean }) {
  return (
    <Suspense
      fallback={
        <section className="space-y-4">
          <StagePanel>
            <p className="text-slate-200">Preparing run modes...</p>
          </StagePanel>
        </section>
      }
    >
      <RunTestContent canManageAccess={canManageAccess} />
    </Suspense>
  );
}
