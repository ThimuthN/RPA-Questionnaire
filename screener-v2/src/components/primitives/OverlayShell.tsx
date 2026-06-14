"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Shared shell for all ATS overlays (modals, drawers, slideovers).
 * Provides: portal to document.body, scroll-lock, SSR safety, and a
 * standardized z-[999] stacking context.
 *
 * Each consuming modal keeps its own AnimatePresence + motion so that
 * enter/exit animations remain under its control. This shell only
 * handles the invariant concerns.
 */
export function OverlayShell({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!mounted) return null;
  return createPortal(<>{children}</>, document.body);
}

/**
 * Standard backdrop for use inside OverlayShell.
 * Uses --app-modal-overlay so light/dark themes control the tint,
 * and backdrop-blur-sm for depth separation.
 */
export function OverlayBackdrop({
  onClick,
}: {
  onClick?: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[999] backdrop-blur-sm"
      style={{ background: "var(--app-modal-overlay, rgba(0,0,0,0.5))" }}
      onClick={onClick}
      aria-hidden="true"
    />
  );
}

/**
 * Standard content container for use inside OverlayShell.
 * Sits above the backdrop (z-[1000]) and centers its child.
 */
export function OverlayContent({
  children,
  align = "center",
}: {
  children: React.ReactNode;
  align?: "center" | "bottom";
}) {
  return (
    <div
      className={`fixed inset-0 z-[1000] flex p-4 ${
        align === "bottom"
          ? "items-end justify-center sm:items-center"
          : "items-center justify-center"
      }`}
    >
      {children}
    </div>
  );
}
