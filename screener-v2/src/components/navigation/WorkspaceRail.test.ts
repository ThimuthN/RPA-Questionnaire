import { describe, expect, it } from "vitest";
import { resolveCurrentWorkspace } from "./WorkspaceRail";

describe("resolveCurrentWorkspace", () => {
  const visibleDepartments = [
    { id: "dept-1", name: "RPA SL", isActive: true },
    { id: "dept-2", name: "RPA IND", isActive: true }
  ];

  it("uses query workspace context on candidate detail pages", () => {
    const workspace = resolveCurrentWorkspace({
      pathname: "/people/candidates/cand-1",
      searchParams: new URLSearchParams("workspaceId=dept-1"),
      isAdmin: true,
      visibleDepartments
    });

    expect(workspace).toBe("dept-1");
  });

  it("falls back to admin workspace on global admin routes", () => {
    const workspace = resolveCurrentWorkspace({
      pathname: "/people/candidates",
      searchParams: new URLSearchParams(),
      isAdmin: true,
      visibleDepartments
    });

    expect(workspace).toBe("admin");
  });

  it("ignores invalid query workspace ids", () => {
    const workspace = resolveCurrentWorkspace({
      pathname: "/people/candidates/cand-1",
      searchParams: new URLSearchParams("workspaceId=dept-missing"),
      isAdmin: true,
      visibleDepartments
    });

    expect(workspace).toBe("admin");
  });

  it("keeps department routes scoped by pathname", () => {
    const workspace = resolveCurrentWorkspace({
      pathname: "/departments/dept-2/candidates",
      searchParams: new URLSearchParams("workspaceId=dept-1"),
      isAdmin: true,
      visibleDepartments
    });

    expect(workspace).toBe("dept-2");
  });
});
