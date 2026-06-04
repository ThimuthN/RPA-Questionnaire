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

  it("resolves departmentId search param on /people routes to that department workspace", () => {
    const workspace = resolveCurrentWorkspace({
      pathname: "/people/candidates/new",
      searchParams: new URLSearchParams("departmentId=dept-1"),
      isAdmin: true,
      visibleDepartments
    });

    expect(workspace).toBe("dept-1");
  });

  it("falls back to admin when departmentId param does not match a visible department", () => {
    const workspace = resolveCurrentWorkspace({
      pathname: "/people/candidates/new",
      searchParams: new URLSearchParams("departmentId=dept-missing"),
      isAdmin: true,
      visibleDepartments
    });

    expect(workspace).toBe("admin");
  });

  it("falls back to admin when /people route has no departmentId param", () => {
    const workspace = resolveCurrentWorkspace({
      pathname: "/people/candidates/new",
      searchParams: new URLSearchParams(),
      isAdmin: true,
      visibleDepartments
    });

    expect(workspace).toBe("admin");
  });

  it("resolves /departments/[id]/jobs/new to that department", () => {
    const workspace = resolveCurrentWorkspace({
      pathname: "/departments/dept-1/jobs/new",
      searchParams: new URLSearchParams(),
      isAdmin: true,
      visibleDepartments
    });

    expect(workspace).toBe("dept-1");
  });

  it("resolves /departments/[id]/candidates/new to that department", () => {
    const workspace = resolveCurrentWorkspace({
      pathname: "/departments/dept-2/candidates/new",
      searchParams: new URLSearchParams(),
      isAdmin: true,
      visibleDepartments
    });

    expect(workspace).toBe("dept-2");
  });

  it("resolves /access-roles to admin workspace for admin users", () => {
    const workspace = resolveCurrentWorkspace({
      pathname: "/access-roles",
      searchParams: new URLSearchParams(),
      isAdmin: true,
      visibleDepartments
    });

    expect(workspace).toBe("admin");
  });

  it("resolves /users to admin workspace for admin users", () => {
    const workspace = resolveCurrentWorkspace({
      pathname: "/users",
      searchParams: new URLSearchParams(),
      isAdmin: true,
      visibleDepartments
    });

    expect(workspace).toBe("admin");
  });

  it("resolves /create-test to admin workspace for admin users", () => {
    const workspace = resolveCurrentWorkspace({
      pathname: "/create-test",
      searchParams: new URLSearchParams(),
      isAdmin: true,
      visibleDepartments
    });

    expect(workspace).toBe("admin");
  });

  it("returns undefined for /access-roles when user is not admin", () => {
    const workspace = resolveCurrentWorkspace({
      pathname: "/access-roles",
      searchParams: new URLSearchParams(),
      isAdmin: false,
      visibleDepartments
    });

    expect(workspace).toBeUndefined();
  });
});
