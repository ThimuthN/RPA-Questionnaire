"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { motion, AnimatePresence } from "framer-motion";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  entityHref: string | null;
  readAt: string | null;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnread(data.count ?? 0);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30_000);
    return () => clearInterval(id);
  }, [fetchCount]);

  const openDrawer = async () => {
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    setUnread(0);
  };

  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] transition hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)]"
        aria-label="Notifications"
      >
        <Bell size={16} className="text-[color:var(--app-muted)]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-400 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="fixed right-4 top-14 z-50 w-80 overflow-hidden rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
            >
              <div className="flex items-center justify-between border-b border-[color:var(--app-border)] px-4 py-3">
                <p className="text-sm font-semibold text-[color:var(--app-heading)]">Notifications</p>
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]"
                  >
                    <Check size={12} />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <p className="p-4 text-sm text-[color:var(--app-muted)]">Loading…</p>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10">
                    <Bell size={24} className="text-[color:var(--app-muted)]" />
                    <p className="text-sm text-[color:var(--app-muted)]">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex gap-3 border-b border-[color:var(--app-border)] px-4 py-3 last:border-0 ${
                        !n.readAt ? "bg-brand-500/5" : ""
                      }`}
                    >
                      {!n.readAt && (
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-400" />
                      )}
                      <div className={`min-w-0 flex-1 ${n.readAt ? "pl-4" : ""}`}>
                        <p className="text-sm font-medium text-[color:var(--app-heading)] leading-tight">
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="mt-0.5 text-xs text-[color:var(--app-muted)] leading-snug">
                            {n.body}
                          </p>
                        )}
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-[color:var(--app-muted)]">
                            {timeAgo(n.createdAt)}
                          </span>
                          {n.entityHref && (
                            <Link
                              href={n.entityHref as Route}
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-0.5 text-[10px] text-brand-300 hover:underline"
                            >
                              View <ExternalLink size={9} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
