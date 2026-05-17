-- CreateTable
CREATE TABLE "GameAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "game" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "dataUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "GameAsset_game_itemKey_kind_key" ON "GameAsset"("game", "itemKey", "kind");

-- CreateIndex
CREATE INDEX "GameAsset_game_idx" ON "GameAsset"("game");
