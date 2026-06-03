import { describe, it, expect } from "vitest";
import { getNavItems, isNavItemActive } from "./nav-config";
import type { AppSession } from "@/lib/auth/session";

describe("nav-config", () => {
  describe("getNavItems", () => {
    it("shows admin Manage Workspaces item when permitted", () => {
      const viewer = { permissions: ["manage_users"], departmentId: "dept-1" } as Pick<AppSession, "permissions" | "departmentId">;
      const items = getNavItems(viewer);
      expect(items.map((item) => item.label)).toEqual([
        "Manage Workspaces",
        "Jobs",
        "Applicants",
        "Candidates",
        "Assessments"
      ]);
      const manageItem = items.find((item) => item.label === "Manage Workspaces");
      expect(manageItem?.href).toBe("/departments");
      expect(manageItem?.section).toBe("Admin");
    });

    it("includes Jobs for authenticated users at /people/candidates/jobs", () => {
      const viewer = { permissions: [], departmentId: null } as Pick<AppSession, "permissions" | "departmentId">;
      const items = getNavItems(viewer);
      const jobsItem = items.find((item) => item.label === "Jobs");
      expect(jobsItem).toBeDefined();
      expect(jobsItem?.href).toBe("/people/candidates/jobs");
    });

    it("hides non-workflow authenticated nav items", () => {
      const viewer = { permissions: ["manage_users"], departmentId: "dept-1" } as Pick<AppSession, "permissions" | "departmentId">;
      const labels = getNavItems(viewer).map((item) => item.label);
      expect(labels).not.toContain("Add-ons");
      expect(labels).not.toContain("Results");
      expect(labels).not.toContain("Live sessions");
      expect(labels).not.toContain("My Department");
    });

    it("department-scoped users see only global items in sidebar (workspace selector handles switching)", () => {
      const viewer = { permissions: [], departmentId: "dept-1" } as Pick<AppSession, "permissions" | "departmentId">;
      const labels = getNavItems(viewer).map((item) => item.label);
      expect(labels).toContain("Jobs");
      expect(labels).toContain("Applicants");
      expect(labels).toContain("Candidates");
      expect(labels).not.toContain("Workspaces");
      expect(labels).not.toContain("Manage Workspaces");
    });

    it("admin users see Manage Workspaces in Admin section", () => {
      const viewer = { permissions: ["manage_users"], departmentId: null } as Pick<AppSession, "permissions" | "departmentId">;
      const items = getNavItems(viewer);
      const manageWorkspacesItem = items.find((item) => item.label === "Manage Workspaces");
      expect(manageWorkspacesItem).toBeDefined();
      expect(manageWorkspacesItem?.href).toBe("/departments");
      expect(manageWorkspacesItem?.section).toBe("Admin");
    });

    it("Manage Workspaces is the first nav item for admins", () => {
      const viewer = { permissions: ["manage_users"], departmentId: "dept-1" } as Pick<AppSession, "permissions" | "departmentId">;
      expect(getNavItems(viewer)[0]?.label).toBe("Manage Workspaces");
    });

    it("Jobs item has 'All hiring' section label", () => {
      const viewer = { permissions: ["manage_users"], departmentId: "dept-1" } as Pick<AppSession, "permissions" | "departmentId">;
      const jobsItem = getNavItems(viewer).find((item) => item.label === "Jobs");
      expect(jobsItem?.section).toBe("All hiring");
    });

    it("includes Careers for unauthenticated users at /jobs", () => {
      const items = getNavItems(null);
      const careersItem = items.find((item) => item.label === "Careers");
      expect(careersItem).toBeDefined();
      expect(careersItem?.href).toBe("/jobs");
    });

    it("does not include Live sessions for unauthenticated users", () => {
      const labels = getNavItems(null).map((item) => item.label);
      expect(labels).not.toContain("Live sessions");
    });

    it("does not include internal Jobs for unauthenticated users", () => {
      const items = getNavItems(null);
      const jobsItem = items.find((item) => item.label === "Jobs");
      expect(jobsItem).toBeUndefined();
    });
  });

  describe("isNavItemActive", () => {
    it("marks /people/candidates/jobs as active for Jobs item", () => {
      expect(isNavItemActive("/people/candidates/jobs", "/people/candidates/jobs")).toBe(true);
    });

    it("marks /people/candidates/jobs/new as active for Jobs item", () => {
      expect(isNavItemActive("/people/candidates/jobs/new", "/people/candidates/jobs")).toBe(true);
    });

    it("marks /people/candidates/jobs/[id] as active for Jobs item", () => {
      expect(isNavItemActive("/people/candidates/jobs/123", "/people/candidates/jobs")).toBe(true);
    });

    it("marks Applicants routes active for Applicants only", () => {
      expect(isNavItemActive("/people/candidates/applicants", "/people/candidates/applicants")).toBe(true);
      expect(isNavItemActive("/people/candidates/applicants/123", "/people/candidates/applicants")).toBe(true);
      expect(isNavItemActive("/people/candidates/applicants", "/people/candidates/jobs")).toBe(false);
      expect(isNavItemActive("/people/candidates/applicants", "/people/candidates")).toBe(false);
    });

    it("marks Jobs routes active for Jobs only", () => {
      expect(isNavItemActive("/people/candidates/jobs", "/people/candidates/jobs")).toBe(true);
      expect(isNavItemActive("/people/candidates/jobs/new", "/people/candidates/jobs")).toBe(true);
      expect(isNavItemActive("/people/candidates", "/people/candidates/jobs")).toBe(false);
      expect(isNavItemActive("/people/candidates/jobs", "/people/candidates")).toBe(false);
      expect(isNavItemActive("/people/candidates/jobs", "/people/candidates/applicants")).toBe(false);
    });

    it("marks Candidates route active for Candidates only", () => {
      expect(isNavItemActive("/people/candidates", "/people/candidates")).toBe(true);
      expect(isNavItemActive("/people/candidates", "/people/candidates/jobs")).toBe(false);
      expect(isNavItemActive("/people/candidates", "/people/candidates/applicants")).toBe(false);
    });

    it("marks /assessments as active for Assessments item", () => {
      expect(isNavItemActive("/assessments", "/assessments")).toBe(true);
    });

    it("marks /departments as active for Manage Workspaces item", () => {
      expect(isNavItemActive("/departments", "/departments")).toBe(true);
    });

    it("does not mark department workspace detail routes active for Manage Workspaces item", () => {
      expect(isNavItemActive("/departments/dept-1/users", "/departments")).toBe(false);
      expect(isNavItemActive("/departments/dept-1/jobs", "/departments")).toBe(false);
      expect(isNavItemActive("/departments/dept-1", "/departments")).toBe(false);
    });

    it("marks /jobs as active for public Careers item", () => {
      expect(isNavItemActive("/jobs", "/jobs")).toBe(true);
    });

    it("does not mark /jobs/[slug] as active for Careers item when /jobs/[slug] is a detail page", () => {
      // Public career pages are at /jobs/[slug], and /jobs is the careers list
      // The public jobs detail page should not activate /jobs nav item
      expect(isNavItemActive("/jobs/123", "/jobs")).toBe(false);
    });

    it("does not confuse public Careers with internal Jobs", () => {
      expect(isNavItemActive("/jobs", "/people/candidates/jobs")).toBe(false);
      expect(isNavItemActive("/people/candidates/jobs", "/jobs")).toBe(false);
    });
  });
});
