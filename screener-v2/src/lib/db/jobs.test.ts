import { describe, it, expect } from "vitest";
import { mapJobPosting } from "./jobs";

describe("jobs mapper", () => {
  describe("mapJobPosting", () => {
    it("includes salary, team, and remote metadata fields", () => {
      const row = {
        id: "job-1",
        slug: "engineer",
        title: "Software Engineer",
        roleId: "role-1",
        screenerPresetId: "preset-1",
        summary: "Join our team",
        description: "We are hiring",
        salaryMin: 100000,
        salaryMax: 150000,
        teamSize: 5,
        techStack: "TypeScript, React",
        remotePolicy: "Hybrid",
        isPublished: true,
        isOpen: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
        role: { label: "Engineering", department: "Tech" },
        screenerPreset: { id: "preset-1", label: "Technical Assessment" },
        applications: []
      };

      const result = mapJobPosting(row as any);

      expect(result).toEqual(
        expect.objectContaining({
          id: "job-1",
          slug: "engineer",
          title: "Software Engineer",
          salaryMin: 100000,
          salaryMax: 150000,
          teamSize: 5,
          techStack: "TypeScript, React",
          remotePolicy: "Hybrid",
          roleLabel: "Engineering",
          roleDepartment: "Tech",
          screenerPresetLabel: "Technical Assessment",
          applicantCount: 0
        })
      );
    });

    it("omits metadata fields when null", () => {
      const row = {
        id: "job-1",
        slug: "designer",
        title: "Product Designer",
        roleId: null,
        screenerPresetId: null,
        summary: "Design role",
        description: "Design our product",
        salaryMin: null,
        salaryMax: null,
        teamSize: null,
        techStack: null,
        remotePolicy: null,
        isPublished: true,
        isOpen: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
        role: null,
        screenerPreset: null,
        applications: []
      };

      const result = mapJobPosting(row as any);

      expect(result.salaryMin).toBeUndefined();
      expect(result.salaryMax).toBeUndefined();
      expect(result.teamSize).toBeUndefined();
      expect(result.techStack).toBeUndefined();
      expect(result.remotePolicy).toBeUndefined();
      expect(result.roleId).toBeUndefined();
      expect(result.screenerPresetId).toBeUndefined();
    });
  });
});
