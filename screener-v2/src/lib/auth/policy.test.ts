import { describe, expect, it } from "vitest";
import { isAuthRequiredPath } from "@/lib/auth/policy";

describe("auth policy", () => {
  it("keeps public job application route open", () => {
    expect(isAuthRequiredPath("/api/jobs/backend-engineer/apply")).toBe(false);
  });

  it("protects internal jobs routes", () => {
    expect(isAuthRequiredPath("/api/jobs")).toBe(true);
    expect(isAuthRequiredPath("/api/jobs/cma123")).toBe(true);
  });
});
