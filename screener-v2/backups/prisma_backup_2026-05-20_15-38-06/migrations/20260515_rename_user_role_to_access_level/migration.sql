CREATE TYPE "AppAccessLevel" AS ENUM ('admin', 'recruiter', 'hiring_manager', 'interviewer', 'member');

ALTER TABLE "User"
  ADD COLUMN "accessLevel" "AppAccessLevel" NOT NULL DEFAULT 'member';

UPDATE "User"
SET "accessLevel" = CASE
  WHEN "role" = 'admin' THEN 'admin'::"AppAccessLevel"
  WHEN "role" = 'recruiter' THEN 'recruiter'::"AppAccessLevel"
  WHEN "role" = 'hiring_manager' THEN 'hiring_manager'::"AppAccessLevel"
  WHEN "role" = 'interviewer' THEN 'interviewer'::"AppAccessLevel"
  ELSE 'member'::"AppAccessLevel"
END;

ALTER TABLE "User" DROP COLUMN "role";
