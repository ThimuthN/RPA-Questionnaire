import Link from "next/link";
import type { Route } from "next";
import { getDepartment } from "@/lib/db/departments";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";

export default async function DepartmentDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const department = await getDepartment(id);
  if (!department) {
    notFound();
  }

  const [userCount, designationCount, openJobCount, applicantCount, activeCandidateCount, finalizedCandidateCount, assessmentCount] = await Promise.all([
    prisma.user.count({ where: { departmentId: id, isActive: true } }),
    prisma.roleCatalog.count({ where: { departmentId: id, isActive: true } }),
    prisma.jobPosting.count({ where: { role: { departmentId: id }, isOpen: true } }),
    prisma.candidateApplication.count({
      where: {
        jobPosting: { role: { departmentId: id } },
        status: "submitted"
      }
    }),
    prisma.candidate.count({ where: { departmentId: id, orgStage: "active" } }),
    prisma.candidate.count({ where: { departmentId: id, orgStage: "finalized" } }),
    prisma.candidateAssessment.count({
      where: { candidate: { departmentId: id } }
    })
  ]);

  const cards = [
    { label: "Team", value: userCount, href: `/departments/${id}/users` as Route },
    { label: "Roles", value: designationCount, href: `/departments/${id}/designations` as Route },
    { label: "Open jobs", value: openJobCount, href: `/departments/${id}/jobs` as Route },
    { label: "Applicants", value: applicantCount, href: `/departments/${id}/applicants` as Route },
    { label: "Candidates", value: activeCandidateCount, href: `/departments/${id}/candidates` as Route },
    { label: "Finalized", value: finalizedCandidateCount, href: `/departments/${id}/candidates?stage=finalized` as Route },
    { label: "Assessments", value: assessmentCount, href: `/departments/${id}/assessments` as Route }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl text-[color:var(--app-heading)]">Overview</h2>
        <p className="text-sm text-[color:var(--app-muted)]">
          Select a section to manage it.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {cards.map(({ label, value, href }) => (
          <Link key={label} href={href}>
            <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 hover:bg-[color:var(--app-surface)] transition cursor-pointer">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">{label}</p>
              <p className="mt-2 text-3xl text-[color:var(--app-heading)]">{value}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
