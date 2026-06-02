import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import PeopleCandidatesPage from "./page";

const candidateWorkspaceViewSpy = vi.fn((props?: unknown) => <div data-testid="candidate-workspace-view" data-props={JSON.stringify(props)} />);

vi.mock("@/components/candidates/CandidateWorkspaceView", () => ({
  CandidateWorkspaceView: (props: unknown) => candidateWorkspaceViewSpy(props)
}));

vi.mock("@/components/motion/SceneTransition", () => ({
  SceneTransition: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

vi.mock("@/components/scene/SceneShell", () => ({
  SceneShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>
}));

vi.mock("@/components/people/PeopleViewSwitch", () => ({
  PeopleViewSwitch: () => <div />
}));

describe("/people/candidates page", () => {
  it("wires the global route to the shared candidate workspace without department scope", async () => {
    const element = await PeopleCandidatesPage({
      searchParams: Promise.resolve({ stage: "pipeline" })
    });

    renderToStaticMarkup(element);

    expect(candidateWorkspaceViewSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "global",
        searchParams: { stage: "pipeline" }
      })
    );
    expect(candidateWorkspaceViewSpy.mock.calls[0]?.[0]).not.toHaveProperty("departmentId");
  });
});
