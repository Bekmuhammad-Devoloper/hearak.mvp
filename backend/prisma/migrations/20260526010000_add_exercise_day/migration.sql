-- Rehabilitatsiya kuni: admin har mashqni `day` raqamiga biriktirib qo'yadi,
-- bola "Bugungi mashqlar" ro'yxati shu kunga mos mashqlarni ko'rsatadi.
-- `NULL` bo'lsa — mashq fond mashq sifatida saqlanadi (har kun uchun mavjud).
ALTER TABLE "Exercise" ADD COLUMN "day" INTEGER;
