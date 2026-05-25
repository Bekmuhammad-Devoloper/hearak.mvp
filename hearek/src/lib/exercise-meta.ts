import {
  Apple,
  Bell,
  Brain,
  Cherry,
  Compass,
  Disc,
  Drum,
  Ear,
  Footprints,
  Gamepad2,
  Hand,
  Hash,
  Headphones,
  House,
  Image as ImageIcon,
  MessageCircle,
  Music,
  Palette,
  Sparkles,
  Target,
  Users,
  Volume2,
  type LucideIcon,
} from "lucide-react";

/** Daily exercise type strings as stored by backend. */
export type ExerciseType = "O'yin" | "Nutq" | "Eshitish";

/** Visual tone — picks color palette for the card. */
export type ExerciseTone = "primary" | "accent" | "warm";

/** Game keys exposed by /games (must match the SoundFind/Direction/WordPick/Repeat keys). */
export type GameKey = "sound-find" | "direction" | "word-pick" | "repeat";

/**
 * Per-template Lucide icon. Unknown IDs (admin-created) fall back to per-type icon.
 */
export const EXERCISE_ICON_BY_ID: Record<string, LucideIcon> = {
  ex_family: Users,
  ex_ona_repeat: Users,
  ex_animals: Cherry,
  ex_fruits: Apple,
  ex_colors: Palette,
  ex_numbers: Hash,
  ex_body: Hand,
  ex_actions: Footprints,
  ex_household: House,
  ex_nature: Headphones,
  ex_sound_loc: Compass,
  ex_loud_quiet: Volume2,
  ex_music: Music,
  ex_home_sounds: Bell,
  ex_sound_find: Target,
  ex_rhythm: Drum,
  ex_word_pick: ImageIcon,
  ex_memory_sound: Brain,
};

export const EXERCISE_FALLBACK_BY_TYPE: Record<ExerciseType, LucideIcon> = {
  Nutq: MessageCircle,
  Eshitish: Ear,
  "O'yin": Gamepad2,
};

export const EXERCISE_TONE_BY_TYPE: Record<ExerciseType, ExerciseTone> = {
  Nutq: "primary",
  Eshitish: "accent",
  "O'yin": "warm",
};

export const exerciseToneClasses: Record<
  ExerciseTone,
  { bg: string; ring: string; iconBg: string; iconText: string }
> = {
  primary: {
    bg: "bg-primary-soft/70",
    ring: "ring-primary/15",
    iconBg: "bg-primary/12",
    iconText: "text-primary",
  },
  accent: {
    bg: "bg-accent-soft/70",
    ring: "ring-accent/20",
    iconBg: "bg-accent/15",
    iconText: "text-accent-foreground",
  },
  warm: {
    bg: "bg-warm-soft/70",
    ring: "ring-warm/25",
    iconBg: "bg-warm/15",
    iconText: "text-warm-foreground",
  },
};

export function exerciseVisual(
  id: string,
  type: ExerciseType,
): { Icon: LucideIcon; tone: ExerciseTone } {
  const Icon = EXERCISE_ICON_BY_ID[id] ?? EXERCISE_FALLBACK_BY_TYPE[type] ?? Sparkles;
  const tone = EXERCISE_TONE_BY_TYPE[type] ?? "primary";
  return { Icon, tone };
}

/** Short label per template ID (Oila, Sonlar, ...). Unknown IDs derive from title. */
export const EXERCISE_SHORT_LABEL: Record<string, string> = {
  ex_family: "Oila",
  ex_ona_repeat: "Oila a'zolari",
  ex_animals: "Hayvonlar",
  ex_fruits: "Mevalar",
  ex_colors: "Ranglar",
  ex_numbers: "Sonlar",
  ex_body: "Tana",
  ex_actions: "Harakat",
  ex_household: "Buyumlar",
  ex_nature: "Tabiat",
  ex_sound_loc: "Yo'nalish",
  ex_loud_quiet: "Baland-past",
  ex_music: "Musiqa",
  ex_home_sounds: "Uy ovozlari",
  ex_sound_find: "Topish",
  ex_rhythm: "Ritm",
  ex_word_pick: "Rasm",
  ex_memory_sound: "Xotira",
};

export function exerciseShortLabel(id: string, title: string): string {
  if (EXERCISE_SHORT_LABEL[id]) return EXERCISE_SHORT_LABEL[id];
  const cleaned = title.replace(/["'`]/g, "").trim();
  const firstWord = cleaned.split(/\s+/)[0] ?? title;
  return firstWord.length > 12 ? firstWord.slice(0, 11) + "…" : firstWord;
}

/**
 * Map exercise template ID → in-app game route. Only IDs listed here open a
 * real interactive game; others use the home-practice dialog flow.
 */
export const EXERCISE_TO_GAME: Record<string, GameKey> = {
  ex_sound_find: "sound-find",
  ex_sound_loc: "direction",
  ex_word_pick: "word-pick",
};

/**
 * Per-ID brief practice tip shown in the home-practice dialog. Unknown IDs
 * use a generic per-type tip.
 */
export const EXERCISE_TIPS: Record<string, string> = {
  ex_family:
    "Bola bilan oilangizdagi har bir a'zoni rasm yoki ko'rgazma orqali nomlab bering ('Ona', 'Ota', 'Aka'). Takrorlashga harakat qilsa, jiddiy maqtang.",
  ex_animals:
    "Hayvon rasmlari yoki o'yinchoqlari bilan har birining nomini sekin ayting. Hayvon tovushini ham qo'shing ('mushuk — miyov'). Bola takrorlasa, qo'llab-quvvatlang.",
  ex_fruits:
    "Bo'lim asboblari yoki rasm orqali meva nomlarini ayting. Iloji bo'lsa, bolaga ushlab ko'rishga bering — sezgi va so'z bog'lansa, eslab qolish oson.",
  ex_colors:
    "Atrof-muhitdan 3–4 ta rangni tanlang. Har birini nomlang, keyin bolaga \"qizilni ko'rsat\" deb so'rang.",
  ex_numbers:
    "1 dan 10 gacha sonlarni sekin, ohang bilan ayting. Bola takrorlasa, barmoq bilan birga sanang.",
  ex_body:
    "Tana a'zolarini nomlang va ko'rsating ('bu — qo'l', 'bu — bosh'). \"Burningni ko'rsat\" deb so'rang.",
  ex_actions:
    "Oddiy harakat fe'llarini ko'rsatib ayting: yur, o'tir, sakra, qarsak chap. Bola bilan birga bajaring — harakat va so'z bog'lanadi.",
  ex_household:
    "Uy buyumlarini birma-bir ko'rsating va nomlang ('stol', 'stul', 'choynak'). Bola so'rasa, qaytarib ayting.",
  ex_nature:
    "Tashqariga chiqing yoki deraza yonida o'tirib, qush, shamol, suv tovushlarini birga eshiting va izohlang.",
  ex_loud_quiet:
    "Bitta tovushni avval past, keyin baland chalib bering ('shu — past', 'shu — baland'). Bolaga farqlashni o'rgating.",
  ex_music:
    "Bolaga moslangan o'zbek bolalar qo'shig'idan birini birga tinglang. Imkon bo'lsa, kuylab bering — yumshoq tonda.",
  ex_home_sounds:
    "Eshik qo'ng'irog'i, telefon, soat tovushlarini bola yonida chaldiring. \"Bu — soat\" deb izohlang.",
  ex_rhythm:
    "Stol yoki barabanda oddiy ritm chiqaring (ta-ta-ta) va bolaga takrorlatishga harakat qiling. Qarsak ham qo'shilsa, yanada qiziqarli.",
  ex_memory_sound:
    "2–3 ta tovushni ketma-ket chalib bering, keyin bolaga \"qaysi tovush birinchi edi?\" deb so'rang.",
};

export const EXERCISE_GENERIC_TIP_BY_TYPE: Record<ExerciseType, string> = {
  Nutq: "So'z mashqi — bolaga sekin va aniq ayting, takrorlatishga vaqt bering. Maqtab turish — eng kuchli motivatsiya.",
  Eshitish:
    "Bolani tinch joyga olib chiqing. Tovushni sekin va aniq chalib bering, takror takror tinglang.",
  "O'yin":
    "O'yinli mashq — qoidasini bolaga ko'rsatib bering, keyin birga o'ynang. Yutuq emas, ishtirok muhim.",
};

export function exerciseTip(id: string, type: ExerciseType): string {
  return EXERCISE_TIPS[id] ?? EXERCISE_GENERIC_TIP_BY_TYPE[type] ?? "";
}

// ── Guided practice — har bir non-game mashq uchun haqiqiy ichki jarayon ──
//
// Foydalanuvchi mashq kartasini bossa, /practice/$exerciseId ga o'tadi.
// O'sha sahifa quyidagi `items` qatorini bittama-bitta ko'rsatadi:
//   • katta emoji + matn
//   • avto-TTS (ovozda o'qiladi)
//   • "Eshitish" tugmasi → qaytadan chalish
//   • "Keyingisi" → keyingi item
//   • Oxirgisidan keyin → avtomatik bajarildi + natija ekrani

/** Item uchun ovoz manbai. Berilmasa, TTS bilan `spoken ?? text` o'qiladi. */
export type SoundSpec =
  | { kind: "tts"; rate?: number; pitch?: number }
  | { kind: "sfx"; name: "drum" | "rattle" | "horn" | "bell" | "whistle" | "clap"; volume?: number; repeat?: number; gap?: number }
  | { kind: "file"; src: string }
  | { kind: "tone"; freq: number; durationMs?: number; type?: "sine" | "square" | "triangle" | "sawtooth"; volume?: number };

export type PracticeItem = {
  text: string;
  emoji?: string;
  /** Hex rang — `ex_colors` uchun emoji o'rniga to'la rangli kvadrat ko'rsatamiz. */
  color?: string;
  /** TTS o'rniga shu so'zni ovozda o'qish (default = `text`). */
  spoken?: string;
  /** Real ovoz manbai (qo'ng'iroq, baraban, hayvon mp3, musiqa notasi). */
  sound?: SoundSpec;
  /**
   * Yuklab qo'yilgan rasm — data URL yoki publik URL. Mavjud bo'lsa emoji/
   * color o'rniga shu rasm ko'rsatiladi. Admin paneldan yuklanadi.
   */
  image?: string;
};

/**
 * PracticeItem uchun barqaror itemKey hosil qilish — admin tomondan yuklangan
 * rasm/ovoz items'larini bog'lash uchun ishlatiladi. Lotin harflari, raqamlar
 * va tire — qolgan barcha narsa tushib qoladi.
 */
export function practiceItemKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/['ʻ`]/g, "")
    .normalize("NFD")
    // diakritik belgilarni olib tashlash (a-ringli a → a, и → и va h.k.)
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "item";
}

/** Backend GameItem `game` kaliti uchun prefiks — mashqlar va o'yinlar farqlansin. */
export const EXERCISE_GAME_KEY_PREFIX = "exercise__";

export function exerciseGameKey(exerciseTemplateId: string): string {
  return EXERCISE_GAME_KEY_PREFIX + exerciseTemplateId;
}

export type PracticeGroup = {
  key: string;
  title: string;
  emoji?: string;
  items: PracticeItem[];
};

export type PracticeScript = {
  title: string;
  intro?: string;
  items: PracticeItem[];
  /** TTS sekinligi (default 0.85 — bola uchun yumshoq). */
  rate?: number;
  /**
   * Ixtiyoriy sub-guruhlar — masalan hayvonlar uchun "Uy" va "Yovvoyi".
   * Mavjud bo'lsa, mashqni boshlashdan oldin guruh tanlash ekrani ko'rinadi
   * va quiz faqat tanlangan guruh ichidagi item'lardan tuziladi.
   */
  groups?: PracticeGroup[];
};

export const PRACTICE_SCRIPTS: Record<string, PracticeScript> = {
  ex_family: {
    title: "Oila a'zolari",
    intro: "Har bir so'zni eshiting va bola bilan birga takrorlang.",
    items: [
      { text: "Ona", emoji: "👩" },
      { text: "Ota", emoji: "👨" },
      { text: "Buvi", emoji: "👵" },
      { text: "Buva", emoji: "👴" },
      { text: "Aka", emoji: "👦" },
      { text: "Opa", emoji: "👧" },
      { text: "Singil", emoji: "🧒" },
      { text: "Uka", emoji: "👶" },
    ],
  },
  ex_ona_repeat: {
    title: "Oila a'zolarini o'rganamiz",
    intro:
      "Yaqin oila a'zolarini birga o'rganamiz. So'zni eshiting va to'g'ri rasmni tanlang.",
    items: [
      { text: "Ona", emoji: "👩" },
      { text: "Ota", emoji: "👨" },
      { text: "Buvi", emoji: "👵" },
      { text: "Buva", emoji: "👴" },
      { text: "Aka", emoji: "👦" },
      { text: "Opa", emoji: "👧" },
      { text: "Singil", emoji: "🧒" },
      { text: "Uka", emoji: "👶" },
      { text: "Amaki", emoji: "🧔" },
      { text: "Amma", emoji: "🧕" },
    ],
  },
  ex_animals: {
    title: "Hayvonlar",
    intro: "Avval guruhni tanlang — uy hayvonlari yoki yovvoyi hayvonlar.",
    // Bu yerda flat items barcha hayvonlar — guruh tanlanmagan bo'lsa fallback uchun
    items: [],
    groups: [
      {
        key: "domestic",
        title: "Uy hayvonlari",
        emoji: "🏠",
        items: [
          { text: "It", emoji: "🐶", sound: { kind: "file", src: "/sounds/animals/dog.mp3" } },
          { text: "Mushuk", emoji: "🐱", sound: { kind: "file", src: "/sounds/animals/cat.mp3" } },
          { text: "Sigir", emoji: "🐮", sound: { kind: "file", src: "/sounds/animals/cow.mp3" } },
          { text: "Qo'y", emoji: "🐑" },
          { text: "Ot", emoji: "🐴" },
          { text: "Echki", emoji: "🐐" },
          { text: "Tovuq", emoji: "🐔" },
          { text: "G'oz", emoji: "🦢" },
        ],
      },
      {
        key: "wild",
        title: "Yovvoyi hayvonlar",
        emoji: "🌳",
        items: [
          { text: "Sher", emoji: "🦁", sound: { kind: "file", src: "/sounds/animals/lion.mp3" } },
          { text: "Yo'lbars", emoji: "🐯" },
          { text: "Bo'ri", emoji: "🐺" },
          { text: "Ayiq", emoji: "🐻" },
          { text: "Tulki", emoji: "🦊" },
          { text: "Maymun", emoji: "🐵" },
          { text: "Fil", emoji: "🐘" },
          { text: "Qurbaqa", emoji: "🐸", sound: { kind: "file", src: "/sounds/animals/frog.mp3" } },
          { text: "Qush", emoji: "🐦", sound: { kind: "file", src: "/sounds/animals/bird.mp3" } },
        ],
      },
    ],
  },
  ex_fruits: {
    title: "Mevalar",
    intro: "Har bir meva nomini eshiting va takrorlang.",
    items: [
      { text: "Olma", emoji: "🍎" },
      { text: "Banan", emoji: "🍌" },
      { text: "Uzum", emoji: "🍇" },
      { text: "Tarvuz", emoji: "🍉" },
      { text: "Olcha", emoji: "🍒" },
      { text: "Apelsin", emoji: "🍊" },
      { text: "Nok", emoji: "🍐" },
    ],
  },
  ex_colors: {
    title: "Ranglar",
    intro: "Har bir rangni ko'ring va nomini takrorlang.",
    items: [
      { text: "Qizil", color: "#e54545" },
      { text: "Ko'k", color: "#3b82f6" },
      { text: "Yashil", color: "#22a55d" },
      { text: "Sariq", color: "#f5c518" },
      { text: "Pushti", color: "#ec4899" },
      { text: "Qora", color: "#1f2937" },
      { text: "Oq", color: "#f8fafc" },
    ],
  },
  ex_numbers: {
    title: "Sonlar 1–10",
    intro: "Har bir sonni eshiting va barmoq bilan birga sanang.",
    rate: 0.9,
    items: Array.from({ length: 10 }, (_, i) => ({
      text: String(i + 1),
      emoji: ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"][i],
      spoken: ["bir", "ikki", "uch", "to'rt", "besh", "olti", "yetti", "sakkiz", "to'qqiz", "o'n"][i],
    })),
  },
  ex_body: {
    title: "Tana a'zolari",
    intro: "Har bir a'zoni ko'rsating, nomini ayting va takrorlang.",
    items: [
      { text: "Bosh", emoji: "🧑" },
      { text: "Ko'z", emoji: "👁️" },
      { text: "Burun", emoji: "👃" },
      { text: "Quloq", emoji: "👂" },
      { text: "Og'iz", emoji: "👄" },
      { text: "Qo'l", emoji: "✋" },
      { text: "Oyoq", emoji: "🦶" },
    ],
  },
  ex_actions: {
    title: "Harakat fe'llari",
    intro: "Bola bilan birga bajaring — harakat va so'z bog'lanadi.",
    items: [
      { text: "Yur", emoji: "🚶" },
      { text: "O'tir", emoji: "🪑", spoken: "o'tir" },
      { text: "Sakra", emoji: "🤸" },
      { text: "Qarsak", emoji: "👏", spoken: "qarsak chal" },
      { text: "Yot", emoji: "🛌" },
      { text: "Yugur", emoji: "🏃" },
    ],
  },
  ex_household: {
    title: "Uy buyumlari",
    intro: "Har bir buyumni ko'ring va nomini takrorlang.",
    items: [
      { text: "Stol", emoji: "🪑", spoken: "stol" },
      { text: "Eshik", emoji: "🚪" },
      { text: "Deraza", emoji: "🪟" },
      { text: "Choynak", emoji: "🫖" },
      { text: "Kosa", emoji: "🍜" },
      { text: "Kitob", emoji: "📕" },
      { text: "Kalit", emoji: "🔑" },
    ],
  },
  // Eshitish mashqlari — ovoz fonni TTS bilan emas, lekin tovushlar yetishmasa
  // izohlovchi matn TTS bilan o'qiladi.
  ex_nature: {
    title: "Tabiat tovushlari",
    intro: "Har bir tovush nomini eshiting va atrofdan o'sha tovushni topishga harakat qiling.",
    items: [
      { text: "Qush sayrashi", emoji: "🐦" },
      { text: "Suv shovqini", emoji: "💧" },
      { text: "Shamol", emoji: "🌬️" },
      { text: "Yomg'ir", emoji: "🌧️" },
      { text: "Momaqaldiroq", emoji: "⛈️" },
    ],
  },
  ex_loud_quiet: {
    title: "Baland va past tovush",
    intro: "Tovushni eshiting — past, o'rta yoki baland?",
    items: [
      { text: "Juda past", emoji: "🤫", sound: { kind: "tone", freq: 330, durationMs: 700, volume: 0.07 } },
      { text: "Past", emoji: "🔈", sound: { kind: "tone", freq: 330, durationMs: 700, volume: 0.18 } },
      { text: "Baland", emoji: "🔊", sound: { kind: "tone", freq: 330, durationMs: 700, volume: 0.55 } },
      { text: "Juda baland", emoji: "📢", sound: { kind: "tone", freq: 330, durationMs: 700, volume: 0.95 } },
    ],
  },
  ex_music: {
    title: "Musiqa notalari",
    intro: "Notalarni eshiting — past, o'rta yoki baland?",
    items: [
      { text: "Past nota", emoji: "🎵", sound: { kind: "tone", freq: 196, durationMs: 900, type: "sine" } },
      { text: "O'rta nota", emoji: "🎶", sound: { kind: "tone", freq: 440, durationMs: 900, type: "sine" } },
      { text: "Baland nota", emoji: "🎼", sound: { kind: "tone", freq: 880, durationMs: 900, type: "sine" } },
      { text: "Juda baland", emoji: "✨", sound: { kind: "tone", freq: 1568, durationMs: 900, type: "sine" } },
    ],
  },
  ex_home_sounds: {
    title: "Uy tovushlari",
    intro: "Tovushni eshiting va mos buyumni toping.",
    items: [
      { text: "Qo'ng'iroq", emoji: "🔔", sound: { kind: "sfx", name: "bell" } },
      { text: "Telefon", emoji: "📱", sound: { kind: "sfx", name: "horn" } },
      { text: "Soat", emoji: "⏰", sound: { kind: "tone", freq: 1800, durationMs: 80, type: "square", volume: 0.4 } },
      { text: "Eshik (taqir-tuqur)", emoji: "🚪", sound: { kind: "sfx", name: "drum" } },
      { text: "Hushtak", emoji: "📯", sound: { kind: "sfx", name: "whistle" } },
    ],
  },
  ex_rhythm: {
    title: "Ritm va qarsak",
    intro: "Ritmni eshiting va mos miqdorni tanlang.",
    items: [
      { text: "Bir marta", emoji: "👏", sound: { kind: "sfx", name: "clap", repeat: 1, gap: 0 } },
      { text: "Ikki marta", emoji: "👏👏", sound: { kind: "sfx", name: "clap", repeat: 2, gap: 350 } },
      { text: "Uch marta", emoji: "👏👏👏", sound: { kind: "sfx", name: "clap", repeat: 3, gap: 350 } },
      { text: "Tez ketma-ket", emoji: "👐", sound: { kind: "sfx", name: "clap", repeat: 5, gap: 150 } },
    ],
  },
  ex_memory_sound: {
    title: "Tovush xotirasi",
    intro: "Har bir tovushni diqqat bilan eshiting va mos buyumni toping.",
    items: [
      { text: "Baraban", emoji: "🥁", sound: { kind: "sfx", name: "drum" } },
      { text: "Hushtak", emoji: "📯", sound: { kind: "sfx", name: "whistle" } },
      { text: "Qo'ng'iroq", emoji: "🔔", sound: { kind: "sfx", name: "bell" } },
      { text: "Mashina", emoji: "🚗", sound: { kind: "sfx", name: "horn" } },
      { text: "Qarsak", emoji: "👏", sound: { kind: "sfx", name: "clap" } },
    ],
  },
};

/** Custom (admin) mashq uchun fallback script — sarlavhani 3 marta sekin o'qish. */
export function buildFallbackScript(title: string, type: ExerciseType): PracticeScript {
  return {
    title,
    intro: EXERCISE_GENERIC_TIP_BY_TYPE[type] ?? "",
    items: [
      { text: title, emoji: type === "O'yin" ? "🎮" : type === "Eshitish" ? "👂" : "💬" },
    ],
  };
}

export function getPracticeScript(
  id: string,
  title: string,
  type: ExerciseType,
): PracticeScript {
  return PRACTICE_SCRIPTS[id] ?? buildFallbackScript(title, type);
}

/** Practice ichidagi item'lar (guruhlar yig'iladi). */
export function allScriptItems(script: PracticeScript): PracticeItem[] {
  if (script.items.length > 0) return script.items;
  if (script.groups) return script.groups.flatMap((g) => g.items);
  return [];
}

/**
 * Mashqlar ro'yxati kartochkasida ko'rsatiladigan 3–5 ta misol emoji.
 * Foydalanuvchi karta ichida nimalar borligini bir qarashda ko'radi.
 */
export function previewEmojis(id: string, max = 4): string[] {
  const script = PRACTICE_SCRIPTS[id];
  if (!script) return [];
  const items = allScriptItems(script);
  const emojis = items
    .map((it) => it.emoji)
    .filter((e): e is string => !!e);
  return emojis.slice(0, max);
}
