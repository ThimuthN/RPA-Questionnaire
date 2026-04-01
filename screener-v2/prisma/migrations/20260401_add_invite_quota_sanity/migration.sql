ALTER TABLE "Invite"
ADD CONSTRAINT "Invite_attempt_quota_sane"
CHECK (
  "maxAttempts" >= 0 AND
  "usedAttempts" >= 0 AND
  "usedAttempts" <= "maxAttempts"
) NOT VALID;
