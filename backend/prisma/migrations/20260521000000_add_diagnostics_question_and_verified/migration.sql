-- AddColumn: User.verified (true uchun mavjud mutaxassislar va boshqa rollar)
ALTER TABLE "User" ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT 1;

-- CreateTable: DiagnosticsQuestion
CREATE TABLE "DiagnosticsQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Umumiy',
    "ageGroup" TEXT NOT NULL DEFAULT '0–5 yosh',
    "weight" INTEGER NOT NULL DEFAULT 2,
    "active" BOOLEAN NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
