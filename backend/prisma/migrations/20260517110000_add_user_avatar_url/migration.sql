-- AddColumn: User.avatarUrl (data URL yoki publik URL — null bo'lsa monogram ko'rsatiladi)
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
