'use client';

import { RoleCatalog } from '@prisma/client';
import { APP_ACTION_LABELS } from '@/lib/auth/permissions';

const PERMISSION_GROUPS = {
  'Users & Access': ['manage_users', 'create_role', 'edit_role', 'delete_role'],
  'Jobs': ['create_job', 'edit_job'],
  'Candidates': ['view_candidates', 'manage_candidates', 'promote_candidate', 'delete_candidate', 'hire_candidate'],
  'Assessments / Results': ['create_invite', 'view_results'],
  'Add-ons': ['manage_addons']
};

interface Props {
  isOpen: boolean;
  role: RoleCatalog & { permissions: { permission: string }[] };
  onClose: () => void;
}

export default function PermissionsViewModal({ isOpen, role, onClose }: Props) {
  if (!isOpen) return null;

  const permissions = new Set(role.permissions.map(p => p.permission));

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[color:var(--app-surface)] rounded-xl max-w-2xl w-full">
        <div className="sticky top-0 border-b border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">
              {role.label} — Permissions
            </h2>
            <p className="text-xs text-[color:var(--app-muted)] mt-1">
              {role.slug}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[color:var(--app-muted)] hover:text-[color:var(--app-heading)] transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {Object.entries(PERMISSION_GROUPS).map(([groupName, groupPerms]) => {
            const groupPermissions = groupPerms.filter(p => permissions.has(p));
            if (groupPermissions.length === 0) return null;

            return (
              <div key={groupName}>
                <h3 className="font-medium text-[color:var(--app-heading)] mb-3">
                  {groupName}
                </h3>
                <div className="space-y-2">
                  {groupPermissions.map(perm => (
                    <div key={perm} className="flex items-center gap-2 p-2 rounded hover:bg-[color:var(--app-surface-soft)]">
                      <div className="w-2 h-2 rounded-full bg-[color:var(--app-primary)]" />
                      <span className="text-sm text-[color:var(--app-text)]">
                        {APP_ACTION_LABELS[perm as keyof typeof APP_ACTION_LABELS]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {permissions.size === 0 && (
            <p className="text-sm text-[color:var(--app-muted)]">No permissions configured.</p>
          )}
        </div>

        <div className="border-t border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg border border-[color:var(--app-border)] text-[color:var(--app-text)] hover:bg-[color:var(--app-surface)] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
