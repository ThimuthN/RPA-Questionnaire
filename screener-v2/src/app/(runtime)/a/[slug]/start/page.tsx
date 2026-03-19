"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import type { ExamBlueprint, RoleId, StackId } from "@/lib/assessment-engine/types";
import type { SectionId } from "@/lib/sections/types";

interface InviteMeta {
  roleLocked: boolean;
  stackLocked: boolean;
  roleId: RoleId | null;
  passTarget: number | null;
  stacks: StackId[];
  sections: SectionId[];
  blueprint: ExamBlueprint;
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
  const [totalDurationMinutes, setTotalDurationMinutes] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(true);

  const hasBlueprint = Boolean(inviteMeta?.blueprint?.exams?.length);
  const canStart = Boolean(fullName.trim() && email.trim() && !detailsLoading && hasBlueprint);
  const readiness = useMemo(() => (canStart ? "Ready" : "Missing details"), [canStart]);
  const showPasscodeField =
    Boolean(token) || Boolean(passcode) || error.toLowerCase().includes("passcode");

  useEffect(() => {
    let active = true;

    async function hydrateInviteMeta() {
      setDetailsLoading(true);
      setError("");
      const response = await fetch("/api/invites/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(token ? { token, passcode: passcode || undefined } : { slug: params.slug, passcode: passcode || undefined })
      });
      const data = await response.json();
      if (!active) return;
      if (!data?.ok) {
        setInviteMeta(null);
        setRoleId(null);
        setStacks([]);
        setError(data?.message || "Could not load test details.");
        setDetailsLoading(false);
        return;
      }
      const invite = data.invite as InviteMeta;
      setInviteMeta(invite);
      setTotalDurationMinutes(typeof data.totalDurationMinutes === "number" ? data.totalDurationMinutes : null);
      if (invite.roleId) setRoleId(invite.roleId);
      if (invite.stacks?.length) setStacks(invite.stacks);
      setDetailsLoading(false);
    }

    void hydrateInviteMeta();
    return () => {
      active = false;
    };
  }, [params.slug, token, passcode]);

  async function onStart() {
    setLoading(true);
    setError("");
    if (!hasBlueprint) {
      setError("Test details are not ready.");
      setLoading(false);
      return;
    }
    const validateResponse = await fetch("/api/invites/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(token ? { token, passcode } : { slug: params.slug, passcode })
    });
    const validated = await validateResponse.json();
    if (!validated.ok) {
      setError(validated.message || "Invite check failed.");
      setLoading(false);
      return;
    }

    const invite = validated.invite as InviteMeta;
    const effectiveRoleId = invite.roleId ?? roleId;
    const effectiveStacks = invite.stacks?.length ? invite.stacks : stacks;
    setInviteMeta(invite);
    setTotalDurationMinutes(typeof validated.totalDurationMinutes === "number" ? validated.totalDurationMinutes : null);
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
          <StatusPill label="Role + Stack" tone="teal" />
          <StatusPill label="Start" tone="emerald" />
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

          {error ? (
            <p className="rounded-md border border-red-400/40 bg-red-500/20 px-3 py-2 text-sm text-red-100">
              {error}
            </p>
          ) : null}

          <div className="pt-1">
            <Button onClick={onStart} disabled={loading || !canStart}>
              {loading ? "Starting..." : "Start test"}
            </Button>
          </div>
        </StagePanel>

        <StagePanel className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Test details</p>
          <StatusPill label={readiness} tone={canStart ? "emerald" : "amber"} />
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
              Pass target: {detailsLoading ? "Loading..." : inviteMeta?.passTarget != null ? `${inviteMeta.passTarget}%` : "Not available"}
            </p>
            <p className="rounded-[18px] border border-white/10 bg-white/5 px-3 py-2 text-slate-100">
              Exams:{" "}
              {detailsLoading
                ? "Loading..."
                : inviteMeta?.blueprint?.exams?.length
                  ? inviteMeta.blueprint.exams.map((exam) => `${exam.label}${exam.configSummary ? ` (${exam.configSummary})` : ""}`).join(", ")
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
