import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { createAssessmentPreset, listAssessmentPresets } from "@/lib/addons/catalog";

const presetSchema = z.object({
  label: z.string().min(2),
  description: z.string().default(""),
  isActive: z.boolean().optional(),
  items: z
    .array(
      z.object({
        addonId: z.string().min(1),
        sortOrder: z.number().int().min(0),
        configOverride: z.record(z.string(), z.unknown()).default({}),
        weightOverride: z.number().int().min(0).max(100).optional()
      })
    )
    .min(1)
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "1";
  const presets = await listAssessmentPresets(includeInactive);

  return NextResponse.json({
    ok: true,
    presets
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = presetSchema.parse(await request.json());
    const preset = await createAssessmentPreset({
      label: body.label,
      description: body.description,
      isActive: body.isActive,
      items: body.items
    });

    return NextResponse.json({ ok: true, preset });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not create preset." },
      { status: 400 }
    );
  }
}
