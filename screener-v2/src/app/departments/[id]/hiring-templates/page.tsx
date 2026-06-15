import { HiringTeamsManagement } from "@/components/departments/HiringTeamsManagement";
import { getDepartment } from "@/lib/db/departments";
import { requirePageSession } from "@/lib/auth/guards";
import { requirePermissionForDepartment } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";

export default async function HiringTemplatesPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await requirePageSession(`/departments/${id}/hiring-templates`);
  const permResult = await requirePermissionForDepartment(session, "manage_users", id);
  if (!permResult.ok) {
    notFound();
  }

  const [department, hiringTeamTemplates, accessGrantTeam] = await Promise.all([
    getDepartment(id),
    prisma.hiringTeamTemplate.findMany({
      where: { departmentId: id, isActive: true },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          },
          orderBy: { role: "asc" }
        }
      },
      orderBy: { sortOrder: "asc" }
    }),
    prisma.accessGrant.findMany({
      where: { departmentId: id, scope: "department", status: "active" },
      select: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { user: { name: "asc" } }
    })
  ]);

  if (!department) {
    notFound();
  }

  const teamUsers = accessGrantTeam.map((g) => ({
    id: g.user.id,
    name: g.user.name,
    email: g.user.email
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl text-[color:var(--app-heading)]">Hiring team templates</h2>
        <p className="text-sm text-[color:var(--app-muted)]">
          Define reusable hiring panels that can be applied to candidate profiles and job postings.
        </p>
      </div>

      <HiringTeamsManagement
        departmentId={id}
        departmentName={department.name}
        templates={hiringTeamTemplates.map((template) => ({
          id: template.id,
          name: template.name,
          description: template.description || undefined,
          isActive: template.isActive,
          members: template.members.map((member) => ({
            id: member.id,
            user: {
              id: member.user.id,
              name: member.user.name,
              email: member.user.email
            },
            role: member.role
          }))
        }))}
        teamUsers={teamUsers}
      />
    </div>
  );
}
