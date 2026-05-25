-- CreateTable: ChatConversation
CREATE TABLE "ChatConversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Yangi suhbat',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChatConversation_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ChatConversation_childId_updatedAt_idx" ON "ChatConversation"("childId", "updatedAt");

-- AlterTable: ChatMessage.conversationId (nullable, FK to ChatConversation)
ALTER TABLE "ChatMessage" ADD COLUMN "conversationId" TEXT REFERENCES "ChatConversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage"("conversationId", "createdAt");
