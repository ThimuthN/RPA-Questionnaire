import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DepartmentCandidatesPage from "./page";

const candidateWorkspaceViewSpy = vi.fn((props?: unknown) => <div data-testid="candidate-workspace-view" data-props={JSON.stringify(props)} />);

vi.mock("@/components/candidates/CandidateWorkspaceView", () => ({
  CandidateWorkspaceView: (props: unknown) => candidateWorkspaceViewSpy(props)
}));

vi.mock("@/lib/db/departments", () => ({
  getDepartment: vi.fn()
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("notFound");
  })
}));

const { getDepartment } = await import("@/lib/db/departments");

describe("/departments/[id]/candidates page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDepartment).mockResolvedValue({
      id: "dept-1",
      slug: "rpa-sl",
      name: "RPA SL",
      isActive: true,
      sortOrder: 1
    } as any);
  });

  it("passes departmentId into the shared candidate workspace route view", async () => {
    const element = await DepartmentCandidatesPage({
      params: Promise.resolve({ id: "dept-1" }),
      searchParams: Promise.resolve({ stage: "finalized" })
    });

    renderToStaticMarkup(element);

    expect(candidateWorkspaceViewSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "department",
        departmentId: "dept-1",
        departmentName: "RPA SL",
        searchParams: { stage: "finalized" }
      })
    );
  });
});
