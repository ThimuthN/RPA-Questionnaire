import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CandidatePipelineProgress } from "./CandidatePipelineProgress";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>
}));

describe("CandidatePipelineProgress", () => {
  it("prefers the finalized stage when final is complete but earlier work is still pending", () => {
    const markup = renderToStaticMarkup(
      <CandidatePipelineProgress
        pipelineHref={"/people/candidates/cand-1?tab=pipeline"}
        milestones={[
          {
            id: "registration",
            type: "registration",
            title: "Registration",
            status: "done",
            sortOrder: 10
          },
          {
            id: "screening",
            type: "screener",
            title: "Screener",
            status: "in_progress",
            sortOrder: 20
          },
          {
            id: "final",
            type: "finalized",
            title: "Finalized",
            status: "done",
            sortOrder: 999
          }
        ]}
      />
    );

    expect(markup).toContain("Final");
    expect(markup).toContain("Pending items");
    expect(markup).toContain("- Finalized");
  });
});
