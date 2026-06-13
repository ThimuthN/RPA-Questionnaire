CREATE TABLE "EmailLog" (
  "id"          TEXT NOT NULL,
  "to"          TEXT NOT NULL,
  "cc"          TEXT,
  "subject"     TEXT NOT NULL,
  "template"    TEXT NOT NULL,
  "candidateId" TEXT,
  "sentById"    TEXT,
  "status"      TEXT NOT NULL DEFAULT 'sent',
  "errorMsg"    TEXT,
  "sentAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailLog_candidateId_sentAt_idx" ON "EmailLog"("candidateId", "sentAt");
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");

ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_candidateId_fkey"
  FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_sentById_fkey"
  FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
