import { Prisma } from "@prisma/client";

/**
 * Safely cast a Prisma JSON value to a typed object.
 * Returns `fallback` if the value is null, undefined, or an array.
 */
export function toObject<T>(value: Prisma.JsonValue | null | undefined, fallback: T): T {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as T;
  }
  return fallback;
}
