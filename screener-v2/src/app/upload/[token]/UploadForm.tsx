"use client";

import { useRef, useState, useCallback } from "react";
import { UploadShell, UploadSuccessScreen } from "./UploadTokenGate";

const MAX_FILES = 5;
const MAX_SIZE_MB = 50;
const ACCEPTED = ".pdf,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg,.webp,.zip";

type UploadState = "idle" | "uploading" | "done" | "error";

export function UploadForm({ token, assessmentTitle }: { token: string; assessmentTitle: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming);
    const totalSize = arr.reduce((s, f) => s + f.size, 0);
    if (totalSize > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Total size must not exceed ${MAX_SIZE_MB} MB.`);
      return;
    }
    setFiles((prev) => {
      const merged = [...prev, ...arr];
      if (merged.length > MAX_FILES) {
        setError(`Maximum ${MAX_FILES} files allowed.`);
        return prev;
      }
      setError(null);
      return merged;
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
    setError(null);
  };

  const handleSubmit = async () => {
    if (files.length === 0) { setError("Please add at least one file."); return; }
    setState("uploading");
    setError(null);
    setProgress(10);

    const fd = new FormData();
    for (const f of files) fd.append("files", f);

    try {
      setProgress(40);
      const res = await fetch(`/api/upload/${token}`, { method: "POST", body: fd });
      setProgress(90);
      const data = await res.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Upload failed. Please try again.");
        setState("error");
        return;
      }
      setProgress(100);
      setState("done");
    } catch {
      setError("Network error. Please check your connection and try again.");
      setState("error");
    }
  };

  if (state === "done") return <UploadSuccessScreen />;

  return (
    <UploadShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#18b5ae]">Assessment submission</p>
          <h1 className="text-xl font-semibold text-white leading-snug">{assessmentTitle}</h1>
          <p className="text-sm text-slate-400">
            Upload your completed work using this secure one-time link. Accepted formats: PDF, Word, images, ZIP — up to {MAX_FILES} files.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={[
            "cursor-pointer rounded-[16px] border-2 border-dashed px-6 py-10 text-center transition-all",
            dragging
              ? "border-[#18b5ae] bg-[#18b5ae]/6"
              : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
          ].join(" ")}
        >
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#18b5ae]/10">
            <svg className="h-5 w-5 text-[#18b5ae]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-300">
            {dragging ? "Drop to add" : "Drag files here or click to browse"}
          </p>
          <p className="mt-1 text-xs text-slate-500">PDF, Word, ZIP, images · Up to {MAX_FILES} files · {MAX_SIZE_MB} MB total</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED}
            className="sr-only"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((f) => (
              <div key={f.name} className="flex items-center gap-3 rounded-[12px] border border-white/8 bg-white/[0.03] px-4 py-2.5">
                <svg className="h-4 w-4 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-300">{f.name}</span>
                <span className="flex-shrink-0 text-xs text-slate-500">{(f.size / 1024).toFixed(0)} KB</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeFile(f.name); }}
                  className="flex-shrink-0 rounded p-0.5 text-slate-500 transition hover:text-red-400"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-[12px] border border-red-500/20 bg-red-500/8 px-4 py-3">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Progress bar */}
        {state === "uploading" && (
          <div className="space-y-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#18b5ae] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-xs text-slate-400">Uploading {files.length} file{files.length !== 1 ? "s" : ""}…</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={state === "uploading" || files.length === 0}
          className="w-full rounded-full bg-[#18b5ae] py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {state === "uploading" ? "Uploading…" : `Submit ${files.length > 0 ? `${files.length} file${files.length !== 1 ? "s" : ""}` : "files"}`}
        </button>

        <p className="text-center text-[11px] text-slate-600">
          This link can only be used once. Files are securely stored and accessible only to the hiring team.
        </p>
      </div>
    </UploadShell>
  );
}
