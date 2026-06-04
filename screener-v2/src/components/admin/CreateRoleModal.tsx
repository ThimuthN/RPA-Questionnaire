'use client';

import { useEffect, useState } from 'react';
import { APP_ACTIONS, APP_ACTION_LABELS } from '@/lib/auth/permissions';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDepartmentId?: string;
  defaultApplicability?: 'system' | 'department' | 'both';
  allowSystemOnly?: boolean;
}

const emptyForm = {
  label: '',
  slug: '',
  description: '',
  applicability: 'department' as const,
  permissions: [] as string[]
};

export default function CreateRoleModal({
  isOpen,
  onClose,
  onSuccess,
  defaultDepartmentId,
  defaultApplicability = 'department',
  allowSystemOnly = true
}: CreateRoleModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    ...emptyForm,
    applicability: defaultApplicability
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData({
      ...emptyForm,
      applicability: defaultApplicability
    });
    setError('');
  }, [defaultApplicability, isOpen]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handlePermissionChange = (permission: string) => {
    setFormData((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((value) => value !== permission)
        : [...current.permissions, permission]
    }));
  };

  const applicabilityOptions = allowSystemOnly
    ? [
        { value: 'system', label: 'System Only (system-wide grants)' },
        { value: 'department', label: 'Department Only (department-scoped grants)' },
        { value: 'both', label: 'Both (system and department grants)' }
      ]
    : [
        { value: 'department', label: 'Department Only (department-scoped grants)' },
        { value: 'both', label: 'Both (system and department grants)' }
      ];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          kind: 'access_role',
          departmentId: defaultDepartmentId
        })
      });

      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || data.ok === false) {
        throw new Error(data.message || 'Failed to create role');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-[color:var(--app-surface)]">
        <div className="sticky top-0 flex items-center justify-between border-b border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6">
          <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">Create access role</h2>
          <button
            onClick={onClose}
            className="text-[color:var(--app-muted)] transition hover:text-[color:var(--app-heading)]"
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
              {error}
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
                placeholder="e.g. Senior Hiring Lead"
                required
                className="w-full rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-input-bg)] px-3 py-2 text-[color:var(--app-text)] placeholder-[color:var(--app-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--app-primary)]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[color:var(--app-heading)]">Slug *</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="senior-hiring-lead"
                title="Lowercase, numbers, hyphens, and underscores only"
                required
                className="w-full rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-input-bg)] px-3 py-2 text-[color:var(--app-text)] placeholder-[color:var(--app-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--app-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[color:var(--app-heading)]">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what this access role allows."
              rows={3}
              className="w-full rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-input-bg)] px-3 py-2 text-[color:var(--app-text)] placeholder-[color:var(--app-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--app-primary)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[color:var(--app-heading)]">Applicability *</label>
            <select
              name="applicability"
              value={formData.applicability}
              onChange={handleChange}
              className="w-full rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-input-bg)] px-3 py-2 text-[color:var(--app-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--app-primary)]"
            >
              {applicabilityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-[color:var(--app-heading)]">Permissions</label>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
              {APP_ACTIONS.map((action) => (
                <label
                  key={action}
                  className="flex cursor-pointer items-center gap-2 rounded p-2 transition hover:bg-[color:var(--app-surface)]"
                >
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(action)}
                    onChange={() => handlePermissionChange(action)}
                    className="h-4 w-4 rounded border-[color:var(--app-border)]"
                  />
                  <span className="text-sm text-[color:var(--app-text)]">
                    {APP_ACTION_LABELS[action as keyof typeof APP_ACTION_LABELS]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-[color:var(--app-border)] pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[color:var(--app-border)] px-4 py-2 text-[color:var(--app-text)] transition hover:bg-[color:var(--app-surface-soft)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.label || !formData.slug}
              className="rounded-lg bg-[color:var(--app-primary)] px-4 py-2 text-white transition hover:bg-[color:var(--app-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create access role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
