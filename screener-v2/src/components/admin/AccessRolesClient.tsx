'use client';

import { useState } from 'react';
import CreateRoleModal from '@/components/admin/CreateRoleModal';
import DeleteRoleModal from '@/components/admin/DeleteRoleModal';
import DuplicateRoleModal from '@/components/admin/DuplicateRoleModal';
import EditRoleModal from '@/components/admin/EditRoleModal';

type AccessRoleRecord = {
  id: string;
  slug: string;
  label: string;
  description?: string;
  applicability?: "system" | "department" | "both";
  permissions?: string[];
  accessGrantCount?: number;
};

export default function AccessRolesClient({
  initialRoles
}: {
  initialRoles: AccessRoleRecord[];
}) {
  const [roles, setRoles] = useState<AccessRoleRecord[]>(initialRoles);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AccessRoleRecord | null>(null);
  const [duplicatingRole, setDuplicatingRole] = useState<AccessRoleRecord | null>(null);
  const [deletingRole, setDeletingRole] = useState<AccessRoleRecord | null>(null);

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles?kind=access_role');
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; roles?: AccessRoleRecord[] };
      if (response.ok && data.ok && Array.isArray(data.roles)) {
        setRoles(data.roles);
      }
    } catch (error) {
      console.error('Failed to reload roles:', error);
    }
  };

  const systemRoles = roles.filter((role) => role.applicability === 'system');
  const departmentRoles = roles.filter((role) => role.applicability === 'department');
  const bothRoles = roles.filter((role) => role.applicability === 'both');

  const isStronglyProtected = (role: AccessRoleRecord) => ['system_admin', 'system-admin'].includes(role.slug);

  const RoleSection = ({ title, items }: { title: string; items: AccessRoleRecord[] }) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-3">
        <h3 className="font-medium text-[color:var(--app-heading)]">{title}</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((role) => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>
      </div>
    );
  };

  const RoleCard = ({ role }: { role: AccessRoleRecord }) => {
    const isProtected = isStronglyProtected(role);
    const grantCount = role.accessGrantCount || 0;
    const permissionCount = role.permissions?.length ?? 0;

    return (
      <div className="space-y-3 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4 transition hover:border-[color:var(--app-border-hover)]">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-[color:var(--app-heading)]">{role.label}</h4>
            <p className="text-xs text-[color:var(--app-muted)]">{role.slug}</p>
          </div>
          {isProtected ? (
            <span className="rounded bg-red-500/10 px-2 py-1 text-xs text-red-600">System Protected</span>
          ) : null}
        </div>

        {role.description ? <p className="text-sm text-[color:var(--app-text)]">{role.description}</p> : null}

        <div className="flex items-center justify-between border-t border-[color:var(--app-border)] pt-2">
          <div className="text-xs text-[color:var(--app-muted)]">
            {permissionCount} permission{permissionCount !== 1 ? 's' : ''}
            {grantCount > 0 ? ` · ${grantCount} active grant${grantCount !== 1 ? 's' : ''}` : ''}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditingRole(role)}
              disabled={isProtected}
              className="rounded bg-[color:var(--app-button-bg)] px-3 py-1 text-xs text-[color:var(--app-button-text)] transition hover:bg-[color:var(--app-button-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              Edit
            </button>
            <button
              onClick={() => setDuplicatingRole(role)}
              className="rounded bg-[color:var(--app-button-bg)] px-3 py-1 text-xs text-[color:var(--app-button-text)] transition hover:bg-[color:var(--app-button-hover)]"
              type="button"
            >
              Duplicate
            </button>
            <button
              onClick={() => setDeletingRole(role)}
              disabled={isProtected}
              className="rounded bg-red-500/10 px-3 py-1 text-xs text-red-600 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium text-[color:var(--app-heading)]">Access Roles</h1>
          <p className="mt-1 text-sm text-[color:var(--app-muted)]">Manage system and custom access roles for your workspace.</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="rounded-lg bg-[color:var(--app-primary)] px-4 py-2 text-white transition hover:bg-[color:var(--app-primary-hover)]"
          type="button"
        >
          + New Role
        </button>
      </div>

      {roles.length === 0 ? (
        <div className="space-y-3 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-8 text-center">
          <p className="text-sm text-[color:var(--app-text)]">No access roles configured</p>
          <p className="text-xs text-[color:var(--app-muted)]">Create custom access roles to get started.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <RoleSection title="System Roles" items={systemRoles} />
          <RoleSection title="Department Roles" items={departmentRoles} />
          <RoleSection title="Both (System & Department)" items={bothRoles} />
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
          defaultApplicability="department"
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
    </div>
  );
}
