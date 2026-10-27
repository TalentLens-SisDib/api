-- CreateTable
CREATE TABLE "CulturalFit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "JobOpeningCulturalFit" (
    "jobOpeningId" TEXT NOT NULL,
    "culturalFitId" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL,

    PRIMARY KEY ("jobOpeningId", "culturalFitId"),
    CONSTRAINT "JobOpeningCulturalFit_jobOpeningId_fkey" FOREIGN KEY ("jobOpeningId") REFERENCES "JobOpening" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JobOpeningCulturalFit_culturalFitId_fkey" FOREIGN KEY ("culturalFitId") REFERENCES "CulturalFit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileCulturalFit" (
    "profileId" TEXT NOT NULL,
    "culturalFitId" TEXT NOT NULL,

    PRIMARY KEY ("profileId", "culturalFitId"),
    CONSTRAINT "ProfileCulturalFit_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ApplicantProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileCulturalFit_culturalFitId_fkey" FOREIGN KEY ("culturalFitId") REFERENCES "CulturalFit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
