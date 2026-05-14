import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const MILESTONE_TEMPLATE = [
  { day: 7, title: 'Birinchi tovushga reaksiya' },
  { day: 30, title: "Ovozni qidirish" },
  { day: 90, title: "Ismiga javob berish" },
  { day: 180, title: "Birinchi so'zlar" },
  { day: 365, title: 'Qisqa jumlalar' },
  { day: 540, title: "Suhbatga qo'shilish" },
];

const MONTHLY = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn'];

async function main() {
  console.log('🌱 Seeding…');

  const passwordHash = await bcrypt.hash('demo1234', 10);

  const parent = await prisma.user.upsert({
    where: { email: 'ona@misol.uz' },
    update: {},
    create: {
      email: 'ona@misol.uz',
      fullName: 'Aziza Karimova',
      passwordHash,
      role: 'parent',
      avatarLetter: 'A',
    },
  });

  const specialist = await prisma.user.upsert({
    where: { email: 'nigora@misol.uz' },
    update: {},
    create: {
      email: 'nigora@misol.uz',
      fullName: 'Dr. Nigora Yusupova',
      passwordHash,
      role: 'specialist',
      title: 'Logoped',
      avatarLetter: 'N',
    },
  });

  const seeds: Array<{
    name: string;
    dob: string;
    implantDate: string;
    stage: string;
    stageNumber: number;
    totalStages: number;
    emoji: string;
    wordCount: number;
  }> = [
    {
      name: 'Diyora',
      dob: '2021-03-14',
      implantDate: '2023-06-10',
      stage: "So'zlarni tanish bosqichi",
      stageNumber: 3,
      totalStages: 6,
      emoji: '👧',
      wordCount: 47,
    },
    {
      name: 'Asilbek',
      dob: '2022-08-02',
      implantDate: '2025-09-01',
      stage: 'Tovushlarga reaksiya bosqichi',
      stageNumber: 1,
      totalStages: 6,
      emoji: '👦',
      wordCount: 8,
    },
    {
      name: 'Madina',
      dob: '2020-12-20',
      implantDate: '2023-11-12',
      stage: 'Qisqa jumlalar bosqichi',
      stageNumber: 4,
      totalStages: 6,
      emoji: '👧',
      wordCount: 82,
    },
  ];

  for (const s of seeds) {
    const existing = await prisma.child.findFirst({
      where: { parentId: parent.id, name: s.name },
    });
    if (existing) continue;

    const child = await prisma.child.create({
      data: {
        parentId: parent.id,
        name: s.name,
        dob: new Date(s.dob),
        implantDate: new Date(s.implantDate),
        stage: s.stage,
        stageNumber: s.stageNumber,
        totalStages: s.totalStages,
        emoji: s.emoji,
        wordCount: s.wordCount,
      },
    });

    for (const m of MILESTONE_TEMPLATE) {
      const done = m.day <= Math.min(90, child.stageNumber * 60);
      const current = !done && m.day <= child.stageNumber * 90 + 60;
      await prisma.milestone.create({
        data: { childId: child.id, day: m.day, title: m.title, done, current },
      });
    }

    const base = Math.max(4, Math.round(child.wordCount / 12));
    for (let i = 0; i < MONTHLY.length; i++) {
      const value = Math.round(base + ((child.wordCount - base) / (MONTHLY.length - 1)) * i);
      await prisma.progressPoint.create({
        data: { childId: child.id, month: MONTHLY[i], value, order: i },
      });
    }

    await prisma.chatMessage.create({
      data: {
        childId: child.id,
        from: 'ai',
        text: 'Salom! Men Hearak yordamchisiman. Bugun qanday yordam bera olaman?',
      },
    });

    if (child.name === 'Diyora') {
      await prisma.chatMessage.create({
        data: {
          childId: child.id,
          from: 'user',
          text: "Bolam yangi tovushlarga qo'rqib reaksiya bildirayapti. Bu normalmi?",
        },
      });
      await prisma.chatMessage.create({
        data: {
          childId: child.id,
          from: 'ai',
          text: 'Ha, bu juda tabiiy. Implantdan so\'ng yangi tovushlar dunyosi ochiladi va bola asta-sekin moslashadi. Sekin va past ovozlardan boshlang.',
        },
      });

      for (const note of [
        "Tovushlarga reaksiya yaxshilanmoqda. Yangi so'zlarni qo'shamiz.",
        "Birinchi seans. Ona bilan suhbat o'tkazildi.",
      ]) {
        await prisma.note.create({
          data: { childId: child.id, specialistId: specialist.id, text: note },
        });
      }

      for (const title of [
        'Kundalik 5 daqiqa mashqlari',
        "Tabiat tovushlari ro'yxati",
        'Hafta oxiri uchrashuvi',
      ]) {
        await prisma.assignment.create({
          data: {
            childId: child.id,
            specialistId: specialist.id,
            title,
            done: false,
          },
        });
      }
    }
  }

  console.log('✅ Seed complete.');
  console.log('   Parent:     ona@misol.uz / demo1234');
  console.log('   Specialist: nigora@misol.uz / demo1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
