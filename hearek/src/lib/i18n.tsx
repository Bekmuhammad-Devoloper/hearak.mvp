import { createContext, useContext, useState, type ReactNode } from "react";

export type Locale = "uz" | "ru";
export const LANG_KEY = "hearak.lang";

const dict = {
  uz: {
    appName: "Nutq yo'li",
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
    // Auth
    welcomeBack: "Yana xush kelibsiz",
    startJourney: "Bolangiz sayohatini hozir boshlang",
    backToAccount: "Hisobingizga qayting",
    forgotPassword: "Unutdingizmi?",
    minChars: "Kamida 6 ta belgi",
    createAccount: "Hisob yaratish",
    demoAccount: "Demo hisob",
    // Dashboard
    greeting: "Assalomu alaykum",
    selectChild: "Bolani tanlash",
    addNewChild: "+ Yangi bola qo'shish",
    daysSince: "kun · implantatsiyadan keyin",
    todayStart: "Bugun boshlaylik",
    todayDone: "Bugun yakunlandi",
    todayContinue: "Davom etamiz",
    games: "Mini o'yinlar",
    gamesDesc: "4 ta qiziqarli",
    speechCheck: "Nutqni tinglash",
    speechDesc: "Mikrofon orqali",
    diagnosticsDesc: "8 ta savol",
    progressLabel: "Rivojlanish",
    progressDesc: "Grafik & bosqichlar",
    fromSpecialist: "Mutaxassisdan",
    markDone: "Bajarildi deb belgilandi",
    riskAlert: "Mutaxassis aralashuvi kerak",
    riskWarn: "E'tibor bering",
    // Progress
    daysPath: "kun yo'l",
    progressSubtitle: "Implantatsiyadan keyingi har bir qadam — ahamiyatli.",
    wordVocab: "So'z boyligi",
    last6Months: "Oxirgi 6 oy davomida",
    wordCount: "so'z",
    milestonesTimeline: "Vaqt jadvali",
    personalPath: "Shaxsiy yo'l",
    aiRoadmap: "AI Rivojlanish xaritasi",
    gamesSection: "O'yinlar",
    latestResults: "So'nggi natijalar",
    notPlayedYet: "Hozircha o'ynalmagan",
    dayN: "-kun · implantatsiyadan keyin",
    // Exercises
    exercisesCount: "ta kichik mashq",
    exercisesSubtitle: "Bolangizning kunidagi eng muhim payti — qisqa, izchil, samarali.",
    minutes: "daqiqa",
    markComplete: "Bajarildi deb belgilash",
    unmark: "Bekor qilish",
    // Chat
    aiHelper: "AI yordamchi",
    aiAssistant: "Nutq yo'li suhbatdosh",
    // Settings index
    account: "Hisobingiz",
    settingsKicker: "Sozlamalar",
    profileInfo: "Profil ma'lumotlari",
    childProfiles: "Bola profillari",
    notifications: "Bildirishnomalar",
    language: "Til",
    currentLangLabel: "O'zbekcha",
    parent: "Ota-ona",
    specialistRole: "Mutaxassis",
    specialistPanelBtn: "Mutaxassis paneliga o'tish",
    guest: "Mehmon",
    // Language page
    langUz: "O'zbekcha",
    langUzHint: "Asosiy til",
    langRu: "Русский",
    langRuHint: "Qo'shimcha til",
    langSelectedUz: "O'zbekcha tanlandi",
    langSelectedRu: "Выбран русский",
    // Profile
    choosePhoto: "Rasm tanlash",
    removePhoto: "O'chirish",
    // Notifications
    dailyExercises: "Kunlik mashqlar",
    dailyExercisesDesc: "Har kuni eslatma yuboramiz",
    newMilestones: "Yangi bosqichlar",
    newMilestonesDesc: "Bola yangi yutuqqa erishganda",
    specialistMsgs: "Mutaxassis xabarlari",
    specialistMsgsDesc: "Yangi qayd yoki topshiriqlar",
    // Children settings
    noProfiles: "Hozircha profillar yo'q",
    addChildPlus: "+ Bola qo'shish",
    // Add child
    newProfileKicker: "Yangi profil",
    meetChildTitle: "Bolangiz bilan tanishaylik",
    meetChildDesc: "Sayohatni shaxsiylashtirish uchun uchta asosiy ma'lumot kifoya.",
    implantStartNote: "Rivojlanish bosqichlari shu kundan boshlanadi.",
    saveAndStart: "Saqlash va boshlash",
    // Onboarding
    slide0Eyebrow: "Implantatsiyadan keyin",
    slide0Title: "Har bir kun — kichik g'alaba",
    slide0Text: "Bolangizning eshitish va nutq rivojini implantatsiya kunidan boshlab nozik kuzating.",
    slide1Eyebrow: "Bugungi 5 daqiqa",
    slide1Title: "Qisqa va izchil mashqlar",
    slide1Text: "Har kuni 3 ta sodda mashq — o'yin, nutq va eshitish. Ortiqcha emas, kifoyalik.",
    slide2Eyebrow: "Mutaxassis bilan",
    slide2Title: "Yolg'iz emassiz",
    slide2Text: "Surdopedagog bilan aloqada bo'ling va istalgan vaqtda AI yordamchidan so'rang.",
  },
  ru: {
    appName: "Nutq yo'li",
    tagline: "Ваш спутник в путешествии слуха и речи",
    continue: "Продолжить",
    skip: "Пропустить",
    getStarted: "Начать",
    signIn: "Войти",
    signUp: "Регистрация",
    email: "Электронная почта",
    password: "Пароль",
    name: "Имя",
    fullName: "Полное имя",
    save: "Сохранить",
    next: "Далее",
    back: "Назад",
    done: "Готово",
    today: "Сегодня",
    todayFiveMin: "Сегодня 5 минут",
    progress: "Развитие",
    exercises: "Упражнения",
    chat: "Помощник",
    settings: "Настройки",
    home: "Главная",
    childName: "Имя ребёнка",
    dob: "Дата рождения",
    implantDate: "Дата имплантации",
    addChild: "Добавить профиль ребёнка",
    diagnostics: "Диагностика",
    startDiagnostics: "Начать диагностику",
    seeProgress: "Смотреть развитие",
    milestones: "Этапы",
    specialistPanel: "Панель специалиста",
    notes: "Заметки",
    assignments: "Задания",
    logout: "Выйти",
    welcome: "Добро пожаловать",
    askSomething: "Задайте вопрос...",
    send: "Отправить",
    daysSinceImplant: "после имплантации",
    // Auth
    welcomeBack: "С возвращением",
    startJourney: "Начните путь вашего ребёнка прямо сейчас",
    backToAccount: "Вернитесь в свой аккаунт",
    forgotPassword: "Забыли?",
    minChars: "Минимум 6 символов",
    createAccount: "Создать аккаунт",
    demoAccount: "Демо аккаунт",
    // Dashboard
    greeting: "Здравствуйте",
    selectChild: "Выбрать ребёнка",
    addNewChild: "+ Добавить нового ребёнка",
    daysSince: "дн. · после имплантации",
    todayStart: "Начнём сегодня",
    todayDone: "Сегодня завершено",
    todayContinue: "Продолжаем",
    games: "Мини-игры",
    gamesDesc: "4 интересных",
    speechCheck: "Слушать речь",
    speechDesc: "Через микрофон",
    diagnosticsDesc: "8 вопросов",
    progressLabel: "Развитие",
    progressDesc: "График и этапы",
    fromSpecialist: "От специалиста",
    markDone: "Отмечено как выполнено",
    riskAlert: "Требуется вмешательство специалиста",
    riskWarn: "Обратите внимание",
    // Progress
    daysPath: "дней пути",
    progressSubtitle: "Каждый шаг после имплантации важен.",
    wordVocab: "Словарный запас",
    last6Months: "За последние 6 месяцев",
    wordCount: "слов",
    milestonesTimeline: "Хронология",
    personalPath: "Личный путь",
    aiRoadmap: "AI Карта развития",
    gamesSection: "Игры",
    latestResults: "Последние результаты",
    notPlayedYet: "Пока не играли",
    dayN: "-дн. · после имплантации",
    // Exercises
    exercisesCount: "упражнений",
    exercisesSubtitle: "Самый важный момент дня вашего ребёнка — короткий, стабильный, эффективный.",
    minutes: "минут",
    markComplete: "Отметить как выполненное",
    unmark: "Отменить",
    // Chat
    aiHelper: "AI помощник",
    aiAssistant: "Собеседник Nutq yo'li",
    // Settings index
    account: "Ваш аккаунт",
    settingsKicker: "Настройки",
    profileInfo: "Данные профиля",
    childProfiles: "Профили детей",
    notifications: "Уведомления",
    language: "Язык",
    currentLangLabel: "Русский",
    parent: "Родитель",
    specialistRole: "Специалист",
    specialistPanelBtn: "Перейти в панель специалиста",
    guest: "Гость",
    // Language page
    langUz: "O'zbekcha",
    langUzHint: "Основной язык",
    langRu: "Русский",
    langRuHint: "Дополнительный язык",
    langSelectedUz: "O'zbekcha tanlandi",
    langSelectedRu: "Выбран русский",
    // Profile
    choosePhoto: "Выбрать фото",
    removePhoto: "Удалить",
    // Notifications
    dailyExercises: "Ежедневные упражнения",
    dailyExercisesDesc: "Отправляем напоминание каждый день",
    newMilestones: "Новые этапы",
    newMilestonesDesc: "Когда ребёнок достигает нового результата",
    specialistMsgs: "Сообщения специалиста",
    specialistMsgsDesc: "Новые заметки или задания",
    // Children settings
    noProfiles: "Профилей пока нет",
    addChildPlus: "+ Добавить ребёнка",
    // Add child
    newProfileKicker: "Новый профиль",
    meetChildTitle: "Познакомимся с вашим ребёнком",
    meetChildDesc: "Для персонализации пути достаточно трёх основных данных.",
    implantStartNote: "Этапы развития начинаются с этого дня.",
    saveAndStart: "Сохранить и начать",
    // Onboarding
    slide0Eyebrow: "После имплантации",
    slide0Title: "Каждый день — маленькая победа",
    slide0Text: "Тонко отслеживайте развитие слуха и речи вашего ребёнка с первого дня имплантации.",
    slide1Eyebrow: "Сегодня 5 минут",
    slide1Title: "Короткие и постоянные упражнения",
    slide1Text: "Каждый день 3 простых упражнения — игра, речь и слух. Не больше, но достаточно.",
    slide2Eyebrow: "Со специалистом",
    slide2Title: "Вы не одни",
    slide2Text: "Оставайтесь на связи с сурдопедагогом и спрашивайте AI помощника в любое время.",
  },
} as const;

export type DictKey = keyof typeof dict["uz"];

// ── React context ────────────────────────────────────────────────
interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: DictKey) => string;
}

const LocaleContext = createContext<LocaleCtx>({
  locale: "uz",
  setLocale: () => {},
  t: (key) => dict.uz[key],
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const raw = window.localStorage.getItem(LANG_KEY);
      if (raw === "ru" || raw === "uz") return raw;
    } catch { /* ignore */ }
    return "uz";
  });

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try { window.localStorage.setItem(LANG_KEY, l); } catch { /* ignore */ }
  };

  const t = (key: DictKey): string =>
    (dict[locale] as Record<string, string>)[key] ?? dict.uz[key];

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);
export const useT = () => useContext(LocaleContext).t;

// Legacy — module-level t() for non-reactive contexts (still works for uz default)
export const t = (key: DictKey) => dict.uz[key];
export const setLocale = (_l: Locale) => {};
