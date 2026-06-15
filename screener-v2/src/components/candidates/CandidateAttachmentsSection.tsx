"use client";

import { startTransition, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Paperclip, Trash2, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/primitives/Button";

type Attachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageUrl: string;
  label: string | null;
  uploadedAt: string;
};

const ALLOWED_EXTENSIONS = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CandidateAttachmentsSection({
  candidateId,
  initialAttachments,
  canManage,
}: {
  candidateId: string;
  initialAttachments: Attachment[];
  canManage: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [attachments, setAttachments] = useState(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");

    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const formData = new FormData();
      formData.append("file", file, file.name);
      if (label.trim()) formData.append("label", label.trim());

      const res = await fetch(`/api/candidates/${candidateId}/attachments`, {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });

      const data = (await res.json()) as { ok?: boolean; message?: string; attachment?: Attachment };
      if (!res.ok || !data.ok) throw new Error(data.message || "Upload failed.");

      if (data.attachment) {
        setAttachments((prev) => [data.attachment!, ...prev]);
      }
      setLabel("");
      if (inputRef.current) inputRef.current.value = "";
      startTransition(() => {
        router.replace(`${pathname}?attachmentUploaded=${stamp}` as never);
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(attachmentId: string) {
    setDeletingId(attachmentId);
    try {
      const res = await fetch(`/api/candidates/${candidateId}/attachments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ attachmentId }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) throw new Error(data.message || "Delete failed.");
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Paperclip size={15} className="text-[color:var(--app-muted)]" />
        <h3 className="text-sm font-semibold text-[color:var(--app-heading)]">Attachments</h3>
        {attachments.length > 0 && (
          <span className="rounded-full bg-[color:var(--app-surface-soft)] px-2 py-0.5 text-[11px] text-[color:var(--app-muted)]">
            {attachments.length}
          </span>
        )}
      </div>

      {attachments.length === 0 && !canManage ? (
        <p className="text-sm text-[color:var(--app-muted)]">No attachments uploaded.</p>
      ) : null}

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate text-sm font-medium text-[color:var(--app-heading)]">
                  {attachment.label || attachment.fileName}
                </p>
                <p className="text-[11px] text-[color:var(--app-muted)]">
                  {attachment.label ? `${attachment.fileName} · ` : ""}
                  {formatBytes(attachment.sizeBytes)} · {formatDate(attachment.uploadedAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <a
                  href={`/api/candidates/${candidateId}/attachments/${attachment.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-[10px] text-[color:var(--app-muted)] transition hover:bg-[color:var(--app-surface)] hover:text-[color:var(--app-heading)]"
                  aria-label="Open attachment"
                  title="View"
                >
                  <ExternalLink size={13} />
                </a>
                <a
                  href={`/api/candidates/${candidateId}/attachments/${attachment.id}?download=1`}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-[10px] text-[color:var(--app-muted)] transition hover:bg-[color:var(--app-surface)] hover:text-[color:var(--app-heading)]"
                  aria-label="Download attachment"
                  title="Download"
                >
                  <Download size={13} />
                </a>
                {canManage && (
                  <button
                    type="button"
                    disabled={deletingId === attachment.id}
                    onClick={() => void handleDelete(attachment.id)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-[10px] text-[color:var(--app-muted)] transition hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Delete attachment"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {canManage && (
        <details className="rounded-[14px] border border-dashed border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3">
          <summary className="cursor-pointer list-none text-sm font-medium text-[color:var(--app-heading)] [&::-webkit-details-marker]:hidden">
            Upload attachment
          </summary>
          <div className="mt-4 space-y-3 border-t border-[color:var(--app-border)] pt-4">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (optional — e.g. Portfolio, Certificate)"
              className="w-full rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-sm text-[color:var(--app-text)] outline-none focus:border-brand-300/60"
            />
            <input
              ref={inputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS}
              className="sr-only"
              onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? "Uploading..." : "Choose file"}
              </Button>
              <p className="text-xs text-[color:var(--app-muted)]">
                PDF, Word, Excel, images, plain text · Max 20 MB
              </p>
            </div>
            {error && <p className="text-sm text-[color:var(--app-danger)]">{error}</p>}
          </div>
        </details>
      )}
    </div>
  );
}
