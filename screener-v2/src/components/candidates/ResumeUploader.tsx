"use client";

import { startTransition, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  async function saveResumeRecord(args: {
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    storageUrl: string;
  }) {
    const completeResponse = await fetch(`/api/candidates/${candidateId}/resume`, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        action: "complete",
        ...args
      })
    });

    if (!completeResponse.ok) {
      const payload = (await completeResponse.json().catch(() => null)) as { message?: string } | null;
      throw new Error(payload?.message || "Could not save the uploaded resume.");
    }
  }

  async function confirmResume(storageKey: string) {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const response = await fetch(`/api/candidates/${candidateId}/resume`, {
        cache: "no-store",
        credentials: "same-origin"
      });

      if (!response.ok) {
        throw new Error("Could not confirm the resume upload.");
      }

      const payload = (await response.json()) as {
        ok: boolean;
        resume?: { storageKey?: string } | null;
      };

      if (payload.resume?.storageKey === storageKey) {
        return;
      }

      await sleep(800);
    }

    throw new Error("Upload finished, but the resume is still processing. Please try again.");
  }

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
    setProgress(0);
    setError("");
    setMessage("");

    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const storageKey = `candidate-resumes/${candidateId}/${stamp}-${normalizeResumeFileName(file.name)}`;
      const blob = await upload(storageKey, file, {
        access: "public",
        handleUploadUrl: `/api/candidates/${candidateId}/resume`,
        clientPayload: JSON.stringify({
          fileName: file.name,
          sizeBytes: file.size
        }),
        contentType: file.type,
        multipart: true,
        onUploadProgress: ({ percentage }) => {
          setProgress(Math.round(percentage));
        }
      });

      setUploadState("processing");
      setMessage("Saving resume...");

      try {
        await confirmResume(blob.pathname);
      } catch {
        // Recover when the blob callback is slow or unavailable by persisting the
        // uploaded file through the app route before the final confirmation check.
        await saveResumeRecord({
          fileName: file.name,
          sizeBytes: file.size,
          mimeType: file.type,
          storageKey: blob.pathname,
          storageUrl: blob.url
        });
        await confirmResume(blob.pathname);
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
            ? "border-brand-300/70 bg-brand-500/10"
            : "border-white/18 bg-white/[0.04] hover:border-white/28 hover:bg-white/[0.06]"
        }`}
      >
        <div className="space-y-2">
          <p className="text-base text-white">{hasResume ? "Replace resume" : "Add resume"}</p>
          <p className="text-sm text-slate-300">Drag and drop a PDF here, or click to choose a file.</p>
          <p className="text-xs text-slate-400">Up to 10 MB.</p>
        </div>
      </button>

      {(uploadState === "uploading" || uploadState === "processing") ? (
        <div className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-sm text-white">
            {uploadState === "uploading" ? "Uploading..." : "Processing..."}
          </p>
          {progress !== null ? (
            <p className="mt-1 text-sm text-slate-300">
              {progress}% complete
              {uploadState === "uploading" && progress >= 80 ? " | Finalizing with storage..." : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
      {error ? <p className="text-sm text-red-200">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={onChooseFile}>
          {hasResume ? "Replace resume" : "Choose file"}
        </Button>
      </div>
    </div>
  );
}
