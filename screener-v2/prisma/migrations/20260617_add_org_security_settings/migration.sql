-- OrgSecuritySettings: singleton row for admin-configurable security policy.
-- Apply with: psql $DATABASE_URL -f prisma/migrations/manual_org_security_settings.sql

CREATE TABLE IF NOT EXISTS "OrgSecuritySettings" (
  "id"                TEXT         NOT NULL DEFAULT 'singleton' PRIMARY KEY,
  "mfaEnforcement"    TEXT         NOT NULL DEFAULT 'off',
  "passwordMinLength" INTEGER      NOT NULL DEFAULT 8,
  "requireUppercase"  BOOLEAN      NOT NULL DEFAULT TRUE,
  "requireNumber"     BOOLEAN      NOT NULL DEFAULT TRUE,
  "requireSpecial"    BOOLEAN      NOT NULL DEFAULT FALSE,
  "sessionDays"       INTEGER      NOT NULL DEFAULT 7,
  "lockoutThreshold"  INTEGER      NOT NULL DEFAULT 10,
  "lockoutMinutes"    INTEGER      NOT NULL DEFAULT 30,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedById"       TEXT
);
