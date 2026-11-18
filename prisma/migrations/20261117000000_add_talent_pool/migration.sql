-- CreateTable
CREATE TABLE "TalentPoolEntry" (
    "profileId" TEXT NOT NULL PRIMARY KEY,
    "note" TEXT,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedById" INTEGER,
    CONSTRAINT "TalentPoolEntry_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ApplicantProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TalentPoolEntry_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TalentPoolEntry_addedAt_idx" ON "TalentPoolEntry"("addedAt");
