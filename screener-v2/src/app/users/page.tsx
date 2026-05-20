import { redirect } from "next/navigation";
import { requireAdminPageSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export default async function UsersPage() {
  await requireAdminPageSession("/users");
  const systemDepartment = await prisma.department.findFirst({
    where: { slug: "system" },
    select: { id: true }
  });
  redirect(systemDepartment ? `/departments/${systemDepartment.id}/users` : "/departments");
}
