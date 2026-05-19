import { prisma } from "@/lib/db/prisma";

let createdIds: {
  candidates: string[];
  users: string[];
  roles: string[];
  departments: string[];
  employees: string[];
  assessments: string[];
  offers: string[];
} = {
  candidates: [],
  users: [],
  roles: [],
  departments: [],
  employees: [],
  assessments: [],
  offers: []
};

export async function createTestDepartment(name: string) {
  const dept = await prisma.department.create({
    data: {
      name,
      slug: `test-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`
    }
  });
  createdIds.departments.push(dept.id);
  return dept;
}

export async function createTestRole(label: string, departmentId?: string) {
  let deptId = departmentId;

  // If departmentId is provided, verify it exists
  if (deptId) {
    const deptExists = await prisma.department.findUnique({
      where: { id: deptId }
    });
    // If department doesn't exist, create it
    if (!deptExists) {
      const dept = await createTestDepartment(`Department-${Date.now()}`);
      deptId = dept.id;
    }
  } else {
    // If no departmentId provided, create a department
    const dept = await createTestDepartment(`Department-${Date.now()}`);
    deptId = dept.id;
  }

  const role = await prisma.roleCatalog.create({
    data: {
      label,
      slug: `test-${label.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      departmentId: deptId
    }
  });
  createdIds.roles.push(role.id);
  return role;
}

export async function createTestUser(data: {
  name?: string;
  email?: string;
  roleId?: string;
  departmentId?: string;
}) {
  const user = await prisma.user.create({
    data: {
      email: data.email || `test-${Date.now()}@test.com`,
      name: data.name || "Test User",
      roleId: data.roleId,
      departmentId: data.departmentId,
      passwordHash: "hashed_password"
    }
  });
  createdIds.users.push(user.id);
  return { ...user, token: `test-token-${user.id}` };
}

export async function createTestCandidate(data?: {
  fullName?: string;
  email?: string;
  stage?: string;
  roleId?: string;
  departmentId?: string;
}) {
  const candidateData = data || {};
  const candidate = await prisma.candidate.create({
    data: {
      fullName: candidateData.fullName || "Test Candidate",
      email: candidateData.email || `candidate-${Date.now()}@test.com`,
      stage: candidateData.stage || "pipeline",
      roleId: candidateData.roleId,
      departmentId: candidateData.departmentId
    }
  });
  createdIds.candidates.push(candidate.id);
  return candidate;
}

export async function createTestAssessment(candidateId: string) {
  // Get candidate info
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId }
  });
  if (!candidate) throw new Error("Candidate not found");

  // Create participant
  const participant = await prisma.participant.create({
    data: {
      kind: "candidate",
      fullName: candidate.fullName,
      email: candidate.email
    }
  });

  const invite = await prisma.invite.create({
    data: {
      assessmentVersionId: `test-${Date.now()}`,
      mode: "test",
      slug: `invite-${Date.now()}`,
      tokenHash: `hash-${Date.now()}`
    }
  });

  const attempt = await prisma.attempt.create({
    data: {
      assessmentVersionId: `test-version-${Date.now()}`,
      inviteId: invite.id,
      participantId: participant.id,
      seed: Math.floor(Math.random() * 1000),
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
      candidateId,
      inviteId: invite.id,
      attemptId: attempt.id
    }
  });

  createdIds.assessments.push(assessment.id);
  return { assessment, result, attempt, invite, participant };
}

export async function createTestOffer(candidateId: string, status: string = "sent") {
  const offer = await prisma.candidateOffer.create({
    data: {
      candidateId,
      status: status as any,
      targetStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }
  });
  createdIds.offers.push(offer.id);
  return offer;
}

export async function cleanupTestData() {
  // Clean up in reverse order of creation to respect foreign keys
  try {
    // Delete employees first (references candidates)
    for (const id of createdIds.employees) {
      await prisma.employee.delete({ where: { id } }).catch(() => {});
    }

    // Delete candidate-related data
    for (const id of createdIds.offers) {
      await prisma.candidateOffer.delete({ where: { id } }).catch(() => {});
    }

    for (const id of createdIds.assessments) {
      await prisma.candidateAssessment.delete({ where: { id } }).catch(() => {});
    }

    // Delete candidates
    for (const id of createdIds.candidates) {
      await prisma.candidate.delete({ where: { id } }).catch(() => {});
    }

    // Delete users
    for (const id of createdIds.users) {
      await prisma.user.delete({ where: { id } }).catch(() => {});
    }

    // Delete roles
    for (const id of createdIds.roles) {
      await prisma.roleCatalog.delete({ where: { id } }).catch(() => {});
    }

    // Delete departments
    for (const id of createdIds.departments) {
      await prisma.department.delete({ where: { id } }).catch(() => {});
    }
  } catch (error) {
    console.error("Cleanup error:", error);
  }

  // Reset for next test
  createdIds = {
    candidates: [],
    users: [],
    roles: [],
    departments: [],
    employees: [],
    assessments: [],
    offers: []
  };
}
