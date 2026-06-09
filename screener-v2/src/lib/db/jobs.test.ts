import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./prisma", () => ({
  prisma: {
    jobPosting: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    candidateApplication: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn()
    }
  }
}));

vi.mock("@/lib/db/candidates", () => ({
  createCandidate: vi.fn(),
  findExistingCandidateByEmail: vi.fn(),
  mapCandidate: vi.fn()
}));

vi.mock("@/lib/tokens/token-service", () => ({
  cuidLike: vi.fn(() => "mock-cuid")
}));

import { mapJobPosting, listPublicJobPostings, listJobPostings } from "./jobs";
import { prisma } from "./prisma";

function makeJobRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "job-1",
    slug: "software-engineer",
    title: "Software Engineer",
    roleId: "role-1",
    screenerPresetId: null,
    summary: "Join our team",
    description: "We are hiring engineers.",
    salaryMin: null,
    salaryMax: null,
    teamSize: null,
    techStack: null,
    remotePolicy: null,
    isPublished: true,
    isOpen: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
    role: { label: "Engineering", department: "Tech" },
    screenerPreset: null,
    applications: [],
    ...overrides
  };
}

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

describe("listPublicJobPostings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.jobPosting.findMany).mockResolvedValue([]);
  });

  it("queries only published and open jobs", async () => {
    await listPublicJobPostings();
    const call = vi.mocked(prisma.jobPosting.findMany).mock.calls[0][0] as any;
    expect(call.where).toMatchObject({ isPublished: true, isOpen: true });
  });

  it("does not return draft or closed jobs", async () => {
    // The DB mock returns an empty array — the where clause is the contract;
    // this test verifies the query never omits the published+open filter.
    await listPublicJobPostings();
    const call = vi.mocked(prisma.jobPosting.findMany).mock.calls[0][0] as any;
    expect(call.where.isPublished).toBe(true);
    expect(call.where.isOpen).toBe(true);
  });

  it("applies search query filter when provided", async () => {
    await listPublicJobPostings({ q: "engineer" });
    const call = vi.mocked(prisma.jobPosting.findMany).mock.calls[0][0] as any;
    expect(call.where.OR).toBeDefined();
    expect(call.where.isPublished).toBe(true);
  });

  it("applies department filter when provided", async () => {
    await listPublicJobPostings({ department: "Tech" });
    const call = vi.mocked(prisma.jobPosting.findMany).mock.calls[0][0] as any;
    expect(call.where.role).toEqual({ department: "Tech" });
    expect(call.where.isPublished).toBe(true);
    expect(call.where.isOpen).toBe(true);
  });

  it("returns mapped job postings from the result set", async () => {
    vi.mocked(prisma.jobPosting.findMany).mockResolvedValue([makeJobRow()] as any);
    const jobs = await listPublicJobPostings();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe("job-1");
    expect(jobs[0].isPublished).toBe(true);
    expect(jobs[0].isOpen).toBe(true);
  });
});

describe("listJobPostings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.jobPosting.findMany).mockResolvedValue([]);
  });

  it("returns all jobs when no departmentId is given (admin/global view)", async () => {
    await listJobPostings();
    const call = vi.mocked(prisma.jobPosting.findMany).mock.calls[0][0] as any;
    expect(call.where).toEqual({});
  });

  it("scopes to the given department when departmentId is provided", async () => {
    await listJobPostings("dept-1");
    const call = vi.mocked(prisma.jobPosting.findMany).mock.calls[0][0] as any;
    expect(call.where).toEqual({ role: { departmentId: "dept-1" } });
  });

  it("does not leak jobs from other departments when scoped", async () => {
    await listJobPostings("dept-1");
    const call = vi.mocked(prisma.jobPosting.findMany).mock.calls[0][0] as any;
    // The where clause must only match the given department
    expect(call.where).toStrictEqual({ role: { departmentId: "dept-1" } });
  });

  it("returns all jobs including unpublished for internal view", async () => {
    vi.mocked(prisma.jobPosting.findMany).mockResolvedValue([
      makeJobRow({ isPublished: false }),
      makeJobRow({ id: "job-2", isPublished: true })
    ] as any);
    const jobs = await listJobPostings();
    expect(jobs).toHaveLength(2);
  });
});
