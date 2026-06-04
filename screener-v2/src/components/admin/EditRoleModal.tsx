'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { APP_ACTIONS, APP_ACTION_LABELS } from '@/lib/auth/permissions';

type AccessRoleRecord = {
  id: string;
  label: string;
  slug: string;
  applicability?: "system" | "department" | "both";
  description?: string;
  permissions?: string[];
};

type AccessRoleApplicability = "system" | "department" | "both";

interface EditRoleModalProps {
  isOpen: boolean;
  role: AccessRoleRecord;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditRoleModal({ isOpen, role, onClose, onSuccess }: EditRoleModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permissionsChanged, setPermissionsChanged] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    applicability: 'department' as AccessRoleApplicability,
    permissions: [] as string[]
  });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const currentPermissions = role.permissions ?? [];
    setFormData({
      label: role.label || '',
      description: role.description || '',
      applicability: role.applicability || 'department',
      permissions: currentPermissions
    });
    setPermissionsChanged(false);
    setError('');
  }, [isOpen, role]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handlePermissionChange = (permission: string) => {
    const originalPermissions = role.permissions ?? [];
    setFormData((current) => {
      const nextPermissions = current.permissions.includes(permission)
        ? current.permissions.filter((value) => value !== permission)
        : [...current.permissions, permission];

      const hasDifference =
        nextPermissions.length !== originalPermissions.length ||
        !nextPermissions.every((value) => originalPermissions.includes(value));

      setPermissionsChanged(hasDifference);
      return { ...current, permissions: nextPermissions };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/roles/${role.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || data.ok === false) {
        throw new Error(data.message || 'Failed to update role');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-[color:var(--app-surface)]">
        {/* Header — always visible */}
        <div className="flex shrink-0 items-center justify-between border-b border-[color:var(--app-border)] p-6">
          <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">Edit access role: {role.label}</h2>
          <button
            onClick={onClose}
            className="text-[color:var(--app-muted)] transition hover:text-[color:var(--app-heading)]"
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* Scrollable body */}
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {error ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
                  {error}
                </div>
              ) : null}

              {permissionsChanged ? (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-700">
                  Changing permissions updates what users with this access role can do immediately.
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[color:var(--app-heading)]">Role name *</label>
                  <input
                    type="text"
                    name="label"
                    value={formData.label}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-input-bg)] px-3 py-2 text-[color:var(--app-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--app-primary)]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[color:var(--app-heading)]">Slug (read-only)</label>
                  <input
                    type="text"
                    value={role.slug}
                    disabled
                    className="w-full cursor-not-allowed rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-2 text-[color:var(--app-muted)]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[color:var(--app-heading)]">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-input-bg)] px-3 py-2 text-[color:var(--app-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--app-primary)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[color:var(--app-heading)]">Applicability</label>
                <input
                  type="text"
                  value={`${formData.applicability.charAt(0).toUpperCase()}${formData.applicability.slice(1)}`}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-2 text-[color:var(--app-muted)]"
                />
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-[color:var(--app-heading)]">Permissions</label>
                <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-3">
                  {APP_ACTIONS.map((action) => (
                    <label
                      key={action}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition hover:bg-[color:var(--app-surface)]"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(action)}
                        onChange={() => handlePermissionChange(action)}
                        className="h-4 w-4 shrink-0 rounded border-[color:var(--app-border)]"
                      />
                      <span className="text-sm text-[color:var(--app-text)]">
                        {APP_ACTION_LABELS[action as keyof typeof APP_ACTION_LABELS]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer — always visible */}
          <div className="flex shrink-0 justify-end gap-3 border-t border-[color:var(--app-border)] p-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[color:var(--app-border)] px-4 py-2 text-[color:var(--app-text)] transition hover:bg-[color:var(--app-surface-soft)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[color:var(--app-primary)] px-4 py-2 text-white transition hover:bg-[color:var(--app-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
