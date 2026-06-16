'use client';

import { useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { APP_ACTION_LABELS } from '@/lib/auth/permissions';
import CreateRoleModal from '@/components/admin/CreateRoleModal';
import DeleteRoleModal from '@/components/admin/DeleteRoleModal';
import DuplicateRoleModal from '@/components/admin/DuplicateRoleModal';
import EditRoleModal from '@/components/admin/EditRoleModal';

const permissionLabel = (key: string) => (APP_ACTION_LABELS as Record<string, string>)[key] ?? key;

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
    const inUse = grantCount > 0;
    const previewPerms = (role.permissions ?? []).slice(0, 3);
    const extraPerms = permissionCount - previewPerms.length;

    return (
      <div className="flex h-full flex-col gap-3 rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4 transition hover:border-[color:var(--app-border-strong)] hover:shadow-[var(--app-shadow-soft)]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate font-semibold text-[color:var(--app-heading)]">{role.label}</h4>
            <p className="truncate text-xs text-[color:var(--app-muted)]">{role.slug}</p>
          </div>
          {isProtected ? (
            <span className="shrink-0 rounded-full border border-[color:var(--pill-amber-border)] bg-[color:var(--pill-amber-bg)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--pill-amber-text)]">
              Protected
            </span>
          ) : inUse ? (
            <span className="shrink-0 rounded-full bg-[color:var(--app-surface-soft)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--app-muted)]" title={`${grantCount} user${grantCount !== 1 ? 's' : ''} hold this role`}>
              In use · {grantCount}
            </span>
          ) : null}
        </div>

        {role.description ? (
          <p className="text-sm leading-6 text-[color:var(--app-muted)]">{role.description}</p>
        ) : null}

        {/* Permission preview — visibility into what the role actually grants */}
        <div className="flex flex-wrap items-center gap-1.5">
          {permissionCount === 0 ? (
            <span className="text-xs text-[color:var(--app-muted)]">No permissions</span>
          ) : (
            <>
              {previewPerms.map((p) => (
                <span key={p} className="rounded-full bg-[color:var(--app-surface-soft)] px-2 py-0.5 text-[11px] text-[color:var(--app-text)]">
                  {permissionLabel(p)}
                </span>
              ))}
              {extraPerms > 0 ? (
                <span className="text-[11px] text-[color:var(--app-muted)]">+{extraPerms} more</span>
              ) : null}
            </>
          )}
        </div>

        {/* Footer pinned to bottom so cards in a row align regardless of description length */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[color:var(--app-border)] pt-3">
          <span className="text-xs text-[color:var(--app-muted)]">
            {permissionCount} permission{permissionCount !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-1.5">
            <Button type="button" variant="secondary" className="px-2.5 py-1.5 text-xs" disabled={isProtected} onClick={() => setEditingRole(role)}>
              Edit
            </Button>
            <Button type="button" variant="ghost" className="px-2.5 py-1.5 text-xs" onClick={() => setDuplicatingRole(role)}>
              Duplicate
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="px-2.5 py-1.5 text-xs text-[color:var(--app-danger)] hover:bg-[color:var(--app-danger-soft)]"
              disabled={isProtected || inUse}
              title={inUse ? `In use by ${grantCount} user${grantCount !== 1 ? 's' : ''} — reassign before deleting` : isProtected ? "System-protected role" : undefined}
              onClick={() => setDeletingRole(role)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium text-[color:var(--app-heading)]">Access Roles</h1>
          <p className="mt-1 text-sm text-[color:var(--app-muted)]">
            Manage system and custom access roles{roles.length > 0 ? ` · ${roles.length} total` : ""}.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateModalOpen(true)}>
          + New Role
        </Button>
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
