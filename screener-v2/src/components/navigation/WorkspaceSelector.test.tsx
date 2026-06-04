import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceSelector } from "./WorkspaceSelector";

// The dropdown panel is portaled to document.body at runtime and is therefore
// absent from server-side static markup (mounted=false during SSR, createPortal
// returns null). These tests cover the trigger card and collapsed states only.
// Panel open/close behavior requires an interactive test environment.

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

  it("renders current workspace name and switcher trigger for admins", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceSelector currentWorkspace="admin" departments={departments} isAdmin={true} collapsed={false} />
    );

    expect(markup).toContain("Admin Workspace");
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('aria-label="Toggle workspace menu"');
  });

  it("renders current department workspace name in the card", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceSelector currentWorkspace="dept-1" departments={departments} isAdmin={true} collapsed={false} />
    );

    expect(markup).toContain("RPA SL");
    // card link for current workspace
    expect(markup).toContain('href="/departments/dept-1"');
    // switcher trigger present (multiple options available)
    expect(markup).toContain('aria-expanded="false"');
  });

  it("does not render a switcher trigger for department-scoped users with one workspace", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceSelector
        currentWorkspace="dept-1"
        departments={[{ id: "dept-1", name: "RPA SL", isActive: true }]}
        isAdmin={false}
        collapsed={false}
      />
    );

    // only one option — no switcher needed
    expect(markup).not.toContain("aria-expanded");
    expect(markup).not.toContain("Admin Workspace");
    // card still shows the workspace name and type
    expect(markup).toContain("RPA SL");
    expect(markup).toContain("Department workspace");
  });

  it("current workspace card link points at the correct route", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceSelector currentWorkspace="dept-1" departments={departments} isAdmin={true} collapsed={false} />
    );

    // the card's own Link navigates to the current workspace
    expect(markup).toContain('href="/departments/dept-1"');
    // dept-2 link lives inside the portaled panel — not in SSR markup
  });

  it("shows an ASCII admin abbreviation when collapsed", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceSelector currentWorkspace="admin" departments={[]} isAdmin={true} collapsed={true} />
    );

    expect(markup).toContain(">AD<");
  });

  it("shows a department abbreviation when collapsed", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceSelector currentWorkspace="dept-1" departments={departments} isAdmin={false} collapsed={true} />
    );

    expect(markup).toContain(">RP<");
  });
});
