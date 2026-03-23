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
  RoleId,
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
  roleId: RoleId | null;
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

function InviteStartContent() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("t") || "";
  const passcodeFromQuery = searchParams.get("passcode") || "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roleId, setRoleId] = useState<RoleId | null>(null);
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
      setRoleId(data.invite?.roleId ?? null);
      setStacks(data.invite?.stacks ?? []);
      setDetailsLoading(false);
    }

    void hydrateInviteMeta();
    return () => {
      active = false;
    };
  }, [params.slug, passcode, token]);

  async function onStart() {
    setLoading(true);
    setError("");
    if (!hasExams) {
      setError("Test details are not ready.");
      setLoading(false);
      return;
    }
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
      setError(validated.message || "Invite check failed.");
      setLoading(false);
      return;
    }

    const invite = validated.invite;
    const effectiveRoleId = invite.roleId ?? roleId;
    const effectiveStacks = invite.stacks?.length ? invite.stacks : stacks;
    setInviteMeta(invite);
    setTotalDurationMinutes(
      typeof validated.totalDurationMinutes === "number" ? validated.totalDurationMinutes : null
    );
    setRoleId(effectiveRoleId);
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
        roleId: effectiveRoleId,
        stacks: effectiveStacks
      })
    });
    const started = await startResponse.json();
    if (!started.ok) {
      setError(started.message || "Could not start assessment.");
      setLoading(false);
      return;
    }
    router.push(`/a/${params.slug}/attempt/${started.attemptId}`);
  }

  return (
    <SceneShell
      variant="run"
      eyebrow="Check-in"
      title="Confirm details"
      utility={
        <div className="flex flex-wrap gap-2">
          <StatusPill label="Identity" tone="blue" />
          <StatusPill label={isInvitePasscodeState(validationState) ? "Passcode" : "Role + Stack"} tone="teal" />
          <StatusPill label={blocked ? "Blocked" : "Start"} tone={blocked ? "red" : "emerald"} />
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <StagePanel className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-sm text-slate-200">Full name</label>
              <input
                className="rounded-[18px] border border-white/20 bg-white/5 px-3 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                placeholder="Alex Perera"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm text-slate-200">Email</label>
              <input
                className="rounded-[18px] border border-white/20 bg-white/5 px-3 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                placeholder="you@company.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="grid gap-1 md:col-span-2">
              <label className="text-sm text-slate-200">Phone (optional)</label>
              <input
                className="rounded-[18px] border border-white/20 bg-white/5 px-3 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                placeholder="+94 7x xxx xxxx"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
            {showPasscodeField ? (
              <div className="grid gap-1 md:col-span-2">
                <label className="text-sm text-slate-200">Passcode</label>
                <input
                  className="rounded-[18px] border border-white/20 bg-white/5 px-3 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
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
                ? "border-red-400/40 bg-red-500/20 text-red-100"
                : isInvitePasscodeState(validationState)
                  ? "border-amber-400/40 bg-amber-500/20 text-amber-100"
                  : "border-white/12 bg-white/[0.04] text-slate-200"
            }`}
          >
            {validationMessage}
          </div>

          {error ? (
            <p className="rounded-md border border-red-400/40 bg-red-500/20 px-3 py-2 text-sm text-red-100">
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
            <p className="rounded-[18px] border border-white/10 bg-white/5 px-3 py-2 text-slate-100">
              Role: {detailsLoading ? "Loading..." : roleId ?? "Not available"}
            </p>
            <p className="rounded-[18px] border border-white/10 bg-white/5 px-3 py-2 text-slate-100">
              Stack: {detailsLoading ? "Loading..." : stacks.length ? stacks.join(", ") : "Not available"}
            </p>
            <p className="rounded-[18px] border border-white/10 bg-white/5 px-3 py-2 text-slate-100">
              Time: {totalDurationMinutes != null ? `${totalDurationMinutes}m total` : "Loading..."}
            </p>
            <p className="rounded-[18px] border border-white/10 bg-white/5 px-3 py-2 text-slate-100">
              Pass target:{" "}
              {detailsLoading
                ? "Loading..."
                : inviteMeta?.passTarget != null
                  ? `${inviteMeta.passTarget}%`
                  : "Not available"}
            </p>
            <p className="rounded-[18px] border border-white/10 bg-white/5 px-3 py-2 text-slate-100">
              Integrity: {preset ? preset.shortLabel : detailsLoading ? "Loading..." : "Not available"}
            </p>
            <p className="rounded-[18px] border border-white/10 bg-white/5 px-3 py-2 text-slate-100">
              Attempts left: {detailsLoading ? "Loading..." : remainingAttempts}
            </p>
            <p className="rounded-[18px] border border-white/10 bg-white/5 px-3 py-2 text-slate-100">
              Exams:{" "}
              {detailsLoading
                ? "Loading..."
                : inviteMeta?.exams?.length
                  ? inviteMeta.exams
                      .map((exam) => `${exam.label}${exam.configSummary ? ` (${exam.configSummary})` : ""}`)
                      .join(", ")
                  : "Not available"}
            </p>
            <p className="rounded-[18px] border border-white/10 bg-white/5 px-3 py-2 text-slate-100">
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
            <p className="text-slate-200">Preparing check-in...</p>
          </StagePanel>
        </section>
      }
    >
      <InviteStartContent />
    </Suspense>
  );
}
