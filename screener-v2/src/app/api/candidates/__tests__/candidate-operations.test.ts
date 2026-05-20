import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { createTestCandidate, createTestUser, createTestRole, createTestDepartment, cleanupTestData, testFetch } from "@/lib/test-utils";

describe("Candidate Operations", () => {
  let testUser: any;
  let testRole: any;
  let testDepartment: any;
  let testCandidate: any;

  beforeAll(async () => {
    testDepartment = await createTestDepartment("Test Dept");
    testRole = await createTestRole("Test Role", testDepartment.id);
    testUser = await createTestUser({ roleId: testRole.id, departmentId: testDepartment.id });
  });

  afterEach(async () => {
    try {
      await cleanupTestData();
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  describe("DELETE /api/candidates/[id]/delete", () => {
    it("should reject delete of hired candidates (stage=finalized with employee)", async () => {
      const candidate = await createTestCandidate({ stage: "finalized" });
      const employee = await prisma.employee.create({
        data: {
          candidateId: candidate.id,
          employeeNumber: "EMP001",
          fullName: candidate.fullName,
          email: candidate.email,
          startDate: new Date()
        }
      });

      const response = await testFetch(`/api/candidates/${candidate.id}/delete`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${testUser.token}` }
      });

      expect(response.status).toBe(303); // Redirect with error
      const candidate_after = await prisma.candidate.findUnique({
        where: { id: candidate.id },
        include: { employee: true }
      });
      expect(candidate_after?.employee).toBeTruthy();
    });

    it("should reject delete of candidate with pending offer", async () => {
      const candidate = await createTestCandidate({ stage: "finalized" });
      await prisma.candidateOffer.create({
        data: {
          candidateId: candidate.id,
          status: "sent"
        }
      });

      const response = await testFetch(`/api/candidates/${candidate.id}/delete`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${testUser.token}` }
      });

      expect(response.status).toBe(303);
      const offer = await prisma.candidateOffer.findUnique({
        where: { candidateId: candidate.id }
      });
      expect(offer).toBeTruthy();
    });

    it("should reject delete of candidate with active interview panels", async () => {
      const candidate = await createTestCandidate({ stage: "interview" });
      const milestone = await prisma.candidateMilestone.create({
        data: {
          candidateId: candidate.id,
          type: "interview",
          title: "Round 1",
          status: "not_started",
          sortOrder: 1,
          mode: "scheduled"
        }
      });
      const panel = await prisma.interviewPanel.create({
        data: {
          candidateId: candidate.id,
          milestoneId: milestone.id,
          roundNumber: 1,
          roundName: "Round 1"
        }
      });

      const response = await testFetch(`/api/candidates/${candidate.id}/delete`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${testUser.token}` }
      });

      expect(response.status).toBe(303);
      const panel_after = await prisma.interviewPanel.findUnique({
        where: { id: panel.id }
      });
      expect(panel_after).toBeTruthy();
    });

    it("should allow delete of pipeline candidate without constraints", async () => {
      const candidate = await createTestCandidate({ stage: "pipeline" });

      const response = await testFetch(`/api/candidates/${candidate.id}/delete`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${testUser.token}` }
      });

      expect(response.status).toBe(303);
      const candidate_after = await prisma.candidate.findUnique({
        where: { id: candidate.id }
      });
      expect(candidate_after).toBeNull();
    });
  });

  describe("POST /api/candidates/[id]/promote", () => {
    it("should reject promote to finalized without passed assessment", async () => {
      const candidate = await createTestCandidate({ stage: "finalized" });

      const response = await testFetch(`/api/candidates/${candidate.id}/promote`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${testUser.token}` }
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("passed assessment");

      const candidate_after = await prisma.candidate.findUnique({
        where: { id: candidate.id }
      });
      expect(candidate_after?.stage).toBe("finalized");
    });

    it("should reject promote to advanced_review without assessment", async () => {
      const candidate = await createTestCandidate({ stage: "interview" });

      const response = await testFetch(`/api/candidates/${candidate.id}/promote`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${testUser.token}` }
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("assessment");
    });

    it("should allow promote with valid stage transition and passed assessment", async () => {
      const candidate = await createTestCandidate({ stage: "finalized" });

      // Create assessment with passed result
      const participant = await prisma.participant.create({
        data: {
          kind: "candidate",
          fullName: candidate.fullName,
          email: candidate.email
        }
      });
      const invite = await prisma.invite.create({
        data: {
          assessmentVersionId: "test",
          mode: "test",
          slug: `test-${candidate.id}`,
          tokenHash: "hash"
        }
      });
      const attempt = await prisma.attempt.create({
        data: {
          assessmentVersionId: "test-version",
          inviteId: invite.id,
          participantId: participant.id,
          seed: 1,
          stage: "submitted",
          status: "submitted" as any,
          passTargetPercent: 70,
          stacksJson: {},
          sectionsJson: {},
          coreQuestionIdsJson: [],
          coreAnswersJson: {},
          practicalAnswerJson: {},
          remainingCoreSeconds: 0,
          remainingPracticalSeconds: 0,
          integrityJson: {}
        }
      });
      const result = await prisma.result.create({
        data: {
          attemptId: attempt.id,
          corePercent: 85,
          practicalPercent: 80,
          finalPercent: 82,
          pass: true,
          borderline: false,
          breakdownJson: {}
        }
      });
      const assessment = await prisma.candidateAssessment.create({
        data: {
          candidateId: candidate.id,
          inviteId: invite.id,
          attemptId: attempt.id
        }
      });

      const response = await testFetch(`/api/candidates/${candidate.id}/promote`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${testUser.token}` }
      });

      expect(response.status).toBe(200);
      const candidate_after = await prisma.candidate.findUnique({
        where: { id: candidate.id }
      });
      expect(candidate_after?.stage).toBe("finalized");
    });
  });

  describe("POST /api/candidates/[id]/hire", () => {
    it("should reject hire of candidate not in finalized stage", async () => {
      const candidate = await createTestCandidate({ stage: "interview" });

      const response = await testFetch(`/api/candidates/${candidate.id}/hire`, {
        method: "POST",
        body: JSON.stringify({ createEmployeeRecord: true }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${testUser.token}`
        }
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain("finalized stage");
    });

    it("should reject hire without accepted offer", async () => {
      const candidate = await createTestCandidate({ stage: "finalized" });

      const response = await testFetch(`/api/candidates/${candidate.id}/hire`, {
        method: "POST",
        body: JSON.stringify({ createEmployeeRecord: true }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${testUser.token}`
        }
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain("Offer must be in accepted status");
    });

    it("should reject hire without passed assessment", async () => {
      const candidate = await createTestCandidate({ stage: "finalized" });
      await prisma.candidateOffer.create({
        data: {
          candidateId: candidate.id,
          status: "accepted",
          targetStartDate: new Date()
        }
      });

      const response = await testFetch(`/api/candidates/${candidate.id}/hire`, {
        method: "POST",
        body: JSON.stringify({ createEmployeeRecord: true }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${testUser.token}`
        }
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain("passed assessment");
    });

    it("should successfully hire candidate with all preconditions met", async () => {
      const candidate = await createTestCandidate({ stage: "finalized" });
      const offer = await prisma.candidateOffer.create({
        data: {
          candidateId: candidate.id,
          status: "accepted",
          targetStartDate: new Date()
        }
      });

      // Create passed assessment
      const participant = await prisma.participant.create({
        data: {
          kind: "candidate",
          fullName: candidate.fullName,
          email: candidate.email
        }
      });
      const invite = await prisma.invite.create({
        data: {
          assessmentVersionId: "test",
          mode: "test",
          slug: `test-hire-${candidate.id}`,
          tokenHash: "hash"
        }
      });
      const attempt = await prisma.attempt.create({
        data: {
          assessmentVersionId: "test-version",
          inviteId: invite.id,
          participantId: participant.id,
          seed: 1,
          stage: "submitted",
          status: "submitted" as any,
          passTargetPercent: 70,
          stacksJson: {},
          sectionsJson: {},
          coreQuestionIdsJson: [],
          coreAnswersJson: {},
          practicalAnswerJson: {},
          remainingCoreSeconds: 0,
          remainingPracticalSeconds: 0,
          integrityJson: {}
        }
      });
      const result = await prisma.result.create({
        data: {
          attemptId: attempt.id,
          corePercent: 85,
          practicalPercent: 80,
          finalPercent: 82,
          pass: true,
          borderline: false,
          breakdownJson: {}
        }
      });
      const assessment = await prisma.candidateAssessment.create({
        data: {
          candidateId: candidate.id,
          inviteId: invite.id,
          attemptId: attempt.id
        }
      });

      const response = await testFetch(`/api/candidates/${candidate.id}/hire`, {
        method: "POST",
        body: JSON.stringify({ createEmployeeRecord: true }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${testUser.token}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.employee).toBeTruthy();

      const employee = await prisma.employee.findUnique({
        where: { candidateId: candidate.id }
      });
      expect(employee).toBeTruthy();
      expect(employee?.fullName).toBe(candidate.fullName);
    });
  });
});
