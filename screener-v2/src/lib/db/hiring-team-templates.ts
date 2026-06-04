import type { HiringTeamRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { cuidLike } from "@/lib/tokens/token-service";

export interface HiringTeamTemplateInput {
  departmentId: string;
  name: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface HiringTeamTemplateMemberInput {
  templateId: string;
  userId: string;
  role: HiringTeamRole;
}

export async function createHiringTeamTemplate(input: HiringTeamTemplateInput) {
  return prisma.hiringTeamTemplate.create({
    data: {
      id: cuidLike(),
      departmentId: input.departmentId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { role: "asc" }
      }
    }
  });
}

export async function updateHiringTeamTemplate(
  templateId: string,
  input: Partial<HiringTeamTemplateInput>
) {
  return prisma.hiringTeamTemplate.update({
    where: { id: templateId },
    data: {
      name: input.name ? input.name.trim() : undefined,
      description: input.description !== undefined ? (input.description?.trim() || null) : undefined,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
      updatedAt: new Date()
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { role: "asc" }
      }
    }
  });
}

export async function listHiringTeamTemplates(departmentId: string, isActive?: boolean) {
  const where: any = { departmentId };
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  return prisma.hiringTeamTemplate.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { role: "asc" }
      },
      _count: {
        select: { members: true }
      }
    }
  });
}

export async function getHiringTeamTemplate(templateId: string) {
  return prisma.hiringTeamTemplate.findUnique({
    where: { id: templateId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { role: "asc" }
      }
    }
  });
}

export async function deleteHiringTeamTemplate(templateId: string) {
  return prisma.hiringTeamTemplate.delete({
    where: { id: templateId }
  });
}

export async function addHiringTeamTemplateMember(input: HiringTeamTemplateMemberInput) {
  // Check if user exists and is active
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, isActive: true }
  });

  if (!user || !user.isActive) {
    throw new Error("User not found or is inactive");
  }

  // Check if member already exists
  const existing = await prisma.hiringTeamTemplateMember.findFirst({
    where: {
      templateId: input.templateId,
      userId: input.userId,
      role: input.role
    }
  });

  if (existing) {
    throw new Error("Member already exists in template with this role");
  }

  return prisma.hiringTeamTemplateMember.create({
    data: {
      id: cuidLike(),
      templateId: input.templateId,
      userId: input.userId,
      role: input.role
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });
}

export async function removeHiringTeamTemplateMember(
  templateId: string,
  userId: string,
  role: HiringTeamRole
) {
  return prisma.hiringTeamTemplateMember.delete({
    where: {
      templateId_userId_role: {
        templateId,
        userId,
        role
      }
    }
  });
}

export async function getTemplateMembers(templateId: string) {
  return prisma.hiringTeamTemplateMember.findMany({
    where: { templateId },
    include: {
      user: {
        select: { id: true, name: true, email: true, isActive: true }
      }
    },
    orderBy: { role: "asc" }
  });
}
