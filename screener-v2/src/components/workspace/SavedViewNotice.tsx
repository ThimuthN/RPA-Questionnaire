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
  const hasActiveFilters = currentPathAndQuery.includes("?");

  useEffect(() => {
    const key = storageKey(storageId);
    const stored = window.localStorage.getItem(key) || "";
    setSavedHref(stored);
  }, [storageId]);

  function saveCurrentView() {
    const key = storageKey(storageId);
    window.localStorage.setItem(key, currentPathAndQuery);
    setSavedHref(currentPathAndQuery);
  }

  function clearSavedView() {
    window.localStorage.removeItem(storageKey(storageId));
    setSavedHref("");
  }

  // Active filters, nothing saved yet — offer to save
  if (hasActiveFilters && (!savedHref || savedHref === currentPathAndQuery)) {
    return (
      <StagePanel className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="space-y-1">
          <p className="text-sm text-white">Save this view</p>
          <p className="text-xs text-slate-400">Bookmark your current filters so you can restore them next time.</p>
        </div>
        <Button variant="secondary" type="button" onClick={saveCurrentView}>
          Save this view
        </Button>
      </StagePanel>
    );
  }

  // No active filters, saved view exists — offer to restore
  if (!hasActiveFilters && savedHref) {
    return (
      <StagePanel className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="space-y-1">
          <p className="text-sm text-white">Restore your last filtered view</p>
          <p className="text-xs text-slate-400">Your previous filters were saved in this browser.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={savedHref as Route}>
            <Button variant="secondary">Restore</Button>
          </Link>
          <Button variant="ghost" type="button" onClick={clearSavedView}>
            Clear saved
          </Button>
        </div>
      </StagePanel>
    );
  }

  return null;
}
