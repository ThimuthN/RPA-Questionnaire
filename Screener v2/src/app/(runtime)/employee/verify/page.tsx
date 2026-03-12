"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { StatusPill } from "@/components/primitives/StatusPill";

function EmployeeVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("t") || "";
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);

  async function onVerify() {
    setLoading(true);
    setError("");
    const verifyResponse = await fetch("/api/auth/magic/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, fullName })
    });
    const verified = await verifyResponse.json();
    if (!verified.ok) {
      setError(verified.message || "Verification failed.");
      setLoading(false);
      return;
    }

    const startResponse = await fetch("/api/attempts/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participant: {
          kind: "employee",
          fullName: fullName || "Employee",
          email: verified.session.email
        },
        roleId: "Associate",
        stacks: ["UiPath"]
      })
    });
    const started = await startResponse.json();
    if (!started.ok) {
      setError(started.message || "Unable to start assessment.");
      setLoading(false);
      return;
    }
    setVerified(true);
    await new Promise((resolve) => setTimeout(resolve, 420));
    router.push(`/a/internal/attempt/${started.attemptId}`);
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <Card className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Verify and Continue</p>
        <h1 className="text-3xl text-white">Confirm token</h1>
        <StatusPill label={token ? "Token detected" : "Token missing"} tone={token ? "emerald" : "amber"} />
        <input
          className="rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white"
          placeholder="Your name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
        {error ? <p className="text-sm text-red-200">{error}</p> : null}
        {verified ? <p className="text-sm text-emerald-200">Verified. Launching assessment...</p> : null}
        <Button onClick={onVerify} disabled={!token || loading}>
          {loading ? "Verifying..." : "Verify and Continue"}
        </Button>
      </Card>
    </section>
  );
}

export default function EmployeeVerifyPage() {
  return (
    <Suspense
      fallback={
        <section className="space-y-4">
          <Card>
            <p className="text-slate-200">Preparing verification...</p>
          </Card>
        </section>
      }
    >
      <EmployeeVerifyContent />
    </Suspense>
  );
}
