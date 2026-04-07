"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import type {
  ExamSummaryItem,
  IntegrityPresetId,
  StackId
} from "@/lib/assessment-engine/types";
import {
  integrityPresetMeta,
  normalizeIntegrityPreset
} from "@/lib/integrity/policy";
import {
  isInviteBlockedState,
  isInvitePasscodeState,
  type InviteValidationState
} from "@/lib/invites/validation";
import type { SectionId } from "@/lib/sections/types";

interface InviteMeta {
  roleLocked: boolean;
  stackLocked: boolean;
  passTarget: number | null;
  stacks: StackId[];
  sections: SectionId[];
  integrityPreset: IntegrityPresetId;
  exams: ExamSummaryItem[];
}

interface InviteValidationResponse {
  ok: boolean;
  state: InviteValidationState;
  message: string;
  invite: InviteMeta | null;
  totalDurationMinutes: number | null;
  remainingAttempts: number;
}

const fieldLabelClassName = "text-sm text-[color:var(--app-muted)]";
const fieldInputClassName =
  "rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80";
const detailRowClassName =
  "rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-2 text-[color:var(--app-text)]";

function InviteStartContent() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("t") || "";
  const passcodeFromQuery = searchParams.get("passcode") || "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [stacks, setStacks] = useState<StackId[]>([]);
  const [passcode, setPasscode] = useState(passcodeFromQuery);
  const [inviteMeta, setInviteMeta] = useState<InviteMeta | null>(null);
  const [validationState, setValidationState] = useState<InviteValidationState>("invalid");
  const [validationMessage, setValidationMessage] = useState("Preparing your assessment access.");
  const [remainingAttempts, setRemainingAttempts] = useState(0);
  const [totalDurationMinutes, setTotalDurationMinutes] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(true);

  const hasExams = Boolean(inviteMeta?.exams?.length);
  const showPasscodeField = Boolean(passcode) || isInvitePasscodeState(validationState);
  const blocked = isInviteBlockedState(validationState);
  const canStart = Boolean(
    fullName.trim() &&
      email.trim() &&
      !detailsLoading &&
      validationState === "valid" &&
      hasExams
  );
  const readiness = useMemo(() => {
    if (detailsLoading) return { label: "Checking access", tone: "blue" as const };
    if (blocked) return { label: "Unavailable", tone: "red" as const };
    if (isInvitePasscodeState(validationState)) {
      return { label: "Passcode needed", tone: "amber" as const };
    }
    return canStart
      ? { label: "Ready", tone: "emerald" as const }
      : { label: "Missing details", tone: "amber" as const };
  }, [blocked, canStart, detailsLoading, validationState]);
  const preset = inviteMeta
    ? integrityPresetMeta[normalizeIntegrityPreset(inviteMeta.integrityPreset, "strict")]
    : null;

  useEffect(() => {
    let active = true;

    async function hydrateInviteMeta() {
      setDetailsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/invites/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            token
              ? { token, passcode: passcode || undefined }
              : { slug: params.slug, passcode: passcode || undefined }
          )
        });
        const data = (await response.json()) as InviteValidationResponse;
        if (!active) return;

        setValidationState(data.state);
        setValidationMessage(data.message || "Could not load test details.");
        setRemainingAttempts(typeof data.remainingAttempts === "number" ? data.remainingAttempts : 0);
        setInviteMeta(data.invite);
        setTotalDurationMinutes(
          typeof data.totalDurationMinutes === "number" ? data.totalDurationMinutes : null
        );
        setStacks(data.invite?.stacks ?? []);
      } catch {
        if (!active) return;
        setValidationState("invalid");
        setValidationMessage("Could not load assessment access. Refresh the page and try again.");
        setRemainingAttempts(0);
        setInviteMeta(null);
        setTotalDurationMinutes(null);
        setStacks([]);
        setError("Could not load assessment details. Refresh the page and try again.");
      } finally {
        if (active) {
          setDetailsLoading(false);
        }
      }
    }

    void hydrateInviteMeta();
    return () => {
      active = false;
    };
  }, [params.slug, passcode, token]);

  async function onStart() {
    if (!hasExams) {
      setError("Test details are not ready.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const validateResponse = await fetch("/api/invites/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(token ? { token, passcode } : { slug: params.slug, passcode })
      });
      const validated = (await validateResponse.json()) as InviteValidationResponse;
      setValidationState(validated.state);
      setValidationMessage(validated.message);
      setRemainingAttempts(
        typeof validated.remainingAttempts === "number" ? validated.remainingAttempts : 0
      );
      if (!validated.ok || !validated.invite) {
        setError(validated.message || "Assessment access could not be confirmed. Check your details and try again.");
        return;
      }

      const invite = validated.invite;
      const effectiveStacks = invite.stacks?.length ? invite.stacks : stacks;
      setInviteMeta(invite);
      setTotalDurationMinutes(
        typeof validated.totalDurationMinutes === "number" ? validated.totalDurationMinutes : null
      );
      setStacks(effectiveStacks);

      const startResponse = await fetch("/api/attempts/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteToken: token || undefined,
          inviteSlug: token ? undefined : params.slug,
          passcode: passcode || undefined,
          participant: {
            kind: "candidate",
            fullName,
            email,
            phone
          },
          stacks: effectiveStacks
        })
      });
      const started = await startResponse.json();
      if (!started.ok) {
        setError(started.message || "Could not start assessment. Please try again.");
        return;
      }
      router.push(`/a/${params.slug}/attempt/${started.attemptId}`);
    } catch {
      setError("Could not start assessment. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SceneShell
      variant="run"
      eyebrow="Check-in"
      title="Confirm details"
      utility={
        <div className="flex flex-wrap gap-2">
          <StatusPill label="Identity" tone="blue" />
          <StatusPill label={isInvitePasscodeState(validationState) ? "Passcode" : "Assessment details"} tone="teal" />
          <StatusPill label={blocked ? "Blocked" : "Start"} tone={blocked ? "red" : "emerald"} />
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <StagePanel className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-1">
              <label className={fieldLabelClassName}>Full name</label>
              <input
                className={fieldInputClassName}
                placeholder="Alex Perera"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <label className={fieldLabelClassName}>Email</label>
              <input
                className={fieldInputClassName}
                placeholder="you@company.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="grid gap-1 md:col-span-2">
              <label className={fieldLabelClassName}>Phone (optional)</label>
              <input
                className={fieldInputClassName}
                placeholder="+94 7x xxx xxxx"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
            {showPasscodeField ? (
              <div className="grid gap-1 md:col-span-2">
                <label className={fieldLabelClassName}>Passcode</label>
                <input
                  className={fieldInputClassName}
                  placeholder="6-digit passcode"
                  value={passcode}
                  onChange={(event) => setPasscode(event.target.value)}
                />
              </div>
            ) : null}
          </div>

          <div
            className={`rounded-md border px-3 py-2 text-sm ${
              blocked
                ? "border-[color:var(--app-danger)]/40 bg-[color:var(--app-danger-soft)] text-[color:var(--app-danger)]"
                : isInvitePasscodeState(validationState)
                  ? "border-[color:var(--app-warning)]/40 bg-[color:var(--app-warning-soft)] text-[color:var(--app-warning)]"
                  : "border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] text-[color:var(--app-text)]"
            }`}
          >
            {validationMessage}
          </div>

          {error ? (
            <p className="rounded-md border border-[color:var(--app-danger)]/40 bg-[color:var(--app-danger-soft)] px-3 py-2 text-sm text-[color:var(--app-danger)]">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-1">
            <Button onClick={onStart} disabled={loading || !canStart}>
              {loading
                ? "Starting..."
                : isInvitePasscodeState(validationState)
                  ? "Enter passcode to continue"
                  : blocked
                    ? "Assessment unavailable"
                    : "Start test"}
            </Button>
            {blocked ? (
              <Link href="/">
                <Button variant="secondary">Return home</Button>
              </Link>
            ) : null}
          </div>
        </StagePanel>

        <StagePanel className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Test details</p>
          <StatusPill label={readiness.label} tone={readiness.tone} />
          <div className="space-y-2 text-sm">
            <p className={detailRowClassName}>
              Stack: {detailsLoading ? "Loading..." : stacks.length ? stacks.join(", ") : "Not available"}
            </p>
            <p className={detailRowClassName}>
              Time: {totalDurationMinutes != null ? `${totalDurationMinutes}m total` : "Loading..."}
            </p>
            <p className={detailRowClassName}>
              Pass target:{" "}
              {detailsLoading
                ? "Loading..."
                : inviteMeta?.passTarget != null
                  ? `${inviteMeta.passTarget}%`
                  : "Not available"}
            </p>
            <p className={detailRowClassName}>
              Integrity: {preset ? preset.shortLabel : detailsLoading ? "Loading..." : "Not available"}
            </p>
            <p className={detailRowClassName}>
              Attempts left: {detailsLoading ? "Loading..." : remainingAttempts}
            </p>
            <p className={detailRowClassName}>
              Exams:{" "}
              {detailsLoading
                ? "Loading..."
                : inviteMeta?.exams?.length
                  ? inviteMeta.exams
                      .map((exam) => `${exam.label}${exam.configSummary ? ` (${exam.configSummary})` : ""}`)
                      .join(", ")
                  : "Not available"}
            </p>
            <p className={detailRowClassName}>
              Autosave: Enabled
            </p>
          </div>
        </StagePanel>
      </div>
    </SceneShell>
  );
}

export default function InviteStartPage() {
  return (
    <Suspense
      fallback={
        <section className="space-y-4">
          <StagePanel>
            <p className="text-[color:var(--app-text)]">Preparing check-in...</p>
          </StagePanel>
        </section>
      }
    >
      <InviteStartContent />
    </Suspense>
  );
}
