"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { DropdownMenu } from "@/components/primitives/DropdownMenu";

function primaryActionLabel(args: {
  applicantCount: number;
  isPublished: boolean;
  isOpen: boolean;
}) {
  if (args.applicantCount > 0) return "Review";
  if (!args.isPublished) return "Finish setup";
  if (!args.isOpen) return "Manage";
  return "Review";
}

export function JobRowActions({
  jobId,
  isPublished,
  isOpen,
  applicantCount,
  canEditJob,
  applicantsHref,
  publicHref,
  editHref,
  returnTo
}: {
  jobId: string;
  isPublished: boolean;
  isOpen: boolean;
  applicantCount: number;
  canEditJob: boolean;
  applicantsHref: Route;
  publicHref?: Route;
  editHref: Route;
  returnTo: string;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitJobAction(action: "toggle_published" | "toggle_open") {
    setIsSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("action", action);
      formData.set("returnTo", returnTo);

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "POST",
        headers: {
          accept: "application/json"
        },
        body: formData
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        next?: string;
      };

      if (!response.ok || data.ok === false) {
        throw new Error(data.message || "Could not update job.");
      }

      if (data.next) {
        router.push(data.next as Route);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update job.");
    } finally {
      setIsSaving(false);
    }
  }

  const primaryHref = applicantCount > 0 ? applicantsHref : editHref;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link href={primaryHref}>
          <Button type="button" className="px-3 py-2 text-xs">
            {primaryActionLabel({ applicantCount, isPublished, isOpen })}
          </Button>
        </Link>

        {publicHref ? (
          <Link href={publicHref} target="_blank" rel="noreferrer">
            <Button type="button" variant="secondary" className="px-3 py-2 text-xs">
              Public page
            </Button>
          </Link>
        ) : null}

        {canEditJob ? (
          <DropdownMenu
            trigger={
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-[color:var(--app-text)] transition hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)]">
                <MoreHorizontal className="h-4 w-4" />
              </span>
            }
            items={[
              { label: "Edit job", href: editHref },
              ...(publicHref ? [{ label: "Open public page", href: publicHref }] : []),
              {
                label: isPublished ? "Unpublish job" : "Publish job",
                onClick: () => void submitJobAction("toggle_published")
              },
              {
                label: isOpen ? "Close applications" : "Open applications",
                onClick: () => void submitJobAction("toggle_open")
              }
            ]}
          />
        ) : null}
      </div>

      {error ? (
        <p className="text-right text-xs text-[color:var(--app-danger)]">{error}</p>
      ) : isSaving ? (
        <p className="text-right text-xs text-[color:var(--app-muted)]">Updating job...</p>
      ) : null}
    </div>
  );
}
