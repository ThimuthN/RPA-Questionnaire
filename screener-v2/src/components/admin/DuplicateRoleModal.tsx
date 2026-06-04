'use client';

import { useState } from 'react';
import { RoleCatalog } from '@prisma/client';

interface DuplicateRoleModalProps {
  isOpen: boolean;
  sourceRole: RoleCatalog & { permissions: { permission: string }[] };
  onClose: () => void;
  onSuccess: () => void;
}

export default function DuplicateRoleModal({
  isOpen,
  sourceRole,
  onClose,
  onSuccess
}: DuplicateRoleModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    label: `${sourceRole.label} (Copy)`,
    slug: `${sourceRole.slug}-copy`
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/roles/${sourceRole.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to duplicate role');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate role');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[color:var(--app-surface)] rounded-xl max-w-md w-full">
        <div className="border-b border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">Duplicate Role</h2>
          <button
            onClick={onClose}
            className="text-[color:var(--app-muted)] hover:text-[color:var(--app-heading)] transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <p className="text-sm text-[color:var(--app-text)] mb-3">
              Creating a copy of <strong>{sourceRole.label}</strong> with the same permissions.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:var(--app-heading)] mb-2">
              New Role Name *
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
              New Slug *
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              pattern="^[a-z0-9_-]+$"
              title="Lowercase, numbers, hyphens, and underscores only"
              required
              className="w-full px-3 py-2 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-input-bg)] text-[color:var(--app-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--app-primary)]"
            />
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
              {loading ? 'Duplicating...' : 'Duplicate Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
