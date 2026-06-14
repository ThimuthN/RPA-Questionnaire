'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { APP_ACTION_LABELS } from '@/lib/auth/permissions';

const PERMISSION_GROUPS = {
  'Users & Access': ['manage_users', 'create_role', 'edit_role', 'delete_role'],
  Integrations: ['manage_integrations'],
  Jobs: ['create_job', 'edit_job'],
  Candidates: ['view_candidates', 'manage_candidates', 'promote_candidate', 'delete_candidate', 'hire_candidate'],
  'Assessments / Results': ['create_invite', 'view_results'],
  'Add-ons': ['manage_addons']
};

type AccessRoleRecord = {
  label: string;
  slug: string;
  permissions?: string[];
};

interface Props {
  isOpen: boolean;
  role: AccessRoleRecord;
  onClose: () => void;
}

export default function PermissionsViewModal({ isOpen, role, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

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

  if (!isOpen || !mounted) return null;

  const permissions = new Set(role.permissions ?? []);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-[color:var(--app-surface)]">
        <div className="sticky top-0 flex items-center justify-between border-b border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6">
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">{role.label} - Permissions</h2>
            <p className="mt-1 text-xs text-[color:var(--app-muted)]">{role.slug}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[color:var(--app-muted)] transition hover:text-[color:var(--app-heading)]"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
          {Object.entries(PERMISSION_GROUPS).map(([groupName, groupPermissions]) => {
            const enabledPermissions = groupPermissions.filter((permission) => permissions.has(permission));
            if (enabledPermissions.length === 0) {
              return null;
            }

            return (
              <div key={groupName}>
                <h3 className="mb-3 font-medium text-[color:var(--app-heading)]">{groupName}</h3>
                <div className="space-y-2">
                  {enabledPermissions.map((permission) => (
                    <div
                      key={permission}
                      className="flex items-center gap-2 rounded p-2 hover:bg-[color:var(--app-surface-soft)]"
                    >
                      <div className="h-2 w-2 rounded-full bg-[color:var(--app-primary)]" />
                      <span className="text-sm text-[color:var(--app-text)]">
                        {APP_ACTION_LABELS[permission as keyof typeof APP_ACTION_LABELS]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {permissions.size === 0 ? <p className="text-sm text-[color:var(--app-muted)]">No permissions configured.</p> : null}
        </div>

        <div className="border-t border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-6">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-[color:var(--app-border)] px-4 py-2 text-[color:var(--app-text)] transition hover:bg-[color:var(--app-surface)]"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
