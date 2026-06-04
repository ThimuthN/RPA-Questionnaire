'use client';

import { useEffect, useState } from 'react';
import { RoleCatalog } from '@prisma/client';
import CreateRoleModal from '@/components/admin/CreateRoleModal';
import EditRoleModal from '@/components/admin/EditRoleModal';
import DuplicateRoleModal from '@/components/admin/DuplicateRoleModal';
import DeleteRoleModal from '@/components/admin/DeleteRoleModal';

type RoleWithPermissions = RoleCatalog & {
  permissions: { permission: string }[];
  _count?: { accessGrants: number };
};

export default function AccessRolesPage() {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  const [duplicatingRole, setDuplicatingRole] = useState<RoleWithPermissions | null>(null);
  const [deletingRole, setDeletingRole] = useState<RoleWithPermissions | null>(null);

  const loadRoles = async () => {
    try {
      const res = await fetch('/api/roles?kind=access_role');
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const systemRoles = roles.filter(r => r.applicability === 'system');
  const departmentRoles = roles.filter(r => r.applicability === 'department');
  const bothRoles = roles.filter(r => r.applicability === 'both');

  const isStronglyProtected = (role: RoleWithPermissions) => {
    // Only System Admin is strongly protected and cannot be edited/deleted
    return ['system_admin', 'system-admin'].includes(role.slug);
  };

  const RoleCard = ({ role }: { role: RoleWithPermissions }) => {
    const isProtected = isStronglyProtected(role);
    const grantCount = role._count?.accessGrants || 0;

    return (
      <div className="rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4 space-y-3 hover:border-[color:var(--app-border-hover)] transition">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-[color:var(--app-heading)]">{role.label}</h4>
            <p className="text-xs text-[color:var(--app-muted)]">{role.slug}</p>
          </div>
          {isProtected && (
            <span className="text-xs bg-red-500/10 text-red-600 px-2 py-1 rounded">
              System Protected
            </span>
          )}
        </div>
        {role.description && (
          <p className="text-sm text-[color:var(--app-text)]">{role.description}</p>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-[color:var(--app-border)]">
          <div className="text-xs text-[color:var(--app-muted)]">
            {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
            {grantCount > 0 && ` • ${grantCount} active grant${grantCount !== 1 ? 's' : ''}`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditingRole(role)}
              disabled={isProtected}
              className="text-xs px-3 py-1 rounded bg-[color:var(--app-button-bg)] hover:bg-[color:var(--app-button-hover)] text-[color:var(--app-button-text)] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Edit
            </button>
            <button
              onClick={() => setDuplicatingRole(role)}
              className="text-xs px-3 py-1 rounded bg-[color:var(--app-button-bg)] hover:bg-[color:var(--app-button-hover)] text-[color:var(--app-button-text)] transition"
            >
              Duplicate
            </button>
            <button
              onClick={() => setDeletingRole(role)}
              disabled={isProtected}
              className="text-xs px-3 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const RoleSection = ({ title, roles }: { title: string; roles: RoleWithPermissions[] }) => {
    if (roles.length === 0) return null;

    return (
      <div className="space-y-3">
        <h3 className="font-medium text-[color:var(--app-heading)]">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(role => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[color:var(--app-heading)]">Access Roles</h2>
          <p className="text-sm text-[color:var(--app-muted)]">
            Manage system and custom access roles for your workspace.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-[color:var(--app-primary)] text-white hover:bg-[color:var(--app-primary-hover)] transition"
        >
          + New Role
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-[color:var(--app-muted)]">Loading roles...</div>
      ) : roles.length === 0 ? (
        <div className="rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-8 text-center space-y-3">
          <p className="text-sm text-[color:var(--app-text)]">No access roles found</p>
          <p className="text-xs text-[color:var(--app-muted)]">
            Create custom roles or import default roles to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <RoleSection title="System Roles" roles={systemRoles} />
          <RoleSection title="Department Roles" roles={departmentRoles} />
          <RoleSection title="Both (System & Department)" roles={bothRoles} />
        </div>
      )}

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
    </div>
  );
}
