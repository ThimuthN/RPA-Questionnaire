import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn(),
  requirePermissionForDepartment: vi.fn()
}));

vi.mock("@/lib/db/candidates", () => ({
  updateCandidate: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    candidate: {
      findUnique: vi.fn()
    },
    roleCatalog: {
      findUnique: vi.fn()
    },
    department: {
      findUnique: vi.fn()
    },
    user: {
      findUnique: vi.fn()
    }
  }
}));

import { POST } from "./route";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { updateCandidate } from "@/lib/db/candidates";
import { prisma } from "@/lib/db/prisma";

describe("/api/candidates/[id] POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: {
        userId: "user-1",
        email: "user@example.com",
        name: "User",
        permissions: ["manage_candidates"]
      }
    } as never);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as never);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue({
      stage: "pipeline",
      nextAction: "review_result",
      departmentId: "dept-1",
      roleId: "role-1",
      orgStage: "active"
    } as never);
  });

  it("returns JSON success for in-page profile edits", async () => {
    const formData = new FormData();
    formData.set("fullName", "Jane Doe");
    formData.set("email", "jane@example.com");

    const response = await POST(
      new Request("http://localhost/api/candidates/cand-1", {
        method: "POST",
        headers: {
          Accept: "application/json"
        },
        body: formData
      }),
      {
        params: Promise.resolve({ id: "cand-1" })
      }
    );

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(vi.mocked(updateCandidate)).toHaveBeenCalledWith(
      "cand-1",
      expect.objectContaining({
        fullName: "Jane Doe",
        email: "jane@example.com",
        actorId: "user-1"
      })
    );
  });

  it("returns JSON errors for in-page profile edit validation failures", async () => {
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue({
      stage: "pipeline",
      nextAction: "review_result",
      departmentId: "dept-1",
      roleId: "role-1",
      orgStage: "finalized"
    } as never);

    const formData = new FormData();
    formData.set("fullName", "Jane Doe");
    formData.set("email", "jane@example.com");

    const response = await POST(
      new Request("http://localhost/api/candidates/cand-1", {
        method: "POST",
        headers: {
          Accept: "application/json"
        },
        body: formData
      }),
      {
        params: Promise.resolve({ id: "cand-1" })
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: "Finalized candidates must be reverted before editing."
    });
  });

  it("rejects protocol-relative returnTo values for form redirects", async () => {
    vi.mocked(updateCandidate).mockResolvedValue(undefined as never);

    const formData = new FormData();
    formData.set("fullName", "Jane Doe");
    formData.set("email", "jane@example.com");
    formData.set("returnTo", "//evil.example/phish");

    const response = await POST(
      new Request("http://localhost/api/candidates/cand-1", {
        method: "POST",
        body: formData
      }),
      {
        params: Promise.resolve({ id: "cand-1" })
      }
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/people/candidates/cand-1?updated=1");
  });
});
