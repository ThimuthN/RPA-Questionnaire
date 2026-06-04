'use client';

import { useEffect, useState } from 'react';

type AccessRoleRecord = {
  id: string;
  label: string;
  accessGrantCount?: number;
};

interface DeleteRoleModalProps {
  isOpen: boolean;
  role: AccessRoleRecord;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteRoleModal({ isOpen, role, onClose, onSuccess }: DeleteRoleModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [grantCount, setGrantCount] = useState(0);
  const [deleteMode, setDeleteMode] = useState<'delete' | 'deactivate'>('deactivate');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setError('');
    setDeleteMode('deactivate');
    setGrantCount(role.accessGrantCount ?? 0);
  }, [isOpen, role]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/roles/${role.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: deleteMode })
      });

      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || data.ok === false) {
        throw new Error(data.message || 'Failed to delete role');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasActiveGrants = grantCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-[color:var(--app-surface)]">
        <div className="flex items-center justify-between border-b border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6">
          <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">Delete access role</h2>
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

          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <p className="mb-2 text-sm font-medium text-red-700">Delete access role: {role.label}</p>
            <p className="text-xs text-red-600">This action cannot be undone.</p>
          </div>

          {hasActiveGrants ? (
            <div className="space-y-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
              <p className="text-sm font-medium text-yellow-700">
                This access role has {grantCount} active grant{grantCount !== 1 ? 's' : ''}.
              </p>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2 rounded p-2 transition hover:bg-[color:var(--app-surface)]">
                  <input
                    type="radio"
                    name="mode"
                    value="deactivate"
                    checked={deleteMode === 'deactivate'}
                    onChange={(event) => setDeleteMode(event.target.value as 'delete' | 'deactivate')}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-yellow-700">
                    Deactivate the role and inactivate existing grants.
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded p-2 transition hover:bg-[color:var(--app-surface)]">
                  <input
                    type="radio"
                    name="mode"
                    value="delete"
                    checked={deleteMode === 'delete'}
                    onChange={(event) => setDeleteMode(event.target.value as 'delete' | 'deactivate')}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium text-red-600">Permanently delete the role.</span>
                </label>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[color:var(--app-text)]">This access role has no active grants and can be deleted.</p>
          )}

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
              disabled={loading}
              className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Processing...' : deleteMode === 'delete' ? 'Delete permanently' : 'Deactivate role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
