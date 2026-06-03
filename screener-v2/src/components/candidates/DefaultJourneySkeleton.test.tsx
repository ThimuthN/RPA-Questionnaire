import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DefaultJourneySkeleton } from "./DefaultJourneySkeleton";

describe("DefaultJourneySkeleton", () => {
  it("renders all default journey stages", () => {
    const markup = renderToStaticMarkup(
      <DefaultJourneySkeleton hasLinkedApplication={true} />
    );

    const stages = [
      "Registered / Applied",
      "Screening",
      "Assessment",
      "Interview",
      "Advanced Review",
      "Finalized"
    ];

    stages.forEach((stage) => {
      expect(markup).toContain(stage);
    });
  });

  it("shows imported-only message when no linked application", () => {
    const markup = renderToStaticMarkup(
      <DefaultJourneySkeleton hasLinkedApplication={false} />
    );

    expect(markup).toContain("Imported/manual candidate");
    expect(markup).toContain("no linked application journey yet");
  });

  it("shows pending milestones message when application exists", () => {
    const markup = renderToStaticMarkup(
      <DefaultJourneySkeleton hasLinkedApplication={true} />
    );

    expect(markup).toContain("No tracked milestones yet");
    expect(markup).toContain("Milestones will appear");
  });

  it("renders numbered stages in order", () => {
    const markup = renderToStaticMarkup(
      <DefaultJourneySkeleton hasLinkedApplication={true} />
    );

    // Check that stage numbers are rendered
    for (let i = 1; i <= 6; i++) {
      expect(markup).toContain(i.toString());
    }
  });
});
