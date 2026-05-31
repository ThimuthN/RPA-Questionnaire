import { describe, it, expect } from "vitest";
import { getNavItems, isNavItemActive } from "./nav-config";
import type { AppSession } from "@/lib/auth/session";

describe("nav-config", () => {
  describe("getNavItems", () => {
    it("includes Jobs for authenticated users at /people/candidates/jobs", () => {
      const viewer = { permissions: [], departmentId: null } as Pick<AppSession, "permissions" | "departmentId">;
      const items = getNavItems(viewer);
      const jobsItem = items.find((item) => item.label === "Jobs");
      expect(jobsItem).toBeDefined();
      expect(jobsItem?.href).toBe("/people/candidates/jobs");
    });

    it("includes Careers for unauthenticated users at /jobs", () => {
      const items = getNavItems(null);
      const careersItem = items.find((item) => item.label === "Careers");
      expect(careersItem).toBeDefined();
      expect(careersItem?.href).toBe("/jobs");
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

    it("marks /people/candidates/applicants as active for Jobs item", () => {
      expect(isNavItemActive("/people/candidates/applicants", "/people/candidates/jobs")).toBe(true);
    });

    it("does not mark /people/candidates as active for Jobs item", () => {
      expect(isNavItemActive("/people/candidates", "/people/candidates/jobs")).toBe(false);
    });

    it("marks /jobs as active for public Careers item", () => {
      expect(isNavItemActive("/jobs", "/jobs")).toBe(true);
    });

    it("does not mark /jobs/[slug] as active for Careers item when /jobs/[slug] is a detail page", () => {
      // Public career pages are at /jobs/[slug], and /jobs is the careers list
      // The public jobs detail page should not activate /jobs nav item
      expect(isNavItemActive("/jobs/123", "/jobs")).toBe(false);
    });
  });
});
