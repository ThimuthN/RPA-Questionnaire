import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { updateAssessmentPreset } from "@/lib/addons/catalog";
import {
  createRequestLogContext,
  logRouteError,
  messageFromError
} from "@/lib/server/logger";

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

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const logContext = createRequestLogContext(request, "api.addonPresets.update");
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const params = await context.params;
    const body = presetSchema.parse(await request.json());
    const preset = await updateAssessmentPreset(params.id, {
      label: body.label,
      description: body.description,
      isActive: body.isActive,
      items: body.items
    });

    return NextResponse.json({ ok: true, preset });
  } catch (error) {
    logRouteError("addon_preset_update_failed", logContext, error);

    return NextResponse.json(
      {
        ok: false,
        message: messageFromError(error, "Could not update preset."),
        requestId: logContext.requestId
      },
      { status: 400 }
    );
  }
}
