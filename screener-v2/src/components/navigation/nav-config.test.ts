import { describe, it, expect } from "vitest";
import { getNavItems, isNavItemActive } from "./nav-config";
import type { AppSession } from "@/lib/auth/session";

describe("nav-config", () => {
  describe("getNavItems", () => {
    it("full admin workspace shows workspaces, integrations, and global hiring items", () => {
      const viewer = {
        permissions: ["manage_users", "manage_integrations"],
        departmentId: null
      } as Pick<AppSession, "permissions" | "departmentId">;
      const items = getNavItems(viewer, "admin");
      const labels = items.map((item) => item.label);
      expect(labels).toContain("Workspaces");
      expect(labels).toContain("Integrations");
      expect(labels).toContain("All Jobs");
      expect(labels).toContain("All Applicants");
      expect(labels).toContain("All Candidates");
    });

    it("integrations-only admin workspace shows App Integrations without user-management items", () => {
      const viewer = {
        permissions: ["manage_integrations"],
        departmentId: null
      } as Pick<AppSession, "permissions" | "departmentId">;

      const labels = getNavItems(viewer, "admin").map((item) => item.label);

      expect(labels).toContain("Integrations");
      expect(labels).not.toContain("Workspaces");
      expect(labels).not.toContain("Users");
      expect(labels).not.toContain("All Jobs");
    });

    it("department workspace returns empty items (WorkspaceSubnav is sole source)", () => {
      const viewer = { permissions: [], departmentId: "dept-1" } as Pick<AppSession, "permissions" | "departmentId">;
      const items = getNavItems(viewer, "dept-1");
      expect(items).toEqual([]);
    });

    it("hides non-workflow authenticated nav items", () => {
      const viewer = { permissions: ["manage_users"], departmentId: "dept-1" } as Pick<AppSession, "permissions" | "departmentId">;
      const labels = getNavItems(viewer, "admin").map((item) => item.label);
      expect(labels).not.toContain("Add-ons");
      expect(labels).not.toContain("Results");
      expect(labels).not.toContain("Live sessions");
      expect(labels).not.toContain("My Department");
    });

    it("admin workspace Jobs item says 'All Jobs'", () => {
      const viewer = { permissions: ["manage_users"], departmentId: null } as Pick<AppSession, "permissions" | "departmentId">;
      const items = getNavItems(viewer, "admin");
      const jobsItem = items.find((item) => item.label === "All Jobs");
      expect(jobsItem).toBeDefined();
      expect(jobsItem?.section).toBe("All hiring");
    });

    it("department workspace has no global items", () => {
      const viewer = { permissions: [], departmentId: "dept-1" } as Pick<AppSession, "permissions" | "departmentId">;
      const items = getNavItems(viewer, "dept-1");
      const labels = items.map((item) => item.label);
      expect(labels).not.toContain("All Jobs");
      expect(labels).not.toContain("All Candidates");
      expect(labels).not.toContain("Workspaces");
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

    it("marks /addons and /results as active for Assessments item", () => {
      expect(isNavItemActive("/addons", "/assessments")).toBe(true);
      expect(isNavItemActive("/results", "/assessments")).toBe(true);
      expect(isNavItemActive("/results/attempt-1", "/assessments")).toBe(true);
    });

    it("marks /departments as active for Manage Workspaces item", () => {
      expect(isNavItemActive("/departments", "/departments")).toBe(true);
    });

    it("marks /integrations routes as active for App Integrations item", () => {
      expect(isNavItemActive("/integrations", "/integrations")).toBe(true);
      expect(isNavItemActive("/integrations/providers", "/integrations")).toBe(true);
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
