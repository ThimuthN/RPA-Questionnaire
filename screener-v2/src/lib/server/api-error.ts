import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation_error"
  | "conflict"
  | "internal_error"
  | "service_unavailable";

const HTTP_STATUS: Record<ApiErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  validation_error: 422,
  conflict: 409,
  internal_error: 500,
  service_unavailable: 503,
};

export type ApiErrorBody = {
  ok: false;
  errorCode: ApiErrorCode;
  message: string;
  requestId?: string;
};

export function apiError(
  code: ApiErrorCode,
  message: string,
  requestId?: string
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { ok: false as const, errorCode: code, message, requestId },
    { status: HTTP_STATUS[code] }
  );
}
