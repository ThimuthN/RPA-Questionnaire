ALTER TABLE "Invite"
ADD COLUMN "contextType" TEXT NOT NULL DEFAULT 'general';

ALTER TABLE "Attempt"
ADD COLUMN "contextType" TEXT NOT NULL DEFAULT 'general';

ALTER TABLE "Result"
ADD COLUMN "contextType" TEXT NOT NULL DEFAULT 'general',
ADD COLUMN "reviewState" TEXT NOT NULL DEFAULT 'unreviewed';

CREATE INDEX "Result_reviewState_createdAt_idx" ON "Result"("reviewState", "createdAt");
