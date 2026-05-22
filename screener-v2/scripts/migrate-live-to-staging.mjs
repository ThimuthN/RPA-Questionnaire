import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { PrismaClient } from "@prisma/client";

const SOURCE_ENV_FILE = process.env.SOURCE_ENV_FILE ?? ".env";
const TARGET_ENV_FILE = process.env.TARGET_ENV_FILE ?? ".env.staging.local";

const args = new Set(process.argv.slice(2));
const shouldReset = args.has("--reset");

const allowedCandidateStages = new Set([
  "applicant",
  "pipeline",
  "screening",
  "interview",
  "advanced_review",
  "finalized"
]);

const allowedNextActions = new Set([
  "schedule_interview",
  "send_test",
  "review_result",
  "schedule_final",
  "prepare_offer",
  "close_profile",
  "follow_up",
  "none"
]);

const allowedScreeningStatuses = new Set(["pending", "passed", "failed", "on_hold"]);
const allowedAttemptStatuses = new Set(["in_progress", "submitted", "graded", "reviewed"]);
const allowedResultReviewStates = new Set(["unreviewed", "reviewed", "flagged"]);
const allowedMilestoneStatuses = new Set(["not_started", "in_progress", "done", "failed", "skipped"]);
let typeScriptHooksRegistered = false;

function parseEnvFile(filePath) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absolutePath)) {
    return {};
  }

  const entries = {};
  for (const line of fs.readFileSync(absolutePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
}

function mergeNonEmptyEnvEntries(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value !== "") {
      target[key] = value;
    }
  }

  return target;
}

function hasKnownExtension(value) {
  return /\.[a-z0-9]+$/i.test(value);
}

function resolveWorkspaceModule(rawPath) {
  const candidates = hasKnownExtension(rawPath)
    ? [rawPath]
    : [rawPath + ".ts", rawPath + ".tsx", rawPath + ".json", path.join(rawPath, "index.ts")];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? rawPath;
}

function ensureTypeScriptImportHooks() {
  if (typeScriptHooksRegistered) {
    return;
  }

  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier.startsWith("@/")) {
        const absolute = resolveWorkspaceModule(path.join(process.cwd(), "src", specifier.slice(2)));
        return { url: pathToFileURL(absolute).href, shortCircuit: true };
      }

      if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
        const parentPath = fileURLToPath(context.parentURL);
        const absolute = resolveWorkspaceModule(path.resolve(path.dirname(parentPath), specifier));
        if (fs.existsSync(absolute)) {
          return { url: pathToFileURL(absolute).href, shortCircuit: true };
        }
      }

      return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (url.endsWith(".json")) {
        const json = fs.readFileSync(fileURLToPath(url), "utf8");
        return {
          format: "module",
          source: `export default ${json};`,
          shortCircuit: true
        };
      }

      if (url.endsWith(".ts") || url.endsWith(".tsx")) {
        const source = fs.readFileSync(fileURLToPath(url), "utf8");
        return {
          format: "module",
          source: stripTypeScriptTypes(source),
          shortCircuit: true
        };
      }

      return nextLoad(url, context);
    }
  });

  typeScriptHooksRegistered = true;
}

function getDatabaseIdentity(rawUrl) {
  const url = new URL(rawUrl);
  return `${url.hostname}${url.pathname}`;
}

function stableId(seedKey) {
  return crypto.createHash("md5").update(seedKey).digest("hex");
}

function loadConfig() {
  const sourceEnv = parseEnvFile(SOURCE_ENV_FILE);
  const targetEnvFiles = Array.from(new Set([TARGET_ENV_FILE, ".env.staging"]));
  const targetEnv = targetEnvFiles.reduce(
    (merged, file) => mergeNonEmptyEnvEntries(merged, parseEnvFile(file)),
    {}
  );

  const sourceDatabaseUrl = process.env.SOURCE_DATABASE_URL ?? sourceEnv.DATABASE_URL;
  const targetDatabaseUrl = process.env.TARGET_DATABASE_URL ?? targetEnv.DATABASE_URL;
  const targetDirectUrl = process.env.TARGET_DIRECT_URL ?? targetEnv.DIRECT_URL ?? targetDatabaseUrl;

  if (!sourceDatabaseUrl) {
    throw new Error(`Missing source database URL. Checked SOURCE_DATABASE_URL and ${SOURCE_ENV_FILE}.`);
  }

  if (!targetDatabaseUrl) {
    throw new Error(
      `Missing target database URL. Set TARGET_DATABASE_URL / TARGET_DIRECT_URL or create ${TARGET_ENV_FILE}.`
    );
  }

  if (getDatabaseIdentity(sourceDatabaseUrl) === getDatabaseIdentity(targetDatabaseUrl)) {
    throw new Error("Source and target database URLs resolve to the same database. Refusing to continue.");
  }

  return {
    sourceEnv,
    targetEnv,
    sourceDatabaseUrl,
    targetDatabaseUrl,
    targetDirectUrl
  };
}

function runCommand(command, env) {
  const result = spawnSync(command, {
    shell: true,
    stdio: "inherit",
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env
    }
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command}`);
  }
}

async function resetTargetDatabase(config) {
  console.log("Resetting staging database...");

  const admin = new PrismaClient({
    datasources: {
      db: {
        url: config.targetDirectUrl
      }
    }
  });

  try {
    await admin.$executeRawUnsafe("DROP SCHEMA IF EXISTS public CASCADE");
    await admin.$executeRawUnsafe("CREATE SCHEMA public");
  } finally {
    await admin.$disconnect();
  }

  const env = {
    DATABASE_URL: config.targetDirectUrl,
    DIRECT_URL: config.targetDirectUrl,
    APP_URL: config.targetEnv.APP_URL ?? "https://screener-v2-staging.vercel.app"
  };

  runCommand("npx prisma db push --skip-generate --accept-data-loss", env);
}

async function loadAddonCatalogSeeds() {
  ensureTypeScriptImportHooks();
  const moduleUrl = pathToFileURL(path.join(process.cwd(), "src", "lib", "addons", "catalog-seeds.ts")).href;
  const catalogSeedsModule = await import(moduleUrl);
  return catalogSeedsModule.addonCatalogSeeds;
}

async function loadAppActions() {
  ensureTypeScriptImportHooks();
  const moduleUrl = pathToFileURL(path.join(process.cwd(), "src", "lib", "auth", "permissions.ts")).href;
  const permissionsModule = await import(moduleUrl);
  return permissionsModule.APP_ACTIONS;
}

async function seedCurrentAddonCatalog(target) {
  const addonCatalogSeeds = await loadAddonCatalogSeeds();
  const presetSeedsPath = path.join(process.cwd(), "src", "lib", "addons", "preset-seeds.json");
  const presetSeeds = JSON.parse(fs.readFileSync(presetSeedsPath, "utf8"));

  await target.addonCatalog.createMany({
    data: addonCatalogSeeds.map((seed) => ({
      id: stableId(seed.seedKey),
      slug: seed.slug,
      label: seed.label,
      description: seed.description,
      assessmentTypeId: seed.assessmentTypeId,
      defaultConfigJson: seed.defaultConfig,
      defaultDurationMinutes: seed.defaultDurationMinutes,
      defaultRequiredPercent: seed.defaultRequiredPercent,
      defaultWeight: seed.defaultWeight,
      isActive: seed.isActive,
      sortOrder: seed.sortOrder
    }))
  });

  const addonRows = await target.addonCatalog.findMany({
    select: { id: true, slug: true }
  });
  const addonIdBySlug = new Map(addonRows.map((row) => [row.slug, row.id]));

  await target.assessmentPreset.createMany({
    data: presetSeeds.map((seed) => ({
      id: stableId(seed.seedKey),
      slug: seed.slug,
      label: seed.label,
      description: seed.description,
      isActive: seed.isActive,
      sortOrder: seed.sortOrder
    }))
  });

  await target.assessmentPresetItem.createMany({
    data: presetSeeds.flatMap((seed) => {
      const presetId = stableId(seed.seedKey);
      return seed.items.map((item, index) => {
        const addonId = addonIdBySlug.get(item.addonSlug);
        if (!addonId) {
          throw new Error(`Preset seed '${seed.slug}' references unknown add-on slug '${item.addonSlug}'.`);
        }

        return {
          id: stableId(`${seed.seedKey}:${index}:${item.addonSlug}`),
          presetId,
          addonId,
          sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : index,
          configOverrideJson: item.configOverride ?? {},
          weightOverride:
            typeof item.weightOverride === "number" ? Math.max(0, Math.round(item.weightOverride)) : null
        };
      });
    })
  });
}

async function seedSystemAdminAccess(target) {
  const appActions = await loadAppActions();

  let systemDepartment = await target.department.findUnique({
    where: { slug: "system" }
  });

  if (!systemDepartment) {
    systemDepartment = await target.department.create({
      data: {
        id: "system-dept",
        slug: "system",
        name: "System",
        isActive: true,
        sortOrder: 0
      }
    });
  }

  let adminRole = await target.roleCatalog.findFirst({
    where: { slug: "system_admin" }
  });

  if (!adminRole) {
    adminRole = await target.roleCatalog.create({
      data: {
        id: stableId("role:system_admin"),
        slug: "system_admin",
        label: "System Admin",
        isActive: true,
        departmentId: systemDepartment.id
      }
    });
  } else if (adminRole.departmentId !== systemDepartment.id || !adminRole.isActive) {
    adminRole = await target.roleCatalog.update({
      where: { id: adminRole.id },
      data: {
        departmentId: systemDepartment.id,
        isActive: true
      }
    });
  }

  await target.rolePermissionTemplate.createMany({
    data: appActions.map((permission) => ({
      id: stableId(`system_admin:${permission}`),
      roleId: adminRole.id,
      permission,
      scope: "global"
    })),
    skipDuplicates: true
  });

  await target.user.updateMany({
    where: { roleId: null },
    data: {
      roleId: adminRole.id,
      departmentId: systemDepartment.id
    }
  });
}

function normalizeCandidateStage(rawStage) {
  const stage = (rawStage ?? "").trim().toLowerCase();
  const mapped =
    {
      new: "applicant",
      applicant: "applicant",
      pipeline: "pipeline",
      screening: "screening",
      testing: "screening",
      interview: "interview",
      decision: "advanced_review",
      advanced_review: "advanced_review",
      closed: "finalized",
      finalized: "finalized"
    }[stage] ?? "pipeline";

  return allowedCandidateStages.has(mapped) ? mapped : "pipeline";
}

function normalizeNextAction(rawAction) {
  const action = (rawAction ?? "").trim().toLowerCase();
  return allowedNextActions.has(action) ? action : "none";
}

function normalizeScreeningStatus(rawStatus) {
  const status = (rawStatus ?? "").trim().toLowerCase();
  if (!status) {
    return null;
  }

  if (status === "under_review") {
    return "pending";
  }

  return allowedScreeningStatuses.has(status) ? status : null;
}

function normalizeAttemptStatus(rawStatus) {
  const status = (rawStatus ?? "").trim().toLowerCase();
  return allowedAttemptStatuses.has(status) ? status : "in_progress";
}

function normalizeResultReviewState(rawState) {
  const state = (rawState ?? "").trim().toLowerCase();
  return allowedResultReviewStates.has(state) ? state : "unreviewed";
}

function normalizeMilestoneStatus(rawStatus) {
  const status = (rawStatus ?? "").trim().toLowerCase();
  return allowedMilestoneStatuses.has(status) ? status : "not_started";
}

function slugify(value) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeLookupKey(value) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function getCandidateOrgState(candidate) {
  const stage = (candidate.stage ?? "").trim().toLowerCase();
  const finalDecision = (candidate.finalDecision ?? "").trim().toLowerCase();
  const intakeBucket = (candidate.intakeBucket ?? "").trim().toLowerCase();

  if (intakeBucket === "talent_pool") {
    return {
      stage: normalizeCandidateStage(candidate.stage),
      orgStatus: "talent_pool",
      orgStage: "active",
      finalizedAs: null
    };
  }

  if (finalDecision === "rejected" || stage === "closed" || stage === "finalized") {
    return {
      stage: "finalized",
      orgStatus: "org_rejected",
      orgStage: "finalized",
      finalizedAs: "rejected"
    };
  }

  return {
    stage: normalizeCandidateStage(candidate.stage),
    orgStatus: "active",
    orgStage: "active",
    finalizedAs: null
  };
}

function optionalReference(value, allowedIds, label) {
  if (!value) {
    return null;
  }

  if (!allowedIds.has(value)) {
    throw new Error(`Missing reference for ${label}: ${value}`);
  }

  return value;
}

function requiredReference(value, allowedIds, label) {
  if (!value) {
    throw new Error(`Missing required reference value for ${label}`);
  }

  if (!allowedIds.has(value)) {
    throw new Error(`Missing reference for ${label}: ${value}`);
  }

  return value;
}

function buildRoleLookup(roles) {
  const lookup = new Map();

  function add(key, id) {
    if (!key) {
      return;
    }

    const normalized = normalizeLookupKey(key);
    if (!normalized) {
      return;
    }

    const bucket = lookup.get(normalized) ?? new Set();
    bucket.add(id);
    lookup.set(normalized, bucket);
  }

  for (const role of roles) {
    add(role.id, role.id);
    add(role.slug, role.id);
    add(role.label, role.id);
  }

  return lookup;
}

function resolveOptionalRoleReference(value, roleIds, roleLookup) {
  if (!value) {
    return { roleId: null, cleared: false };
  }

  if (roleIds.has(value)) {
    return { roleId: value, cleared: false };
  }

  const matches = roleLookup.get(normalizeLookupKey(value));
  if (matches?.size === 1) {
    return { roleId: Array.from(matches)[0], cleared: false };
  }

  return { roleId: null, cleared: true };
}

async function fetchSourceSnapshot(source) {
  const queries = {
    departments:
      'SELECT id, slug, name, "isActive", "sortOrder", "createdAt", "updatedAt" FROM "Department" ORDER BY "sortOrder", slug',
    roles:
      'SELECT id, slug, label, department, "departmentId", "experienceLevel", requirements, "sortOrder", "isActive", "createdAt", "updatedAt" FROM "RoleCatalog" ORDER BY slug',
    users:
      'SELECT id, email, name, "departmentId", "passwordHash", "isActive", "lastLoginAt", "createdAt", "updatedAt" FROM "User" ORDER BY email',
    candidates:
      'SELECT id, "fullName", email, phone, "roleId", "departmentId", "hrOwnerId", "positionAppliedFor", "batchId", "resumeSource", "hrOwner", stage, "nextAction", "screeningStatus", "candidateFolderUrl", "notesSummary", "createdAt", "updatedAt", "intakeBucket", "finalDecision" FROM "Candidate" ORDER BY "createdAt", id',
    candidateResumes:
      'SELECT id, "candidateId", "fileName", "mimeType", "sizeBytes", "storageKey", "storageUrl", "uploadedAt" FROM "CandidateResume" ORDER BY "uploadedAt", id',
    candidateNotes:
      'SELECT id, "candidateId", type, body, "createdAt", "updatedAt", "deletedAt", "createdById", "updatedById" FROM "CandidateNote" ORDER BY "createdAt", id',
    candidateMilestones:
      'SELECT id, "candidateId", type, title, status, "sortOrder", mode, date, notes, score, result, recommendation, "candidateAssessmentId", "createdAt", "updatedAt" FROM "CandidateMilestone" ORDER BY "candidateId", "sortOrder"',
    candidateMilestoneChecks:
      'SELECT id, "milestoneId", type, status, notes, "actorId", "actorName", metadata, "createdAt", "updatedAt" FROM "CandidateMilestoneCheck" ORDER BY "createdAt", id',
    candidateActivityEvents:
      'SELECT id, "candidateId", "actorId", "actorName", event, "entityType", "entityId", detail, "createdAt" FROM "CandidateActivityEvent" ORDER BY "createdAt", id',
    jobPostings:
      'SELECT id, slug, title, "roleId", "departmentId", "screenerPresetId", summary, description, "salaryMin", "salaryMax", "teamSize", "techStack", "remotePolicy", "isPublished", "isOpen", "createdAt", "updatedAt" FROM "JobPosting" ORDER BY "createdAt", id',
    candidateApplications:
      'SELECT id, "candidateId", "jobPostingId", status, "coverNote", "createdAt", "updatedAt" FROM "CandidateApplication" ORDER BY "createdAt", id',
    participants:
      'SELECT id, kind, "fullName", email, phone, "employeeId", "createdAt" FROM "Participant" ORDER BY "createdAt", id',
    invites:
      'SELECT id, "assessmentVersionId", mode, "contextType", slug, "tokenHash", "passcodeHash", "integrityPreset", "roleLocked", "stackLocked", "roleId", "passTargetPercent", "stacksJson", "sectionsJson", "blueprintJson", "maxAttempts", "usedAttempts", "expiresAt", "createdAt" FROM "Invite" ORDER BY "createdAt", id',
    attempts:
      'SELECT id, "assessmentVersionId", "inviteId", "participantId", "contextType", "integrityPreset", "roleId", "passTargetPercent", "stacksJson", "sectionsJson", "blueprintJson", "sectionStateJson", seed, stage, status, "coreQuestionIdsJson", "coreAnswersJson", "practicalAnswerJson", "practicalEarned", "practicalPossible", "logicReasoningAnswerJson", "logicReasoningEarned", "logicReasoningPossible", "remainingCoreSeconds", "remainingPracticalSeconds", "remainingLogicReasoningSeconds", "stateVersion", "integrityJson", "startedAt", "submittedAt" FROM "Attempt" ORDER BY "startedAt", id',
    results:
      'SELECT id, "attemptId", "contextType", "reviewState", "corePercent", "practicalPercent", "finalPercent", pass, borderline, "breakdownJson", "exportedAt", "createdAt" FROM "Result" ORDER BY "createdAt", id',
    candidateAssessments:
      'SELECT id, "candidateId", "inviteId", "attemptId", "createdAt", "createdById" FROM "CandidateAssessment" ORDER BY "createdAt", id',
    candidateAssessmentAttempts:
      'SELECT id, "candidateAssessmentId", "attemptId", "linkedAt" FROM "CandidateAssessmentAttempt" ORDER BY "linkedAt", id',
    employees:
      'SELECT id, "candidateId", "employeeNumber", "fullName", email, phone, title, "roleId", "departmentId", "managerId", "employmentType", "employmentStatus", "startDate", "probationEndDate", "endDate", location, level, "createdAt", "updatedAt" FROM "Employee" ORDER BY "createdAt", id',
    auditLogs:
      'SELECT id, action, "actorId", "actorEmail", "targetId", "targetType", before, after, "createdAt" FROM "AuditLog" ORDER BY "createdAt", id'
  };

  const entries = await Promise.all(
    Object.entries(queries).map(async ([key, sql]) => [key, await source.$queryRawUnsafe(sql)])
  );

  return Object.fromEntries(entries);
}

async function buildTargetPresetSet(target) {
  const presets = await target.assessmentPreset.findMany({
    select: { id: true }
  });

  return new Set(presets.map((preset) => preset.id));
}

function transformSnapshot(snapshot, presetIds) {
  const syntheticDepartmentTimestamp = new Date();
  const existingDepartmentIds = new Set(snapshot.departments.map((row) => row.id));
  const usedDepartmentSlugs = new Set(snapshot.departments.map((row) => row.slug));
  const missingDepartments = new Map();

  for (const role of snapshot.roles) {
    if (role.departmentId && !existingDepartmentIds.has(role.departmentId) && !missingDepartments.has(role.departmentId)) {
      missingDepartments.set(role.departmentId, role.department ?? "Imported Department");
    }
  }

  let nextSortOrder = Math.max(0, ...snapshot.departments.map((row) => row.sortOrder ?? 0)) + 1;
  const syntheticDepartments = Array.from(missingDepartments.entries()).map(([id, label], index) => {
    const baseSlug = slugify(label) || `imported-department-${index + 1}`;
    let slug = baseSlug;
    let suffix = 2;

    while (usedDepartmentSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    usedDepartmentSlugs.add(slug);

    return {
      id,
      slug,
      name: label,
      isActive: true,
      sortOrder: nextSortOrder++,
      createdAt: syntheticDepartmentTimestamp,
      updatedAt: syntheticDepartmentTimestamp
    };
  });

  const departments = [
    ...snapshot.departments.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    })),
    ...syntheticDepartments
  ];

  const departmentIds = new Set(departments.map((row) => row.id));
  const roleIds = new Set(snapshot.roles.map((row) => row.id));
  const roleLookup = buildRoleLookup(snapshot.roles);
  const userIds = new Set(snapshot.users.map((row) => row.id));
  const candidateIds = new Set(snapshot.candidates.map((row) => row.id));
  const participantIds = new Set(snapshot.participants.map((row) => row.id));
  const inviteIds = new Set(snapshot.invites.map((row) => row.id));
  const attemptIds = new Set(snapshot.attempts.map((row) => row.id));
  const candidateAssessmentIds = new Set(snapshot.candidateAssessments.map((row) => row.id));
  const milestoneIds = new Set(snapshot.candidateMilestones.map((row) => row.id));
  const employeeIds = new Set(snapshot.employees.map((row) => row.id));
  const normalizedCandidates = [];

  for (const row of snapshot.candidates) {
    const orgState = getCandidateOrgState(row);
    normalizedCandidates.push({
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      roleId: optionalReference(row.roleId, roleIds, `candidate.roleId for ${row.id}`),
      departmentId: optionalReference(row.departmentId, departmentIds, `candidate.departmentId for ${row.id}`),
      hrOwnerId: optionalReference(row.hrOwnerId, userIds, `candidate.hrOwnerId for ${row.id}`),
      positionAppliedFor: row.positionAppliedFor,
      batchId: row.batchId,
      resumeSource: row.resumeSource,
      hrOwner: row.hrOwner,
      stage: orgState.stage,
      nextAction: normalizeNextAction(row.nextAction),
      screeningStatus: normalizeScreeningStatus(row.screeningStatus),
      candidateFolderUrl: row.candidateFolderUrl,
      notesSummary: row.notesSummary,
      orgStatus: orgState.orgStatus,
      orgStage: orgState.orgStage,
      finalizedAs: orgState.finalizedAs,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    });
  }

  const normalizedDepartmentCandidacies = normalizedCandidates
    .filter((candidate) => candidate.departmentId)
    .map((candidate) => ({
      id: `dc-${candidate.id}-${candidate.departmentId}`,
      candidateId: candidate.id,
      departmentId: candidate.departmentId,
      roleId: candidate.roleId,
      hrOwnerId: candidate.hrOwnerId,
      status:
        candidate.orgStatus === "org_rejected"
          ? "dept_rejected"
          : candidate.orgStatus === "talent_pool"
            ? "talent_pool"
            : "active",
      source: "manual",
      nominatedBy: null,
      nominationNote: null,
      jobPostingId: null,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt
    }));

  let clearedPresetReferences = 0;
  let clearedLegacyRoleReferences = 0;
  const normalizedJobPostings = snapshot.jobPostings.map((row) => {
    const screenerPresetId =
      row.screenerPresetId && presetIds.has(row.screenerPresetId) ? row.screenerPresetId : null;
    if (row.screenerPresetId && !screenerPresetId) {
      clearedPresetReferences += 1;
    }

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      roleId: optionalReference(row.roleId, roleIds, `jobPosting.roleId for ${row.id}`),
      departmentId: optionalReference(row.departmentId, departmentIds, `jobPosting.departmentId for ${row.id}`),
      screenerPresetId,
      summary: row.summary,
      description: row.description,
      salaryMin: row.salaryMin,
      salaryMax: row.salaryMax,
      teamSize: row.teamSize,
      techStack: row.techStack,
      remotePolicy: row.remotePolicy,
      isPublished: row.isPublished,
      isOpen: row.isOpen,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  });
  const jobPostingIds = new Set(normalizedJobPostings.map((row) => row.id));

  return {
    departments,
    roles: snapshot.roles.map((row) => ({
      id: row.id,
      slug: row.slug,
      label: row.label,
      department: row.department,
      departmentId: requiredReference(row.departmentId, departmentIds, `role.departmentId for ${row.id}`),
      description: null,
      experienceLevel: row.experienceLevel,
      requirements: row.requirements,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    })),
    users: snapshot.users.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      departmentId: optionalReference(row.departmentId, departmentIds, `user.departmentId for ${row.id}`),
      roleId: null,
      passwordHash: row.passwordHash,
      isActive: row.isActive,
      lastLoginAt: row.lastLoginAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    })),
    candidates: normalizedCandidates,
    departmentCandidacies: normalizedDepartmentCandidacies,
    candidateResumes: snapshot.candidateResumes.map((row) => ({
      id: row.id,
      candidateId: requiredReference(row.candidateId, candidateIds, `candidateResume.candidateId for ${row.id}`),
      fileName: row.fileName,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      storageKey: row.storageKey,
      storageUrl: row.storageUrl,
      uploadedAt: row.uploadedAt
    })),
    candidateNotes: snapshot.candidateNotes.map((row) => ({
      id: row.id,
      candidateId: requiredReference(row.candidateId, candidateIds, `candidateNote.candidateId for ${row.id}`),
      type: row.type,
      body: row.body,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
      createdById: optionalReference(row.createdById, userIds, `candidateNote.createdById for ${row.id}`),
      updatedById: optionalReference(row.updatedById, userIds, `candidateNote.updatedById for ${row.id}`)
    })),
    candidateMilestones: snapshot.candidateMilestones.map((row) => ({
      id: row.id,
      candidateId: requiredReference(row.candidateId, candidateIds, `candidateMilestone.candidateId for ${row.id}`),
      type: row.type,
      title: row.title,
      status: normalizeMilestoneStatus(row.status),
      sortOrder: row.sortOrder,
      mode: row.mode,
      date: row.date,
      notes: row.notes,
      score: row.score,
      result: row.result,
      recommendation: row.recommendation,
      candidateAssessmentId: optionalReference(
        row.candidateAssessmentId,
        candidateAssessmentIds,
        `candidateMilestone.candidateAssessmentId for ${row.id}`
      ),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    })),
    candidateMilestoneChecks: snapshot.candidateMilestoneChecks.map((row) => ({
      id: row.id,
      milestoneId: requiredReference(row.milestoneId, milestoneIds, `candidateMilestoneCheck.milestoneId for ${row.id}`),
      type: row.type,
      status: row.status,
      notes: row.notes,
      actorId: optionalReference(row.actorId, userIds, `candidateMilestoneCheck.actorId for ${row.id}`),
      actorName: row.actorName,
      metadata: row.metadata,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    })),
    candidateActivityEvents: snapshot.candidateActivityEvents.map((row) => ({
      id: row.id,
      candidateId: requiredReference(row.candidateId, candidateIds, `candidateActivityEvent.candidateId for ${row.id}`),
      actorId: optionalReference(row.actorId, userIds, `candidateActivityEvent.actorId for ${row.id}`),
      actorName: row.actorName,
      event: row.event,
      entityType: row.entityType,
      entityId: row.entityId,
      detail: row.detail,
      createdAt: row.createdAt
    })),
    jobPostings: normalizedJobPostings,
    candidateApplications: snapshot.candidateApplications.map((row) => ({
      id: row.id,
      candidateId: requiredReference(row.candidateId, candidateIds, `candidateApplication.candidateId for ${row.id}`),
      jobPostingId: requiredReference(row.jobPostingId, jobPostingIds, `candidateApplication.jobPostingId for ${row.id}`),
      status: row.status,
      coverNote: row.coverNote,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    })),
    participants: snapshot.participants.map((row) => ({
      id: row.id,
      kind: row.kind,
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      employeeId: optionalReference(row.employeeId, employeeIds, `participant.employeeId for ${row.id}`),
      createdAt: row.createdAt
    })),
    invites: snapshot.invites.map((row) => {
      const resolvedRole = resolveOptionalRoleReference(row.roleId, roleIds, roleLookup);
      if (resolvedRole.cleared) {
        clearedLegacyRoleReferences += 1;
      }

      return {
        id: row.id,
        assessmentVersionId: row.assessmentVersionId,
        mode: row.mode,
        contextType: row.contextType ?? "general",
        slug: row.slug,
        tokenHash: row.tokenHash,
        passcodeHash: row.passcodeHash,
        integrityPreset: row.integrityPreset,
        roleLocked: resolvedRole.roleId ? row.roleLocked : false,
        stackLocked: row.stackLocked,
        roleId: resolvedRole.roleId,
        passTargetPercent: row.passTargetPercent,
        stacksJson: row.stacksJson,
        sectionsJson: row.sectionsJson,
        blueprintJson: row.blueprintJson,
        maxAttempts: row.maxAttempts,
        usedAttempts: row.usedAttempts,
        expiresAt: row.expiresAt,
        createdAt: row.createdAt
      };
    }),
    attempts: snapshot.attempts.map((row) => {
      const resolvedRole = resolveOptionalRoleReference(row.roleId, roleIds, roleLookup);
      if (resolvedRole.cleared) {
        clearedLegacyRoleReferences += 1;
      }

      return {
        id: row.id,
        assessmentVersionId: row.assessmentVersionId,
        inviteId: optionalReference(row.inviteId, inviteIds, `attempt.inviteId for ${row.id}`),
        participantId: requiredReference(row.participantId, participantIds, `attempt.participantId for ${row.id}`),
        contextType: row.contextType ?? "general",
        integrityPreset: row.integrityPreset,
        roleId: resolvedRole.roleId,
        passTargetPercent: row.passTargetPercent,
        stacksJson: row.stacksJson,
        sectionsJson: row.sectionsJson,
        blueprintJson: row.blueprintJson,
        sectionStateJson: row.sectionStateJson,
        seed: row.seed,
        stage: row.stage,
        status: normalizeAttemptStatus(row.status),
        coreQuestionIdsJson: row.coreQuestionIdsJson,
        coreAnswersJson: row.coreAnswersJson,
        practicalAnswerJson: row.practicalAnswerJson,
        practicalEarned: row.practicalEarned,
        practicalPossible: row.practicalPossible,
        logicReasoningAnswerJson: row.logicReasoningAnswerJson,
        logicReasoningEarned: row.logicReasoningEarned,
        logicReasoningPossible: row.logicReasoningPossible,
        remainingCoreSeconds: row.remainingCoreSeconds,
        remainingPracticalSeconds: row.remainingPracticalSeconds,
        remainingLogicReasoningSeconds: row.remainingLogicReasoningSeconds,
        stateVersion: row.stateVersion,
        integrityJson: row.integrityJson,
        startedAt: row.startedAt,
        submittedAt: row.submittedAt
      };
    }),
    results: snapshot.results.map((row) => ({
      id: row.id,
      attemptId: requiredReference(row.attemptId, attemptIds, `result.attemptId for ${row.id}`),
      contextType: row.contextType ?? "general",
      reviewState: normalizeResultReviewState(row.reviewState),
      corePercent: row.corePercent,
      practicalPercent: row.practicalPercent,
      finalPercent: row.finalPercent,
      pass: row.pass,
      borderline: row.borderline,
      breakdownJson: row.breakdownJson,
      exportedAt: row.exportedAt,
      createdAt: row.createdAt
    })),
    candidateAssessments: snapshot.candidateAssessments.map((row) => ({
      id: row.id,
      candidateId: requiredReference(row.candidateId, candidateIds, `candidateAssessment.candidateId for ${row.id}`),
      inviteId: requiredReference(row.inviteId, inviteIds, `candidateAssessment.inviteId for ${row.id}`),
      attemptId: optionalReference(row.attemptId, attemptIds, `candidateAssessment.attemptId for ${row.id}`),
      createdAt: row.createdAt,
      createdById: optionalReference(row.createdById, userIds, `candidateAssessment.createdById for ${row.id}`)
    })),
    candidateAssessmentAttempts: snapshot.candidateAssessmentAttempts.map((row) => ({
      id: row.id,
      candidateAssessmentId: requiredReference(
        row.candidateAssessmentId,
        candidateAssessmentIds,
        `candidateAssessmentAttempt.candidateAssessmentId for ${row.id}`
      ),
      attemptId: requiredReference(row.attemptId, attemptIds, `candidateAssessmentAttempt.attemptId for ${row.id}`),
      linkedAt: row.linkedAt
    })),
    employees: snapshot.employees.map((row) => ({
      id: row.id,
      candidateId: optionalReference(row.candidateId, candidateIds, `employee.candidateId for ${row.id}`),
      employeeNumber: row.employeeNumber,
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      title: row.title,
      roleId: optionalReference(row.roleId, roleIds, `employee.roleId for ${row.id}`),
      departmentId: optionalReference(row.departmentId, departmentIds, `employee.departmentId for ${row.id}`),
      managerId: optionalReference(row.managerId, employeeIds, `employee.managerId for ${row.id}`),
      employmentType: row.employmentType,
      employmentStatus: row.employmentStatus,
      startDate: row.startDate,
      probationEndDate: row.probationEndDate,
      endDate: row.endDate,
      location: row.location,
      level: row.level,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    })),
    auditLogs: snapshot.auditLogs.map((row) => ({
      id: row.id,
      action: row.action,
      actorId: row.actorId,
      actorEmail: row.actorEmail,
      targetId: row.targetId,
      targetType: row.targetType,
      before: row.before,
      after: row.after,
      createdAt: row.createdAt
    })),
    stats: {
      clearedPresetReferences,
      syntheticDepartmentCount: syntheticDepartments.length,
      clearedLegacyRoleReferences
    }
  };
}

async function importSnapshot(target, data) {
  await target.department.createMany({ data: data.departments });
  await target.roleCatalog.createMany({ data: data.roles });
  await target.user.createMany({ data: data.users });
  await target.candidate.createMany({ data: data.candidates });
  await target.departmentCandidacy.createMany({ data: data.departmentCandidacies });
  await target.jobPosting.createMany({ data: data.jobPostings });
  await target.candidateApplication.createMany({ data: data.candidateApplications });
  await target.employee.createMany({ data: data.employees });
  await target.participant.createMany({ data: data.participants });
  await target.invite.createMany({ data: data.invites });
  await target.attempt.createMany({ data: data.attempts });
  await target.result.createMany({ data: data.results });
  await target.candidateAssessment.createMany({ data: data.candidateAssessments });
  await target.candidateAssessmentAttempt.createMany({ data: data.candidateAssessmentAttempts });
  await target.candidateResume.createMany({ data: data.candidateResumes });
  await target.candidateNote.createMany({ data: data.candidateNotes });
  await target.candidateMilestone.createMany({ data: data.candidateMilestones });
  await target.candidateMilestoneCheck.createMany({ data: data.candidateMilestoneChecks });
  await target.candidateActivityEvent.createMany({ data: data.candidateActivityEvents });
  await target.auditLog.createMany({ data: data.auditLogs });
}

async function verifyCounts(target, data) {
  const expectations = {
    Department: data.departments.length,
    RoleCatalog: data.roles.length,
    User: data.users.length,
    Candidate: data.candidates.length,
    DepartmentCandidacy: data.departmentCandidacies.length,
    JobPosting: data.jobPostings.length,
    CandidateApplication: data.candidateApplications.length,
    CandidateAssessment: data.candidateAssessments.length,
    CandidateAssessmentAttempt: data.candidateAssessmentAttempts.length,
    Attempt: data.attempts.length,
    Result: data.results.length,
    CandidateNote: data.candidateNotes.length,
    CandidateMilestone: data.candidateMilestones.length,
    CandidateMilestoneCheck: data.candidateMilestoneChecks.length,
    CandidateActivityEvent: data.candidateActivityEvents.length,
    CandidateResume: data.candidateResumes.length,
    Employee: data.employees.length,
    Invite: data.invites.length,
    Participant: data.participants.length,
    AuditLog: data.auditLogs.length
  };

  const queries = Object.keys(expectations).map(async (table) => {
    const rows = await target.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM "${table}"`);
    return [table, rows[0].count];
  });

  const actual = Object.fromEntries(await Promise.all(queries));
  const mismatches = [];

  for (const [table, expected] of Object.entries(expectations)) {
    if (actual[table] !== expected) {
      mismatches.push(`${table}: expected ${expected}, got ${actual[table]}`);
    }
  }

  if (mismatches.length > 0) {
    throw new Error(`Count verification failed.\n${mismatches.join("\n")}`);
  }

  return actual;
}

async function main() {
  const config = loadConfig();
  const source = new PrismaClient({
    datasources: {
      db: {
        url: config.sourceDatabaseUrl
      }
    }
  });
  const target = new PrismaClient({
    datasources: {
      db: {
        url: config.targetDirectUrl
      }
    }
  });

  try {
    console.log(`Source env: ${SOURCE_ENV_FILE}`);
    console.log(`Target env: ${TARGET_ENV_FILE}`);

    if (shouldReset) {
      await resetTargetDatabase(config);
      console.log("Seeding current addon catalog...");
      await seedCurrentAddonCatalog(target);
    } else {
      console.log("Skipping reset. Pass --reset to rebuild staging before import.");
    }

    console.log("Reading source data...");
    const snapshot = await fetchSourceSnapshot(source);

    console.log("Reading target preset catalog...");
    const presetIds = await buildTargetPresetSet(target);

    console.log("Transforming source rows to current schema...");
    const transformed = transformSnapshot(snapshot, presetIds);

    console.log("Importing data into staging...");
    await importSnapshot(target, transformed);

    console.log("Repairing system admin access...");
    await seedSystemAdminAccess(target);

    console.log("Verifying row counts...");
    const counts = await verifyCounts(target, transformed);

    console.log("Migration complete.");
    console.log(JSON.stringify({
      counts,
      clearedPresetReferences: transformed.stats.clearedPresetReferences,
      syntheticDepartmentCount: transformed.stats.syntheticDepartmentCount,
      clearedLegacyRoleReferences: transformed.stats.clearedLegacyRoleReferences
    }, null, 2));
  } finally {
    await Promise.all([source.$disconnect(), target.$disconnect()]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
