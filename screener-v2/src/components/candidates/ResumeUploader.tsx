"use client";

import { startTransition, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import {
  candidateResumeMaxSizeBytes,
  candidateResumeMimeTypes,
  normalizeResumeFileName
} from "@/lib/candidates/resume-config";

type UploadState = "idle" | "uploading" | "processing" | "uploaded" | "failed";

function allowedMimeType(file: File) {
  return candidateResumeMimeTypes.includes(file.type as (typeof candidateResumeMimeTypes)[number]);
}

export function ResumeUploader({
  candidateId,
  hasResume = false
}: {
  candidateId: string;
  hasResume?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | null) {
    if (!file) {
      setError("Choose a resume file first.");
      setMessage("");
      setUploadState("failed");
      return;
    }

    if (!allowedMimeType(file)) {
      setError("Resume must be a PDF file.");
      setMessage("");
      setUploadState("failed");
      return;
    }

    if (file.size > candidateResumeMaxSizeBytes) {
      setError("Resume must be 10 MB or smaller.");
      setMessage("");
      setUploadState("failed");
      return;
    }

    setUploadState("uploading");
    setProgress(null);
    setError("");
    setMessage("");

    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const storageKey = `candidate-resumes/${candidateId}/${stamp}-${normalizeResumeFileName(file.name)}`;
      const formData = new FormData();
      formData.append("action", "upload");
      formData.append("pathname", storageKey);
      formData.append("file", file, file.name);

      const response = await fetch(`/api/candidates/${candidateId}/resume`, {
        method: "POST",
        credentials: "same-origin",
        body: formData
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string; requestId?: string }
          | null;
        const detail = payload?.requestId ? ` (Request ID: ${payload.requestId})` : "";
        throw new Error((payload?.message || "Upload failed.") + detail);
      }

      setUploadState("uploaded");
      setMessage("Resume uploaded.");
      if (inputRef.current) {
        inputRef.current.value = "";
      }

      startTransition(() => {
        router.replace(`${pathname}?resumeUploaded=1` as never);
        router.refresh();
      });
    } catch (uploadError) {
      setUploadState("failed");
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setProgress(null);
    }
  }

  function onChooseFile() {
    inputRef.current?.click();
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        name="resume"
        type="file"
        accept=".pdf,application/pdf"
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
      />

      <button
        type="button"
        onClick={onChooseFile}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFile(event.dataTransfer.files?.[0] ?? null);
        }}
        className={`w-full rounded-[24px] border border-dashed px-5 py-8 text-left transition ${
          dragging
            ? "border-brand-300/70 bg-[color:var(--app-brand-soft)]"
            : "border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface)]"
        }`}
      >
        <div className="space-y-2">
          <p className="text-base text-[color:var(--app-heading)]">{hasResume ? "Replace resume" : "Add resume"}</p>
          <p className="text-sm text-[color:var(--app-text)]">Drag and drop a PDF here, or click to choose a file.</p>
          <p className="text-xs text-[color:var(--app-muted)]">Up to 10 MB.</p>
        </div>
      </button>

      {(uploadState === "uploading" || uploadState === "processing") ? (
        <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] px-4 py-3">
          <p className="text-sm text-[color:var(--app-heading)]">
            {uploadState === "uploading" ? "Uploading..." : "Processing..."}
          </p>
          {progress !== null ? (
            <p className="mt-1 text-sm text-[color:var(--app-muted)]">
              {progress}% complete
              {uploadState === "uploading" && progress >= 80 ? " | Finalizing with storage..." : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      {message ? <p className="text-sm text-[color:var(--app-success)]">{message}</p> : null}
      {error ? <p className="text-sm text-[color:var(--app-danger)]">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={onChooseFile}>
          {hasResume ? "Replace resume" : "Choose file"}
        </Button>
      </div>
    </div>
  );
}
