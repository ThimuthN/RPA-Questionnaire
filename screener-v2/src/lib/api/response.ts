import { NextResponse } from "next/server";

export type ApiResponse<T = unknown> = { ok: true; data: T } | { ok: false; error: string; code: string };

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string = "INTERNAL_ERROR",
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data } satisfies ApiResponse<T>, { status });
}

export function err(error: unknown, fallbackStatus = 400) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { ok: false, error: error.message, code: error.code } satisfies ApiResponse<never>,
      { status: error.status },
    );
  }
  if (error instanceof Error) {
    return NextResponse.json(
      { ok: false, error: error.message, code: "BAD_REQUEST" } satisfies ApiResponse<never>,
      { status: fallbackStatus },
    );
  }
  return NextResponse.json(
    { ok: false, error: "Unexpected error", code: "INTERNAL_ERROR" } satisfies ApiResponse<never>,
    { status: 500 },
  );
}

export function notFound(resource: string) {
  return new ApiError(`${resource} not found`, "NOT_FOUND", 404);
}

export function forbidden(message = "Forbidden") {
  return new ApiError(message, "FORBIDDEN", 403);
}

export function unauthorized(message = "Unauthorized") {
  return new ApiError(message, "UNAUTHORIZED", 401);
}

export function conflict(message: string) {
  return new ApiError(message, "CONFLICT", 409);
}

export function badRequest(message: string) {
  return new ApiError(message, "BAD_REQUEST", 400);
}
