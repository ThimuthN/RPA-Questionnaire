'use client';

import { useState } from 'react';
import CreateRoleModal from '@/components/admin/CreateRoleModal';
import DeleteRoleModal from '@/components/admin/DeleteRoleModal';
import DuplicateRoleModal from '@/components/admin/DuplicateRoleModal';
import EditRoleModal from '@/components/admin/EditRoleModal';
import PermissionsViewModal from '@/components/admin/PermissionsViewModal';

type AccessRoleRecord = {
  id: string;
  slug: string;
  label: string;
  description?: string;
  applicability?: "system" | "department" | "both";
  permissions?: string[];
  accessGrantCount?: number;
};

export default function DepartmentAccessClient({
  departmentId,
  departmentName,
  initialRoles
}: {
  departmentId: string;
  departmentName: string;
  initialRoles: AccessRoleRecord[];
}) {
  const [roles, setRoles] = useState<AccessRoleRecord[]>(initialRoles);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AccessRoleRecord | null>(null);
  const [duplicatingRole, setDuplicatingRole] = useState<AccessRoleRecord | null>(null);
  const [deletingRole, setDeletingRole] = useState<AccessRoleRecord | null>(null);
  const [viewingRole, setViewingRole] = useState<AccessRoleRecord | null>(null);

  const loadRoles = async () => {
    try {
      const response = await fetch(
        `/api/roles?kind=access_role&scope=department&departmentId=${encodeURIComponent(departmentId)}`
      );
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; roles?: AccessRoleRecord[] };
      if (response.ok && data.ok && Array.isArray(data.roles)) {
        setRoles(data.roles);
      }
    } catch (error) {
      console.error('Failed to reload roles:', error);
    }
  };

  const RoleCard = ({ role }: { role: AccessRoleRecord }) => {
    const grantCount = role.accessGrantCount || 0;
    const permissionCount = role.permissions?.length ?? 0;

    return (
      <div className="space-y-3 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4">
        <div>
          <h4 className="font-medium text-[color:var(--app-heading)]">{role.label}</h4>
          <p className="text-xs text-[color:var(--app-muted)]">{role.slug}</p>
        </div>

        {role.description ? <p className="text-sm text-[color:var(--app-text)]">{role.description}</p> : null}

        <div className="flex flex-wrap gap-1">
          <span className="rounded bg-blue-500/10 px-2 py-1 text-xs text-blue-600">
            {role.applicability === 'both' ? 'System & Department' : 'Department'}
          </span>
          <span className="rounded bg-gray-500/10 px-2 py-1 text-xs text-gray-600">
            {permissionCount} permission{permissionCount !== 1 ? 's' : ''}
          </span>
          {grantCount > 0 ? (
            <span className="rounded bg-green-500/10 px-2 py-1 text-xs text-green-600">
              {grantCount} user{grantCount !== 1 ? 's' : ''}
            </span>
          ) : null}
        </div>

        <div className="flex gap-2 border-t border-[color:var(--app-border)] pt-2">
          <button
            onClick={() => setViewingRole(role)}
            className="flex-1 rounded bg-[color:var(--app-button-bg)] px-3 py-2 text-xs text-[color:var(--app-button-text)] transition hover:bg-[color:var(--app-button-hover)]"
            type="button"
          >
            View
          </button>
          <button
            onClick={() => setEditingRole(role)}
            className="flex-1 rounded bg-[color:var(--app-button-bg)] px-3 py-2 text-xs text-[color:var(--app-button-text)] transition hover:bg-[color:var(--app-button-hover)]"
            type="button"
          >
            Edit
          </button>
          <button
            onClick={() => setDuplicatingRole(role)}
            className="flex-1 rounded bg-[color:var(--app-button-bg)] px-3 py-2 text-xs text-[color:var(--app-button-text)] transition hover:bg-[color:var(--app-button-hover)]"
            type="button"
          >
            Duplicate
          </button>
          <button
            onClick={() => setDeletingRole(role)}
            className="flex-1 rounded bg-red-500/10 px-3 py-2 text-xs text-red-600 transition hover:bg-red-500/20"
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-[color:var(--app-heading)]">{departmentName} access roles</h2>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="rounded-lg bg-[color:var(--app-primary)] px-4 py-2 text-white transition hover:bg-[color:var(--app-primary-hover)]"
          type="button"
        >
          + Create Role
        </button>
      </div>

      {roles.length === 0 ? (
        <div className="space-y-3 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-8 text-center">
          <p className="text-sm text-[color:var(--app-text)]">No department access roles configured yet</p>
          <p className="text-xs text-[color:var(--app-muted)]">
            Create access roles for this workspace before assigning team members.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>
      )}

      {createModalOpen ? (
        <CreateRoleModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            void loadRoles();
          }}
          defaultDepartmentId={departmentId}
          defaultApplicability="department"
          allowSystemOnly={false}
        />
      ) : null}

      {editingRole ? (
        <EditRoleModal
          isOpen={Boolean(editingRole)}
          role={editingRole}
          onClose={() => setEditingRole(null)}
          onSuccess={() => {
            setEditingRole(null);
            void loadRoles();
          }}
        />
      ) : null}

      {duplicatingRole ? (
        <DuplicateRoleModal
          isOpen={Boolean(duplicatingRole)}
          sourceRole={duplicatingRole}
          onClose={() => setDuplicatingRole(null)}
          onSuccess={() => {
            setDuplicatingRole(null);
            void loadRoles();
          }}
        />
      ) : null}

      {deletingRole ? (
        <DeleteRoleModal
          isOpen={Boolean(deletingRole)}
          role={deletingRole}
          onClose={() => setDeletingRole(null)}
          onSuccess={() => {
            setDeletingRole(null);
            void loadRoles();
          }}
        />
      ) : null}

      {viewingRole ? (
        <PermissionsViewModal
          isOpen={Boolean(viewingRole)}
          role={viewingRole}
          onClose={() => setViewingRole(null)}
        />
      ) : null}
    </div>
  );
}
