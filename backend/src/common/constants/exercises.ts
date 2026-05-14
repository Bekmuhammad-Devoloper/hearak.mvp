export type ExerciseTemplate = {
  id: string;
  title: string;
  type: "O'yin" | 'Nutq' | 'Eshitish';
  minutes: number;
  emoji: string;
};

export const EXERCISE_TEMPLATES: ReadonlyArray<ExerciseTemplate> = [
  { id: 'ex_sound_find', title: "Tovushlarni topish o'yini", type: "O'yin", minutes: 3, emoji: '🎯' },
  { id: 'ex_mama_repeat', title: '"Mama" so\'zini takrorlash', type: 'Nutq', minutes: 2, emoji: '💬' },
  { id: 'ex_nature', title: 'Tabiat tovushlarini eshitish', type: 'Eshitish', minutes: 2, emoji: '🎧' },
  { id: 'ex_animals', title: 'Hayvonlar nomi', type: 'Nutq', minutes: 3, emoji: '🐶' },
  { id: 'ex_rhythm', title: 'Ritm va qarsak', type: "O'yin", minutes: 2, emoji: '👏' },
  { id: 'ex_household', title: 'Uy buyumlari nomlari', type: 'Nutq', minutes: 3, emoji: '🏠' },
];

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
