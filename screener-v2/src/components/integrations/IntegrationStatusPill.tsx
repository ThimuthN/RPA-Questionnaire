"use client";

import { StatusPill } from "@/components/primitives/StatusPill";

function toneForStatus(status: string) {
  if (status === "connected" || status === "ready") return "emerald" as const;
  if (status === "sync_issue") return "red" as const;
  if (status === "needs_reauthentication") return "amber" as const;
  if (status === "disabled") return "neutral" as const;
  return "blue" as const;
}

function labelForStatus(status: string) {
  if (status === "connected") return "Connected";
  if (status === "needs_reauthentication") return "Needs attention";
  if (status === "sync_issue") return "Sync issue";
  if (status === "not_connected") return "Not connected";
  if (status === "not_configured") return "Not configured";
  if (status === "disconnected") return "Disconnected";
  if (status === "disabled") return "Disabled";
  if (status === "ready") return "Ready";
  return status.replace(/_/g, " ");
}

export function IntegrationStatusPill({ status }: { status: string }) {
  return <StatusPill label={labelForStatus(status)} tone={toneForStatus(status)} />;
}
