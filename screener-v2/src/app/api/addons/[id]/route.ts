import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/guards";
import { addonUpsertSchema } from "@/lib/addons/api-schema";
import { updateAddonCatalogEntry } from "@/lib/addons/catalog";
import {
  createRequestLogContext,
  logRouteError,
  messageFromError
} from "@/lib/server/logger";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const logContext = createRequestLogContext(request, "api.addons.update");
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
    logRouteError("addon_update_failed", logContext, error);

    return NextResponse.json(
      {
        ok: false,
        message: messageFromError(error, "Could not update add-on."),
        requestId: logContext.requestId
      },
      { status: 400 }
    );
  }
}
