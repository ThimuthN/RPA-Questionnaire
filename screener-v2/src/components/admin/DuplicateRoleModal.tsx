'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type AccessRoleRecord = {
  id: string;
  label: string;
  slug: string;
  permissions?: string[];
};

interface DuplicateRoleModalProps {
  isOpen: boolean;
  sourceRole: AccessRoleRecord;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DuplicateRoleModal({
  isOpen,
  sourceRole,
  onClose,
  onSuccess
}: DuplicateRoleModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    label: `${sourceRole.label} (Copy)`,
    slug: `${sourceRole.slug}-copy`
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

    setFormData({
      label: `${sourceRole.label} (Copy)`,
      slug: `${sourceRole.slug}-copy`
    });
    setError('');
  }, [isOpen, sourceRole]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/roles/${sourceRole.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        suggestedSlug?: string;
      };

      if (!response.ok || data.ok === false) {
        if (data.suggestedSlug) {
          setFormData((current) => ({ ...current, slug: data.suggestedSlug as string }));
        }
        throw new Error(data.message || 'Failed to duplicate role');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate role');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-[color:var(--app-surface)]">
        <div className="flex items-center justify-between border-b border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6">
          <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">Duplicate access role</h2>
          <button
            onClick={onClose}
            className="text-[color:var(--app-muted)] transition hover:text-[color:var(--app-heading)]"
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <p className="text-sm text-[color:var(--app-text)]">
            Create a copy of <strong>{sourceRole.label}</strong> with the same permissions.
          </p>

          <div>
            <label className="mb-2 block text-sm font-medium text-[color:var(--app-heading)]">New role name *</label>
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
            <label className="mb-2 block text-sm font-medium text-[color:var(--app-heading)]">New slug *</label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              title="Lowercase, numbers, hyphens, and underscores only"
              required
              className="w-full rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-input-bg)] px-3 py-2 text-[color:var(--app-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--app-primary)]"
            />
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
              {loading ? 'Duplicating...' : 'Duplicate access role'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
