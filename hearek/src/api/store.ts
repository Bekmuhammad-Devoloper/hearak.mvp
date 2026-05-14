import type {
  Assignment,
  ChatMessage,
  Child,
  DiagnosticsSubmission,
  ExerciseCompletion,
  ExerciseTemplate,
  GameScore,
  Milestone,
  Note,
  ProgressPoint,
  Session,
  SpeechCheck,
  User,
} from "./types";

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export const diagnosticsQuestions = [
  "Bola o'z ismiga reaksiya bildiradimi?",
  "Bola atrofdagi tovushlarga e'tibor beradimi?",
  "Bola oddiy so'zlarni takrorlay oladimi?",
  "Bola ovoz manbasini qidiradimi?",
  "Bola musiqaga qiziqadimi?",
  "Bola sizning ohangingizni tushunadimi?",
  "Bola qisqa ko'rsatmalarga amal qiladimi?",
  "Bola boshqa bolalar bilan muloqot qilishga harakat qiladimi?",
];

export const exerciseTemplates: ExerciseTemplate[] = [
  { id: "ex_sound_find", title: "Tovushlarni topish o'yini", type: "O'yin", minutes: 3, emoji: "🎯" },
  { id: "ex_mama_repeat", title: "\"Mama\" so'zini takrorlash", type: "Nutq", minutes: 2, emoji: "💬" },
  { id: "ex_nature", title: "Tabiat tovushlarini eshitish", type: "Eshitish", minutes: 2, emoji: "🎧" },
  { id: "ex_animals", title: "Hayvonlar nomi", type: "Nutq", minutes: 3, emoji: "🐶" },
  { id: "ex_rhythm", title: "Ritm va qarsak", type: "O'yin", minutes: 2, emoji: "👏" },
  { id: "ex_household", title: "Uy buyumlari nomlari", type: "Nutq", minutes: 3, emoji: "🏠" },
];

const milestoneTemplate = [
  { day: 7, title: "Birinchi tovushga reaksiya" },
  { day: 30, title: "Ovozni qidirish" },
  { day: 90, title: "Ismiga javob berish" },
  { day: 180, title: "Birinchi so'zlar" },
  { day: 365, title: "Qisqa jumlalar" },
  { day: 540, title: "Suhbatga qo'shilish" },
];

const monthlyTemplate = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn"];

type Store = {
  users: Map<string, User>;
  passwords: Map<string, string>;
  sessions: Map<string, Session>;
  children: Map<string, Child>;
  milestones: Map<string, Milestone>;
  progress: ProgressPoint[];
  completions: ExerciseCompletion[];
  diagnostics: DiagnosticsSubmission[];
  notes: Map<string, Note>;
  assignments: Map<string, Assignment>;
  chat: ChatMessage[];
  speechChecks: SpeechCheck[];
  gameScores: GameScore[];
};

const g = globalThis as unknown as { __HEARAK_STORE__?: Store };

function createStore(): Store {
  const store: Store = {
    users: new Map(),
    passwords: new Map(),
    sessions: new Map(),
    children: new Map(),
    milestones: new Map(),
    progress: [],
    completions: [],
    diagnostics: [],
    notes: new Map(),
    assignments: new Map(),
    chat: [],
    speechChecks: [],
    gameScores: [],
  };

  const parent: User = {
    id: "u_demo_parent",
    fullName: "Aziza Karimova",
    email: "ona@misol.uz",
    role: "parent",
    avatarLetter: "A",
  };
  store.users.set(parent.id, parent);
  store.passwords.set(parent.email, "demo1234");

  const specialist: User = {
    id: "u_demo_specialist",
    fullName: "Dr. Nigora Yusupova",
    email: "nigora@misol.uz",
    role: "specialist",
    title: "Logoped",
    avatarLetter: "N",
  };
  store.users.set(specialist.id, specialist);
  store.passwords.set(specialist.email, "demo1234");

  const seeds: Array<Omit<Child, "id" | "parentId" | "createdAt">> = [
    {
      name: "Diyora",
      dob: "2021-03-14",
      implantDate: "2023-06-10",
      stage: "So'zlarni tanish bosqichi",
      stageNumber: 3,
      totalStages: 6,
      emoji: "👧",
      wordCount: 47,
    },
    {
      name: "Asilbek",
      dob: "2022-08-02",
      implantDate: "2025-09-01",
      stage: "Tovushlarga reaksiya bosqichi",
      stageNumber: 1,
      totalStages: 6,
      emoji: "👦",
      wordCount: 8,
    },
    {
      name: "Madina",
      dob: "2020-12-20",
      implantDate: "2023-11-12",
      stage: "Qisqa jumlalar bosqichi",
      stageNumber: 4,
      totalStages: 6,
      emoji: "👧",
      wordCount: 82,
    },
  ];

  for (const seed of seeds) {
    const child: Child = {
      ...seed,
      id: id("c"),
      parentId: parent.id,
      createdAt: new Date().toISOString(),
    };
    store.children.set(child.id, child);
    seedDerivedForChild(store, child);
  }

  return store;
}

function seedDerivedForChild(store: Store, child: Child) {
  for (const m of milestoneTemplate) {
    const done = m.day <= Math.min(90, child.stageNumber * 60);
    const current = !done && m.day <= child.stageNumber * 90 + 60;
    const milestone: Milestone = {
      id: id("ms"),
      childId: child.id,
      day: m.day,
      title: m.title,
      done,
      current,
    };
    store.milestones.set(milestone.id, milestone);
  }

  const base = Math.max(4, Math.round(child.wordCount / 12));
  monthlyTemplate.forEach((month, i) => {
    store.progress.push({
      childId: child.id,
      month,
      value: Math.round(base + ((child.wordCount - base) / (monthlyTemplate.length - 1)) * i),
    });
  });

  const seedChat: Array<{ from: "ai" | "user"; text: string }> = [
    { from: "ai", text: "Salom! Men Hearak yordamchisiman. Bugun qanday yordam bera olaman?" },
  ];
  if (child.name === "Diyora") {
    seedChat.push(
      { from: "user", text: "Bolam yangi tovushlarga qo'rqib reaksiya bildirayapti. Bu normalmi?" },
      {
        from: "ai",
        text:
          "Ha, bu juda tabiiy. Implantdan so'ng yangi tovushlar dunyosi ochiladi va bola asta-sekin moslashadi. Sekin va past ovozlardan boshlang.",
      },
    );
  }
  for (const m of seedChat) {
    store.chat.push({
      id: id("m"),
      childId: child.id,
      from: m.from,
      text: m.text,
      createdAt: new Date().toISOString(),
    });
  }

  if (child.name === "Diyora") {
    const specialist = "u_demo_specialist";
    const sample: Array<Omit<Note, "id" | "childId" | "specialistId">> = [
      { text: "Tovushlarga reaksiya yaxshilanmoqda. Yangi so'zlarni qo'shamiz.", createdAt: "2026-04-12T10:00:00Z" },
      { text: "Birinchi seans. Ona bilan suhbat o'tkazildi.", createdAt: "2026-03-28T10:00:00Z" },
    ];
    for (const n of sample) {
      const note: Note = { id: id("n"), childId: child.id, specialistId: specialist, ...n };
      store.notes.set(note.id, note);
    }

    for (const title of ["Kundalik 5 daqiqa mashqlari", "Tabiat tovushlari ro'yxati", "Hafta oxiri uchrashuvi"]) {
      const a: Assignment = {
        id: id("a"),
        childId: child.id,
        specialistId: specialist,
        title,
        createdAt: new Date().toISOString(),
        done: false,
      };
      store.assignments.set(a.id, a);
    }
  }
}

export function getStore(): Store {
  if (!g.__HEARAK_STORE__) g.__HEARAK_STORE__ = createStore();
  return g.__HEARAK_STORE__;
}

export function newId(prefix: string) {
  return id(prefix);
}
