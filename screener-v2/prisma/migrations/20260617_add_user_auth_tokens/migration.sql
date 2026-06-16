-- Account invitation + password-reset one-time tokens.
-- Apply with: psql "$DATABASE_URL" -f prisma/migrations/manual_user_auth_tokens.sql
-- (or `prisma db push` when SKIP_MIGRATIONS is set on staging). Idempotent.

CREATE TABLE IF NOT EXISTS "UserAuthToken" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "purpose"     TEXT NOT NULL,
  "tokenHash"   TEXT NOT NULL,
  "expiresAt"   TIMESTAMP(3) NOT NULL,
  "usedAt"      TIMESTAMP(3),
  "createdById" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserAuthToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserAuthToken_tokenHash_key" ON "UserAuthToken" ("tokenHash");
CREATE INDEX IF NOT EXISTS "UserAuthToken_userId_purpose_idx" ON "UserAuthToken" ("userId", "purpose");
CREATE INDEX IF NOT EXISTS "UserAuthToken_expiresAt_idx" ON "UserAuthToken" ("expiresAt");

DO $$ BEGIN
  ALTER TABLE "UserAuthToken"
    ADD CONSTRAINT "UserAuthToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
