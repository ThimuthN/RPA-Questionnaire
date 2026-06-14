import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: vi.fn()
}));

vi.mock("@/components/departments/DepartmentAccessRolesSection", () => ({
  DepartmentAccessRolesSection: ({ departmentName }: { departmentName: string }) => (
    <div data-testid="access-roles">Roles for {departmentName}</div>
  )
}));

vi.mock("@/components/integrations/DepartmentIntegrationsSection", () => ({
  DepartmentIntegrationsSection: ({ departmentId }: { departmentId: string }) => (
    <div data-testid="department-integrations">Integrations for {departmentId}</div>
  )
}));

vi.mock("@/components/primitives/NotificationBanner", () => ({
  NotificationBanner: ({ tone, children }: { tone: string; children: React.ReactNode }) => (
    <div data-tone={tone}>{children}</div>
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

vi.mock("@/lib/integrations", () => ({
  listDepartmentIntegrationSummaries: vi.fn()
}));

vi.mock("@/lib/roles/catalog", () => ({
  listAccessRoles: vi.fn()
}));

import DepartmentAccessPage from "./page";
import { requirePageSession } from "@/lib/auth/guards";
import { canUsePermissionForDepartment } from "@/lib/auth/permission-evaluator";
import { getDepartment } from "@/lib/db/departments";
import { listDepartmentIntegrationSummaries } from "@/lib/integrations";
import { listAccessRoles } from "@/lib/roles/catalog";

describe("Department Access Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePageSession).mockResolvedValue({
      userId: "user-1",
      permissions: ["manage_users", "manage_integrations"],
      departmentId: "dept-1"
    } as any);
    vi.mocked(getDepartment).mockResolvedValue({ id: "dept-1", name: "Automation" } as any);
    vi.mocked(listAccessRoles).mockResolvedValue([] as any);
    vi.mocked(listDepartmentIntegrationSummaries).mockResolvedValue([] as any);
  });

  it("renders both sections when the viewer can manage access and integrations", async () => {
    vi.mocked(canUsePermissionForDepartment)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);

    const markup = renderToStaticMarkup(
      await DepartmentAccessPage({
        params: Promise.resolve({ id: "dept-1" }),
        searchParams: Promise.resolve({})
      })
    );

    expect(markup).toContain('data-testid="access-roles"');
    expect(markup).toContain('data-testid="department-integrations"');
  });

  it("renders only Access Control when integrations permission is absent", async () => {
    vi.mocked(canUsePermissionForDepartment)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const markup = renderToStaticMarkup(
      await DepartmentAccessPage({
        params: Promise.resolve({ id: "dept-1" }),
        searchParams: Promise.resolve({})
      })
    );

    expect(markup).toContain('data-testid="access-roles"');
    expect(markup).not.toContain('data-testid="department-integrations"');
    expect(vi.mocked(listDepartmentIntegrationSummaries)).not.toHaveBeenCalled();
  });

  it("renders only App Integrations when access-role permission is absent", async () => {
    vi.mocked(canUsePermissionForDepartment)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const markup = renderToStaticMarkup(
      await DepartmentAccessPage({
        params: Promise.resolve({ id: "dept-1" }),
        searchParams: Promise.resolve({})
      })
    );

    expect(markup).not.toContain('data-testid="access-roles"');
    expect(markup).toContain('data-testid="department-integrations"');
    expect(vi.mocked(listAccessRoles)).not.toHaveBeenCalled();
  });
});
