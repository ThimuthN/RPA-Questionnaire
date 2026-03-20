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

function allowedMimeType(file: File) {
  return candidateResumeMimeTypes.includes(file.type as (typeof candidateResumeMimeTypes)[number]);
}

export function ResumeUploader({ candidateId }: { candidateId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function onUpload() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a resume file first.");
      setMessage("");
      return;
    }

    if (!allowedMimeType(file)) {
      setError("Resume must be a PDF or DOCX file.");
      setMessage("");
      return;
    }

    if (file.size > candidateResumeMaxSizeBytes) {
      setError("Resume must be 10 MB or smaller.");
      setMessage("");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError("");
    setMessage("");

    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const pathnameForUpload = `candidate-resumes/${candidateId}/${stamp}-${normalizeResumeFileName(file.name)}`;

      await upload(pathnameForUpload, file, {
        access: "public",
        handleUploadUrl: `/api/candidates/${candidateId}/resume`,
        clientPayload: JSON.stringify({ fileName: file.name, sizeBytes: file.size }),
        multipart: file.size > 5 * 1024 * 1024,
        contentType: file.type,
        onUploadProgress: ({ percentage }) => {
          setProgress(Math.round(percentage));
        }
      });

      setMessage("Resume uploaded.");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      startTransition(() => {
        router.replace(`${pathname}?resumeUploaded=1` as never);
        router.refresh();
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        name="resume"
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="w-full rounded-[18px] border border-dashed border-white/16 bg-white/[0.05] px-4 py-3 text-sm text-slate-200"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => void onUpload()} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload resume"}
        </Button>
        <p className="text-xs text-slate-400">Accepted: PDF or DOCX, up to 10 MB.</p>
      </div>
      {progress !== null ? <p className="text-sm text-slate-300">Upload progress: {progress}%</p> : null}
      {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
    </div>
  );
}
