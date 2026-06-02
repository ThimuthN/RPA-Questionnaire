import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DepartmentApplicantsPage from "./page";

const applicantWorkspaceViewSpy = vi.fn((props?: unknown) => <div data-testid="applicant-workspace-view" data-props={JSON.stringify(props)} />);

vi.mock("@/components/candidates/ApplicantWorkspaceView", () => ({
  ApplicantWorkspaceView: (props: unknown) => applicantWorkspaceViewSpy(props)
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

describe("/departments/[id]/applicants page", () => {
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

  it("passes departmentId into the shared applicant workspace route view", async () => {
    const element = await DepartmentApplicantsPage({
      params: Promise.resolve({ id: "dept-1" }),
      searchParams: Promise.resolve({ status: "submitted" })
    });

    renderToStaticMarkup(element);

    expect(applicantWorkspaceViewSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "department",
        departmentId: "dept-1",
        departmentName: "RPA SL",
        searchParams: { status: "submitted" }
      })
    );
  });
});
