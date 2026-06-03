import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>
}));

vi.mock("@/components/primitives/Button", () => ({
  Button: ({ children, variant }: { children: React.ReactNode; variant?: string }) =>
    <button data-variant={variant}>{children}</button>
}));

vi.mock("@/components/primitives/StatusPill", () => ({
  StatusPill: ({ label }: { label: string }) => <span>{label}</span>
}));

vi.mock("@/components/primitives/SignalCard", () => ({
  SignalCard: ({ label, value }: { label: string; value: string }) => <div>{label}: {value}</div>
}));

vi.mock("@/components/primitives/NotificationBanner", () => ({
  NotificationBanner: ({ tone, children }: { tone: string; children: React.ReactNode }) =>
    <div data-tone={tone}>{children}</div>
}));

vi.mock("@/components/scene/SceneShell", () => ({
  SceneShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock("@/components/scene/StagePanel", () => ({
  StagePanel: ({ children }: { children: React.ReactNode }) => <section>{children}</section>
}));

vi.mock("@/components/departments/DepartmentModal", () => ({
  DepartmentModal: ({ mode }: { mode?: string }) => <div>{mode ? `Edit Department` : "Create Department"}</div>
}));

vi.mock("@/lib/auth/guards", () => ({
  requireAdminPageSession: vi.fn()
}));

vi.mock("@/lib/db/departments", () => ({
  listDepartments: vi.fn()
}));

import DepartmentsPage from "./page";
import { requireAdminPageSession } from "@/lib/auth/guards";
import { listDepartments } from "@/lib/db/departments";

const mockDepartments = [
  { id: "dept-1", name: "RPA SL", isActive: true },
  { id: "dept-2", name: "RPA IND", isActive: true },
  { id: "dept-3", name: "Archive", isActive: false }
];

describe("Departments Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminPageSession).mockResolvedValue({} as any);
    vi.mocked(listDepartments).mockResolvedValue(mockDepartments as any);
  });

  it("renders intro panel with workspace management copy", async () => {
    const result = await DepartmentsPage({
      searchParams: Promise.resolve({})
    });

    const markup = renderToStaticMarkup(result);
    expect(markup).toContain("Workspace management");
    expect(markup).toContain("Workspaces represent hiring departments");
    expect(markup).toContain("dedicated country model");
  });

  it("renders workspace directory title and description", async () => {
    const result = await DepartmentsPage({
      searchParams: Promise.resolve({})
    });

    const markup = renderToStaticMarkup(result);
    expect(markup).toContain("Workspace directory");
    expect(markup).toContain("Manage hiring workspaces");
  });

  it("renders Open workspace action for each row", async () => {
    const result = await DepartmentsPage({
      searchParams: Promise.resolve({})
    });

    const markup = renderToStaticMarkup(result);
    // Should appear twice if there are two active departments
    expect(markup).toMatch(/Open workspace/g);
  });

  it("displays signal cards with summary counts", async () => {
    const result = await DepartmentsPage({
      searchParams: Promise.resolve({})
    });

    const markup = renderToStaticMarkup(result);
    expect(markup).toContain("Total: 3");
    expect(markup).toContain("Active: 2");
    expect(markup).toContain("Inactive: 1");
  });

  it("renders department table with names and status", async () => {
    const result = await DepartmentsPage({
      searchParams: Promise.resolve({})
    });

    const markup = renderToStaticMarkup(result);
    expect(markup).toContain("RPA SL");
    expect(markup).toContain("RPA IND");
    expect(markup).toContain("Archive");
    expect(markup).toContain("Active");
    expect(markup).toContain("Inactive");
  });
});
