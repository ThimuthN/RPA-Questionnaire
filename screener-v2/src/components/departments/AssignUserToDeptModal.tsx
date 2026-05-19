"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { FormInput } from "@/components/primitives/FormInput";
import { Modal } from "@/components/primitives/Modal";
import { FormError } from "@/components/primitives/FormError";

export function AssignUserToDeptModal({
  departmentId,
  departmentName
}: {
  departmentId: string;
  departmentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const formData = new FormData(e.currentTarget);
      const userId = formData.get("userId") as string;
      const roleId = formData.get("roleId") as string;

      if (!userId || !roleId) {
        setError("Please fill in all fields");
        return;
      }

      const response = await fetch(`/api/departments/${departmentId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, roleId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to assign user to department");
      }

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        // Trigger page refresh to show updated users list
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="secondary" className="px-3 py-2 text-xs">
        Add User
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Assign user to department">
        <div className="space-y-1 mb-6">
          <p className="text-sm text-[color:var(--app-muted)]">
            Add an existing user to {departmentName} and assign them a role.
          </p>
        </div>

        {success && (
          <div className="rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100 mb-4">
            User assigned successfully!
          </div>
        )}

        {error && <FormError message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            name="userId"
            label="User"
            placeholder="Select a user..."
            type="text"
            disabled={saving}
            required
          />

          <FormInput
            name="roleId"
            label="Role"
            placeholder="Select a role..."
            type="text"
            disabled={saving}
            required
          />

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={saving}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="px-4 py-2"
            >
              {saving ? "Assigning..." : "Assign User"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
