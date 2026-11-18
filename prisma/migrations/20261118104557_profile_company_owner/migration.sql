-- Candidatos passam a pertencer a uma empresa (e opcionalmente ao recrutador que os cadastrou).
-- Perfis existentes herdam a empresa da primeira vaga a que foram vinculados; sem vaga, a empresa
-- de quem os colocou no banco de talentos; sem nenhum dos dois, a primeira empresa cadastrada.
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ApplicantProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" INTEGER NOT NULL,
    "createdById" INTEGER,
    CONSTRAINT "ApplicantProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ApplicantProfile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ApplicantProfile" ("createdAt", "description", "id", "name", "updatedAt", "companyId", "createdById")
SELECT
    p."createdAt",
    p."description",
    p."id",
    p."name",
    p."updatedAt",
    COALESCE(
        (SELECT jo."companyId" FROM "JobApplication" ja
            JOIN "JobOpening" jo ON jo."id" = ja."jobOpeningId"
            WHERE ja."profileId" = p."id"
            ORDER BY ja."appliedAt" ASC LIMIT 1),
        (SELECT u."companyId" FROM "TalentPoolEntry" t
            JOIN "User" u ON u."id" = t."addedById"
            WHERE t."profileId" = p."id"),
        (SELECT MIN(c."id") FROM "Company" c)
    ),
    NULL
FROM "ApplicantProfile" p;
DROP TABLE "ApplicantProfile";
ALTER TABLE "new_ApplicantProfile" RENAME TO "ApplicantProfile";
CREATE INDEX "ApplicantProfile_companyId_idx" ON "ApplicantProfile"("companyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
