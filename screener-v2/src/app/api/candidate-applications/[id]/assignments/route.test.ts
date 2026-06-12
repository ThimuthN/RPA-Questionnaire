import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn(),
  requirePermissionForDepartment: vi.fn()
}));

vi.mock("@/lib/db/hiring-assignments", () => ({
  applyHiringTeamTemplateToApplication: vi.fn(),
  getApplicationAssignments: vi.fn(),
  setApplicationAssignments: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    candidateApplication: {
      findUnique: vi.fn()
    }
  }
}));

import { GET, PUT } from "./route";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import {
  applyHiringTeamTemplateToApplication,
  getApplicationAssignments,
  setApplicationAssignments
} from "@/lib/db/hiring-assignments";
import { prisma } from "@/lib/db/prisma";

describe("/api/candidate-applications/[id]/assignments", () => {
  const session = { userId: "user-1", email: "user@example.com", permissions: ["manage_candidates"] };
  const deptId = "dept-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies unauthenticated requests", async () => {
    const unauthorized = NextResponse.json({ ok: false }, { status: 401 });
    vi.mocked(requireApiSession).mockResolvedValue({ ok: false, response: unauthorized } as any);

    const response = await GET(
      new Request("http://localhost/api/candidate-applications/app-1/assignments"),
      { params: Promise.resolve({ id: "app-1" }) }
    );

    expect(response.status).toBe(401);
  });

  it("denies users without manage_candidates permission on PUT", async () => {
    const forbidden = NextResponse.json({ ok: false, message: "Not authorized" }, { status: 403 });
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session } as any);
    vi.mocked(prisma.candidateApplication.findUnique).mockResolvedValue({
      id: "app-1",
      candidateId: "cand-1",
      candidate: { departmentId: deptId }
    } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: false, response: forbidden } as any);

    const response = await PUT(
      new Request("http://localhost/api/candidate-applications/app-1/assignments", {
        method: "PUT",
        body: JSON.stringify({
          mode: "add",
          assignments: [{ userId: "user-2", assignmentRole: "recruiter" }]
        })
      }),
      { params: Promise.resolve({ id: "app-1" }) }
    );

    expect(response.status).toBe(403);
    expect(vi.mocked(setApplicationAssignments)).not.toHaveBeenCalled();
  });

  it("allows users with manage_candidates permission", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session } as any);
    vi.mocked(prisma.candidateApplication.findUnique).mockResolvedValue({
      id: "app-1",
      candidateId: "cand-1",
      candidate: { departmentId: deptId }
    } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as any);
    vi.mocked(setApplicationAssignments).mockResolvedValue({ created: 1, updated: 0, primaryRoleConflicts: [] });
    vi.mocked(getApplicationAssignments).mockResolvedValue([
      {
        id: "assign-1",
        user: { id: "user-2", name: "John Doe", email: "john@example.com", departmentId: deptId },
        assignmentRole: "recruiter",
        isPrimary: true,
        active: true,
        assignedAt: new Date(),
        assignedById: "user-1",
        dueAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        applicationId: "app-1",
        userId: "user-2"
      }
    ] as any);

    const response = await PUT(
      new Request("http://localhost/api/candidate-applications/app-1/assignments", {
        method: "PUT",
        body: JSON.stringify({
          mode: "add",
          assignments: [{ userId: "user-2", assignmentRole: "recruiter", isPrimary: true }]
        })
      }),
      { params: Promise.resolve({ id: "app-1" }) }
    );

    expect(response.status).toBe(200);
    expect(vi.mocked(setApplicationAssignments)).toHaveBeenCalled();
  });

  it("applies a hiring team template when requested", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session } as any);
    vi.mocked(prisma.candidateApplication.findUnique).mockResolvedValue({
      id: "app-1",
      candidateId: "cand-1",
      candidate: { departmentId: deptId }
    } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as any);
    vi.mocked(applyHiringTeamTemplateToApplication).mockResolvedValue({
      created: 2,
      updated: 0,
      primaryRoleConflicts: []
    } as any);
    vi.mocked(getApplicationAssignments).mockResolvedValue([] as any);

    const response = await PUT(
      new Request("http://localhost/api/candidate-applications/app-1/assignments", {
        method: "PUT",
        body: JSON.stringify({
          mode: "apply_template",
          templateId: "template-1"
        })
      }),
      { params: Promise.resolve({ id: "app-1" }) }
    );

    expect(response.status).toBe(200);
    expect(vi.mocked(applyHiringTeamTemplateToApplication)).toHaveBeenCalledWith(
      "app-1",
      "template-1",
      "user-1"
    );
    expect(vi.mocked(setApplicationAssignments)).not.toHaveBeenCalled();
  });

  it("returns 404 when application not found", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session } as any);
    vi.mocked(prisma.candidateApplication.findUnique).mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/candidate-applications/app-1/assignments"),
      { params: Promise.resolve({ id: "app-1" }) }
    );

    expect(response.status).toBe(404);
  });
});
