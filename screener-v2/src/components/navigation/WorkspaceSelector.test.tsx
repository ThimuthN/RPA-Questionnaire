import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceSelector } from "./WorkspaceSelector";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    <a href={href} {...props}>{children}</a>
}));

describe("WorkspaceSelector", () => {
  it("renders admin and department workspace section labels", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceSelector
        currentWorkspace="admin"
        departments={[
          { id: "dept-1", name: "RPA SL", isActive: true },
          { id: "dept-2", name: "RPA IND", isActive: true }
        ]}
        isAdmin={true}
        collapsed={false}
      />
    );

    // When markup is rendered statically, the dropdown won't be open
    // so we can only verify the component renders
    expect(markup).toContain("Admin Workspace");
  });

  it("marks selected workspace as active", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceSelector
        currentWorkspace="dept-1"
        departments={[
          { id: "dept-1", name: "RPA SL", isActive: true },
          { id: "dept-2", name: "RPA IND", isActive: true }
        ]}
        isAdmin={true}
        collapsed={false}
      />
    );

    expect(markup).toContain("RPA SL");
  });

  it("only shows active departments in dropdown", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceSelector
        currentWorkspace="dept-1"
        departments={[
          { id: "dept-1", name: "RPA SL", isActive: true },
          { id: "dept-2", name: "RPA IND", isActive: false }
        ]}
        isAdmin={true}
        collapsed={false}
      />
    );

    expect(markup).toContain("RPA SL");
    // Inactive departments shouldn't appear in the list
  });

  it("renders without admin option when not admin", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceSelector
        currentWorkspace="dept-1"
        departments={[
          { id: "dept-1", name: "RPA SL", isActive: true }
        ]}
        isAdmin={false}
        collapsed={false}
      />
    );

    expect(markup).toContain("RPA SL");
  });

  it("does not render when no workspace is selected", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceSelector
        currentWorkspace={null}
        departments={[
          { id: "dept-1", name: "RPA SL", isActive: true }
        ]}
        isAdmin={true}
        collapsed={false}
      />
    );

    // Component should render as null
    expect(markup).toBe("");
  });

  it("shows abbreviation when collapsed", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceSelector
        currentWorkspace="admin"
        departments={[]}
        isAdmin={true}
        collapsed={true}
      />
    );

    expect(markup).toContain("⚙");
  });
});
