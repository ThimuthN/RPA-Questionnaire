"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, X, Loader2 } from "lucide-react";
import Image from "next/image";

const ACCEPTED_INPUT_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_INPUT_BYTES = 10 * 1024 * 1024; // generous: we downscale before upload
const OUTPUT_SIZE = 512;

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Normalize a photo entirely on the client: center-crop to a square, resize to
 * 512px, and re-encode to WebP. Re-rendering through a canvas discards all
 * embedded metadata (EXIF/GPS) — important since candidate photos are PII — and
 * keeps the uploaded blob tiny and uniform.
 */
function normalizeToSquareWebp(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Your browser can't process this image."));
          return;
        }
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Could not process the image."))),
          "image/webp",
          0.85
        );
      } catch {
        reject(new Error("Could not process the image."));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image. Try a JPEG or PNG."));
    };
    img.src = url;
  });
}

export function CandidateAvatarUpload({
  candidateId,
  fullName,
  avatarUrl,
  canManage
}: {
  candidateId: string;
  fullName: string;
  avatarUrl?: string;
  canManage: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | undefined>(avatarUrl);
  const [error, setError] = useState<string | null>(null);

  const busy = uploading || isPending;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = ""; // allow re-selecting the same file
    if (!file) return;
    setError(null);

    if (!ACCEPTED_INPUT_TYPES.includes(file.type)) {
      setError("Please choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError("That image is too large (max 10 MB).");
      return;
    }

    setUploading(true);
    try {
      const normalized = await normalizeToSquareWebp(file);
      const formData = new FormData();
      formData.append("avatar", normalized, "avatar.webp");

      const res = await fetch(`/api/candidates/${candidateId}/avatar`, {
        method: "POST",
        body: formData
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        avatarUrl?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.avatarUrl) {
        setError(data.error ?? "Upload failed. Please try again.");
        return;
      }
      setLocalAvatarUrl(data.avatarUrl);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setUploading(true);
    try {
      const res = await fetch(`/api/candidates/${candidateId}/avatar`, { method: "DELETE" });
      if (!res.ok) {
        setError("Could not remove the photo.");
        return;
      }
      setLocalAvatarUrl(undefined);
      startTransition(() => router.refresh());
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="group relative">
        {localAvatarUrl ? (
          <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-[color:var(--app-border)]">
            <Image src={localAvatarUrl} alt={fullName} fill sizes="64px" className="object-cover" />
          </div>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--app-brand),var(--app-brand-strong))] text-lg font-semibold text-white select-none ring-2 ring-[color:var(--app-border)]">
            {initials(fullName)}
          </div>
        )}

        {/* Uploading overlay */}
        {busy ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        ) : null}

        {canManage && !busy && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition group-hover:bg-black/32 group-hover:opacity-100"
            aria-label="Upload photo"
          >
            <Camera className="h-5 w-5 text-white drop-shadow" />
          </button>
        )}
      </div>

      {canManage && localAvatarUrl ? (
        <button
          type="button"
          onClick={handleRemove}
          disabled={busy}
          className="flex items-center gap-1 text-[10px] text-[color:var(--app-muted)] transition hover:text-[color:var(--app-danger)] disabled:opacity-50"
          aria-label="Remove photo"
        >
          <X className="h-2.5 w-2.5" />
          Remove photo
        </button>
      ) : canManage ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="text-[10px] text-[color:var(--app-muted)] transition hover:text-[color:var(--app-brand)] disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Add photo"}
        </button>
      ) : null}

      {error ? <p className="max-w-[8rem] text-center text-[11px] text-[color:var(--app-danger)]">{error}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
      />
    </div>
  );
}
