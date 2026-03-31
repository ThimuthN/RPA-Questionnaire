"use client";

import type { Route } from "next";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function PersistedTableState({ storageKey }: { storageKey: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (params.has("clearView")) {
      params.delete("clearView");
      window.localStorage.removeItem(storageKey);
      router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}` as Route, { scroll: false });
      return;
    }

    const currentQuery = params.toString();
    if (currentQuery) {
      window.localStorage.setItem(storageKey, currentQuery);
      return;
    }

    const savedQuery = window.localStorage.getItem(storageKey);
    if (savedQuery) {
      router.replace(`${pathname}?${savedQuery}` as Route, { scroll: false });
    }
  }, [pathname, router, searchParams, storageKey]);

  return null;
}
