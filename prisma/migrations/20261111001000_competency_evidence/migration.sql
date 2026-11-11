CREATE TABLE "CompetencyEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competencyId" TEXT NOT NULL,
    "competencyName" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profileId" TEXT NOT NULL,
    CONSTRAINT "CompetencyEvidence_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ApplicantProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "CompetencyEvidence_profileId_createdAt_idx" ON "CompetencyEvidence"("profileId", "createdAt");
