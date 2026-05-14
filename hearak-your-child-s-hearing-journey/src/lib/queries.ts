import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api, getActiveChildId, setActiveChildId, setToken, subscribeActiveChild } from "./api";

export type PublicUser = {
  id: string;
  fullName: string;
  email: string;
  role: "parent" | "specialist";
  title?: string;
  avatarLetter: string;
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
};

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
    onSuccess: () => {
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
    mutationFn: (body: { fullName: string; email: string; password: string }) =>
      api<{ token: string; user: PublicUser }>(`/api/auth/signup`, { method: "POST", body }),
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
      if (childId) qc.invalidateQueries({ queryKey: qk.assignments(childId) });
      qc.invalidateQueries({ queryKey: ["specialist", "patient"] });
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
    mutationFn: (body: { fullName?: string; email?: string }) =>
      api<{ user: PublicUser }>(`/api/me`, { method: "PATCH", body }),
    onSuccess: () => {
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
    },
  });
}
