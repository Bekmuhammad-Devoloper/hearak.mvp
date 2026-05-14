// Simple i18n scaffold. Add 'ru' later by extending dict.
export type Locale = "uz" | "ru";

const dict = {
  uz: {
    appName: "Hearak",
    tagline: "Eshitish va nutq sayohatingizdagi yo'ldosh",
    continue: "Davom etish",
    skip: "O'tkazib yuborish",
    getStarted: "Boshlash",
    signIn: "Kirish",
    signUp: "Ro'yxatdan o'tish",
    email: "Elektron pochta",
    password: "Parol",
    name: "Ism",
    fullName: "To'liq ism",
    save: "Saqlash",
    next: "Keyingisi",
    back: "Orqaga",
    done: "Bajarildi",
    today: "Bugun",
    todayFiveMin: "Bugungi 5 daqiqa",
    progress: "Rivojlanish",
    exercises: "Mashqlar",
    chat: "Yordamchi",
    settings: "Sozlamalar",
    home: "Asosiy",
    childName: "Bolaning ismi",
    dob: "Tug'ilgan sana",
    implantDate: "Implantatsiya sanasi",
    addChild: "Bola profilini qo'shish",
    diagnostics: "Diagnostika",
    startDiagnostics: "Diagnostikani boshlash",
    seeProgress: "Rivojlanishni ko'rish",
    milestones: "Bosqichlar",
    specialistPanel: "Mutaxassis paneli",
    notes: "Qaydlar",
    assignments: "Topshiriqlar",
    logout: "Chiqish",
    welcome: "Xush kelibsiz",
    askSomething: "Biror narsa so'rang...",
    send: "Yuborish",
    daysSinceImplant: "implantatsiyadan keyin",
  },
  ru: {} as Record<string, string>,
};

let current: Locale = "uz";
export const setLocale = (l: Locale) => { current = l; };
export const t = (key: keyof typeof dict["uz"]) =>
  (dict[current] as any)?.[key] ?? dict.uz[key];
