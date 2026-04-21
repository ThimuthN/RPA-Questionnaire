import { describe, expect, it } from "vitest";
import { isActiveApplicationStatus } from "@/lib/jobs/types";

describe("job application status helpers", () => {
  it("treats submitted and under review as active", () => {
    expect(isActiveApplicationStatus("submitted")).toBe(true);
    expect(isActiveApplicationStatus("under_review")).toBe(true);
  });

  it("treats closed and moved to pipeline as inactive", () => {
    expect(isActiveApplicationStatus("closed")).toBe(false);
    expect(isActiveApplicationStatus("moved_to_pipeline")).toBe(false);
  });
});
