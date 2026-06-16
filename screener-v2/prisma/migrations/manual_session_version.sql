-- Add session versioning to User for revocation support.
-- Incrementing sessionVersion invalidates all outstanding session tokens
-- for that user (checked in getAppSession on every authenticated request).
-- Triggered by: password reset, account deactivation.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 1;
