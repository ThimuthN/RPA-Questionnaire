import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { parseCandidateCsv } from "@/lib/candidates/csv";
import { candidateNoteTypeValues, candidateUiStatusValues } from "@/lib/candidates/types";
import { bulkUpdateCandidates, createCandidate } from "@/lib/db/candidates";
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
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Login required." }, { status: 401 });
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

      let createdCount = 0;
      let skippedCount = 0;

      for (const row of rows) {
        if (existingEmails.has(row.email)) {
          skippedCount += 1;
          continue;
        }

        await createCandidate(row);
        existingEmails.add(row.email);
        createdCount += 1;
      }

      url.searchParams.set("imported", String(createdCount));
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
