'use client';

import { useState } from 'react';
import { APP_ACTIONS, APP_ACTION_LABELS } from '@/lib/auth/permissions';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateRoleModal({ isOpen, onClose, onSuccess }: CreateRoleModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    label: '',
    slug: '',
    description: '',
    applicability: 'department' as const,
    permissions: [] as string[]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create role');
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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[color:var(--app-surface)] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 border-b border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">Create New Role</h2>
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
                placeholder="e.g., Senior Hiring Lead"
                required
                className="w-full px-3 py-2 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-input-bg)] text-[color:var(--app-text)] placeholder-[color:var(--app-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--app-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[color:var(--app-heading)] mb-2">
                Slug *
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="senior-hiring-lead"
                pattern="^[a-z0-9_-]+$"
                title="Lowercase, numbers, hyphens, and underscores only"
                required
                className="w-full px-3 py-2 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-input-bg)] text-[color:var(--app-text)] placeholder-[color:var(--app-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--app-primary)]"
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
              placeholder="Describe this role's purpose and responsibilities"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-input-bg)] text-[color:var(--app-text)] placeholder-[color:var(--app-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--app-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:var(--app-heading)] mb-2">
              Applicability *
            </label>
            <select
              name="applicability"
              value={formData.applicability}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-input-bg)] text-[color:var(--app-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--app-primary)]"
            >
              <option value="system">System Only (system-wide grants)</option>
              <option value="department">Department Only (department-scoped grants)</option>
              <option value="both">Both (system and department grants)</option>
            </select>
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
              disabled={loading || !formData.label || !formData.slug}
              className="px-4 py-2 rounded-lg bg-[color:var(--app-primary)] text-white hover:bg-[color:var(--app-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
