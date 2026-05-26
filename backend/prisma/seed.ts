import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Idempotent production seed:
 *  - Admin hisobini yaratadi/yangilaydi (admin@misol.uz / admin1234).
 *  - Avval mavjud bo'lgan demo hisoblar (ona@misol.uz, nigora@misol.uz) va
 *    ularga bog'liq barcha bolalar, mashq tarixlari, suhbatlar, tashriflar
 *    o'chiriladi (Child.parent onDelete: Cascade orqali).
 *
 *  Yangi muhitda hech qanday demo data yaratilmaydi — toza holatda
 *  faqat admin qoladi.
 */
const prisma = new PrismaClient();

const LEGACY_DEMO_EMAILS = ['ona@misol.uz', 'nigora@misol.uz'];

async function main() {
  console.log('🌱 Seeding…');

  // 1) Mavjud demo foydalanuvchilarni va ularning bog'liq ma'lumotlarini tozalash.
  //    Cascade orqali Child → Milestone, ChatMessage, ExerciseCompletion va h.k.
  //    avtomatik o'chiriladi (schema'da onDelete: Cascade belgilangan).
  const removed = await prisma.user.deleteMany({
    where: { email: { in: LEGACY_DEMO_EMAILS } },
  });
  if (removed.count > 0) {
    console.log(`   • Demo foydalanuvchilar tozalandi: ${removed.count}`);
  }

  // 2) Admin hisobini yaratish yoki yangilash.
  const adminPasswordHash = await bcrypt.hash('admin1234', 10);
  await prisma.user.upsert({
    where: { email: 'admin@misol.uz' },
    update: { role: 'admin', fullName: "Nutq Yo'li Admin", title: 'Super admin', avatarLetter: 'N' },
    create: {
      email: 'admin@misol.uz',
      fullName: "Nutq Yo'li Admin",
      passwordHash: adminPasswordHash,
      role: 'admin',
      title: 'Super admin',
      avatarLetter: 'N',
    },
  });

  console.log('✅ Seed complete.');
  console.log('   Admin: admin@misol.uz / admin1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
