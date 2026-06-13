import { describe, expect, it } from "vitest";
import { isWorkspaceSubnavItemActive } from "./WorkspaceSubnav";

describe("isWorkspaceSubnavItemActive", () => {
  it("keeps department assessment routes active under the workspace assessments item", () => {
    const isActive = isWorkspaceSubnavItemActive({
      itemKey: "assessments",
      href: "/departments/dept-1/assessments",
      pathname: "/addons",
      departmentId: "dept-1",
      workspaceId: "dept-1"
    });

    expect(isActive).toBe(true);
  });

  it("does not activate the workspace assessments item for another workspace", () => {
    const isActive = isWorkspaceSubnavItemActive({
      itemKey: "assessments",
      href: "/departments/dept-1/assessments",
      pathname: "/results",
      departmentId: "dept-1",
      workspaceId: "dept-2"
    });

    expect(isActive).toBe(false);
  });

  it("keeps normal nested department routes active by pathname", () => {
    const isActive = isWorkspaceSubnavItemActive({
      itemKey: "jobs",
      href: "/departments/dept-1/jobs",
      pathname: "/departments/dept-1/jobs/new",
      departmentId: "dept-1"
    });

    expect(isActive).toBe(true);
  });

  it("activates candidates item when on cross-route candidate profile with matching workspaceId", () => {
    const isActive = isWorkspaceSubnavItemActive({
      itemKey: "candidates",
      href: "/departments/dept-1/candidates",
      pathname: "/people/candidates/cand-123",
      departmentId: "dept-1",
      workspaceId: "dept-1"
    });

    expect(isActive).toBe(true);
  });

  it("does not activate candidates item on cross-route profile with mismatched workspaceId", () => {
    const isActive = isWorkspaceSubnavItemActive({
      itemKey: "candidates",
      href: "/departments/dept-1/candidates",
      pathname: "/people/candidates/cand-123",
      departmentId: "dept-1",
      workspaceId: "dept-2"
    });

    expect(isActive).toBe(false);
  });

  it("activates applicants item on cross-route applicant page with matching workspaceId", () => {
    const isActive = isWorkspaceSubnavItemActive({
      itemKey: "applicants",
      href: "/departments/dept-1/applicants",
      pathname: "/people/candidates/applicants/app-456",
      departmentId: "dept-1",
      workspaceId: "dept-1"
    });

    expect(isActive).toBe(true);
  });

  it("does not activate candidates item for applicants cross-route page", () => {
    const isActive = isWorkspaceSubnavItemActive({
      itemKey: "candidates",
      href: "/departments/dept-1/candidates",
      pathname: "/people/candidates/applicants/app-456",
      departmentId: "dept-1",
      workspaceId: "dept-1"
    });

    expect(isActive).toBe(false);
  });
});
