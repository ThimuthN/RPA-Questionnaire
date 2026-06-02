import { describe, expect, it } from "vitest";
import { getCandidateStageLabel } from "@/lib/candidates/lifecycle";

describe("getCandidateStageLabel", () => {
  it("uses the canonical stage labels", () => {
    expect(getCandidateStageLabel("pipeline")).toBe("Pipeline");
    expect(getCandidateStageLabel("finalized")).toBe("Finalized");
  });

  it("keeps the screening label aligned across table and profile views", () => {
    expect(getCandidateStageLabel("screening")).toBe("Screening assessment");
  });

  it("normalizes the legacy new stage to the pipeline label", () => {
    expect(getCandidateStageLabel("new")).toBe("Pipeline");
  });
});
