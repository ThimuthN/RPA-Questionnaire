"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function updatePosition() {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 6,
          left: rect.right - 192
        });
      }
    }

    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);
    }

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center text-[color:var(--app-muted)] transition hover:text-[color:var(--app-text)]"
        aria-label="More options"
      >
        {trigger}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-50 min-w-48 rounded border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-md"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`
            }}
          >
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
          </div>,
          document.body
        )}
    </>
  );
}
