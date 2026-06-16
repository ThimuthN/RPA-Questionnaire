import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn(),
  requirePermissionForDepartment: vi.fn(),
}));

vi.mock("@/lib/auth/permission-evaluator", () => ({
  isSystemAdmin: vi.fn(),
  hasGlobalPermission: vi.fn(),
}));

vi.mock("@/lib/auth/app-auth", () => ({
  createAppUser: vi.fn(),
}));

vi.mock("@/lib/auth/user-tokens", () => ({
  issueUserAuthToken: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendEmailSafe: vi.fn(),
  userInviteEmail: vi.fn(),
  getOrgName: vi.fn(),
  getAppUrl: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/access-roles", () => ({
  validateAssignableAccessRole: vi.fn(),
}));

vi.mock("@/lib/server/logger", () => ({
  logError: vi.fn(),
}));

import { POST } from "./route";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { isSystemAdmin, hasGlobalPermission } from "@/lib/auth/permission-evaluator";
import { createAppUser } from "@/lib/auth/app-auth";
import { issueUserAuthToken } from "@/lib/auth/user-tokens";
import { sendEmailSafe, userInviteEmail, getOrgName, getAppUrl } from "@/lib/email";
import { prisma } from "@/lib/db/prisma";
import { validateAssignableAccessRole } from "@/lib/auth/access-roles";

const ADMIN_SESSION = {
  ok: true,
  session: {
    userId: "user-admin-1",
    email: "admin@example.com",
    name: "Admin User",
    permissions: ["manage_users"],
  },
} as const;

const UNAUTH_RESPONSE = new Response(JSON.stringify({ ok: false, message: "Unauthorized" }), {
  status: 401,
});

const TOKEN_RESULT = {
  rawToken: "raw-token-abc123",
  expiresAt: new Date("2026-07-01T00:00:00.000Z"),
};

function makePostRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/users/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/users/invite - happy path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(true);
    vi.mocked(hasGlobalPermission).mockResolvedValue(true);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(createAppUser).mockResolvedValue({ id: "new-user-1", name: "Jane Doe" } as never);
    vi.mocked(issueUserAuthToken).mockResolvedValue(TOKEN_RESULT as never);
    vi.mocked(getAppUrl).mockReturnValue("https://app.example.com");
    vi.mocked(getOrgName).mockReturnValue("Acme Corp");
    vi.mocked(userInviteEmail).mockReturnValue({
      subject: "You've been invited",
      html: "<p>Join us</p>",
    } as never);
    vi.mocked(sendEmailSafe).mockResolvedValue(undefined as never);
    vi.mocked(validateAssignableAccessRole).mockResolvedValue({ ok: true } as never);
  });

  it("invites a new user and returns acceptUrl, userId, email, expiresAt", async () => {
    const response = await POST(
      makePostRequest({ email: "jane@example.com", name: "Jane Doe" })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.userId).toBe("new-user-1");
    expect(data.email).toBe("jane@example.com");
    expect(data.acceptUrl).toBe("https://app.example.com/invite/raw-token-abc123");
    expect(data.expiresAt).toBeDefined();
  });

  it("creates a new app user when no existing record is found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await POST(makePostRequest({ email: "newuser@example.com", name: "New User" }));

    expect(createAppUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "newuser@example.com",
        name: "New User",
        actorId: "user-admin-1",
        actorEmail: "admin@example.com",
      })
    );
  });

  it("normalises email to lowercase before lookup and creation", async () => {
    await POST(makePostRequest({ email: "Jane@EXAMPLE.COM" }));

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "jane@example.com" } })
    );
  });

  it("issues token with purpose 'invite' and correct userId", async () => {
    await POST(makePostRequest({ email: "jane@example.com" }));

    expect(issueUserAuthToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "new-user-1",
        purpose: "invite",
        createdById: "user-admin-1",
      })
    );
  });

  it("builds acceptUrl from getAppUrl + rawToken", async () => {
    vi.mocked(getAppUrl).mockReturnValue("https://custom.app.io");
    vi.mocked(issueUserAuthToken).mockResolvedValue({
      rawToken: "tok-xyz",
      expiresAt: new Date(),
    } as never);

    const response = await POST(makePostRequest({ email: "someone@example.com" }));
    const data = await response.json();

    expect(data.acceptUrl).toBe("https://custom.app.io/invite/tok-xyz");
  });

  it("sends invite email fire-and-forget", async () => {
    await POST(makePostRequest({ email: "jane@example.com", name: "Jane" }));

    expect(sendEmailSafe).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "jane@example.com",
        template: "user_invite",
      })
    );
  });
});

describe("POST /api/users/invite - re-invite pending user", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(true);
    vi.mocked(hasGlobalPermission).mockResolvedValue(true);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as never);
    vi.mocked(issueUserAuthToken).mockResolvedValue(TOKEN_RESULT as never);
    vi.mocked(getAppUrl).mockReturnValue("https://app.example.com");
    vi.mocked(getOrgName).mockReturnValue("Acme Corp");
    vi.mocked(userInviteEmail).mockReturnValue({ subject: "Invite", html: "" } as never);
    vi.mocked(sendEmailSafe).mockResolvedValue(undefined as never);
    vi.mocked(validateAssignableAccessRole).mockResolvedValue({ ok: true } as never);
  });

  it("re-invites a pending user (null passwordHash) by reissuing token without creating a new user", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "pending-user-1",
      passwordHash: null,
      name: "Pending User",
    } as never);

    const response = await POST(makePostRequest({ email: "pending@example.com" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.userId).toBe("pending-user-1");
    expect(createAppUser).not.toHaveBeenCalled();
    expect(issueUserAuthToken).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "pending-user-1", purpose: "invite" })
    );
  });

  it("returns the new acceptUrl when re-inviting a pending user", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "pending-user-1",
      passwordHash: null,
      name: "Pending",
    } as never);
    vi.mocked(issueUserAuthToken).mockResolvedValue({
      rawToken: "new-token-456",
      expiresAt: new Date("2026-08-01T00:00:00.000Z"),
    } as never);

    const response = await POST(makePostRequest({ email: "pending@example.com" }));
    const data = await response.json();

    expect(data.acceptUrl).toBe("https://app.example.com/invite/new-token-456");
  });
});

describe("POST /api/users/invite - 409 active member", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(true);
    vi.mocked(hasGlobalPermission).mockResolvedValue(true);
  });

  it("returns 409 when user already has a passwordHash (active member)", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "active-user-1",
      passwordHash: "$argon2id$v=19$hashed",
      name: "Active User",
    } as never);

    const response = await POST(makePostRequest({ email: "active@example.com" }));
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.ok).toBe(false);
    expect(data.message).toBe("That email already belongs to an active member.");
    expect(createAppUser).not.toHaveBeenCalled();
    expect(issueUserAuthToken).not.toHaveBeenCalled();
  });
});

describe("POST /api/users/invite - authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: false,
      response: UNAUTH_RESPONSE,
    } as never);

    const response = await POST(makePostRequest({ email: "someone@example.com" }));

    expect(response.status).toBe(401);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns 403 when inviting unassigned user without global manage_users", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: { userId: "dept-manager-1", email: "mgr@example.com", permissions: [] },
    } as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(false);
    vi.mocked(hasGlobalPermission).mockResolvedValue(false);

    // No departmentId means unassigned — requires global manage_users
    const response = await POST(makePostRequest({ email: "someone@example.com" }));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.ok).toBe(false);
    expect(data.message).toBe("Inviting an unassigned user requires global manage_users.");
    expect(createAppUser).not.toHaveBeenCalled();
  });

  it("allows department-scoped invite when requirePermissionForDepartment succeeds", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: { userId: "dept-mgr-1", email: "mgr@example.com", permissions: [] },
    } as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(false);
    vi.mocked(hasGlobalPermission).mockResolvedValue(false);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(createAppUser).mockResolvedValue({ id: "new-user-2", name: null } as never);
    vi.mocked(issueUserAuthToken).mockResolvedValue(TOKEN_RESULT as never);
    vi.mocked(getAppUrl).mockReturnValue("https://app.example.com");
    vi.mocked(getOrgName).mockReturnValue("Acme");
    vi.mocked(userInviteEmail).mockReturnValue({ subject: "Invite", html: "" } as never);
    vi.mocked(sendEmailSafe).mockResolvedValue(undefined as never);
    vi.mocked(validateAssignableAccessRole).mockResolvedValue({ ok: true } as never);

    const response = await POST(
      makePostRequest({ email: "new@example.com", departmentId: "dept-1" })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(requirePermissionForDepartment).toHaveBeenCalledWith(
      expect.anything(),
      "manage_users",
      "dept-1"
    );
  });

  it("returns 403 when department-scoped invite fails permission check", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: { userId: "other-mgr", email: "other@example.com", permissions: [] },
    } as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(false);
    vi.mocked(hasGlobalPermission).mockResolvedValue(false);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ ok: false, message: "Forbidden" }), { status: 403 }),
    } as never);

    const response = await POST(
      makePostRequest({ email: "someone@example.com", departmentId: "dept-99" })
    );

    expect(response.status).toBe(403);
  });

  it("uses permissionDepartmentId over departmentId for authorization when both provided", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: { userId: "mgr-1", email: "mgr@example.com", permissions: [] },
    } as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(false);
    vi.mocked(hasGlobalPermission).mockResolvedValue(false);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(createAppUser).mockResolvedValue({ id: "u1", name: null } as never);
    vi.mocked(issueUserAuthToken).mockResolvedValue(TOKEN_RESULT as never);
    vi.mocked(getAppUrl).mockReturnValue("https://app.example.com");
    vi.mocked(getOrgName).mockReturnValue("Acme");
    vi.mocked(userInviteEmail).mockReturnValue({ subject: "Invite", html: "" } as never);
    vi.mocked(sendEmailSafe).mockResolvedValue(undefined as never);
    vi.mocked(validateAssignableAccessRole).mockResolvedValue({ ok: true } as never);

    await POST(
      makePostRequest({
        email: "person@example.com",
        departmentId: "dept-1",
        permissionDepartmentId: "dept-2",
      })
    );

    expect(requirePermissionForDepartment).toHaveBeenCalledWith(
      expect.anything(),
      "manage_users",
      "dept-2"
    );
  });
});

describe("POST /api/users/invite - email send failure is fire-and-forget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(true);
    vi.mocked(hasGlobalPermission).mockResolvedValue(true);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(createAppUser).mockResolvedValue({ id: "new-user-1", name: "Jane" } as never);
    vi.mocked(issueUserAuthToken).mockResolvedValue(TOKEN_RESULT as never);
    vi.mocked(getAppUrl).mockReturnValue("https://app.example.com");
    vi.mocked(getOrgName).mockReturnValue("Acme Corp");
    vi.mocked(userInviteEmail).mockReturnValue({ subject: "Invite", html: "" } as never);
    vi.mocked(validateAssignableAccessRole).mockResolvedValue({ ok: true } as never);
  });

  it("still returns 200 and acceptUrl when email sending fails", async () => {
    vi.mocked(sendEmailSafe).mockRejectedValue(new Error("SMTP timeout"));

    const response = await POST(makePostRequest({ email: "jane@example.com" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.acceptUrl).toBeDefined();
  });

  it("returns 400 when sendEmailSafe throws synchronously before returning a promise", async () => {
    vi.mocked(sendEmailSafe).mockImplementation(() => {
      throw new Error("No SMTP config");
    });

    const response = await POST(makePostRequest({ email: "failmail@example.com" }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.message).toContain("No SMTP config");
  });
});

describe("POST /api/users/invite - role validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(true);
    vi.mocked(hasGlobalPermission).mockResolvedValue(true);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(createAppUser).mockResolvedValue({ id: "new-user-1", name: null } as never);
    vi.mocked(issueUserAuthToken).mockResolvedValue(TOKEN_RESULT as never);
    vi.mocked(getAppUrl).mockReturnValue("https://app.example.com");
    vi.mocked(getOrgName).mockReturnValue("Acme Corp");
    vi.mocked(userInviteEmail).mockReturnValue({ subject: "Invite", html: "" } as never);
    vi.mocked(sendEmailSafe).mockResolvedValue(undefined as never);
  });

  it("validates roleId when provided and proceeds on success", async () => {
    vi.mocked(validateAssignableAccessRole).mockResolvedValue({ ok: true } as never);

    const response = await POST(
      makePostRequest({ email: "roleuser@example.com", roleId: "role-1", departmentId: "dept-1" })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(validateAssignableAccessRole).toHaveBeenCalledWith("role-1", "dept-1", expect.anything());
  });

  it("returns error status when roleId validation fails", async () => {
    vi.mocked(validateAssignableAccessRole).mockResolvedValue({
      ok: false,
      message: "Role is not assignable in this department.",
      status: 403,
    } as never);

    const response = await POST(
      makePostRequest({ email: "roleuser@example.com", roleId: "bad-role", departmentId: "dept-1" })
    );
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.ok).toBe(false);
    expect(data.message).toBe("Role is not assignable in this department.");
    expect(createAppUser).not.toHaveBeenCalled();
  });

  it("skips role validation when no roleId is provided", async () => {
    await POST(makePostRequest({ email: "norole@example.com" }));

    expect(validateAssignableAccessRole).not.toHaveBeenCalled();
  });
});

describe("POST /api/users/invite - Zod validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(true);
    vi.mocked(hasGlobalPermission).mockResolvedValue(true);
  });

  it("returns 400 when email is missing", async () => {
    const response = await POST(makePostRequest({ name: "No Email" }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
  });

  it("returns 400 when email is not a valid email address", async () => {
    const response = await POST(makePostRequest({ email: "not-an-email" }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
  });

  it("returns 400 for completely malformed JSON body", async () => {
    const response = await POST(
      new Request("http://localhost/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ not valid json",
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
  });
});
