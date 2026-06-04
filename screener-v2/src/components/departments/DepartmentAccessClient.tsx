'use client';

import { useState } from 'react';
import { RoleCatalog } from '@prisma/client';
import CreateRoleModal from '@/components/admin/CreateRoleModal';
import EditRoleModal from '@/components/admin/EditRoleModal';
import DuplicateRoleModal from '@/components/admin/DuplicateRoleModal';
import DeleteRoleModal from '@/components/admin/DeleteRoleModal';
import PermissionsViewModal from '@/components/admin/PermissionsViewModal';

type RoleWithPermissions = RoleCatalog & {
  permissions: { permission: string }[];
  _count?: { accessGrants: number };
};

export default function DepartmentAccessClient({
  departmentId,
  departmentName,
  initialRoles
}: {
  departmentId: string;
  departmentName: string;
  initialRoles: RoleWithPermissions[];
}) {
  const [roles, setRoles] = useState<RoleWithPermissions[]>(initialRoles);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  const [duplicatingRole, setDuplicatingRole] = useState<RoleWithPermissions | null>(null);
  const [deletingRole, setDeletingRole] = useState<RoleWithPermissions | null>(null);
  const [viewingRole, setViewingRole] = useState<RoleWithPermissions | null>(null);

  const loadRoles = async () => {
    try {
      const res = await fetch('/api/roles?kind=access_role');
      if (res.ok) {
        const data = await res.json();
        // Filter to department/both only for this page
        const filtered = data.filter(
          (r: any) => r.applicability === 'department' || r.applicability === 'both'
        );
        setRoles(filtered);
      }
    } catch (err) {
      console.error('Failed to reload roles:', err);
    }
  };

  const RoleCard = ({ role }: { role: RoleWithPermissions }) => {
    const grantCount = role._count?.accessGrants || 0;

    return (
      <div className="rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4 space-y-3">
        <div>
          <h4 className="font-medium text-[color:var(--app-heading)]">{role.label}</h4>
          <p className="text-xs text-[color:var(--app-muted)]">{role.slug}</p>
        </div>

        {role.description && (
          <p className="text-sm text-[color:var(--app-text)]">{role.description}</p>
        )}

        <div className="flex flex-wrap gap-1">
          <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded">
            {role.applicability === 'both' ? 'System & Department' : 'Department'}
          </span>
          <span className="text-xs bg-gray-500/10 text-gray-600 px-2 py-1 rounded">
            {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
          </span>
          {grantCount > 0 && (
            <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">
              {grantCount} user{grantCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-[color:var(--app-border)]">
          <button
            onClick={() => setViewingRole(role)}
            className="flex-1 text-xs px-3 py-2 rounded bg-[color:var(--app-button-bg)] hover:bg-[color:var(--app-button-hover)] text-[color:var(--app-button-text)] transition"
          >
            View
          </button>
          <button
            onClick={() => setEditingRole(role)}
            className="flex-1 text-xs px-3 py-2 rounded bg-[color:var(--app-button-bg)] hover:bg-[color:var(--app-button-hover)] text-[color:var(--app-button-text)] transition"
          >
            Edit
          </button>
          <button
            onClick={() => setDuplicatingRole(role)}
            className="flex-1 text-xs px-3 py-2 rounded bg-[color:var(--app-button-bg)] hover:bg-[color:var(--app-button-hover)] text-[color:var(--app-button-text)] transition"
          >
            Duplicate
          </button>
          <button
            onClick={() => setDeletingRole(role)}
            className="flex-1 text-xs px-3 py-2 rounded bg-red-500/10 hover:bg-red-500/20 text-red-600 transition"
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
        <h2 className="text-xl font-medium text-[color:var(--app-heading)]">Department Roles</h2>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-[color:var(--app-primary)] text-white hover:bg-[color:var(--app-primary-hover)] transition"
        >
          + Create Role
        </button>
      </div>

      {roles.length === 0 ? (
        <div className="rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-8 text-center space-y-3">
          <p className="text-sm text-[color:var(--app-text)]">No department roles configured yet</p>
          <p className="text-xs text-[color:var(--app-muted)]">
            Create custom roles for this workspace to control user permissions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(role => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>
      )}

      {/* Modals */}
      {createModalOpen && (
        <CreateRoleModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            loadRoles();
          }}
        />
      )}

      {editingRole && (
        <EditRoleModal
          isOpen={!!editingRole}
          role={editingRole}
          onClose={() => setEditingRole(null)}
          onSuccess={() => {
            setEditingRole(null);
            loadRoles();
          }}
        />
      )}

      {duplicatingRole && (
        <DuplicateRoleModal
          isOpen={!!duplicatingRole}
          sourceRole={duplicatingRole}
          onClose={() => setDuplicatingRole(null)}
          onSuccess={() => {
            setDuplicatingRole(null);
            loadRoles();
          }}
        />
      )}

      {deletingRole && (
        <DeleteRoleModal
          isOpen={!!deletingRole}
          role={deletingRole}
          onClose={() => setDeletingRole(null)}
          onSuccess={() => {
            setDeletingRole(null);
            loadRoles();
          }}
        />
      )}

      {viewingRole && (
        <PermissionsViewModal
          isOpen={!!viewingRole}
          role={viewingRole}
          onClose={() => setViewingRole(null)}
        />
      )}
    </div>
  );
}
