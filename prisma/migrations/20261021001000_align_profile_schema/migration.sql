-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ApplicantProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ApplicantProfile" ("description", "id", "name") SELECT "description", "id", "name" FROM "ApplicantProfile";
DROP TABLE "ApplicantProfile";
ALTER TABLE "new_ApplicantProfile" RENAME TO "ApplicantProfile";
CREATE TABLE "new_JobOpening" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "expectedWage" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "JobOpening_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JobOpening_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_JobOpening" ("companyId", "description", "expectedWage", "id", "name", "userId") SELECT "companyId", "description", "expectedWage", "id", "name", "userId" FROM "JobOpening";
DROP TABLE "JobOpening";
ALTER TABLE "new_JobOpening" RENAME TO "JobOpening";
CREATE TABLE "new_Requirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Requirement" ("id", "name") SELECT "id", "name" FROM "Requirement";
DROP TABLE "Requirement";
ALTER TABLE "new_Requirement" RENAME TO "Requirement";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
