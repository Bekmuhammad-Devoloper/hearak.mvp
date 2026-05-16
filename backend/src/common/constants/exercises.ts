export type ExerciseTemplate = {
  id: string;
  title: string;
  type: "O'yin" | 'Nutq' | 'Eshitish';
  minutes: number;
  emoji: string;
};

export const EXERCISE_TEMPLATES: ReadonlyArray<ExerciseTemplate> = [
  // Nutq mashqlari
  { id: 'ex_family', title: "Oila a'zolari nomlari", type: 'Nutq', minutes: 2, emoji: '👨‍👩‍👧' },
  { id: 'ex_ona_repeat', title: '"Ona" va "Ota" so\'zlarini takrorlash', type: 'Nutq', minutes: 2, emoji: '💬' },
  { id: 'ex_animals', title: 'Hayvonlar nomi', type: 'Nutq', minutes: 3, emoji: '🐶' },
  { id: 'ex_fruits', title: 'Mevalar nomini aytish', type: 'Nutq', minutes: 2, emoji: '🍎' },
  { id: 'ex_colors', title: 'Ranglar nomini takrorlash', type: 'Nutq', minutes: 2, emoji: '🎨' },
  { id: 'ex_numbers', title: "Sonlarni 1 dan 10 gacha aytish", type: 'Nutq', minutes: 3, emoji: '🔢' },
  { id: 'ex_body', title: "Tana a'zolari nomi", type: 'Nutq', minutes: 2, emoji: '👋' },
  { id: 'ex_actions', title: "Harakat fe'llari (yur, o'tir, sakra)", type: 'Nutq', minutes: 3, emoji: '🏃' },
  { id: 'ex_household', title: 'Uy buyumlari nomlari', type: 'Nutq', minutes: 3, emoji: '🏠' },

  // Eshitish mashqlari
  { id: 'ex_nature', title: 'Tabiat tovushlarini eshitish', type: 'Eshitish', minutes: 2, emoji: '🎧' },
  { id: 'ex_sound_loc', title: 'Tovush qaysi tomondan?', type: 'Eshitish', minutes: 3, emoji: '🧭' },
  { id: 'ex_loud_quiet', title: 'Baland va past tovushlar', type: 'Eshitish', minutes: 2, emoji: '🔊' },
  { id: 'ex_music', title: "Musiqa va qo'shiq tinglash", type: 'Eshitish', minutes: 3, emoji: '🎵' },
  { id: 'ex_home_sounds', title: 'Uydagi tovushlarni tanish', type: 'Eshitish', minutes: 2, emoji: '🔔' },

  // O'yin mashqlari
  { id: 'ex_sound_find', title: "Tovushlarni topish o'yini", type: "O'yin", minutes: 3, emoji: '🎯' },
  { id: 'ex_rhythm', title: 'Ritm va qarsak', type: "O'yin", minutes: 2, emoji: '👏' },
  { id: 'ex_word_pick', title: "Rasmga mos so'z", type: "O'yin", minutes: 3, emoji: '🖼️' },
  { id: 'ex_memory_sound', title: 'Tovush xotirasi', type: "O'yin", minutes: 3, emoji: '🧠' },
];

/** Har kuni nechta mashq tanlanadi (bitta bola uchun). */
export const DAILY_EXERCISE_COUNT = 5;

export const DIAGNOSTICS_QUESTIONS: ReadonlyArray<string> = [
  "Bola o'z ismiga reaksiya bildiradimi?",
  'Bola atrofdagi tovushlarga e\'tibor beradimi?',
  "Bola oddiy so'zlarni takrorlay oladimi?",
  'Bola ovoz manbasini qidiradimi?',
  'Bola musiqaga qiziqadimi?',
  'Bola sizning ohangingizni tushunadimi?',
  "Bola qisqa ko'rsatmalarga amal qiladimi?",
  'Bola boshqa bolalar bilan muloqot qilishga harakat qiladimi?',
];
