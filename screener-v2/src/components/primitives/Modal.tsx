"use client";

import { createPortal } from "react-dom";

export function Modal({
  isOpen,
  title,
  children,
  footer,
  onClose,
  maxWidth = "max-w-2xl"
}: {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 backdrop-blur-xl" style={{ background: "var(--app-modal-overlay)" }}>
      <div className={`flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden rounded-[30px] border border-[color:var(--app-border)] shadow-[var(--app-modal-shadow)]`} style={{ background: "var(--app-modal-surface)" }}>
        <div className="border-b border-[color:var(--app-border)] px-5 py-4 md:px-6" style={{ background: "var(--app-modal-header)" }}>
          <h3 className="text-2xl text-[color:var(--app-heading)]">{title}</h3>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 md:px-6" style={{ background: "var(--app-modal-body)" }}>
          {children}
        </div>

        {footer && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--app-border)] px-5 py-4 md:px-6" style={{ background: "var(--app-modal-footer)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
