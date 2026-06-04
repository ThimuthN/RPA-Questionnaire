'use client';

import { useState, useEffect } from 'react';
import { RoleCatalog } from '@prisma/client';
import { APP_ACTIONS, APP_ACTION_LABELS } from '@/lib/auth/permissions';

interface EditRoleModalProps {
  isOpen: boolean;
  role: RoleCatalog & { permissions: { permission: string }[] };
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditRoleModal({ isOpen, role, onClose, onSuccess }: EditRoleModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permissionsChanged, setPermissionsChanged] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    applicability: 'department' as const,
    permissions: [] as string[]
  });

  useEffect(() => {
    if (isOpen && role) {
      const currentPermissions = role.permissions.map(p => p.permission);
      setFormData({
        label: role.label || '',
        description: role.description || '',
        applicability: (role.applicability || 'department') as any,
        permissions: currentPermissions
      });
      setPermissionsChanged(false);
    }
  }, [isOpen, role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (permission: string) => {
    const originalPermissions = role.permissions.map(p => p.permission);
    setFormData(prev => {
      const newPermissions = prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission];

      // Check if permissions differ from original
      const hasDifference =
        newPermissions.length !== originalPermissions.length ||
        !newPermissions.every(p => originalPermissions.includes(p));

      setPermissionsChanged(hasDifference);
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/roles/${role.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update role');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !role) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[color:var(--app-surface)] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 border-b border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">Edit Role: {role.label}</h2>
          <button
            onClick={onClose}
            className="text-[color:var(--app-muted)] hover:text-[color:var(--app-heading)] transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {permissionsChanged && (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3 text-sm text-yellow-700">
              ⚠️ You are modifying this role&apos;s permissions. Users with this role will immediately have their access updated.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[color:var(--app-heading)] mb-2">
                Role Name *
              </label>
              <input
                type="text"
                name="label"
                value={formData.label}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-input-bg)] text-[color:var(--app-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--app-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[color:var(--app-heading)] mb-2">
                Slug (read-only)
              </label>
              <input
                type="text"
                value={role.slug}
                disabled
                className="w-full px-3 py-2 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] text-[color:var(--app-muted)] cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:var(--app-heading)] mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-input-bg)] text-[color:var(--app-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--app-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:var(--app-heading)] mb-2">
              Applicability (read-only)
            </label>
            <input
              type="text"
              value={formData.applicability.charAt(0).toUpperCase() + formData.applicability.slice(1)}
              disabled
              className="w-full px-3 py-2 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] text-[color:var(--app-muted)] cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:var(--app-heading)] mb-3">
              Permissions
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-[color:var(--app-border)] rounded-lg p-4 bg-[color:var(--app-surface-soft)]">
              {APP_ACTIONS.map(action => (
                <label key={action} className="flex items-center gap-2 cursor-pointer hover:bg-[color:var(--app-surface)] p-2 rounded transition">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(action)}
                    onChange={() => handlePermissionChange(action)}
                    className="w-4 h-4 rounded border-[color:var(--app-border)] cursor-pointer"
                  />
                  <span className="text-sm text-[color:var(--app-text)]">
                    {APP_ACTION_LABELS[action as keyof typeof APP_ACTION_LABELS]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end border-t border-[color:var(--app-border)] pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[color:var(--app-border)] text-[color:var(--app-text)] hover:bg-[color:var(--app-surface-soft)] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-[color:var(--app-primary)] text-white hover:bg-[color:var(--app-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
