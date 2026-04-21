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
import {
  buildRequestErrorMessage,
  fetchJsonWithTimeout
} from "@/lib/http/client";
import { cn } from "@/lib/utils";

type RunMode = "join_link" | "test_id" | "live_call" | "employee";

interface CreateInviteSuccess extends InviteCredentials {
  ok: true;
  inviteId: string;
  slug: string;
}

interface CreateInviteError {
  ok: false;
  message?: string;
  requestId?: string;
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
  const [theme, setTheme] = useState<"light" | "dark">("light");
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
  const [employeeShortcutUrl, setEmployeeShortcutUrl] = useState("");
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

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => {
      setTheme(root.dataset.theme === "dark" ? "dark" : "light");
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const meta = useMemo(() => modeMeta[mode], [mode]);
  const isDarkTheme = theme === "dark";

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
    try {
      const { response, data } = await fetchJsonWithTimeout<CreateInviteSuccess | CreateInviteError>(
        "/api/invites/create",
        {
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
          sections: ["core", "practical"],
          withPasscode: true,
          maxAttempts: 1
        })
      }
      );
      if (response.ok && data?.ok) {
        setLiveInvite({
          entryUrl: data.entryUrl,
          token: data.token,
          passcode: data.passcode,
          slug: data.slug
        });
      } else {
        setError(buildRequestErrorMessage(data, "Could not generate live session. Please try again."));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not generate live session. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onRequestEmployeeMagic() {
    if (!employeeEmail.trim()) return;
    setLoading(true);
    setError("");
    setEmployeeShortcutUrl("");
    try {
      const response = await fetch("/api/auth/magic/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: employeeEmail.trim() })
      });
      const data = (await response.json()) as { ok: boolean; devShortcutUrl?: string; message?: string };
      if (data.ok) {
        setEmployeeShortcutUrl(data.devShortcutUrl || "");
      } else {
        setError(data.message || "Could not send magic link. Please try again.");
      }
    } catch {
      setError("Could not send magic link. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SceneShell
      variant="run"
      tone={isDarkTheme ? "scene" : "page"}
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
        <StagePanel tone={isDarkTheme ? "workspace" : "summary"} className="space-y-5">
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
                    ? isDarkTheme
                      ? "border-brand-300 bg-brand-500/18 text-white shadow-[0_14px_30px_rgba(31,111,255,0.16)]"
                      : "border-[color:var(--app-brand)] bg-[color:var(--app-brand-soft)] text-[color:var(--app-brand-strong)] shadow-[var(--app-shadow-soft)]"
                    : "border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] text-[color:var(--app-text)] hover:border-brand-300/50 hover:bg-[color:var(--app-surface-muted)]"
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
            <h2 className="text-3xl text-[color:var(--app-heading)]">{meta.title}</h2>
          </div>

          {!canManageAccess ? (
            <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 text-sm text-[color:var(--app-text)]">
              Internal creation, results, and employee/live management become available after login.
            </div>
          ) : null}

          {mode === "join_link" ? (
            <div className="space-y-3 scene-fade-up">
              <input
                className={inputClassName}
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
                  className={inputClassName}
                  placeholder="Test ID"
                  value={testId}
                  onChange={(event) => setTestId(event.target.value)}
                />
                <input
                  className={inputClassName}
                  placeholder="Token (optional)"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                />
                <input
                  className={inputClassName}
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
                className={inputClassName}
                placeholder="employee@company.com"
                value={employeeEmail}
                onChange={(event) => setEmployeeEmail(event.target.value)}
              />
              <Button onClick={onRequestEmployeeMagic} disabled={!employeeEmail || loading}>
                {loading ? "Sending..." : "Send Magic Link"}
              </Button>
              {employeeShortcutUrl ? (
                <div className="space-y-2 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                  <p className="text-sm text-[color:var(--app-text)]">
                    Magic link issued for internal access. The raw token is hidden from the normal UI.
                  </p>
                  <p className="text-xs text-[color:var(--app-muted)]">
                    Use the internal shortcut below only for local admin testing.
                  </p>
                  <Button variant="secondary" onClick={() => window.location.assign(employeeShortcutUrl)}>
                    Open internal shortcut
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? <p className="text-sm text-[color:var(--app-danger)]">{error}</p> : null}
        </StagePanel>

        <StagePanel tone={isDarkTheme ? "workspace" : "summary"} className="space-y-5">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-300">{copy.runModes.selectedMethod}</p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">{copy.runModes.selectedMethod}</p>
              <p className="mt-2 text-xl text-[color:var(--app-heading)]">{meta.title}</p>
            </div>
            <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">{copy.runModes.nextStep}</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--app-text)]">{meta.signal}</p>
            </div>
            <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">{copy.runModes.testFlow}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[color:var(--app-muted)]">
                {["Briefing", "Check-in", "Core", "Practical", "Outcome"].map((step) => (
                  <span
                    key={step}
                    className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-2 py-1"
                  >
                    {step}
                  </span>
                ))}
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
            <p className="text-[color:var(--app-text)]">Preparing run modes...</p>
          </StagePanel>
        </section>
      }
    >
      <RunTestContent canManageAccess={canManageAccess} />
    </Suspense>
  );
}

const inputClassName = cn(
  "w-full rounded-[18px] border px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80",
  "border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-[color:var(--app-text)]"
);
