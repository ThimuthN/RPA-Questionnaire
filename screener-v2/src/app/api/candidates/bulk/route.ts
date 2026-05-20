import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermission, requirePermissionForDepartment } from "@/lib/auth/guards";
import { parseCandidateCsv } from "@/lib/candidates/csv";
import { candidateNoteTypeValues, candidateStageValues } from "@/lib/candidates/types";
import { bulkUpdateCandidates, createCandidatesBatch } from "@/lib/db/candidates";
import { createOrUpdateDepartmentCandidacy } from "@/lib/db/candidacies";
import { prisma } from "@/lib/db/prisma";
import { checkBulkOpRateLimit } from "@/lib/server/rate-limit";

const MAX_BULK_IDS_PER_REQUEST = 500;
const MAX_CSV_ROWS_PER_IMPORT = 1000;

const bulkSchema = z.object({
  action: z.enum(["assign_owner", "set_stage", "add_note", "import_csv", "nominate_to_dept"]),
  owner: z.string().optional(),
  stage: z.enum(candidateStageValues).optional(),
  roleId: z.string().optional(),
  departmentId: z.string().optional(),
  hrOwnerId: z.string().optional(),
  noteBody: z.string().optional(),
  noteType: z.enum(candidateNoteTypeValues).optional(),
  nominationNote: z.string().optional(),
  returnTo: z.string().optional()
});

function redirectUrl(request: Request, returnTo?: string) {
  if (returnTo?.startsWith("/")) {
    return new URL(returnTo, request.url);
  }
  return new URL("/candidates", request.url);
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }
  const { session } = auth;

  // Check permission
  const permissionCheck = await requirePermission(auth.session, "manage_candidates");
  if (!permissionCheck.ok) return permissionCheck.response;

  if (!(await checkBulkOpRateLimit(session.userId ?? ""))) {
    const url = redirectUrl(request, "");
    url.searchParams.set("error", "Bulk operation in progress. Please wait 30 seconds before trying again.");
    return NextResponse.redirect(url, 303);
  }

  const formData = await request.formData();
  try {
    const parsed = bulkSchema.parse(Object.fromEntries(formData.entries()));
    const url = redirectUrl(request, parsed.returnTo);

    if (parsed.action === "import_csv") {
      const csvFile = formData.get("csvFile");
      if (!(csvFile instanceof File)) {
        throw new Error("Choose a CSV file to import.");
      }

      const rows = parseCandidateCsv(await csvFile.text());
      if (rows.length > MAX_CSV_ROWS_PER_IMPORT) {
        url.searchParams.set("error", `Maximum ${MAX_CSV_ROWS_PER_IMPORT} rows per CSV import`);
        return NextResponse.redirect(url, 303);
      }

      const existingEmails = new Set(
        (
          await prisma.candidate.findMany({
            where: {
              email: {
                in: rows.map((row) => row.email)
              }
            },
            select: {
              email: true
            }
          })
        ).map((row) => row.email.toLowerCase())
      );

      const newRows = rows.filter((row) => !existingEmails.has(row.email.toLowerCase()));
      const skippedCount = rows.length - newRows.length;

      const result = await createCandidatesBatch(newRows);

      url.searchParams.set("imported", String(result.createdCount));
      if (skippedCount > 0) {
        url.searchParams.set("skipped", String(skippedCount));
      }
      return NextResponse.redirect(url, 303);
    }

    const ids = formData
      .getAll("candidateId")
      .map((value) => String(value))
      .filter(Boolean);

    if (ids.length > MAX_BULK_IDS_PER_REQUEST) {
      url.searchParams.set("error", `Maximum ${MAX_BULK_IDS_PER_REQUEST} candidates per request`);
      return NextResponse.redirect(url, 303);
    }

    const selectedCandidates = await prisma.candidate.findMany({
      where: { id: { in: ids } },
      select: { id: true, departmentId: true, orgStage: true }
    });
    for (const candidate of selectedCandidates) {
      const scopedPermission = await requirePermissionForDepartment(session, "manage_candidates", candidate.departmentId);
      if (!scopedPermission.ok) return scopedPermission.response;
      if (candidate.orgStage === "finalized") {
        throw new Error("Finalized candidates must be reverted before editing.");
      }
    }

    if (parsed.action === "nominate_to_dept") {
      if (!parsed.departmentId) {
        throw new Error("Choose a target department for the transfer.");
      }
      if (!parsed.roleId) {
        throw new Error("Choose a target role for the transfer.");
      }
      const role = await prisma.roleCatalog.findUnique({
        where: { id: parsed.roleId },
        select: { departmentId: true }
      });
      if (!role || role.departmentId !== parsed.departmentId) {
        throw new Error("Role must belong to the selected department.");
      }

      let count = 0;
      for (const candidateId of ids) {
        await createOrUpdateDepartmentCandidacy({
          candidateId,
          departmentId: parsed.departmentId,
          roleId: parsed.roleId,
          hrOwnerId: parsed.hrOwnerId,
          nominatedBy: session.userId ?? undefined,
          nominatedByName: session.name || session.email || "System",
          nominationNote: parsed.nominationNote,
          source: "nominated"
        });
        count++;
      }
      url.searchParams.set("updated", String(count));
      return NextResponse.redirect(url, 303);
    }

    const result = await bulkUpdateCandidates({
      candidateIds: ids,
      action: parsed.action as any,
      owner: parsed.owner,
      stage: parsed.stage,
      roleId: parsed.roleId,
      departmentId: parsed.departmentId,
      hrOwnerId: parsed.hrOwnerId,
      noteBody: parsed.noteBody,
      noteType: parsed.noteType,
      nominationNote: parsed.nominationNote,
      createdById: session.userId ?? undefined
    });

    url.searchParams.set("updated", String(result.updatedCount));
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const url = redirectUrl(request, String(formData.get("returnTo") || ""));
    url.searchParams.set("error", error instanceof Error ? error.message : "Could not update candidates.");
    return NextResponse.redirect(url, 303);
  }
}
