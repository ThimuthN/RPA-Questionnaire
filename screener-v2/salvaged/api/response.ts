import { NextResponse } from "next/server";

export type ApiResponse<T = any> = {
  ok: true;
  data: T;
} | {
  ok: false;
  error: string;
  code?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string = "INTERNAL_ERROR",
    public status: number = 400
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    { ok: true, data },
    { status }
  );
}

export function errorResponse(error: unknown, defaultStatus = 400) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { ok: false, error: error.message, code: error.code },
      { status: error.status }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { ok: false, error: error.message, code: "VALIDATION_ERROR" },
      { status: defaultStatus }
    );
  }

  return NextResponse.json(
    { ok: false, error: "An unexpected error occurred", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}

export function validationError(message: string) {
  return new ApiError(message, "VALIDATION_ERROR", 400);
}

export function notFoundError(resource: string) {
  return new ApiError(`${resource} not found`, "NOT_FOUND", 404);
}

export function conflictError(message: string) {
  return new ApiError(message, "CONFLICT", 409);
}

export function unauthorizedError(message = "Unauthorized") {
  return new ApiError(message, "UNAUTHORIZED", 401);
}
