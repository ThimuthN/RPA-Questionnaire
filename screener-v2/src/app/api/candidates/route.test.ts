import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn(),
  requirePermissionForDepartment: vi.fn()
}));

vi.mock("@/lib/db/candidates", () => ({
  createCandidate: vi.fn(),
  findExistingCandidateByEmail: vi.fn()
}));

vi.mock("@/lib/server/logger", () => ({
  createRequestLogContext: vi.fn(() => ({ requestId: "req-1" })),
  logRouteError: vi.fn(),
  messageFromError: vi.fn((error: Error) => error.message)
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    roleCatalog: {
      findUnique: vi.fn()
    },
    department: {
      findUnique: vi.fn()
    },
    accessGrant: {
      findMany: vi.fn()
    },
    hiringTeamTemplate: {
      findFirst: vi.fn()
    },
    user: {
      findUnique: vi.fn()
    }
  }
}));

import { POST } from "./route";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { createCandidate } from "@/lib/db/candidates";
import { prisma } from "@/lib/db/prisma";

describe("/api/candidates POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: {
        userId: "user-1",
        permissions: ["manage_candidates"]
      }
    } as never);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as never);
    vi.mocked(prisma.roleCatalog.findUnique).mockResolvedValue({
      id: "role-1",
      departmentId: "dept-1",
      kind: "job_designation"
    } as never);
    vi.mocked(prisma.department.findUnique).mockResolvedValue({ id: "dept-1" } as never);
    vi.mocked(prisma.accessGrant.findMany).mockResolvedValue([
      { userId: "user-1" },
      { userId: "user-2" }
    ] as never);
  });

  it("parses stringified teamUserIds from a form request and redirects to the canonical candidate path", async () => {
    vi.mocked(createCandidate).mockResolvedValue({
      id: "cand-1",
      fullName: "Jane Doe",
      email: "jane@example.com"
    } as never);

    const formData = new FormData();
    formData.set("fullName", "Jane Doe");
    formData.set("email", "jane@example.com");
    formData.set("departmentId", "dept-1");
    formData.set("roleId", "role-1");
    formData.set(
      "teamUserIds",
      JSON.stringify([
        { userId: "user-1", role: "owner" },
        { userId: "user-2", role: "recruiter" }
      ])
    );

    const response = await POST(
      new Request("http://localhost/api/candidates", {
        method: "POST",
        body: formData
      })
    );

    expect(vi.mocked(createCandidate)).toHaveBeenCalledWith(
      expect.objectContaining({
        teamAssignments: [
          { userId: "user-1", role: "owner", source: "manual" },
          { userId: "user-2", role: "recruiter", source: "manual" }
        ],
        createMilestones: false
      })
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/people/candidates/cand-1?created=1");
  });

  it("copies template members with source=template when teamTemplateId is selected", async () => {
    vi.mocked(prisma.hiringTeamTemplate.findFirst).mockResolvedValue({
      id: "template-1",
      members: [
        { userId: "user-1", role: "owner" },
        { userId: "user-2", role: "reviewer" }
      ]
    } as never);
    vi.mocked(createCandidate).mockResolvedValue({
      id: "cand-2",
      fullName: "John Doe",
      email: "john@example.com"
    } as never);

    const response = await POST(
      new Request("http://localhost/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "John Doe",
          email: "john@example.com",
          departmentId: "dept-1",
          roleId: "role-1",
          teamTemplateId: "template-1"
        })
      })
    );

    const data = await response.json();
    expect(vi.mocked(createCandidate)).toHaveBeenCalledWith(
      expect.objectContaining({
        teamAssignments: [
          { userId: "user-1", role: "owner", source: "template", templateId: "template-1" },
          { userId: "user-2", role: "reviewer", source: "template", templateId: "template-1" }
        ]
      })
    );
    expect(data).toEqual({
      ok: true,
      candidate: expect.objectContaining({
        id: "cand-2"
      })
    });
  });
});
