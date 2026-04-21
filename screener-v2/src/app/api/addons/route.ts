import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/guards";
import { addonUpsertSchema } from "@/lib/addons/api-schema";
import { createAddonCatalogEntry, listAddonCatalog } from "@/lib/addons/catalog";
import {
  createRequestLogContext,
  logRouteError,
  messageFromError
} from "@/lib/server/logger";

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "1";
  const addons = await listAddonCatalog(includeInactive);

  return NextResponse.json({
    ok: true,
    addons
  });
}

export async function POST(request: Request) {
  const logContext = createRequestLogContext(request, "api.addons.create");
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = addonUpsertSchema.parse(await request.json());
    const addon = await createAddonCatalogEntry({
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
    logRouteError("addon_create_failed", logContext, error);

    return NextResponse.json(
      {
        ok: false,
        message: messageFromError(error, "Could not create add-on."),
        requestId: logContext.requestId
      },
      { status: 400 }
    );
  }
}
