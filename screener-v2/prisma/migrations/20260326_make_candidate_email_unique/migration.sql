UPDATE "Candidate"
SET "email" = lower(trim("email"))
WHERE "email" IS NOT NULL;

WITH ranked AS (
  SELECT
    "id",
    "email",
    row_number() OVER (
      PARTITION BY "email"
      ORDER BY "createdAt" ASC, "id" ASC
    ) AS duplicate_rank
  FROM "Candidate"
  WHERE "email" IS NOT NULL
)
UPDATE "Candidate" AS candidate
SET "email" =
  split_part(ranked."email", '@', 1) || '+dedup-' || substr(candidate."id", 1, 8) || '@' || split_part(ranked."email", '@', 2)
FROM ranked
WHERE candidate."id" = ranked."id"
  AND ranked.duplicate_rank > 1;

CREATE UNIQUE INDEX "Candidate_email_key" ON "Candidate"("email");
