import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./prisma", () => ({
  prisma: {
    candidateApplication: {
      findMany: vi.fn(),
      count: vi.fn()
    },
    jobPosting: {
      findMany: vi.fn()
    }
  }
}));

vi.mock("@/lib/db/candidates", () => ({
  createCandidate: vi.fn(),
  findExistingCandidateByEmail: vi.fn(),
  mapCandidate: vi.fn()
}));

import { listApplicantWorkspacePage } from "./jobs";
import { prisma } from "./prisma";

function applicantRow(overrides: Partial<{
  id: string;
  candidateId: string;
  status: string;
  coverNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  candidate: {
    id: string;
    fullName: string;
    email: string;
    hrOwner: string | null;
    _count: { resumes: number };
  };
  jobPosting: {
    id: string;
    slug: string;
    title: string;
    role: { label: string; department: string | null } | null;
  };
}> = {}) {
  return {
    id: "app-1",
    candidateId: "cand-1",
    status: "submitted",
    coverNote: null,
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    updatedAt: new Date("2026-06-02T00:00:00.000Z"),
    candidate: {
      id: "cand-1",
      fullName: "Alice Applicant",
      email: "alice@example.com",
      hrOwner: "owner-1",
      _count: { resumes: 1 }
    },
    jobPosting: {
      id: "job-1",
      slug: "rpa-engineer",
      title: "RPA Engineer",
      role: { label: "RPA Engineer", department: "Automation" }
    },
    ...overrides
  };
}

describe("listApplicantWorkspacePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies bounded DB-side pagination and selects only list fields", async () => {
    vi.mocked(prisma.candidateApplication.count)
      .mockResolvedValueOnce(400 as never)
      .mockResolvedValueOnce(18 as never)
      .mockResolvedValueOnce(140 as never)
      .mockResolvedValueOnce(120 as never);
    vi.mocked(prisma.candidateApplication.findMany).mockResolvedValue([
      applicantRow()
    ] as never);
    vi.mocked(prisma.jobPosting.findMany).mockResolvedValue([
      { id: "job-1", title: "RPA Engineer" }
    ] as never);

    const page = await listApplicantWorkspacePage({ page: 4, pageSize: 999 });

    const args = vi.mocked(prisma.candidateApplication.findMany).mock.calls[0]?.[0] as any;
    expect(args?.skip).toBe(150);
    expect(args?.take).toBe(50);
    expect(args?.include).toBeUndefined();
    expect(args?.select).toMatchObject({
      id: true,
      candidateId: true,
      status: true,
      coverNote: true,
      createdAt: true,
      updatedAt: true,
      candidate: {
        select: {
          id: true,
          fullName: true,
          email: true,
          hrOwner: true,
          _count: {
            select: {
              resumes: true
            }
          }
        }
      },
      jobPosting: {
        select: {
          id: true,
          slug: true,
          title: true,
          role: {
            select: {
              label: true,
              department: true
            }
          }
        }
      }
    });
    expect(args?.select?.candidate?.select).not.toHaveProperty("resumes");
    expect(args?.select?.jobPosting?.select).not.toHaveProperty("description");
    expect(page.page).toBe(4);
    expect(page.pageSize).toBe(50);
    expect(page.total).toBe(400);
  });

  it("applies department, job, status, and search filters DB-side", async () => {
    vi.mocked(prisma.candidateApplication.count)
      .mockResolvedValueOnce(3 as never)
      .mockResolvedValueOnce(1 as never)
      .mockResolvedValueOnce(0 as never)
      .mockResolvedValueOnce(0 as never);
    vi.mocked(prisma.candidateApplication.findMany).mockResolvedValue([
      applicantRow({ status: "closed" })
    ] as never);
    vi.mocked(prisma.jobPosting.findMany).mockResolvedValue([
      { id: "job-9", title: "Operations Analyst" }
    ] as never);

    await listApplicantWorkspacePage({
      q: " Alice ",
      jobId: "job-9",
      status: "closed",
      departmentId: "dept-1"
    });

    const countWhere = vi.mocked(prisma.candidateApplication.count).mock.calls[0]?.[0]?.where as any;
    const rowsWhere = vi.mocked(prisma.candidateApplication.findMany).mock.calls[0]?.[0]?.where as any;

    expect(rowsWhere).toEqual(countWhere);
    expect(rowsWhere).toMatchObject({
      jobPostingId: "job-9",
      status: "closed",
      jobPosting: {
        role: {
          departmentId: "dept-1"
        }
      }
    });
    expect(rowsWhere.OR).toHaveLength(5);
    expect(rowsWhere.OR).toEqual(
      expect.arrayContaining([
        { candidate: { fullName: { contains: "Alice", mode: "insensitive" } } },
        { candidate: { email: { contains: "Alice", mode: "insensitive" } } },
        { candidate: { hrOwner: { contains: "Alice", mode: "insensitive" } } },
        { jobPosting: { title: { contains: "Alice", mode: "insensitive" } } },
        { jobPosting: { role: { label: { contains: "Alice", mode: "insensitive" } } } }
      ])
    );
    expect(vi.mocked(prisma.jobPosting.findMany)).toHaveBeenCalledWith({
      where: {
        role: {
          departmentId: "dept-1"
        }
      },
      select: { id: true, title: true },
      orderBy: [{ title: "asc" }]
    });
  });

  it("returns totals and summaries from DB counts instead of JS counting", async () => {
    vi.mocked(prisma.candidateApplication.count)
      .mockResolvedValueOnce(25 as never)
      .mockResolvedValueOnce(6 as never)
      .mockResolvedValueOnce(10 as never)
      .mockResolvedValueOnce(9 as never);
    vi.mocked(prisma.candidateApplication.findMany).mockResolvedValue([
      applicantRow()
    ] as never);
    vi.mocked(prisma.jobPosting.findMany).mockResolvedValue([] as never);

    const page = await listApplicantWorkspacePage();

    expect(vi.mocked(prisma.candidateApplication.count)).toHaveBeenCalledTimes(4);
    expect(page.total).toBe(25);
    expect(page.summary).toEqual({
      total: 25,
      resumeMissing: 6,
      submitted: 10,
      underReview: 9
    });
  });

  it("supports the missing resume workspace filter in the base where clause", async () => {
    vi.mocked(prisma.candidateApplication.count)
      .mockResolvedValueOnce(2 as never)
      .mockResolvedValueOnce(2 as never)
      .mockResolvedValueOnce(1 as never)
      .mockResolvedValueOnce(1 as never);
    vi.mocked(prisma.candidateApplication.findMany).mockResolvedValue([
      applicantRow({
        candidate: {
          id: "cand-2",
          fullName: "Resume Missing",
          email: "missing@example.com",
          hrOwner: null,
          _count: { resumes: 0 }
        }
      })
    ] as never);
    vi.mocked(prisma.jobPosting.findMany).mockResolvedValue([] as never);

    await listApplicantWorkspacePage({ resumeMissing: true });

    const where = vi.mocked(prisma.candidateApplication.findMany).mock.calls[0]?.[0]?.where as any;
    expect(where).toMatchObject({
      candidate: {
        resumes: {
          none: {}
        }
      }
    });
  });
});
