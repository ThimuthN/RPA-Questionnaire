import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DefaultJourneySkeleton } from "./DefaultJourneySkeleton";

describe("DefaultJourneySkeleton", () => {
  it("renders all default review journey stages", () => {
    const markup = renderToStaticMarkup(<DefaultJourneySkeleton hasHiringJourney={true} />);

    [
      "Registered / Applied",
      "Screening assessment",
      "Interview",
      "Advanced Review",
      "Finalized"
    ].forEach((stage) => {
      expect(markup).toContain(stage);
    });
  });

  it("shows a no-linked-application warning without faking completion", () => {
    const markup = renderToStaticMarkup(<DefaultJourneySkeleton hasHiringJourney={false} />);

    expect(markup).toContain("No active hiring journey yet");
    expect(markup).toContain("Pending");
  });

  it("renders the active review card copy for the default stage", () => {
    const markup = renderToStaticMarkup(<DefaultJourneySkeleton hasHiringJourney={true} />);

    expect(markup).toContain("Pending setup");
    expect(markup).toContain("Use this stage to confirm intake basics before any workflow progression.");
  });
});
