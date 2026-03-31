"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/primitives/Button";

export function AddUserModal({
  created,
  updated,
  error
}: {
  created?: string;
  updated?: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (created || error) setOpen(true);
  }, [created, error]);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Add user
      </Button>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, backdropFilter: "blur(6px)" }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="fixed inset-0 z-[999] flex items-start justify-center overflow-y-auto p-4 pt-16 md:p-6 md:pt-20"
                  style={{ background: "var(--app-modal-overlay)" }}
                  onClick={() => setOpen(false)}
                >
                  <motion.div
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.985, filter: "blur(10px)" }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.992, filter: "blur(8px)" }}
                    transition={{ duration: reduceMotion ? 0.14 : 0.26, ease: [0.22, 1, 0.36, 1] }}
                    className="flex w-full max-w-2xl flex-col overflow-hidden rounded-[30px] border border-[color:var(--app-border)] shadow-[var(--app-modal-shadow)]"
                    style={{ background: "var(--app-modal-surface)" }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-start justify-between gap-4 border-b border-[color:var(--app-border)] px-5 py-5 md:px-6" style={{ background: "var(--app-modal-header)" }}>
                      <div className="space-y-1">
                        <h2 className="text-2xl text-[color:var(--app-heading)]">Add user</h2>
                        <p className="text-sm text-[color:var(--app-muted)]">Create internal access for a team member.</p>
                      </div>
                      <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                        Close
                      </Button>
                    </div>

                    <form action="/api/users" method="post" className="space-y-4 px-5 py-5 md:px-6" style={{ background: "var(--app-modal-body)" }}>
                      <div className="grid gap-1">
                        <label className="text-sm text-[color:var(--app-text)]" htmlFor="add-user-name">
                          Name
                        </label>
                        <input
                          id="add-user-name"
                          name="name"
                          className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                          placeholder="Internal user"
                        />
                      </div>

                      <div className="grid gap-1">
                        <label className="text-sm text-[color:var(--app-text)]" htmlFor="add-user-email">
                          Email
                        </label>
                        <input
                          id="add-user-email"
                          name="email"
                          type="email"
                          required
                          className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                        />
                      </div>

                      <div className="grid gap-1">
                        <label className="text-sm text-[color:var(--app-text)]" htmlFor="add-user-password">
                          Password
                        </label>
                        <input
                          id="add-user-password"
                          name="password"
                          type="password"
                          minLength={8}
                          required
                          className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                        />
                      </div>

                      <div className="grid gap-1">
                        <label className="text-sm text-[color:var(--app-text)]" htmlFor="add-user-role">
                          Role
                        </label>
                        <select
                          id="add-user-role"
                          name="role"
                          defaultValue="member"
                          className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      {created ? <p className="text-sm text-[color:var(--app-success)]">Created {created}.</p> : null}
                      {updated ? <p className="text-sm text-[color:var(--app-success)]">Updated {updated}.</p> : null}
                      {error ? <p className="text-sm text-[color:var(--app-danger)]">{error}</p> : null}

                      <div className="flex justify-end gap-3 border-t border-[color:var(--app-border)] pt-4">
                        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Create user</Button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
