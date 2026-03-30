import { NextResponse } from "next/server";
import { z } from "zod";
import type { ExamDefinitionId } from "@/lib/assessment-engine/types";
import { requireApiSession } from "@/lib/auth/guards";
import { updateAddonCatalogEntry } from "@/lib/addons/catalog";
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

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const params = await context.params;
    const body = addonSchema.parse(await request.json());
    const addon = await updateAddonCatalogEntry(params.id, {
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
      { ok: false, message: error instanceof Error ? error.message : "Could not update add-on." },
      { status: 400 }
    );
  }
}
