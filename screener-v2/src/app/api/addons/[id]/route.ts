import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/guards";
import { addonUpsertSchema } from "@/lib/addons/api-schema";
import { updateAddonCatalogEntry } from "@/lib/addons/catalog";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const params = await context.params;
    const body = addonUpsertSchema.parse(await request.json());
    const addon = await updateAddonCatalogEntry(params.id, {
      label: body.label,
      description: body.description,
      assessmentTypeId: body.assessmentTypeId,
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
