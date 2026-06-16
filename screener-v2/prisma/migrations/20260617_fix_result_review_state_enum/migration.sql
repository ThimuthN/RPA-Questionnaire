CREATE TYPE "ResultReviewState" AS ENUM ('unreviewed', 'reviewed', 'flagged');
ALTER TABLE "Result" ALTER COLUMN "reviewState" DROP DEFAULT;
ALTER TABLE "Result"
  ALTER COLUMN "reviewState" TYPE "ResultReviewState"
  USING "reviewState"::"ResultReviewState";
ALTER TABLE "Result" ALTER COLUMN "reviewState" SET DEFAULT 'unreviewed'::"ResultReviewState";
