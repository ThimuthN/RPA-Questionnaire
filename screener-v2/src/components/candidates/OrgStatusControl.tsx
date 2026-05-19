"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { StatusPill } from "@/components/primitives/StatusPill";

type OrgStatus = "active" | "talent_pool" | "org_rejected";

const orgStatusLabels: Record<OrgStatus, string> = {
  active: "Active",
  talent_pool: "Talent Pool",
  org_rejected: "Not Suitable"
};

const orgStatusTones: Record<OrgStatus, "neutral" | "amber" | "red"> = {
  active: "neutral",
  talent_pool: "amber",
  org_rejected: "red"
};

interface OrgStatusControlProps {
  candidateId: string;
  currentStatus: OrgStatus;
  onStatusChange?: (status: OrgStatus) => void;
  readOnly?: boolean;
}

export function OrgStatusControl({
  candidateId,
  currentStatus,
  onStatusChange,
  readOnly = false
}: OrgStatusControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  const handleStatusChange = async (newStatus: OrgStatus) => {
    if (readOnly || newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    setError("");

    try {
      const response = await fetch(`/api/candidates/${candidateId}/org-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgStatus: newStatus })
      });

      if (response.ok) {
        onStatusChange?.(newStatus);
        setIsOpen(false);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update status");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating status");
    } finally {
      setIsUpdating(false);
    }
  };

  if (readOnly) {
    return (
      <StatusPill
        label={orgStatusLabels[currentStatus]}
        tone={orgStatusTones[currentStatus]}
      />
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-sm text-[color:var(--app-text)] hover:border-[color:var(--app-border-strong)] transition"
        disabled={isUpdating}
      >
        <StatusPill
          label={orgStatusLabels[currentStatus]}
          tone={orgStatusTones[currentStatus]}
        />
        <ChevronDown className="h-4 w-4 text-[color:var(--app-muted)]" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 z-50 min-w-48 rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-lg">
          <div className="p-2">
            {error && (
              <div className="text-xs text-[color:var(--app-danger)] px-2 py-1.5 mb-1">
                {error}
              </div>
            )}
            {(["active", "talent_pool", "org_rejected"] as OrgStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={isUpdating}
                className={`w-full text-left px-3 py-2 rounded-[8px] text-sm transition ${
                  currentStatus === status
                    ? "bg-brand-500/10 text-brand-600 font-medium"
                    : "text-[color:var(--app-text)] hover:bg-[color:var(--app-surface-soft)]"
                }`}
              >
                {orgStatusLabels[status]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
