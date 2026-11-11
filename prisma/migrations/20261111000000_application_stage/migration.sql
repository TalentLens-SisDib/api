ALTER TABLE "JobApplication" ADD COLUMN "currentStepId" TEXT REFERENCES "Step"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JobApplication" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'InProgress';
ALTER TABLE "JobApplication" ADD COLUMN "stageUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "JobApplication" SET "stageUpdatedAt" = "appliedAt";
