-- Add password-based login support for internal users.
-- Safe to run multiple times.

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
