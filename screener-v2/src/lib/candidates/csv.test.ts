import { describe, expect, it } from "vitest";
import { parseCandidateCsv } from "@/lib/candidates/csv";

describe("parseCandidateCsv", () => {
  it("parses common candidate columns", () => {
    const rows = parseCandidateCsv(
      [
        "fullName,email,positionAppliedFor,hrOwner",
        "Jane Doe,jane@example.com,QA Engineer,Alex"
      ].join("\n")
    );

    expect(rows).toEqual([
      {
        fullName: "Jane Doe",
        email: "jane@example.com",
        positionAppliedFor: "QA Engineer",
        hrOwner: "Alex"
      }
    ]);
  });

  it("supports quoted commas", () => {
    const rows = parseCandidateCsv(
      [
        "fullName,email,notesSummary",
        "\"Doe, Jane\",jane@example.com,\"Strong screening, needs review\""
      ].join("\n")
    );

    expect(rows[0]?.fullName).toBe("Doe, Jane");
    expect(rows[0]?.notesSummary).toBe("Strong screening, needs review");
  });
});
