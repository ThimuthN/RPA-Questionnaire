import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceSelector } from "./WorkspaceSelector";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

describe("WorkspaceSelector", () => {
  const departments = [
    { id: "dept-1", name: "RPA SL", isActive: true },
    { id: "dept-2", name: "RPA IND", isActive: true }
  ];

  it("renders admin and department workspace groups for admins", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceSelector currentWorkspace="admin" departments={departments} isAdmin={true} collapsed={false} />
    );

    expect(markup).toContain("Admin");
    expect(markup).toContain("Department Workspaces");
    expect(markup).toContain("Admin Workspace");
  });

  it("marks the active workspace clearly", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceSelector currentWorkspace="dept-1" departments={departments} isAdmin={true} collapsed={false} />
    );

    expect(markup).toContain("RPA SL");
    expect(markup).toContain("Current");
    expect(markup).toContain('aria-current="page"');
  });

  it("does not render an admin option for department-scoped users", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceSelector currentWorkspace="dept-1" departments={departments} isAdmin={false} collapsed={false} />
    );

    expect(markup).not.toContain("Admin Workspace");
    expect(markup).toContain("Department workspace");
  });

  it("keeps the workspace links pointed at department routes", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceSelector currentWorkspace="dept-1" departments={departments} isAdmin={true} collapsed={false} />
    );

    expect(markup).toContain('href="/departments/dept-1"');
    expect(markup).toContain('href="/departments/dept-2"');
  });

  it("shows an ASCII admin abbreviation when collapsed", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceSelector currentWorkspace="admin" departments={[]} isAdmin={true} collapsed={true} />
    );

    expect(markup).toContain(">AD<");
  });
});
