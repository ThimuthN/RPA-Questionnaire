import { NextResponse } from "next/server";
import { z } from "zod";
import {
  requireApiSession,
  requireDepartmentWorkspaceAccess,
  requireGlobalPermission,
  requirePermissionForDepartment
} from "@/lib/auth/guards";
import { createAssessmentPreset, listAssessmentPresets } from "@/lib/addons/catalog";
import {
  createRequestLogContext,
  logRouteError,
  messageFromError
} from "@/lib/server/logger";

const presetSchema = z.object({
  label: z.string().min(2),
  description: z.string().default(""),
  departmentId: z.string().optional(),
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
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "1";
  const workspaceId = searchParams.get("workspaceId")?.trim() || undefined;

  if (workspaceId) {
    const access = await requireDepartmentWorkspaceAccess(auth.session, workspaceId);
    if (!access.ok) {
      return access.response;
    }
  } else {
    const permission = await requireGlobalPermission(auth.session, "manage_addons");
    if (!permission.ok) {
      return permission.response;
    }
  }

  const presets = await listAssessmentPresets(
    workspaceId
      ? { includeInactive, departmentId: workspaceId, includeShared: true }
      : { includeInactive }
  );

  return NextResponse.json({
    ok: true,
    presets
  });
}

export async function POST(request: Request) {
  const logContext = createRequestLogContext(request, "api.addonPresets.create");
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = presetSchema.parse(await request.json());
    const permission = body.departmentId
      ? await requirePermissionForDepartment(auth.session, "manage_addons", body.departmentId)
      : await requireGlobalPermission(auth.session, "manage_addons");
    if (!permission.ok) {
      return permission.response;
    }

    const preset = await createAssessmentPreset({
      label: body.label,
      description: body.description,
      departmentId: body.departmentId,
      isActive: body.isActive,
      items: body.items
    });

    return NextResponse.json({ ok: true, preset });
  } catch (error) {
    logRouteError("addon_preset_create_failed", logContext, error);

    return NextResponse.json(
      {
        ok: false,
        message: messageFromError(error, "Could not create preset."),
        requestId: logContext.requestId
      },
      { status: 400 }
    );
  }
}
