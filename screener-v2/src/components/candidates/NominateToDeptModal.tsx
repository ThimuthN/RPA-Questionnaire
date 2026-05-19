"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import { Button } from "@/components/primitives/Button";

interface Department {
  id: string;
  name: string;
}

interface Role {
  id: string;
  label: string;
  departmentId: string;
}

interface NominateToDeptModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  onSuccess?: () => void;
}

export function NominateToDeptModal({
  isOpen,
  onClose,
  candidateId,
  onSuccess
}: NominateToDeptModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingDepts, setIsLoadingDepts] = useState(false);

  const [formData, setFormData] = useState({
    departmentId: "",
    roleId: "",
    nominationNote: ""
  });

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.departmentId) {
      const deptRoles = roles.filter((r) => r.departmentId === formData.departmentId);
      setFormData((prev) => ({
        ...prev,
        roleId: deptRoles.length > 0 ? deptRoles[0].id : ""
      }));
    }
  }, [formData.departmentId, roles]);

  const fetchDepartments = async () => {
    setIsLoadingDepts(true);
    try {
      const response = await fetch("/api/departments");
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
        // Fetch roles as well
        const rolesResponse = await fetch("/api/roles");
        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json();
          setRoles(rolesData);
        }
      }
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    } finally {
      setIsLoadingDepts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError("");

    if (!formData.departmentId) {
      setError("Select a department");
      setIsPending(false);
      return;
    }

    try {
      const response = await fetch("/api/candidacies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          departmentId: formData.departmentId,
          roleId: formData.roleId || undefined,
          nominationNote: formData.nominationNote || undefined
        })
      });

      if (response.ok) {
        setFormData({ departmentId: "", roleId: "", nominationNote: "" });
        onSuccess?.();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to nominate candidate");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error nominating candidate");
    } finally {
      setIsPending(false);
    }
  };

  const availableRoles = formData.departmentId
    ? roles.filter((r) => r.departmentId === formData.departmentId)
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[color:var(--app-border)] bg-gradient-to-r from-[color:var(--app-surface)] to-[color:var(--app-surface-soft)] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10">
                    <Send className="h-5 w-5 text-brand-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">
                    Nominate to Department
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-1 transition hover:bg-[color:var(--app-surface-soft)]"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5 text-[color:var(--app-muted)]" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[16px] border border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger-soft)] p-3 text-sm text-[color:var(--app-danger)]"
                  >
                    {error}
                  </motion.div>
                )}

                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[color:var(--app-muted)]">
                    Department
                  </span>
                  <select
                    value={formData.departmentId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, departmentId: e.target.value }))
                    }
                    disabled={isLoadingDepts || isPending}
                    className="w-full rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3.5 py-2.5 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60 focus-visible:ring-2 focus-visible:ring-brand-300/80"
                  >
                    <option value="">Select a department...</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </label>

                {formData.departmentId && (
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[color:var(--app-muted)]">
                      Role (Optional)
                    </span>
                    <select
                      value={formData.roleId}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, roleId: e.target.value }))
                      }
                      disabled={isPending || availableRoles.length === 0}
                      className="w-full rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3.5 py-2.5 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60 focus-visible:ring-2 focus-visible:ring-brand-300/80"
                    >
                      <option value="">No specific role</option>
                      {availableRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[color:var(--app-muted)]">
                    Nomination Note (Optional)
                  </span>
                  <textarea
                    value={formData.nominationNote}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, nominationNote: e.target.value }))
                    }
                    rows={3}
                    placeholder="Why are you nominating them? Any context for this department?"
                    className="w-full rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3.5 py-2.5 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60 focus-visible:ring-2 focus-visible:ring-brand-300/80 min-h-[100px] resize-y"
                  />
                </label>

                <div className="flex gap-3 border-t border-[color:var(--app-border)] pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending || !formData.departmentId}
                    className="flex-1"
                  >
                    {isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Nominating...
                      </span>
                    ) : (
                      "Nominate"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
