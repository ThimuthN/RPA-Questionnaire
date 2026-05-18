-- Add quick facts fields to JobPosting for salary, team size, tech stack, and remote policy
ALTER TABLE "JobPosting" ADD COLUMN "salaryMin" INTEGER;
ALTER TABLE "JobPosting" ADD COLUMN "salaryMax" INTEGER;
ALTER TABLE "JobPosting" ADD COLUMN "teamSize" INTEGER;
ALTER TABLE "JobPosting" ADD COLUMN "techStack" TEXT;
ALTER TABLE "JobPosting" ADD COLUMN "remotePolicy" TEXT;
