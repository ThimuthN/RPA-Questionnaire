'use client';

import { useState, useEffect } from 'react';
import { RoleCatalog } from '@prisma/client';

interface DeleteRoleModalProps {
  isOpen: boolean;
  role: RoleCatalog & { _count?: { accessGrants: number } };
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteRoleModal({ isOpen, role, onClose, onSuccess }: DeleteRoleModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [grantCount, setGrantCount] = useState(0);
  const [deleteMode, setDeleteMode] = useState<'delete' | 'deactivate'>('deactivate');

  useEffect(() => {
    if (isOpen && role) {
      setError('');
      setDeleteMode('deactivate');
      // Use the count if available, otherwise load it
      setGrantCount(role._count?.accessGrants || 0);
    }
  }, [isOpen, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/roles/${role.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: deleteMode })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete role');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !role) return null;

  const hasActiveGrants = grantCount > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[color:var(--app-surface)] rounded-xl max-w-md w-full">
        <div className="border-b border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">Delete Role</h2>
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

          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4">
            <p className="text-sm font-medium text-red-700 mb-2">
              Delete Role: {role.label}
            </p>
            <p className="text-xs text-red-600">
              This action cannot be undone.
            </p>
          </div>

          {hasActiveGrants && (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4 space-y-3">
              <p className="text-sm font-medium text-yellow-700">
                ⚠️ This role has {grantCount} active user assignment{grantCount !== 1 ? 's' : ''}
              </p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-[color:var(--app-surface)] rounded transition">
                  <input
                    type="radio"
                    name="mode"
                    value="deactivate"
                    checked={deleteMode === 'deactivate'}
                    onChange={(e) => setDeleteMode(e.target.value as any)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm text-yellow-700">
                    Deactivate role (keeps grants inactive, allows reactivation)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-[color:var(--app-surface)] rounded transition">
                  <input
                    type="radio"
                    name="mode"
                    value="delete"
                    checked={deleteMode === 'delete'}
                    onChange={(e) => setDeleteMode(e.target.value as any)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm text-red-600 font-medium">
                    Permanently delete (removes grants, cannot undo)
                  </span>
                </label>
              </div>
            </div>
          )}

          {!hasActiveGrants && (
            <p className="text-sm text-[color:var(--app-text)]">
              This role has no active assignments and can be safely deleted.
            </p>
          )}

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
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Processing...' : deleteMode === 'delete' ? 'Delete Permanently' : 'Deactivate Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
