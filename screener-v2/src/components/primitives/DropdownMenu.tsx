"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

export interface DropdownMenuItemProps {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "danger";
}

export function DropdownMenu({
  items,
  trigger = <MoreVertical className="h-4 w-4" />
}: {
  items: DropdownMenuItemProps[];
  trigger?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center text-[color:var(--app-muted)] transition hover:text-[color:var(--app-text)]"
        aria-label="More options"
      >
        {trigger}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-48 rounded border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-md">
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            const content = (
              <span
                className={`block w-full px-4 py-2 text-left text-sm transition ${
                  item.variant === "danger"
                    ? "text-red-400 hover:bg-red-500/10"
                    : "text-[color:var(--app-text)] hover:bg-[color:var(--app-surface-soft)]"
                }`}
              >
                {item.label}
              </span>
            );

            if (item.href) {
              return (
                <a
                  key={idx}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block no-underline ${!isLast ? "border-b border-[color:var(--app-border)]" : ""}`}
                >
                  {content}
                </a>
              );
            }

            return (
              <button
                key={idx}
                onClick={() => {
                  item.onClick?.();
                  setIsOpen(false);
                }}
                className={`w-full text-left ${!isLast ? "border-b border-[color:var(--app-border)]" : ""}`}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
