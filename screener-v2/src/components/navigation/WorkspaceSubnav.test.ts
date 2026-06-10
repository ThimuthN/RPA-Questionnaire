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
});
