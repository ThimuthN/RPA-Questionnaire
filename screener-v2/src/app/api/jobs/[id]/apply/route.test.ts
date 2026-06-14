import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@vercel/blob", () => ({
  del: vi.fn(),
  put: vi.fn()
}));

vi.mock("@/lib/candidates/resume-storage", () => ({
  assertCandidateResumeMimeType: vi.fn(),
  assertCandidateResumeSize: vi.fn(),
  persistCandidateResumeUpload: vi.fn()
}));

vi.mock("@/lib/candidates/resume-config", () => ({
  normalizeResumeFileName: vi.fn((value: string) => value)
}));

vi.mock("@/lib/db/jobs", () => ({
  beginPublicApplicationScreeningFlow: vi.fn(),
  createCandidateApplicationFromPublicSubmission: vi.fn(),
  publicApplicationScreeningSlug: vi.fn()
}));

vi.mock("@/lib/auth/runtime-session", () => ({
  createRuntimeSessionToken: vi.fn(),
  setRuntimeSessionCookie: vi.fn()
}));

vi.mock("@/lib/jobs/public-access", () => ({
  PUBLIC_JOBS_ENABLED: true
}));

vi.mock("@/lib/email", () => ({
  sendEmailSafe: vi.fn(),
  applicationReceivedEmail: vi.fn(),
  getOrgName: vi.fn()
}));

import { POST } from "./route";
import {
  beginPublicApplicationScreeningFlow,
  createCandidateApplicationFromPublicSubmission,
  publicApplicationScreeningSlug
} from "@/lib/db/jobs";
import {
  createRuntimeSessionToken,
  setRuntimeSessionCookie
} from "@/lib/auth/runtime-session";
import {
  applicationReceivedEmail,
  getOrgName,
  sendEmailSafe
} from "@/lib/email";

describe("POST /api/jobs/[id]/apply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrgName).mockReturnValue("Northstar");
    vi.mocked(applicationReceivedEmail).mockReturnValue({
      subject: "We received your application",
      html: "<p>Received</p>"
    });
  });

  it("sends application confirmation before redirecting screening-required submissions", async () => {
    vi.mocked(createCandidateApplicationFromPublicSubmission).mockResolvedValue({
      status: "created",
      candidateId: "cand-1",
      applicationId: "app-1",
      jobId: "job-1",
      jobTitle: "RPA Engineer",
      screenerPreset: null,
      requiresScreening: true
    });
    vi.mocked(beginPublicApplicationScreeningFlow).mockResolvedValue({
      applicationId: "app-1",
      attemptId: "attempt-1",
      jobSlug: "rpa-engineer",
      runtimeSlug: "application-screening-app-1"
    });
    vi.mocked(publicApplicationScreeningSlug).mockReturnValue("application-screening-app-1");
    vi.mocked(createRuntimeSessionToken).mockResolvedValue("runtime-token");

    const formData = new FormData();
    formData.set("fullName", "Alice Applicant");
    formData.set("email", "alice@example.com");
    formData.set("phone", "+1 555 0100");
    formData.set("coverNote", "Interested in the role.");
    formData.set("consentGiven", "on");

    const response = await POST(
      new Request("http://localhost/api/jobs/rpa-engineer/apply", {
        method: "POST",
        body: formData
      }),
      { params: Promise.resolve({ id: "rpa-engineer" }) }
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost/jobs/rpa-engineer/apply/screening/app-1"
    );
    expect(vi.mocked(sendEmailSafe)).toHaveBeenCalledWith({
      to: "alice@example.com",
      subject: "We received your application",
      html: "<p>Received</p>",
      template: "application_received",
      candidateId: "cand-1"
    });
    expect(vi.mocked(createRuntimeSessionToken)).toHaveBeenCalledWith({
      attemptId: "attempt-1",
      slug: "application-screening-app-1"
    });
    expect(vi.mocked(setRuntimeSessionCookie)).toHaveBeenCalledTimes(1);
  });
});
