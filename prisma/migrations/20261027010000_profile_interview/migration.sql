-- Entrevistas passam a ser por candidato: Interview (usuário × etapa) agrupa
-- vários ProfileInterview (candidato), que guardam transcript/keyTakeaways.
--
-- Migração dos dados antigos (Interview.transcript/keyTakeaways):
--   * Se a vaga da etapa tem exatamente UMA candidatura (JobApplication), o
--     conteúdo vira um ProfileInterview desse candidato (id = id da Interview).
--   * Caso contrário não há como saber o candidato: o conteúdo é copiado para
--     "InterviewTranscriptBackup" (fora do Prisma Client) para recuperação
--     manual, e a Interview continua existindo sem registros de candidato.
--   * Transcrições vazias são descartadas.

-- CreateTable
CREATE TABLE "InterviewTranscriptBackup" (
    "interviewId" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "stepId" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "keyTakeaways" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "backedUpAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ProfileInterview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transcript" TEXT NOT NULL,
    "keyTakeaways" TEXT NOT NULL DEFAULT '[]',
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interviewId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    CONSTRAINT "ProfileInterview_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileInterview_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ApplicantProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfileInterview_interviewId_profileId_key" ON "ProfileInterview"("interviewId", "profileId");

-- MigrateData: atribui ao único candidato da vaga, quando existir
INSERT INTO "ProfileInterview" ("id", "transcript", "keyTakeaways", "startDate", "createdAt", "updatedAt", "interviewId", "profileId")
SELECT i."id", i."transcript", i."keyTakeaways", i."createdAt", i."createdAt", i."updatedAt", i."id", ja."profileId"
FROM "Interview" i
JOIN "Step" s ON s."id" = i."stepId"
JOIN "JobApplication" ja ON ja."jobOpeningId" = s."jobOpeningId"
WHERE trim(i."transcript") <> ''
  AND (SELECT count(*) FROM "JobApplication" x WHERE x."jobOpeningId" = s."jobOpeningId") = 1;

-- MigrateData: guarda o restante para recuperação manual
INSERT INTO "InterviewTranscriptBackup" ("interviewId", "userId", "stepId", "transcript", "keyTakeaways", "createdAt")
SELECT i."id", i."userId", i."stepId", i."transcript", i."keyTakeaways", i."createdAt"
FROM "Interview" i
WHERE trim(i."transcript") <> ''
  AND NOT EXISTS (SELECT 1 FROM "ProfileInterview" pi WHERE pi."interviewId" = i."id");

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Interview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "stepId" TEXT NOT NULL,
    CONSTRAINT "Interview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Interview_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Interview" ("createdAt", "id", "stepId", "updatedAt", "userId") SELECT "createdAt", "id", "stepId", "updatedAt", "userId" FROM "Interview";
DROP TABLE "Interview";
ALTER TABLE "new_Interview" RENAME TO "Interview";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
