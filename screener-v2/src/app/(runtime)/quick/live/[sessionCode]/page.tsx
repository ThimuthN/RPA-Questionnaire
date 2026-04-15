"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/primitives/Card";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";

export default function LiveSessionEntryPage() {
  const params = useParams<{ sessionCode: string }>();
  const [token, setToken] = useState("");
  const [passcode, setPasscode] = useState("");

  function onContinue() {
    if (!token.trim()) return;
    const qs = new URLSearchParams({ t: token.trim() });
    if (passcode.trim()) qs.set("passcode", passcode.trim());
    window.location.assign(`/a/${params.sessionCode}/start?${qs.toString()}`);
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <Card className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Live Session Entry</p>
        <h1 className="text-3xl text-[color:var(--app-heading)]">Session {params.sessionCode}</h1>
        <StatusPill label="Fallback join" tone="blue" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1 md:col-span-2">
            <label className="text-sm text-[color:var(--app-text)]">Token</label>
            <input
              className="rounded-md border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Paste token"
            />
          </div>
          <div className="grid gap-1 md:col-span-2">
            <label className="text-sm text-[color:var(--app-text)]">Passcode (optional)</label>
            <input
              className="rounded-md border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              placeholder="6-digit passcode"
            />
          </div>
        </div>
        <Button onClick={onContinue} disabled={!token.trim()}>
          Continue to Check-in
        </Button>
      </Card>
    </section>
  );
}
