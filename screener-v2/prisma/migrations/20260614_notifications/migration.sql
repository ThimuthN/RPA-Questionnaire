-- L1: AppNotification
CREATE TABLE "AppNotification" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "type"       TEXT NOT NULL,
  "title"      TEXT NOT NULL,
  "body"       TEXT,
  "entityType" TEXT,
  "entityId"   TEXT,
  "entityHref" TEXT,
  "readAt"     TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AppNotification_userId_readAt_createdAt_idx"
  ON "AppNotification"("userId", "readAt", "createdAt");

ALTER TABLE "AppNotification" ADD CONSTRAINT "AppNotification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
