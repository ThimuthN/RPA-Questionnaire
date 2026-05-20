-- Add user profile enhancement fields
ALTER TABLE "User"
  ADD COLUMN "title" TEXT,
  ADD COLUMN "department" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "isInterviewer" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
