-- Phase 1: Remove redundant User fields
-- These fields are not used and add noise to the schema

ALTER TABLE "User" DROP COLUMN IF EXISTS "title";
ALTER TABLE "User" DROP COLUMN IF EXISTS "department";
ALTER TABLE "User" DROP COLUMN IF EXISTS "phone";
