"use client";

import type { Route } from "next";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function sanitizeQueryString(queryString: string, transientKeys: string[]) {
  const params = new URLSearchParams(queryString);

  for (const key of transientKeys) {
    params.delete(key);
  }

  return params.toString();
}

export function PersistedTableState({
  storageKey,
  transientKeys = []
}: {
  storageKey: string;
  transientKeys?: string[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const transientKeySignature = transientKeys.join("\0");

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (params.has("clearView")) {
      params.delete("clearView");
      for (const key of transientKeys) {
        params.delete(key);
      }
      window.localStorage.removeItem(storageKey);
      router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}` as Route, { scroll: false });
      return;
    }

    const currentQuery = params.toString();
    const sanitizedQuery = sanitizeQueryString(currentQuery, transientKeys);
    if (sanitizedQuery !== currentQuery) {
      if (sanitizedQuery) {
        window.localStorage.setItem(storageKey, sanitizedQuery);
      } else {
        window.localStorage.removeItem(storageKey);
      }
      router.replace(`${pathname}${sanitizedQuery ? `?${sanitizedQuery}` : ""}` as Route, { scroll: false });
      return;
    }

    if (currentQuery) {
      window.localStorage.setItem(storageKey, currentQuery);
      return;
    }

    const savedQuery = window.localStorage.getItem(storageKey);
    const sanitizedSavedQuery = sanitizeQueryString(savedQuery ?? "", transientKeys);
    if (savedQuery !== sanitizedSavedQuery) {
      if (sanitizedSavedQuery) {
        window.localStorage.setItem(storageKey, sanitizedSavedQuery);
      } else {
        window.localStorage.removeItem(storageKey);
      }
    }

    if (sanitizedSavedQuery) {
      router.replace(`${pathname}?${sanitizedSavedQuery}` as Route, { scroll: false });
    }
  }, [pathname, router, searchParams, storageKey, transientKeySignature]);

  return null;
}
