ALTER TABLE "JobApplication" ADD COLUMN "closureReason" TEXT;
ALTER TABLE "JobApplication" ADD COLUMN "closureNotes" TEXT;
ALTER TABLE "JobApplication" ADD COLUMN "closedAt" DATETIME;
ALTER TABLE "JobApplication" ADD COLUMN "closedById" INTEGER REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
