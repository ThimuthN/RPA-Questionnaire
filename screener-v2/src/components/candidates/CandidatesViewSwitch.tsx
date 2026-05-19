"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type CandidatesView = "jobs" | "applicants" | "pipeline" | "screener" | "interview" | "testing" | "finalized";

interface StageCounts {
  applicant: number;
  pipeline: number;
  screening: number;
  interview: number;
  testing: number;
  decision: number;
  closed: number;
}

const items: Array<{ key: CandidatesView; label: string; countKey: keyof StageCounts | null; href: Route }> = [
  { key: "jobs", label: "Roles & Jobs", countKey: null, href: "/people/candidates/jobs" as Route },
  { key: "applicants", label: "Applicants", countKey: "applicant", href: "/people/candidates?stage=applicant" as Route },
  { key: "pipeline", label: "Pipeline", countKey: "pipeline", href: "/people/candidates?stage=pipeline" as Route },
  { key: "screener", label: "Screener", countKey: "screening", href: "/people/candidates?stage=screening" as Route },
  { key: "interview", label: "Interview", countKey: "interview", href: "/people/candidates?stage=interview" as Route },
  { key: "testing", label: "Advanced Review", countKey: "testing", href: "/people/candidates?stage=testing" as Route },
  { key: "finalized", label: "Finalized", countKey: "decision", href: "/people/candidates?stage=decision" as Route }
];

export function CandidatesViewSwitch({ current }: { current: CandidatesView }) {
  const [counts, setCounts] = useState<StageCounts | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch("/api/candidates/stage-counts");
        if (res.ok) {
          const data = await res.json();
          setCounts(data);
        }
      } catch (err) {
        console.error("Failed to fetch stage counts:", err);
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] p-1 text-sm text-[color:var(--app-text)] shadow-[var(--app-shadow-soft)]">
      {items.map((item) => {
        const count = item.countKey && counts ? counts[item.countKey] : null;
        const label = count !== null ? `${item.label} (${count})` : item.label;

        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "rounded-full px-3 py-1.5 transition-all whitespace-nowrap font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--app-control-bg)]",
              current === item.key
                ? "bg-[linear-gradient(135deg,var(--app-brand),var(--app-brand-strong))] text-white shadow-[0_12px_28px_color-mix(in_srgb,var(--app-brand)_22%,transparent)] hover:shadow-[0_16px_32px_color-mix(in_srgb,var(--app-brand)_28%,transparent)]"
                : "text-[color:var(--app-muted)] hover:bg-[color:var(--app-surface-soft)] hover:text-[color:var(--app-heading)] hover:shadow-sm"
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
