import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DepartmentAssessmentsPage from "./page";

vi.mock("@/lib/db/departments", () => ({
  getDepartment: vi.fn()
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("notFound");
  })
}));

const { getDepartment } = await import("@/lib/db/departments");

describe("/departments/[id]/assessments page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDepartment).mockResolvedValue({
      id: "dept-1",
      slug: "ba-ind",
      name: "BA IND",
      isActive: true,
      sortOrder: 1
    } as never);
  });

  it("keeps workspace actions scoped to the selected department", async () => {
    const element = await DepartmentAssessmentsPage({
      params: Promise.resolve({ id: "dept-1" })
    });

    const markup = renderToStaticMarkup(element);

    expect(markup).toContain("/create-test?workspaceId=dept-1");
    expect(markup).toContain("/addons?workspaceId=dept-1");
    expect(markup).toContain("/results?workspaceId=dept-1");
  });
});
