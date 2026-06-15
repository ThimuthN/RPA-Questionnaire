"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, X } from "lucide-react";
import Image from "next/image";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | undefined>(avatarUrl);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const formData = new FormData();
    formData.append("avatar", file);

    const res = await fetch(`/api/candidates/${candidateId}/avatar`, {
      method: "POST",
      body: formData
    });

    const data = await res.json().catch(() => ({})) as { ok?: boolean; avatarUrl?: string; error?: string };
    if (!res.ok || data.error) {
      setError(data.error ?? "Upload failed.");
      return;
    }

    setLocalAvatarUrl(data.avatarUrl);
    startTransition(() => router.refresh());
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemove() {
    setError(null);
    const res = await fetch(`/api/candidates/${candidateId}/avatar`, { method: "DELETE" });
    if (!res.ok) { setError("Could not remove photo."); return; }
    setLocalAvatarUrl(undefined);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="group relative">
        {localAvatarUrl ? (
          <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-[color:var(--app-border)]">
            <Image
              src={localAvatarUrl}
              alt={fullName}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--app-brand),var(--app-brand-strong))] text-lg font-semibold text-white select-none ring-2 ring-[color:var(--app-border)]">
            {initials(fullName)}
          </div>
        )}

        {canManage && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
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
          disabled={isPending}
          className="flex items-center gap-1 text-[10px] text-[color:var(--app-muted)] transition hover:text-[color:var(--app-danger)]"
          aria-label="Remove photo"
        >
          <X className="h-2.5 w-2.5" />
          Remove photo
        </button>
      ) : canManage ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="text-[10px] text-[color:var(--app-muted)] transition hover:text-[color:var(--app-brand)]"
        >
          Add photo
        </button>
      ) : null}

      {error ? (
        <p className="text-[11px] text-[color:var(--app-danger)]">{error}</p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleFileChange}
      />
    </div>
  );
}
