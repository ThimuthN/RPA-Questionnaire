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
    setVerified(false);
    try {
      const verifyResponse = await fetch("/api/auth/magic/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, fullName })
      });
      const verified = await verifyResponse.json();
      if (!verified.ok) {
        setError(verified.message || "Verification failed. Check the link and try again.");
        return;
      }

      const startResponse = await fetch("/api/attempts/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runtimeSlug: "internal",
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
        setError(started.message || "Unable to start assessment. Please try again.");
        return;
      }
      setVerified(true);
      await new Promise((resolve) => setTimeout(resolve, 420));
      router.push(`/a/internal/attempt/${started.attemptId}`);
    } catch {
      setError("Verification could not be completed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <Card className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Verify and Continue</p>
        <h1 className="text-3xl text-[color:var(--app-heading)]">Confirm token</h1>
        <StatusPill label={token ? "Token detected" : "Token missing"} tone={token ? "emerald" : "amber"} />
        <input
          className="rounded-md border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-[color:var(--app-text)]"
          placeholder="Your name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
        {error ? <p className="text-sm text-[color:var(--app-danger)]">{error}</p> : null}
        {verified ? <p className="text-sm text-[color:var(--app-success)]">Verified. Launching assessment...</p> : null}
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
            <p className="text-[color:var(--app-text)]">Preparing verification...</p>
          </Card>
        </section>
      }
    >
      <EmployeeVerifyContent />
    </Suspense>
  );
}
