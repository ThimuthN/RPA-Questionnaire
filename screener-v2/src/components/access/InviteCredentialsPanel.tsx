"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/primitives/Button";
import { cn } from "@/lib/utils";
import { copyText } from "@/lib/clipboard";
import { StatusPill } from "@/components/primitives/StatusPill";
import { copy } from "@/lib/design/copy";

export interface InviteCredentials {
  entryUrl: string;
  token: string;
  passcode: string | null;
}

export function InviteCredentialsPanel({
  invite,
  testId,
  className,
  openLabel = copy.create.startTest,
  showCopyAll = true,
  startNow = false
}: {
  invite: InviteCredentials;
  testId?: string | null;
  className?: string;
  openLabel?: string;
  showCopyAll?: boolean;
  startNow?: boolean;
}) {
  const [notice, setNotice] = useState<string>("");
  const reduceMotion = useReducedMotion();
  const openHref = useMemo(() => {
    const separator = invite.entryUrl.includes("?") ? "&" : "?";
    const params = new URLSearchParams();
    if (invite.passcode) params.set("passcode", invite.passcode);
    if (startNow) params.set("startNow", "1");
    const query = params.toString();
    if (!query) return invite.entryUrl;
    return `${invite.entryUrl}${separator}${query}`;
  }, [invite.entryUrl, invite.passcode, startNow]);

  async function onCopy(label: string, value: string | null) {
    if (!value) {
      setNotice(`${label} is empty.`);
      return;
    }
    const ok = await copyText(value);
    setNotice(ok ? `${label} copied.` : `Could not copy ${label.toLowerCase()}.`);
  }

  async function onCopyAll() {
    const payload = [
      `${copy.create.testLink}: ${invite.entryUrl}`,
      `${copy.create.testId}: ${testId ?? "--"}`,
      `${copy.create.passcode}: ${invite.passcode ?? "None"}`
    ].join("\n");
    const ok = await copyText(payload);
    setNotice(ok ? "Details copied." : "Could not copy details.");
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.2, 1, 0.2, 1] }}
      className={cn(
        "space-y-5 rounded-[24px] border border-brand-300/28 bg-[linear-gradient(180deg,rgba(47,134,255,0.14),rgba(255,255,255,0.04))] p-5 shadow-[var(--shadow-elevated)]",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-200">{copy.create.ready}</p>
          <h3 className="text-xl text-white">Assessment access is ready</h3>
        </div>
        <StatusPill label={copy.create.share} tone="blue" className="whitespace-nowrap" />
      </div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.8fr)_minmax(180px,0.7fr)_minmax(180px,0.7fr)]">
        <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{copy.create.testLink}</p>
          <p className="mt-3 break-all font-mono text-xs leading-6 text-white">{invite.entryUrl}</p>
          <Button
            variant="secondary"
            className="mt-4 w-full justify-center"
            onClick={() => onCopy("Link", invite.entryUrl)}
          >
            {copy.create.copyLink}
          </Button>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{copy.create.testId}</p>
          <p className="mt-3 font-mono text-sm text-white">{testId ?? "--"}</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{copy.create.passcode}</p>
          <p className="mt-3 font-mono text-sm text-white">{invite.passcode ?? "None"}</p>
          {invite.passcode ? (
            <Button
              variant="secondary"
              className="mt-4 w-full justify-center"
              onClick={() => onCopy("Passcode", invite.passcode)}
            >
              Copy code
            </Button>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-1">
        <a
          href={openHref}
          className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(31,111,255,1),rgba(47,134,255,0.88))] px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
        >
          {openLabel}
        </a>
        {showCopyAll ? (
          <Button variant="secondary" onClick={onCopyAll}>
            {copy.create.copyDetails}
          </Button>
        ) : null}
        {notice ? <p className="text-xs text-teal-200">{notice}</p> : null}
      </div>
    </motion.div>
  );
}
