"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { StagePanel } from "@/components/scene/StagePanel";

function storageKey(key: string) {
  return `workspace-view:${key}`;
}

export function SavedViewNotice({
  storageId,
  currentPathAndQuery
}: {
  storageId: string;
  currentPathAndQuery: string;
}) {
  const [savedHref, setSavedHref] = useState("");

  useEffect(() => {
    const key = storageKey(storageId);
    if (currentPathAndQuery.includes("?")) {
      window.localStorage.setItem(key, currentPathAndQuery);
      setSavedHref(currentPathAndQuery);
      return;
    }

    const stored = window.localStorage.getItem(key) || "";
    setSavedHref(stored);
  }, [currentPathAndQuery, storageId]);

  if (!savedHref || savedHref === currentPathAndQuery || currentPathAndQuery.includes("?")) {
    return null;
  }

  return (
    <StagePanel className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="space-y-1">
        <p className="text-sm text-white">Restore your last filtered view</p>
        <p className="text-xs text-slate-400">Your previous candidate/result filters were saved in this browser.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={savedHref as Route}>
          <Button variant="secondary">Restore</Button>
        </Link>
        <Button
          variant="ghost"
          type="button"
          onClick={() => {
            window.localStorage.removeItem(storageKey(storageId));
            setSavedHref("");
          }}
        >
          Clear saved
        </Button>
      </div>
    </StagePanel>
  );
}
