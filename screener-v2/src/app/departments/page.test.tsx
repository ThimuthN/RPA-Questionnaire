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
  SceneShell: ({
    eyebrow,
    title,
    subtitle,
    children
  }: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
  }) => (
    <div>
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {children}
    </div>
  )
}));

vi.mock("@/components/scene/StagePanel", () => ({
  StagePanel: ({ children }: { children: React.ReactNode }) => <section>{children}</section>
}));

vi.mock("@/components/departments/DepartmentModal", () => ({
  DepartmentModal: ({ mode }: { mode?: string }) => <div>{mode ? `Edit Department` : "Create Department"}</div>
}));

vi.mock("@/components/departments/WorkspaceDirectory", () => ({
  WorkspaceDirectory: ({ workspaces }: { workspaces: Array<{ name: string; isActive: boolean }> }) => (
    <div>
      {workspaces.map((workspace) => (
        <div key={workspace.name}>
          <span>{workspace.name}</span>
          <span>{workspace.isActive ? "Active" : "Inactive"}</span>
          <a href={`/departments/${workspace.name}`}>Open workspace</a>
        </div>
      ))}
    </div>
  )
}));

vi.mock("@/lib/auth/guards", () => ({
  requireAdminPageSession: vi.fn()
}));

vi.mock("@/lib/db/departments", () => ({
  listDepartments: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    jobPosting: { groupBy: vi.fn() },
    candidate: { groupBy: vi.fn() },
    accessGrant: { groupBy: vi.fn() }
  }
}));

import DepartmentsPage from "./page";
import { requireAdminPageSession } from "@/lib/auth/guards";
import { listDepartments } from "@/lib/db/departments";
import { prisma } from "@/lib/db/prisma";

const mockDepartments = [
  { id: "dept-1", slug: "rpa-sl", sortOrder: 1, name: "RPA SL", isActive: true },
  { id: "dept-2", slug: "rpa-ind", sortOrder: 2, name: "RPA IND", isActive: true },
  { id: "dept-3", slug: "archive", sortOrder: 3, name: "Archive", isActive: false }
];

describe("Departments Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminPageSession).mockResolvedValue({} as any);
    vi.mocked(listDepartments).mockResolvedValue(mockDepartments as any);
    vi.mocked(prisma.jobPosting.groupBy).mockResolvedValue([
      { departmentId: "dept-1", _count: { _all: 3 } },
      { departmentId: "dept-2", _count: { _all: 2 } }
    ] as any);
    vi.mocked(prisma.candidate.groupBy).mockResolvedValue([
      { departmentId: "dept-1", _count: { _all: 4 } },
      { departmentId: "dept-2", _count: { _all: 1 } },
      { departmentId: "dept-3", _count: { _all: 2 } }
    ] as any);
    vi.mocked(prisma.accessGrant.groupBy).mockResolvedValue([
      { departmentId: "dept-1", _count: { _all: 5 } },
      { departmentId: "dept-2", _count: { _all: 4 } }
    ] as any);
  });

  it("renders intro panel with workspace management copy", async () => {
    const result = await DepartmentsPage({
      searchParams: Promise.resolve({})
    });

    const markup = renderToStaticMarkup(result);
    expect(markup).toContain("Manage Workspaces");
    expect(markup).toContain("Create, activate, and manage hiring workspaces");
    expect(markup).toContain("Each workspace is a hiring department or operating unit");
  });

  it("renders workspace directory title and description", async () => {
    const result = await DepartmentsPage({
      searchParams: Promise.resolve({})
    });

    const markup = renderToStaticMarkup(result);
    expect(markup).toContain("Workspace directory");
    expect(markup).toContain("Each workspace is a hiring department or operating unit");
  });

  it("renders Open workspace action for each row", async () => {
    const result = await DepartmentsPage({
      searchParams: Promise.resolve({})
    });

    const markup = renderToStaticMarkup(result);
    expect((markup.match(/Open workspace/g) ?? [])).toHaveLength(3);
  });

  it("displays signal cards with summary counts", async () => {
    const result = await DepartmentsPage({
      searchParams: Promise.resolve({})
    });

    const markup = renderToStaticMarkup(result);
    expect(markup).toContain("Workspaces: 2/3");
    expect(markup).toContain("Active: 2");
    expect(markup).toContain("Open roles: 5");
    expect(markup).toContain("Candidates: 7");
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
