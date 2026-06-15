import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => { throw new Error("notFound"); })
}));

vi.mock("@/components/departments/DepartmentAccessRolesSection", () => ({
  DepartmentAccessRolesSection: ({ departmentName }: { departmentName: string }) => (
    <div data-testid="access-roles">Roles for {departmentName}</div>
  )
}));

vi.mock("@/lib/auth/guards", () => ({
  requirePageSession: vi.fn()
}));

vi.mock("@/lib/auth/permission-evaluator", () => ({
  canUsePermissionForDepartment: vi.fn()
}));

vi.mock("@/lib/db/departments", () => ({
  getDepartment: vi.fn()
}));

vi.mock("@/lib/roles/catalog", () => ({
  listAccessRoles: vi.fn()
}));

import DepartmentAccessPage from "./page";
import { requirePageSession } from "@/lib/auth/guards";
import { canUsePermissionForDepartment } from "@/lib/auth/permission-evaluator";
import { getDepartment } from "@/lib/db/departments";
import { listAccessRoles } from "@/lib/roles/catalog";

describe("Department Access Control Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePageSession).mockResolvedValue({
      userId: "user-1",
      permissions: ["manage_users"],
      departmentId: "dept-1"
    } as never);
    vi.mocked(canUsePermissionForDepartment).mockResolvedValue(true as never);
    vi.mocked(getDepartment).mockResolvedValue({ id: "dept-1", name: "Automation" } as never);
    vi.mocked(listAccessRoles).mockResolvedValue([] as never);
  });

  it("renders access roles section for users with manage_users permission", async () => {
    const markup = renderToStaticMarkup(
      await DepartmentAccessPage({
        params: Promise.resolve({ id: "dept-1" })
      })
    );

    expect(markup).toContain('data-testid="access-roles"');
    expect(markup).toContain("Access Control");
  });

  it("calls notFound when viewer lacks manage_users permission", async () => {
    vi.mocked(canUsePermissionForDepartment).mockResolvedValue(false as never);

    await expect(
      DepartmentAccessPage({ params: Promise.resolve({ id: "dept-1" }) })
    ).rejects.toThrow("notFound");
  });
});
