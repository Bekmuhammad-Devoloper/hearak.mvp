import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api, getActiveChildId, setActiveChildId, setToken, subscribeActiveChild } from "./api";

export type PublicUser = {
  id: string;
  fullName: string;
  email: string;
  role: "parent" | "specialist" | "admin";
  title?: string;
  avatarLetter: string;
  /** Yuklangan avatar — data URL yoki publik URL. `null` bo'lsa monogram ko'rsatiladi. */
  avatarUrl: string | null;
};

export type PublicChild = {
  id: string;
  parentId: string;
  name: string;
  dob: string;
  implantDate: string;
  stage: string;
  stageNumber: number;
  totalStages: number;
  emoji: string;
  avatarUrl: string | null;
  wordCount: number;
  createdAt: string;
  days: number;
  pct: number;
};

export type DailyExercise = {
  id: string;
  title: string;
  type: "O'yin" | "Nutq" | "Eshitish";
  minutes: number;
  emoji: string;
  completed: boolean;
};

export type ProgressResponse = {
  wordCount: number;
  monthly: Array<{ month: string; value: number }>;
  stage: string;
  stageNumber: number;
  totalStages: number;
  days: number;
};

export type MilestoneItem = {
  id: string;
  day: number;
  title: string;
  done: boolean;
  current: boolean;
};

export type ChatMsg = {
  id: string;
  childId: string;
  from: "ai" | "user";
  text: string;
  createdAt: string;
};

export type DiagnosticsResult = {
  id: string;
  childId: string;
  answers: number[];
  score: number;
  maxScore: number;
  pct: number;
  recommendations: string[];
  submittedAt: string;
};

export type AssignmentItem = {
  id: string;
  childId: string;
  specialistId: string;
  title: string;
  createdAt: string;
  done: boolean;
  doneAt?: string;
  parentFeedback?: string;
};

export type SpeechCheckItem = {
  id: string;
  childId: string;
  durationMs: number;
  avgLoudness: number;
  voiceActivityRatio: number;
  note?: string;
  createdAt: string;
};

export type GameScoreItem = {
  id: string;
  childId: string;
  game: "sound-find" | "direction" | "word-pick" | "repeat";
  score: number;
  total: number;
  createdAt: string;
};

export type RiskStatus = {
  level: "ok" | "watch" | "alert";
  reasons: string[];
  recommendation: string;
};

export type SpecialistPatient = {
  id: string;
  name: string;
  age: number;
  implantMonths: number;
  lastSession: string;
  avatarLetter: string;
};

export type SpecialistPatientDetail = {
  patient: PublicChild;
  notes: Array<{ id: string; text: string; createdAt: string }>;
  assignments: Array<{ id: string; title: string; createdAt: string; done: boolean }>;
  milestones: MilestoneItem[];
  monthly: Array<{ month: string; value: number }>;
  chat: Array<{ id: string; from: "ai" | "user"; text: string; createdAt: string }>;
};

export const qk = {
  me: ["me"] as const,
  children: ["children"] as const,
  child: (id: string) => ["child", id] as const,
  exercises: (id: string, date?: string) => ["exercises", id, date ?? "today"] as const,
  progress: (id: string) => ["progress", id] as const,
  milestones: (id: string) => ["milestones", id] as const,
  chat: (id: string) => ["chat", id] as const,
  diagnosticsQuestions: ["diagnostics", "questions"] as const,
  specialistStats: ["specialist", "stats"] as const,
  specialistPatients: ["specialist", "patients"] as const,
  specialistPatient: (id: string) => ["specialist", "patient", id] as const,
  assignments: (childId: string) => ["assignments", childId] as const,
  speechChecks: (childId: string) => ["speechChecks", childId] as const,
  gameScores: (childId: string) => ["gameScores", childId] as const,
  risk: (childId: string) => ["risk", childId] as const,
  adminStats:        ["admin", "stats"] as const,
  adminSpecialists:  ["admin", "specialists"] as const,
  adminParents:      ["admin", "parents"] as const,
  adminChildren:     ["admin", "children"] as const,
  adminChild:        (id: string) => ["admin", "child", id] as const,
  adminAssignments:  ["admin", "assignments"] as const,
  adminDiagnostics:  ["admin", "diagnostics"] as const,
  adminContent:      ["admin", "content"] as const,
  adminAnalytics:    ["admin", "analytics"] as const,
  adminNotifications: ["admin", "notifications"] as const,
  notifications:      ["notifications"] as const,
};

export type AdminStats = {
  counts: { children: number; parents: number; specialists: number; activeThisWeek: number; weeklyActivityPct: number };
  week: Array<{ day: string; value: number }>;
  stages: Array<{ stage: number; name: string; count: number; pct: number }>;
  recentCompletions: Array<{ childId: string; childName: string; exerciseTitle: string; completedAt: string }>;
};
export type AdminSpecialist  = { id: string; fullName: string; email: string; title: string; avatarLetter: string; avatarUrl: string | null; assignments: number; verified: boolean };
export type AdminParent      = { id: string; fullName: string; email: string; avatarLetter: string; avatarUrl: string | null; childrenCount: number; engagement: number };
export type AdminChildRow    = { id: string; name: string; emoji: string; avatarUrl: string | null; age: number; parentName: string; specialistName: string; stage: number; stageName: string; totalStages: number; wordCount: number; days: number; progress: number; risk: "low" | "medium" | "high"; activity: number };
export type AdminAssignment  = { id: string; title: string; childName: string; specialistName: string; createdAt: string; status: "completed" | "in_progress" | "overdue" | "new"; progress: number };
export type AdminDxQuestion  = { id: string; text: string; category: string; ageGroup: string; weight: number; active: boolean };
export type AdminDxResult    = { id: string; childName: string; score: number; maxScore: number; pct: number; recommendation: string; submittedAt: string };
export type AdminExercise    = { id: string; title: string; type: ExerciseType; minutes: number; emoji: string; stage: number; uses: number; active: boolean };
export type AdminGame        = { id: string; title: string; difficulty: string; emoji: string; plays: number };
export type AdminAnalytics   = {
  avgWords: number;
  ageGroups: Array<{ range: string; count: number; pct: number }>;
  growth: Array<{ month: string; value: number }>;
  topSpecialists: Array<{ name: string; assignments: number; notes: number }>;
  stages: Array<{ name: string; count: number; pct: number }>;
};
type ExerciseType = "O'yin" | "Nutq" | "Eshitish";

/**
 * Admin sahifalarda real vaqtda ma'lumot ko'rinishi uchun jonli refetch.
 *
 * Mutaxassislar bemorlarga qayd/topshiriq qo'shsa, admin panel 20 sekund
 * ichida o'zi yangilanadi. Foydalanuvchi sahifaga qaytsa darhol yangilanadi.
 */
const ADMIN_LIVE = {
  refetchInterval: 20_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  staleTime: 10_000,
} as const;

export function useAdminStats() {
  return useQuery({
    queryKey: qk.adminStats,
    queryFn: () => api<AdminStats>("/api/admin/stats"),
    ...ADMIN_LIVE,
  });
}
export function useAdminSpecialists() {
  return useQuery({
    queryKey: qk.adminSpecialists,
    queryFn: () => api<{ specialists: AdminSpecialist[] }>("/api/admin/specialists"),
    ...ADMIN_LIVE,
  });
}
export function useAdminParents() {
  return useQuery({
    queryKey: qk.adminParents,
    queryFn: () => api<{ parents: AdminParent[] }>("/api/admin/parents"),
    ...ADMIN_LIVE,
  });
}
export function useAdminChildren() {
  return useQuery({
    queryKey: qk.adminChildren,
    queryFn: () => api<{ children: AdminChildRow[] }>("/api/admin/children"),
    ...ADMIN_LIVE,
  });
}
export function useAdminAssignments() {
  return useQuery({
    queryKey: qk.adminAssignments,
    queryFn: () => api<{ assignments: AdminAssignment[] }>("/api/admin/assignments"),
    ...ADMIN_LIVE,
  });
}
export function useAdminDiagnostics() {
  return useQuery({
    queryKey: qk.adminDiagnostics,
    queryFn: () => api<{ questions: AdminDxQuestion[]; results: AdminDxResult[] }>("/api/admin/diagnostics"),
    ...ADMIN_LIVE,
  });
}
export function useAdminContent() {
  return useQuery({
    queryKey: qk.adminContent,
    queryFn: () => api<{ exercises: AdminExercise[]; games: AdminGame[] }>("/api/admin/content"),
    ...ADMIN_LIVE,
  });
}
export function useAdminAnalytics() {
  return useQuery({
    queryKey: qk.adminAnalytics,
    queryFn: () => api<AdminAnalytics>("/api/admin/analytics"),
    ...ADMIN_LIVE,
  });
}

export type AdminChildDetail = {
  child: {
    id: string; name: string; emoji: string; avatarUrl: string | null;
    dob: string; implantDate: string;
    stage: string; stageNumber: number; totalStages: number; wordCount: number;
    days: number; pct: number; risk: "low" | "medium" | "high";
  };
  parent: { id: string; fullName: string; email: string; avatarLetter: string; avatarUrl: string | null } | null;
  specialist: { id: string; fullName: string; email: string; title: string; avatarLetter: string; avatarUrl: string | null } | null;
  notes: Array<{ id: string; text: string; createdAt: string; authorName: string; authorRole: "parent" | "specialist" | "admin" }>;
  assignments: Array<{ id: string; title: string; createdAt: string; done: boolean; authorName: string }>;
  milestones: Array<{ id: string; day: number; title: string; done: boolean; current?: boolean }>;
  monthly: Array<{ month: string; value: number }>;
  diagnostics: Array<{ id: string; score: number; maxScore: number; pct: number; recommendations: string[]; submittedAt: string }>;
  completions: Array<{ exerciseId: string; date: string; completedAt: string; title: string; emoji: string }>;
  chat: Array<{ id: string; from: "ai" | "user"; text: string; createdAt: string }>;
};

export function useAdminChild(id: string | undefined) {
  return useQuery({
    queryKey: id ? qk.adminChild(id) : ["admin", "child", "none"],
    queryFn: () => api<AdminChildDetail>(`/api/admin/children/${id}`),
    enabled: !!id,
    ...ADMIN_LIVE,
  });
}

export type ExerciseInput = {
  title: string;
  type: "Nutq" | "Eshitish" | "O'yin";
  minutes?: number;
  emoji?: string;
  stage?: number;
  active?: boolean;
};

// ─── Game assets (o'yin elementlari uchun rasm va ovoz) ────────────────

export type GameAssetMap = Record<string, { image?: string; sound?: string }>;

export function useGameAssets(game: string | undefined) {
  return useQuery({
    queryKey: ["gameAssets", game ?? ""],
    queryFn: () => api<{ game: string; items: GameAssetMap }>(`/api/games/${game}/assets`),
    enabled: !!game,
    // Admin tomonda yangi yuklangan ovoz darhol o'yinda ko'rinishi uchun:
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useUpsertGameAsset(game: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemKey,
      kind,
      dataUrl,
    }: {
      itemKey: string;
      kind: "image" | "sound";
      dataUrl: string;
    }) =>
      api(`/api/games/${game}/items/${itemKey}`, {
        method: "PUT",
        body: { kind, dataUrl },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gameAssets", game] }),
  });
}

export function useDeleteGameAsset(game: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemKey, kind }: { itemKey: string; kind: "image" | "sound" }) =>
      api(`/api/games/${game}/items/${itemKey}/${kind}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gameAssets", game] }),
  });
}

export function useAdminCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ExerciseInput) =>
      api<{ exercise: AdminExercise }>(`/api/admin/exercises`, { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminContent }),
  });
}

export function useAdminUpdateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<ExerciseInput>) =>
      api<{ exercise: AdminExercise }>(`/api/admin/exercises/${id}`, { method: "PATCH", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminContent }),
  });
}

export function useAdminDeleteExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<{ deleted: boolean }>(`/api/admin/exercises/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminContent }),
  });
}

export function useAdminCreateSpecialist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { fullName: string; email: string; password: string; title?: string }) =>
      api<{ user: PublicUser }>(`/api/admin/specialists`, { method: "POST", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.adminSpecialists });
      qc.invalidateQueries({ queryKey: qk.adminStats });
    },
  });
}

export function useAdminSetUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      role,
      title,
    }: {
      userId: string;
      role: "parent" | "specialist" | "admin";
      title?: string;
    }) =>
      api<{ user: PublicUser }>(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        body: { role, ...(title ? { title } : {}) },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.adminSpecialists });
      qc.invalidateQueries({ queryKey: ["admin", "parents"] });
      qc.invalidateQueries({ queryKey: qk.adminStats });
    },
  });
}

export function useAdminAddAssignment(childId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) =>
      api(`/api/admin/children/${childId}/assignments`, { method: "POST", body: { title } }),
    onSuccess: () => {
      if (childId) qc.invalidateQueries({ queryKey: qk.adminChild(childId) });
      qc.invalidateQueries({ queryKey: qk.adminAssignments });
      qc.invalidateQueries({ queryKey: qk.adminStats });
    },
  });
}

export function useAdminAddNote(childId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) =>
      api(`/api/admin/children/${childId}/notes`, { method: "POST", body: { text } }),
    onSuccess: () => {
      if (childId) qc.invalidateQueries({ queryKey: qk.adminChild(childId) });
    },
  });
}

// ── Notifications ─────────────────────────────────────────────────────────
export type Notification = {
  id: string;
  title: string;
  body: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
};

export type AdminNotification = {
  id: string;
  title: string;
  body: string;
  link?: string | null;
  recipientName: string;
  recipientRole: "parent" | "specialist" | "admin";
  sentAt: string;
  read: boolean;
};

export type SendNotificationPayload = {
  title: string;
  body: string;
  audience: "all" | "parents" | "specialists" | "user";
  userId?: string;
  link?: string;
};

export function useNotifications() {
  return useQuery({
    queryKey: qk.notifications,
    queryFn: () => api<{ unread: number; notifications: Notification[] }>("/api/notifications"),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api("/api/notifications/read-all", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications }),
  });
}

export function useAdminNotifications() {
  return useQuery({
    queryKey: qk.adminNotifications,
    queryFn: () => api<{ notifications: AdminNotification[] }>("/api/admin/notifications"),
  });
}

export function useAdminSendNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendNotificationPayload) =>
      api<{ sent: number }>("/api/admin/notifications", { method: "POST", body: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.adminNotifications });
    },
  });
}

export function useActiveChild() {
  const me = useMe();
  const [storedId, setStoredId] = useState<string | null>(null);
  useEffect(() => {
    setStoredId(getActiveChildId());
    return subscribeActiveChild(() => {
      setStoredId(getActiveChildId());
    });
  }, []);
  const children = me.data?.children ?? [];
  const active = children.find((c) => c.id === storedId) ?? children[0] ?? null;
  useEffect(() => {
    if (active && active.id !== storedId) {
      setActiveChildId(active.id);
    }
  }, [active, storedId]);
  return {
    ...me,
    child: active,
    children,
    hasNoChildren: me.isSuccess && children.length === 0,
  };
}

export function useMe() {
  return useQuery({
    queryKey: qk.me,
    queryFn: () => api<{ user: PublicUser; children: PublicChild[] }>("/api/me"),
    retry: false,
    // Sahifaga qaytishda yangi avatar/profil ma'lumotlari darhol ko'rinishi uchun.
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    staleTime: 0,
  });
}

export function useChildren() {
  return useQuery({
    queryKey: qk.children,
    queryFn: () => api<{ children: PublicChild[] }>("/api/children"),
  });
}

export function useChild(id: string | undefined) {
  return useQuery({
    queryKey: qk.child(id ?? ""),
    queryFn: () => api<{ child: PublicChild }>(`/api/children/${id}`),
    enabled: !!id,
  });
}

export function useDailyExercises(childId: string | undefined, date?: string) {
  return useQuery({
    queryKey: qk.exercises(childId ?? "", date),
    queryFn: () =>
      api<{ date: string; exercises: DailyExercise[] }>(`/api/children/${childId}/exercises`, {
        searchParams: { date },
      }),
    enabled: !!childId,
  });
}

export function useToggleExercise(childId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ exerciseId, completed }: { exerciseId: string; completed: boolean }) =>
      api(`/api/children/${childId}/exercises/${exerciseId}/complete`, {
        method: completed ? "POST" : "DELETE",
      }),
    // Optimistik yangilanish — backend javobini kutmasdan UI darhol o'zgaradi.
    // Bu sahifa "sekin" tuyulishini hal qiladi.
    onMutate: async ({ exerciseId, completed }) => {
      if (!childId) return;
      const keys = [["exercises", childId]];
      await Promise.all(keys.map((k) => qc.cancelQueries({ queryKey: k })));
      const snapshots = keys.map((k) => ({
        key: k,
        prev: qc.getQueriesData<{ date: string; exercises: DailyExercise[] }>({ queryKey: k }),
      }));
      qc.setQueriesData<{ date: string; exercises: DailyExercise[] }>(
        { queryKey: ["exercises", childId] },
        (old) =>
          old
            ? {
                ...old,
                exercises: old.exercises.map((e) =>
                  e.id === exerciseId ? { ...e, completed } : e,
                ),
              }
            : old,
      );
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      // Rollback agar muvaffaqiyatsiz bo'lsa.
      ctx?.snapshots?.forEach(({ prev }) => {
        prev.forEach(([key, data]) => qc.setQueryData(key, data));
      });
    },
    onSettled: () => {
      // Server bilan sinxronlash.
      if (childId) qc.invalidateQueries({ queryKey: ["exercises", childId] });
    },
  });
}

export function useProgress(childId: string | undefined) {
  return useQuery({
    queryKey: qk.progress(childId ?? ""),
    queryFn: () => api<ProgressResponse>(`/api/children/${childId}/progress`),
    enabled: !!childId,
  });
}

export function useMilestones(childId: string | undefined) {
  return useQuery({
    queryKey: qk.milestones(childId ?? ""),
    queryFn: () => api<{ milestones: MilestoneItem[] }>(`/api/children/${childId}/milestones`),
    enabled: !!childId,
  });
}

export function useChat(childId: string | undefined) {
  return useQuery({
    queryKey: qk.chat(childId ?? ""),
    queryFn: () => api<{ messages: ChatMsg[] }>(`/api/chat`, { searchParams: { childId } }),
    enabled: !!childId,
  });
}

export function useSendChat(childId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => api<{ user: ChatMsg; ai: ChatMsg }>(`/api/chat`, { method: "POST", body: { childId, text } }),
    onSuccess: (data) => {
      if (!childId) return;
      qc.setQueryData<{ messages: ChatMsg[] }>(qk.chat(childId), (prev) => ({
        messages: [...(prev?.messages ?? []), data.user, data.ai],
      }));
    },
  });
}

export function useDiagnosticsQuestions() {
  return useQuery({
    queryKey: qk.diagnosticsQuestions,
    queryFn: () => api<{ questions: string[] }>(`/api/diagnostics/questions`),
    staleTime: 60_000,
  });
}

export function useSubmitDiagnostics(childId: string | undefined) {
  return useMutation({
    mutationFn: (answers: number[]) =>
      api<DiagnosticsResult>(`/api/children/${childId}/diagnostics`, { method: "POST", body: { answers } }),
  });
}

export function useSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      fullName: string;
      email: string;
      password: string;
      role?: "parent" | "specialist";
      title?: string;
    }) => api<{ token: string; user: PublicUser }>(`/api/auth/signup`, { method: "POST", body }),
    onSuccess: ({ token }) => {
      setToken(token);
      qc.removeQueries();
    },
  });
}

export function useSignin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api<{ token: string; user: PublicUser }>(`/api/auth/signin`, { method: "POST", body }),
    onSuccess: ({ token }) => {
      setToken(token);
      qc.removeQueries();
    },
  });
}

export function useSignout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/api/auth/signout`, { method: "POST" }),
    onSettled: () => {
      setToken(null);
      setActiveChildId(null);
      qc.removeQueries();
    },
  });
}

type CreateChildVars = { name: string; dob: string; implantDate: string; emoji?: string };

export function useCreateChild(
  opts?: UseMutationOptions<{ child: PublicChild }, Error, CreateChildVars>,
) {
  const qc = useQueryClient();
  return useMutation<{ child: PublicChild }, Error, CreateChildVars>({
    ...opts,
    mutationFn: (body: CreateChildVars) =>
      api<{ child: PublicChild }>(`/api/children`, { method: "POST", body }),
    onSuccess: (...args) => {
      const [data] = args;
      qc.invalidateQueries({ queryKey: qk.me });
      qc.invalidateQueries({ queryKey: qk.children });
      setActiveChildId(data.child.id);
      opts?.onSuccess?.(...args);
    },
  });
}

export function useSpecialistStats() {
  return useQuery({
    queryKey: qk.specialistStats,
    queryFn: () => api<{ patients: number; activeThisWeek: number; assignments: number }>(`/api/specialist/stats`),
  });
}

export function useAssignments(childId: string | undefined) {
  return useQuery({
    queryKey: qk.assignments(childId ?? ""),
    queryFn: () => api<{ assignments: AssignmentItem[] }>(`/api/children/${childId}/assignments`),
    enabled: !!childId,
  });
}

export function useUpdateAssignment(childId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { assignmentId: string; done?: boolean; parentFeedback?: string }) =>
      api<{ assignment: AssignmentItem }>(`/api/assignments/${vars.assignmentId}`, {
        method: "PATCH",
        body: { done: vars.done, parentFeedback: vars.parentFeedback },
      }),
    onSuccess: () => {
      if (childId) {
        qc.invalidateQueries({ queryKey: qk.assignments(childId) });
        qc.invalidateQueries({ queryKey: qk.specialistPatient(childId) });
      }
    },
  });
}

export function useSpeechChecks(childId: string | undefined) {
  return useQuery({
    queryKey: qk.speechChecks(childId ?? ""),
    queryFn: () => api<{ checks: SpeechCheckItem[] }>(`/api/children/${childId}/speech-checks`),
    enabled: !!childId,
  });
}

export function useSaveSpeechCheck(childId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { durationMs: number; avgLoudness: number; voiceActivityRatio: number; note?: string }) =>
      api<{ check: SpeechCheckItem }>(`/api/children/${childId}/speech-checks`, { method: "POST", body }),
    onSuccess: () => {
      if (childId) qc.invalidateQueries({ queryKey: qk.speechChecks(childId) });
    },
  });
}

export function useGameScores(childId: string | undefined) {
  return useQuery({
    queryKey: qk.gameScores(childId ?? ""),
    queryFn: () => api<{ scores: GameScoreItem[] }>(`/api/children/${childId}/game-scores`),
    enabled: !!childId,
  });
}

export function useSaveGameScore(childId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { game: GameScoreItem["game"]; score: number; total: number }) =>
      api<{ score: GameScoreItem }>(`/api/children/${childId}/game-scores`, { method: "POST", body }),
    onSuccess: () => {
      if (childId) qc.invalidateQueries({ queryKey: qk.gameScores(childId) });
    },
  });
}

export function useRisk(childId: string | undefined) {
  return useQuery({
    queryKey: qk.risk(childId ?? ""),
    queryFn: () => api<RiskStatus>(`/api/children/${childId}/risk`),
    enabled: !!childId,
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { fullName?: string; email?: string; avatarUrl?: string | null }) =>
      api<{ user: PublicUser }>(`/api/me`, { method: "PATCH", body }),
    onSuccess: (data) => {
      // Yangi user ma'lumotlarini darhol keshga yozamiz, shunda dashboard va
      // boshqa sahifalar darhol yangi avatarni ko'rsatadi (refetch kutmaydi).
      qc.setQueryData<{ user: PublicUser; children: PublicChild[] }>(qk.me, (old) =>
        old ? { ...old, user: data.user } : old,
      );
      // Keyin tekshirish uchun ham invalidatsiya qilamiz.
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export function useUpdateChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
      emoji?: string;
      avatarUrl?: string | null;
    }) => api<{ child: PublicChild }>(`/api/children/${id}`, { method: "PATCH", body }),
    onSuccess: (data) => {
      // Optimistik yangilash — dashboard va settings sahifalarida bola
      // ma'lumotlari (ism, emoji, avatar) darhol yangilanadi.
      qc.setQueryData<{ user: PublicUser; children: PublicChild[] }>(qk.me, (old) =>
        old
          ? {
              ...old,
              children: old.children.map((c) => (c.id === data.child.id ? data.child : c)),
            }
          : old,
      );
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; dob: string; implantDate: string }) =>
      api<{ patient: PublicChild }>(`/api/specialist/patients`, { method: "POST", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.specialistPatients });
      qc.invalidateQueries({ queryKey: qk.specialistStats });
      // Mutaxassis bemor qo'shganda admin paneli ham darhol yangilanadi.
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useSetActiveChild() {
  return (id: string) => {
    setActiveChildId(id);
  };
}

export function useSpecialistPatients() {
  return useQuery({
    queryKey: qk.specialistPatients,
    queryFn: () => api<{ patients: SpecialistPatient[] }>(`/api/specialist/patients`),
  });
}

export function useSpecialistPatient(id: string | undefined) {
  return useQuery({
    queryKey: qk.specialistPatient(id ?? ""),
    queryFn: () => api<SpecialistPatientDetail>(`/api/specialist/patients/${id}`),
    enabled: !!id,
  });
}

export function useAddNote(childId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => api(`/api/specialist/patients/${childId}/notes`, { method: "POST", body: { text } }),
    onSuccess: () => {
      if (childId) qc.invalidateQueries({ queryKey: qk.specialistPatient(childId) });
      // Admin paneli ham darhol yangilanishi uchun (jonli bog'liqlik).
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useAddAssignment(childId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) =>
      api(`/api/specialist/patients/${childId}/assignments`, { method: "POST", body: { title } }),
    onSuccess: () => {
      if (childId) qc.invalidateQueries({ queryKey: qk.specialistPatient(childId) });
      // Admin paneli ham darhol yangilanishi uchun (jonli bog'liqlik).
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: qk.specialistStats });
    },
  });
}
