import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { parseCandidateCsv } from "@/lib/candidates/csv";
import { candidateNoteTypeValues, candidateUiStatusValues } from "@/lib/candidates/types";
import { bulkUpdateCandidates, createCandidatesBatch } from "@/lib/db/candidates";
import { prisma } from "@/lib/db/prisma";

const bulkSchema = z.object({
  action: z.enum(["assign_owner", "set_ui_status", "add_note", "import_csv"]),
  owner: z.string().optional(),
  status: z.enum(candidateUiStatusValues).optional(),
  noteBody: z.string().optional(),
  noteType: z.enum(candidateNoteTypeValues).optional(),
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
    const result = await bulkUpdateCandidates({
      candidateIds: ids,
      action: parsed.action,
      owner: parsed.owner,
      status: parsed.status,
      noteBody: parsed.noteBody,
      noteType: parsed.noteType,
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
