-- G1: SchedulingToken
CREATE TABLE "SchedulingToken" (
  "id"        TEXT NOT NULL,
  "token"     TEXT NOT NULL,
  "panelId"   TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SchedulingToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SchedulingToken_token_key" ON "SchedulingToken"("token");
CREATE INDEX "SchedulingToken_token_idx" ON "SchedulingToken"("token");
CREATE INDEX "SchedulingToken_panelId_idx" ON "SchedulingToken"("panelId");

ALTER TABLE "SchedulingToken" ADD CONSTRAINT "SchedulingToken_panelId_fkey"
  FOREIGN KEY ("panelId") REFERENCES "InterviewPanel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- G2: AvailabilityWindow
CREATE TABLE "AvailabilityWindow" (
  "id"        TEXT NOT NULL,
  "panelId"   TEXT NOT NULL,
  "startsAt"  TIMESTAMP(3) NOT NULL,
  "endsAt"    TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AvailabilityWindow_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AvailabilityWindow_panelId_startsAt_idx" ON "AvailabilityWindow"("panelId", "startsAt");

ALTER TABLE "AvailabilityWindow" ADD CONSTRAINT "AvailabilityWindow_panelId_fkey"
  FOREIGN KEY ("panelId") REFERENCES "InterviewPanel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
