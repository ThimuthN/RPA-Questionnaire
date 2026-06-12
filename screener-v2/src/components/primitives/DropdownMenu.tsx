"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownMenuItemProps {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "danger";
}

export function DropdownMenu({
  items,
  trigger = <ChevronDown className="h-4 w-4" />
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
    <div className="relative inline-block" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] p-2 text-[color:var(--app-text)] transition hover:bg-[color:var(--app-surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
        aria-label="More options"
      >
        {trigger}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 min-w-max rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-lg">
          {items.map((item, idx) => {
            const content = (
              <span
                className={cn(
                  "block w-full px-4 py-2 text-left text-sm font-medium transition",
                  item.variant === "danger"
                    ? "text-red-300 hover:bg-red-500/10"
                    : "text-[color:var(--app-text)] hover:bg-[color:var(--app-surface-soft)]"
                )}
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
                  className="block no-underline"
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
                className="w-full"
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
