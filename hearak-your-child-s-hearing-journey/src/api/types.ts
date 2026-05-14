export type Role = "parent" | "specialist";

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  title?: string;
  avatarLetter: string;
};

export type Child = {
  id: string;
  parentId: string;
  name: string;
  dob: string;
  implantDate: string;
  stage: string;
  stageNumber: number;
  totalStages: number;
  emoji: string;
  wordCount: number;
  createdAt: string;
};

export type ExerciseType = "O'yin" | "Nutq" | "Eshitish";

export type ExerciseTemplate = {
  id: string;
  title: string;
  type: ExerciseType;
  minutes: number;
  emoji: string;
};

export type ExerciseCompletion = {
  childId: string;
  exerciseId: string;
  date: string;
  completedAt: string;
};

export type Milestone = {
  id: string;
  childId: string;
  day: number;
  title: string;
  done: boolean;
  current?: boolean;
};

export type ProgressPoint = {
  childId: string;
  month: string;
  value: number;
};

export type ChatMessage = {
  id: string;
  childId: string;
  from: "ai" | "user";
  text: string;
  createdAt: string;
};

export type DiagnosticsSubmission = {
  id: string;
  childId: string;
  answers: number[];
  score: number;
  maxScore: number;
  pct: number;
  recommendations: string[];
  submittedAt: string;
};

export type Note = {
  id: string;
  childId: string;
  specialistId: string;
  text: string;
  createdAt: string;
};

export type Assignment = {
  id: string;
  childId: string;
  specialistId: string;
  title: string;
  createdAt: string;
  done: boolean;
  doneAt?: string;
  parentFeedback?: string;
};

export type SpeechCheck = {
  id: string;
  childId: string;
  durationMs: number;
  avgLoudness: number;
  voiceActivityRatio: number;
  note?: string;
  createdAt: string;
};

export type GameScore = {
  id: string;
  childId: string;
  game: "sound-find" | "direction" | "word-pick" | "repeat";
  score: number;
  total: number;
  createdAt: string;
};

export type RiskLevel = "ok" | "watch" | "alert";

export type RiskStatus = {
  level: RiskLevel;
  reasons: string[];
  recommendation: string;
};

export type Session = {
  token: string;
  userId: string;
  createdAt: string;
};

export type ApiError = { error: string; status: number };
