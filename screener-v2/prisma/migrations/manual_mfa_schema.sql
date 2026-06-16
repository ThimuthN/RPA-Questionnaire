ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "mfaSecret" TEXT,
  ADD COLUMN IF NOT EXISTS "mfaBackupCodes" TEXT,
  ADD COLUMN IF NOT EXISTS "mfaEnrolledAt" TIMESTAMP(3);

ALTER TABLE "AuditLog"
  ADD COLUMN IF NOT EXISTS "ipAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "userAgent" TEXT;

CREATE TABLE IF NOT EXISTS "MfaTrustedDevice" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "tokenHash"   TEXT NOT NULL,
  "deviceLabel" TEXT,
  "lastUsedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"   TIMESTAMP(3) NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MfaTrustedDevice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MfaTrustedDevice_tokenHash_key" ON "MfaTrustedDevice"("tokenHash");
CREATE INDEX IF NOT EXISTS "MfaTrustedDevice_userId_idx" ON "MfaTrustedDevice"("userId");
CREATE INDEX IF NOT EXISTS "MfaTrustedDevice_expiresAt_idx" ON "MfaTrustedDevice"("expiresAt");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'MfaTrustedDevice_userId_fkey'
  ) THEN
    ALTER TABLE "MfaTrustedDevice"
      ADD CONSTRAINT "MfaTrustedDevice_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
