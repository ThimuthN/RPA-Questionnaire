import { NextResponse } from "next/server";
import { z } from "zod";
import type { ExamDefinitionId } from "@/lib/assessment-engine/types";
import { getAppSession as getSession } from "@/lib/auth/app-session";
import { createAddonCatalogEntry, listAddonCatalog } from "@/lib/addons/catalog";
import { examDefinitionIdSchema } from "@/lib/exams/definitions";

const addonSchema = z.object({
  label: z.string().min(2),
  description: z.string().default(""),
  engineType: examDefinitionIdSchema,
  defaultConfig: z.record(z.string(), z.unknown()).default({}),
  defaultDurationMinutes: z.number().int().positive(),
  defaultRequiredPercent: z.number().int().min(0).max(100),
  defaultWeight: z.number().int().min(0).max(100),
  isActive: z.boolean().optional()
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "1";
  const addons = await listAddonCatalog(includeInactive);

  return NextResponse.json({
    ok: true,
    addons
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Login required." }, { status: 401 });
  }

  try {
    const body = addonSchema.parse(await request.json());
    const addon = await createAddonCatalogEntry({
      label: body.label,
      description: body.description,
      engineType: body.engineType as ExamDefinitionId,
      defaultConfig: body.defaultConfig,
      defaultDurationMinutes: body.defaultDurationMinutes,
      defaultRequiredPercent: body.defaultRequiredPercent,
      defaultWeight: body.defaultWeight,
      isActive: body.isActive
    });

    return NextResponse.json({ ok: true, addon });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not create add-on." },
      { status: 400 }
    );
  }
}
