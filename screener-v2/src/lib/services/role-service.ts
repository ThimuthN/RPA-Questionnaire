import { prisma } from "@/lib/db/prisma";

export class RoleService {
  async createRole(label: string, departmentId?: string) {
    if (!label || label.trim().length < 2) {
      throw new Error("Label must be at least 2 characters");
    }

    let deptId = departmentId;
    if (!deptId) {
      const systemDept = await prisma.department.findUnique({
        where: { slug: "system" },
        select: { id: true }
      });
      if (!systemDept) {
        throw new Error("System department not found. Cannot create role without a department.");
      }
      deptId = systemDept.id;
    } else {
      const dept = await prisma.department.findUnique({
        where: { id: deptId }
      });
      if (!dept) {
        throw new Error("Department not found");
      }
    }

    const role = await prisma.roleCatalog.create({
      data: {
        label,
        slug: `${label.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
        departmentId: deptId
      }
    });

    return role;
  }

  async updateRole(id: string, data: { label?: string; isActive?: boolean; departmentId?: string }) {
    if (data.label !== undefined && (!data.label || data.label.trim().length < 2)) {
      throw new Error("Label must be at least 2 characters");
    }

    if (data.departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: data.departmentId }
      });
      if (!dept) {
        throw new Error("Department not found");
      }
    }

    const updateData: any = {};
    if (data.label) updateData.label = data.label;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.departmentId) updateData.departmentId = data.departmentId;

    const role = await prisma.roleCatalog.update({
      where: { id },
      data: updateData
    });

    return role;
  }

  async deleteRole(id: string) {
    // Check for open jobs
    const openJobs = await prisma.jobPosting.count({
      where: { roleId: id, isOpen: true }
    });
    if (openJobs > 0) {
      throw new Error(`Cannot delete role with ${openJobs} open job(s)`);
    }

    // Check for pipeline candidates
    const pipelineCandidates = await prisma.candidate.count({
      where: {
        roleId: id,
        stage: { not: "finalized" }
      }
    });
    if (pipelineCandidates > 0) {
      throw new Error(`Cannot delete role with ${pipelineCandidates} pipeline candidate(s)`);
    }

    const role = await prisma.roleCatalog.delete({
      where: { id }
    });

    return role;
  }

  async listRoles(includeInactive = false) {
    const roles = await prisma.roleCatalog.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { createdAt: "desc" }
    });

    return roles;
  }

  async getRoleWithCounts(id: string) {
    const role = await prisma.roleCatalog.findUnique({
      where: { id }
    });

    if (!role) {
      throw new Error("Role not found");
    }

    const [openJobCount, pipelineCandidateCount] = await Promise.all([
      prisma.jobPosting.count({
        where: { roleId: id, isOpen: true }
      }),
      prisma.candidate.count({
        where: {
          roleId: id,
          stage: { not: "finalized" }
        }
      })
    ]);

    return {
      ...role,
      openJobCount,
      pipelineCandidateCount
    };
  }
}

export const roleService = new RoleService();
