"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { InviteCredentialsPanel, type InviteCredentials } from "@/components/access/InviteCredentialsPanel";
import type { RoleId, StackId } from "@/lib/assessment-engine/types";

interface CreateInviteSuccess extends InviteCredentials {
  ok: true;
  inviteId: string;
  slug: string;
}

interface CreateInviteError {
  ok: false;
  message?: string;
}

export function PublishDrawer({
  roleId,
  stacks = ["UiPath"]
}: {
  roleId: RoleId;
  stacks?: StackId[];
}) {
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState<InviteCredentials | null>(null);
  const [error, setError] = useState<string>("");

  async function generate() {
    setLoading(true);
    setInvite(null);
    setError("");
    const response = await fetch("/api/invites/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assessmentVersionId: "v1-default",
        mode: "candidate",
        roleLocked: true,
        stackLocked: true,
        roleId,
        stacks,
        withPasscode: true
      })
    });
    const data = (await response.json()) as CreateInviteSuccess | CreateInviteError;
    if (data.ok) {
      setInvite({
        entryUrl: data.entryUrl,
        token: data.token,
        passcode: data.passcode
      });
    } else {
      setError(data.message || "Could not generate invite.");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3 rounded-lg border border-white/15 bg-white/5 p-4">
      <div>
        <h3 className="font-display text-lg text-white">Generate candidate invite</h3>
        <p className="text-sm text-slate-300">Create a one-time link for this assessment.</p>
      </div>
      <Button onClick={generate} disabled={loading}>
        {loading ? "Generating..." : "Generate Invite"}
      </Button>
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
      {invite ? <InviteCredentialsPanel invite={invite} openLabel="Start test" /> : null}
    </div>
  );
}
