import { createSession, HttpError, requireRole, requireUser } from "./auth";
import { diagnosticsQuestions, exerciseTemplates, getStore, newId } from "./store";
import type {
  Assignment,
  ChatMessage,
  Child,
  DiagnosticsSubmission,
  GameScore,
  Milestone,
  Note,
  ProgressPoint,
  RiskStatus,
  SpeechCheck,
  User,
} from "./types";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const ok = (data: unknown) => json(data, 200);
const created = (data: unknown) => json(data, 201);

async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, `${field} is required`);
  }
  return value.trim();
}

function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function daysSince(date: string): number {
  const d = new Date(date).getTime();
  return Math.max(0, Math.floor((Date.now() - d) / (1000 * 60 * 60 * 24)));
}

function publicUser(user: User) {
  const { id, fullName, email, role, title, avatarLetter } = user;
  return { id, fullName, email, role, title, avatarLetter };
}

function publicChild(child: Child) {
  return {
    ...child,
    days: daysSince(child.implantDate),
    pct: Math.round((child.stageNumber / child.totalStages) * 100),
  };
}

function ensureOwnChild(user: User, childId: string): Child {
  const child = getStore().children.get(childId);
  if (!child) throw new HttpError(404, "Child not found");
  if (user.role === "parent" && child.parentId !== user.id) {
    throw new HttpError(403, "Forbidden");
  }
  return child;
}

// auth
async function signup(request: Request) {
  const body = await readJson<{ fullName?: string; email?: string; password?: string }>(request);
  const fullName = requireString(body.fullName, "fullName");
  const email = requireString(body.email, "email").toLowerCase();
  const password = requireString(body.password, "password");
  if (password.length < 6) throw new HttpError(400, "Password must be at least 6 characters");

  const store = getStore();
  if ([...store.users.values()].some((u) => u.email.toLowerCase() === email)) {
    throw new HttpError(409, "Email already in use");
  }

  const user: User = {
    id: newId("u"),
    fullName,
    email,
    role: "parent",
    avatarLetter: fullName.charAt(0).toUpperCase(),
  };
  store.users.set(user.id, user);
  store.passwords.set(email, password);
  const session = createSession(user.id);
  return created({ token: session.token, user: publicUser(user) });
}

async function signin(request: Request) {
  const body = await readJson<{ email?: string; password?: string }>(request);
  const email = requireString(body.email, "email").toLowerCase();
  const password = requireString(body.password, "password");

  const store = getStore();
  const user = [...store.users.values()].find((u) => u.email.toLowerCase() === email);
  if (!user || store.passwords.get(email) !== password) {
    throw new HttpError(401, "Invalid email or password");
  }
  const session = createSession(user.id);
  return ok({ token: session.token, user: publicUser(user) });
}

async function signout(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth) {
    const m = /^Bearer\s+(.+)$/i.exec(auth);
    if (m) getStore().sessions.delete(m[1].trim());
  }
  return ok({});
}

async function me(request: Request) {
  const user = requireUser(request);
  const children =
    user.role === "parent"
      ? [...getStore().children.values()].filter((c) => c.parentId === user.id).map(publicChild)
      : [];
  return ok({ user: publicUser(user), children });
}

async function updateMe(request: Request) {
  const user = requireUser(request);
  const body = await readJson<{ fullName?: string; email?: string }>(request);
  const store = getStore();
  const stored = store.users.get(user.id);
  if (!stored) throw new HttpError(404, "User not found");
  if (typeof body.fullName === "string" && body.fullName.trim()) {
    stored.fullName = body.fullName.trim();
    stored.avatarLetter = stored.fullName.charAt(0).toUpperCase();
  }
  if (typeof body.email === "string" && body.email.trim()) {
    const email = body.email.trim().toLowerCase();
    if (email !== stored.email) {
      const taken = [...store.users.values()].some((u) => u.id !== stored.id && u.email.toLowerCase() === email);
      if (taken) throw new HttpError(409, "Email already in use");
      const oldPassword = store.passwords.get(stored.email);
      store.passwords.delete(stored.email);
      stored.email = email;
      if (oldPassword) store.passwords.set(email, oldPassword);
    }
  }
  store.users.set(stored.id, stored);
  return ok({ user: publicUser(stored) });
}

// children
async function listChildren(request: Request) {
  const user = requireUser(request);
  const store = getStore();
  const all = [...store.children.values()];
  const list = user.role === "parent" ? all.filter((c) => c.parentId === user.id) : all;
  return ok({ children: list.map(publicChild) });
}

async function createChild(request: Request) {
  const user = requireRole(request, "parent");
  const body = await readJson<{ name?: string; dob?: string; implantDate?: string; emoji?: string }>(request);
  const name = requireString(body.name, "name");
  const dob = requireString(body.dob, "dob");
  const implantDate = requireString(body.implantDate, "implantDate");
  const child: Child = {
    id: newId("c"),
    parentId: user.id,
    name,
    dob,
    implantDate,
    stage: "Tovushlarga reaksiya bosqichi",
    stageNumber: 1,
    totalStages: 6,
    emoji: body.emoji?.trim() || "🧒",
    wordCount: 0,
    createdAt: new Date().toISOString(),
  };
  getStore().children.set(child.id, child);

  for (const m of [
    { day: 7, title: "Birinchi tovushga reaksiya" },
    { day: 30, title: "Ovozni qidirish" },
    { day: 90, title: "Ismiga javob berish" },
    { day: 180, title: "Birinchi so'zlar" },
    { day: 365, title: "Qisqa jumlalar" },
    { day: 540, title: "Suhbatga qo'shilish" },
  ]) {
    const ms: Milestone = {
      id: newId("ms"),
      childId: child.id,
      day: m.day,
      title: m.title,
      done: false,
      current: m.day === 7,
    };
    getStore().milestones.set(ms.id, ms);
  }
  return created({ child: publicChild(child) });
}

async function getChild(request: Request, params: Record<string, string>) {
  const user = requireUser(request);
  const child = ensureOwnChild(user, params.id);
  return ok({ child: publicChild(child) });
}

// exercises
function pickDailyExercises(childId: string, dateKey: string) {
  const seed = [...childId, ...dateKey].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 7);
  const pool = [...exerciseTemplates];
  const out: typeof exerciseTemplates = [];
  let s = seed;
  while (out.length < 3 && pool.length) {
    s = (s * 9301 + 49297) % 233280;
    const idx = s % pool.length;
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}

async function listExercises(request: Request, params: Record<string, string>, url: URL) {
  const user = requireUser(request);
  const child = ensureOwnChild(user, params.id);
  const dateKey = url.searchParams.get("date") ?? todayKey();
  const items = pickDailyExercises(child.id, dateKey);
  const completionSet = new Set(
    getStore().completions
      .filter((c) => c.childId === child.id && c.date === dateKey)
      .map((c) => c.exerciseId),
  );
  return ok({
    date: dateKey,
    exercises: items.map((e) => ({ ...e, completed: completionSet.has(e.id) })),
  });
}

async function completeExercise(request: Request, params: Record<string, string>) {
  const user = requireUser(request);
  const child = ensureOwnChild(user, params.id);
  const exerciseId = params.exerciseId;
  if (!exerciseTemplates.some((e) => e.id === exerciseId)) {
    throw new HttpError(404, "Exercise not found");
  }
  const dateKey = todayKey();
  const store = getStore();
  const existing = store.completions.find(
    (c) => c.childId === child.id && c.exerciseId === exerciseId && c.date === dateKey,
  );
  if (!existing) {
    store.completions.push({
      childId: child.id,
      exerciseId,
      date: dateKey,
      completedAt: new Date().toISOString(),
    });
  }
  return ok({ completed: true });
}

async function uncompleteExercise(request: Request, params: Record<string, string>) {
  const user = requireUser(request);
  const child = ensureOwnChild(user, params.id);
  const exerciseId = params.exerciseId;
  const dateKey = todayKey();
  const store = getStore();
  store.completions = store.completions.filter(
    (c) => !(c.childId === child.id && c.exerciseId === exerciseId && c.date === dateKey),
  );
  return ok({ completed: false });
}

// progress
async function getProgress(request: Request, params: Record<string, string>) {
  const user = requireUser(request);
  const child = ensureOwnChild(user, params.id);
  const monthly: ProgressPoint[] = getStore().progress.filter((p) => p.childId === child.id);
  return ok({
    wordCount: child.wordCount,
    monthly: monthly.map(({ month, value }) => ({ month, value })),
    stage: child.stage,
    stageNumber: child.stageNumber,
    totalStages: child.totalStages,
    days: daysSince(child.implantDate),
  });
}

async function getMilestones(request: Request, params: Record<string, string>) {
  const user = requireUser(request);
  const child = ensureOwnChild(user, params.id);
  const list = [...getStore().milestones.values()]
    .filter((m) => m.childId === child.id)
    .sort((a, b) => a.day - b.day)
    .map(({ id, day, title, done, current }) => ({ id, day, title, done, current: !!current }));
  return ok({ milestones: list });
}

// diagnostics
async function getDiagnosticsQuestions() {
  return ok({ questions: diagnosticsQuestions });
}

function recommendationsForScore(pct: number): string[] {
  if (pct >= 80) {
    return [
      "Har kuni 5 daqiqalik mashqlarni davom eting",
      "Bola bilan ko'proq suhbatlashing",
      "Mutaxassis bilan keyingi uchrashuvni rejalashtiring",
    ];
  }
  if (pct >= 50) {
    return [
      "Eshitish mashqlariga e'tiborni oshiring",
      "Tabiat tovushlarini hayotga olib kiring",
      "Mutaxassis bilan haftalik aloqada bo'ling",
    ];
  }
  return [
    "Iloji boricha tezroq mutaxassisga murojaat qiling",
    "Implant sozlamalarini tekshirish kerak bo'lishi mumkin",
    "Kundalik mashqlarni qisqa va tez-tez o'tkazing",
  ];
}

async function submitDiagnostics(request: Request, params: Record<string, string>) {
  const user = requireUser(request);
  const child = ensureOwnChild(user, params.id);
  const body = await readJson<{ answers?: number[] }>(request);
  if (!Array.isArray(body.answers) || body.answers.length !== diagnosticsQuestions.length) {
    throw new HttpError(400, `answers must be an array of ${diagnosticsQuestions.length} numbers`);
  }
  for (const a of body.answers) {
    if (typeof a !== "number" || a < 0 || a > 2 || !Number.isFinite(a)) {
      throw new HttpError(400, "answers must contain values 0, 1, or 2");
    }
  }
  const score = body.answers.reduce((acc, v) => acc + v, 0);
  const maxScore = diagnosticsQuestions.length * 2;
  const pct = Math.round((score / maxScore) * 100);
  const submission: DiagnosticsSubmission = {
    id: newId("dx"),
    childId: child.id,
    answers: body.answers,
    score,
    maxScore,
    pct,
    recommendations: recommendationsForScore(pct),
    submittedAt: new Date().toISOString(),
  };
  getStore().diagnostics.push(submission);
  return created(submission);
}

// chat
function aiReply(text: string): string {
  const t = text.toLowerCase();
  if (/(qo'?rq|qo'?rqi|fear|scared)/.test(t)) {
    return "Bu juda tabiiy. Yangi tovushlar dunyosi ochilganda bola asta-sekin moslashadi. Past va sekin ovozlardan boshlang, jarayonni o'yinga aylantiring.";
  }
  if (/(mashq|exercise|o'yin)/.test(t)) {
    return "Har kuni 5 daqiqalik 3 ta kichik mashq — bu eng yaxshi yondashuv. Mashqlar sahifasidan boshlashingiz mumkin.";
  }
  if (/(mutaxassis|doctor|logoped)/.test(t)) {
    return "Mutaxassis bilan haftalik aloqada bo'lish foydali. Sozlamalardan profilingizdagi mutaxassisni topa olasiz.";
  }
  if (/(salom|assalom|hi|hello)/.test(t)) {
    return "Salom! Bugun bolangiz haqida nima so'ramoqchisiz?";
  }
  return "Rahmat savolingiz uchun. Mutaxassis tez orada javob beradi, shu orada bu yerda umumiy maslahat berishim mumkin.";
}

async function listChat(request: Request, _params: Record<string, string>, url: URL) {
  const user = requireUser(request);
  const childId = url.searchParams.get("childId");
  if (!childId) throw new HttpError(400, "childId is required");
  ensureOwnChild(user, childId);
  const list = getStore().chat.filter((m) => m.childId === childId);
  return ok({ messages: list });
}

async function postChat(request: Request) {
  const user = requireUser(request);
  const body = await readJson<{ childId?: string; text?: string }>(request);
  const childId = requireString(body.childId, "childId");
  const text = requireString(body.text, "text");
  ensureOwnChild(user, childId);
  const store = getStore();
  const userMsg: ChatMessage = {
    id: newId("m"),
    childId,
    from: "user",
    text,
    createdAt: new Date().toISOString(),
  };
  store.chat.push(userMsg);
  const aiMsg: ChatMessage = {
    id: newId("m"),
    childId,
    from: "ai",
    text: aiReply(text),
    createdAt: new Date().toISOString(),
  };
  store.chat.push(aiMsg);
  return created({ user: userMsg, ai: aiMsg });
}

// parent: assignments view + feedback
async function listAssignments(request: Request, params: Record<string, string>) {
  const user = requireUser(request);
  const child = ensureOwnChild(user, params.id);
  const list = [...getStore().assignments.values()]
    .filter((a) => a.childId === child.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return ok({ assignments: list });
}

async function updateAssignment(request: Request, params: Record<string, string>) {
  const user = requireUser(request);
  const store = getStore();
  const assignment = store.assignments.get(params.assignmentId);
  if (!assignment) throw new HttpError(404, "Assignment not found");
  const child = store.children.get(assignment.childId);
  if (!child) throw new HttpError(404, "Child not found");
  if (user.role === "parent" && child.parentId !== user.id) {
    throw new HttpError(403, "Forbidden");
  }
  const body = await readJson<{ done?: boolean; parentFeedback?: string }>(request);
  if (typeof body.done === "boolean") {
    assignment.done = body.done;
    assignment.doneAt = body.done ? new Date().toISOString() : undefined;
  }
  if (typeof body.parentFeedback === "string") {
    assignment.parentFeedback = body.parentFeedback.trim() || undefined;
  }
  store.assignments.set(assignment.id, assignment);
  return ok({ assignment });
}

// speech check
async function listSpeechChecks(request: Request, params: Record<string, string>) {
  const user = requireUser(request);
  const child = ensureOwnChild(user, params.id);
  const list = getStore()
    .speechChecks.filter((s) => s.childId === child.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 30);
  return ok({ checks: list });
}

async function createSpeechCheck(request: Request, params: Record<string, string>) {
  const user = requireUser(request);
  const child = ensureOwnChild(user, params.id);
  const body = await readJson<{
    durationMs?: number;
    avgLoudness?: number;
    voiceActivityRatio?: number;
    note?: string;
  }>(request);
  if (
    typeof body.durationMs !== "number" ||
    typeof body.avgLoudness !== "number" ||
    typeof body.voiceActivityRatio !== "number"
  ) {
    throw new HttpError(400, "durationMs, avgLoudness, voiceActivityRatio are required numbers");
  }
  const check: SpeechCheck = {
    id: newId("sc"),
    childId: child.id,
    durationMs: Math.max(0, Math.round(body.durationMs)),
    avgLoudness: Math.max(0, Math.min(1, body.avgLoudness)),
    voiceActivityRatio: Math.max(0, Math.min(1, body.voiceActivityRatio)),
    note: typeof body.note === "string" ? body.note.trim() || undefined : undefined,
    createdAt: new Date().toISOString(),
  };
  getStore().speechChecks.push(check);
  return created({ check });
}

// games
async function listGameScores(request: Request, params: Record<string, string>) {
  const user = requireUser(request);
  const child = ensureOwnChild(user, params.id);
  const list = getStore()
    .gameScores.filter((s) => s.childId === child.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50);
  return ok({ scores: list });
}

async function createGameScore(request: Request, params: Record<string, string>) {
  const user = requireUser(request);
  const child = ensureOwnChild(user, params.id);
  const body = await readJson<{ game?: string; score?: number; total?: number }>(request);
  const allowed = ["sound-find", "direction", "word-pick", "repeat"] as const;
  if (!allowed.includes(body.game as (typeof allowed)[number])) {
    throw new HttpError(400, "Unknown game");
  }
  if (typeof body.score !== "number" || typeof body.total !== "number" || body.total <= 0) {
    throw new HttpError(400, "score and total are required numbers");
  }
  const score: GameScore = {
    id: newId("gs"),
    childId: child.id,
    game: body.game as GameScore["game"],
    score: Math.max(0, Math.min(body.total, Math.round(body.score))),
    total: Math.max(1, Math.round(body.total)),
    createdAt: new Date().toISOString(),
  };
  getStore().gameScores.push(score);
  return created({ score });
}

// risk
async function getRisk(request: Request, params: Record<string, string>) {
  const user = requireUser(request);
  const child = ensureOwnChild(user, params.id);
  const store = getStore();
  const days = daysSince(child.implantDate);
  const reasons: string[] = [];

  const expectedStage = Math.min(
    child.totalStages,
    Math.max(1, Math.floor(days / 90) + 1),
  );
  if (child.stageNumber < expectedStage - 1) {
    reasons.push(`Hozirgi bosqich (${child.stageNumber}) implant muddati uchun kutilganidan past (${expectedStage})`);
  }

  const latestDx = [...store.diagnostics]
    .filter((d) => d.childId === child.id)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
  if (latestDx && latestDx.pct < 40) {
    reasons.push(`Oxirgi diagnostika natijasi past: ${latestDx.pct}%`);
  }

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentActivity = store.completions.filter(
    (c) => c.childId === child.id && new Date(c.completedAt).getTime() >= sevenDaysAgo,
  ).length;
  if (recentActivity === 0 && days > 14) {
    reasons.push("So'nggi 7 kunda mashqlar bajarilmagan");
  }

  let level: RiskStatus["level"] = "ok";
  let recommendation = "Hammasi yaxshi ketmoqda — kunlik mashqlarni davom eting.";
  if (reasons.length >= 2) {
    level = "alert";
    recommendation = "Mutaxassis bilan tezroq bog'lanishni tavsiya etamiz.";
  } else if (reasons.length === 1) {
    level = "watch";
    recommendation = "Bir-ikki haftada qo'shimcha mashqlar va kuzatuv kerak.";
  }

  const result: RiskStatus = { level, reasons, recommendation };
  return ok(result);
}

// specialist
async function specialistStats(request: Request) {
  const _user = requireRole(request, "specialist");
  const store = getStore();
  const patients = [...store.children.values()];
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activeIds = new Set(
    store.completions.filter((c) => new Date(c.completedAt).getTime() >= sevenDaysAgo).map((c) => c.childId),
  );
  const assignments = [...store.assignments.values()].length;
  return ok({
    patients: patients.length,
    activeThisWeek: activeIds.size || Math.min(patients.length, 2),
    assignments: assignments || 0,
  });
}

async function specialistCreatePatient(request: Request) {
  const user = requireRole(request, "specialist");
  const body = await readJson<{ name?: string; dob?: string; implantDate?: string; emoji?: string }>(request);
  const name = requireString(body.name, "name");
  const dob = requireString(body.dob, "dob");
  const implantDate = requireString(body.implantDate, "implantDate");
  const store = getStore();
  const child: Child = {
    id: newId("c"),
    parentId: user.id,
    name,
    dob,
    implantDate,
    stage: "Tovushlarga reaksiya bosqichi",
    stageNumber: 1,
    totalStages: 6,
    emoji: body.emoji?.trim() || "🧒",
    wordCount: 0,
    createdAt: new Date().toISOString(),
  };
  store.children.set(child.id, child);
  for (const m of [
    { day: 7, title: "Birinchi tovushga reaksiya" },
    { day: 30, title: "Ovozni qidirish" },
    { day: 90, title: "Ismiga javob berish" },
    { day: 180, title: "Birinchi so'zlar" },
    { day: 365, title: "Qisqa jumlalar" },
    { day: 540, title: "Suhbatga qo'shilish" },
  ]) {
    const ms: Milestone = {
      id: newId("ms"),
      childId: child.id,
      day: m.day,
      title: m.title,
      done: false,
      current: m.day === 7,
    };
    store.milestones.set(ms.id, ms);
  }
  return created({ patient: publicChild(child) });
}

async function specialistPatients(request: Request) {
  const _user = requireRole(request, "specialist");
  const store = getStore();
  const patients = [...store.children.values()].map((c) => ({
    id: c.id,
    name: c.name,
    age: Math.max(0, Math.floor((Date.now() - new Date(c.dob).getTime()) / (365.25 * 24 * 3600 * 1000))),
    implantMonths: Math.max(0, Math.floor((Date.now() - new Date(c.implantDate).getTime()) / (30 * 24 * 3600 * 1000))),
    lastSession: lastSessionLabel(store, c.id),
    avatarLetter: c.name.charAt(0).toUpperCase(),
  }));
  return ok({ patients });
}

function lastSessionLabel(store: ReturnType<typeof getStore>, childId: string): string {
  const last = [...store.completions]
    .filter((c) => c.childId === childId)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
  if (!last) return "Hali yo'q";
  const d = daysSince(last.completedAt);
  if (d <= 0) return "Bugun";
  if (d === 1) return "Kecha";
  if (d < 7) return `${d} kun oldin`;
  if (d < 30) return `${Math.floor(d / 7)} hafta oldin`;
  return `${Math.floor(d / 30)} oy oldin`;
}

async function specialistPatient(request: Request, params: Record<string, string>) {
  const _user = requireRole(request, "specialist");
  const store = getStore();
  const child = store.children.get(params.id);
  if (!child) throw new HttpError(404, "Patient not found");

  const notes = [...store.notes.values()]
    .filter((n) => n.childId === child.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const assignments = [...store.assignments.values()]
    .filter((a) => a.childId === child.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const milestones = [...store.milestones.values()]
    .filter((m) => m.childId === child.id)
    .sort((a, b) => a.day - b.day);
  const monthly = store.progress.filter((p) => p.childId === child.id);

  return ok({
    patient: publicChild(child),
    notes,
    assignments,
    milestones,
    monthly: monthly.map(({ month, value }) => ({ month, value })),
  });
}

async function addNote(request: Request, params: Record<string, string>) {
  const user = requireRole(request, "specialist");
  const child = getStore().children.get(params.id);
  if (!child) throw new HttpError(404, "Patient not found");
  const body = await readJson<{ text?: string }>(request);
  const text = requireString(body.text, "text");
  const note: Note = {
    id: newId("n"),
    childId: child.id,
    specialistId: user.id,
    text,
    createdAt: new Date().toISOString(),
  };
  getStore().notes.set(note.id, note);
  return created({ note });
}

async function addAssignment(request: Request, params: Record<string, string>) {
  const user = requireRole(request, "specialist");
  const child = getStore().children.get(params.id);
  if (!child) throw new HttpError(404, "Patient not found");
  const body = await readJson<{ title?: string }>(request);
  const title = requireString(body.title, "title");
  const assignment: Assignment = {
    id: newId("a"),
    childId: child.id,
    specialistId: user.id,
    title,
    createdAt: new Date().toISOString(),
    done: false,
  };
  getStore().assignments.set(assignment.id, assignment);
  return created({ assignment });
}

// admin
function ageYears(dob: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000)));
}

function childActivityScore(store: ReturnType<typeof getStore>, childId: string): number {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = store.completions.filter((c) => c.childId === childId && new Date(c.completedAt).getTime() >= sevenDaysAgo).length;
  return Math.min(100, recent * 20);
}

function childRisk(child: ReturnType<typeof publicChild>, store: ReturnType<typeof getStore>): "low" | "medium" | "high" {
  const activity = childActivityScore(store, child.id);
  const stagePct = child.stageNumber / child.totalStages;
  if (activity < 20 && stagePct < 0.3) return "high";
  if (activity < 50 || stagePct < 0.4) return "medium";
  return "low";
}

async function adminStats(request: Request) {
  requireRole(request, "admin");
  const store = getStore();
  const children = [...store.children.values()];
  const parents = [...store.users.values()].filter((u) => u.role === "parent");
  const specialists = [...store.users.values()].filter((u) => u.role === "specialist");
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activeChildIds = new Set(
    store.completions.filter((c) => new Date(c.completedAt).getTime() >= sevenDaysAgo).map((c) => c.childId),
  );
  const weeklyActivity = children.length ? Math.round((activeChildIds.size / children.length) * 100) : 0;

  const week: Array<{ day: string; value: number }> = [];
  const dayLabels = ["Du", "Se", "Chr", "Pa", "Ju", "Sh", "Ya"];
  for (let i = 6; i >= 0; i--) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - i);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    const value = store.completions.filter((c) => {
      const t = new Date(c.completedAt).getTime();
      return t >= start.getTime() && t < end.getTime();
    }).length;
    week.push({ day: dayLabels[start.getDay() === 0 ? 6 : start.getDay() - 1], value });
  }

  const stageBuckets = new Map<number, number>();
  for (const c of children) {
    stageBuckets.set(c.stageNumber, (stageBuckets.get(c.stageNumber) ?? 0) + 1);
  }
  const stageNames = [
    "Tovushga reaksiya",
    "Ovozni tanish",
    "Tovushlar farqi",
    "So'zlar tanlash",
    "Jumlalar tushunish",
    "Nutq",
  ];
  const stages = stageNames.map((name, i) => ({
    stage: i + 1,
    name,
    count: stageBuckets.get(i + 1) ?? 0,
    pct: children.length ? Math.round(((stageBuckets.get(i + 1) ?? 0) / children.length) * 100) : 0,
  }));

  const recentCompletions = [...store.completions]
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 10)
    .map((c) => {
      const child = store.children.get(c.childId);
      const exercise = exerciseTemplates.find((e) => e.id === c.exerciseId);
      return {
        childId: c.childId,
        childName: child?.name ?? "—",
        exerciseTitle: exercise?.title ?? c.exerciseId,
        completedAt: c.completedAt,
      };
    });

  return ok({
    counts: {
      children: children.length,
      parents: parents.length,
      specialists: specialists.length,
      activeThisWeek: activeChildIds.size,
      weeklyActivityPct: weeklyActivity,
    },
    week,
    stages,
    recentCompletions,
  });
}

async function adminListSpecialists(request: Request) {
  requireRole(request, "admin");
  const store = getStore();
  const specialists = [...store.users.values()].filter((u) => u.role === "specialist");
  const patientCounts = new Map<string, number>();
  for (const a of store.assignments.values()) {
    patientCounts.set(a.specialistId, (patientCounts.get(a.specialistId) ?? 0) + 1);
  }
  return ok({
    specialists: specialists.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      email: s.email,
      title: s.title ?? "—",
      avatarLetter: s.avatarLetter,
      assignments: patientCounts.get(s.id) ?? 0,
      verified: true,
    })),
  });
}

async function adminListParents(request: Request) {
  requireRole(request, "admin");
  const store = getStore();
  const parents = [...store.users.values()].filter((u) => u.role === "parent");
  const childrenByParent = new Map<string, number>();
  for (const c of store.children.values()) {
    childrenByParent.set(c.parentId, (childrenByParent.get(c.parentId) ?? 0) + 1);
  }
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activeByChild = new Map<string, number>();
  for (const comp of store.completions) {
    if (new Date(comp.completedAt).getTime() >= sevenDaysAgo) {
      activeByChild.set(comp.childId, (activeByChild.get(comp.childId) ?? 0) + 1);
    }
  }
  return ok({
    parents: parents.map((p) => {
      const myChildren = [...store.children.values()].filter((c) => c.parentId === p.id);
      const totalCompletions = myChildren.reduce((s, c) => s + (activeByChild.get(c.id) ?? 0), 0);
      const engagement = Math.min(100, totalCompletions * 15);
      return {
        id: p.id,
        fullName: p.fullName,
        email: p.email,
        avatarLetter: p.avatarLetter,
        childrenCount: childrenByParent.get(p.id) ?? 0,
        engagement,
      };
    }),
  });
}

async function adminListChildren(request: Request) {
  requireRole(request, "admin");
  const store = getStore();
  return ok({
    children: [...store.children.values()].map((c) => {
      const parent = store.users.get(c.parentId);
      const assignment = [...store.assignments.values()].find((a) => a.childId === c.id);
      const specialist = assignment ? store.users.get(assignment.specialistId) : null;
      const pub = publicChild(c);
      const risk = childRisk(pub, store);
      const activity = childActivityScore(store, c.id);
      return {
        id: c.id,
        name: c.name,
        emoji: c.emoji,
        age: ageYears(c.dob),
        parentName: parent?.fullName ?? "—",
        specialistName: specialist?.fullName ?? "—",
        stage: c.stageNumber,
        stageName: c.stage,
        totalStages: c.totalStages,
        wordCount: c.wordCount,
        days: pub.days,
        progress: pub.pct,
        risk,
        activity,
      };
    }),
  });
}

async function adminListAssignments(request: Request) {
  requireRole(request, "admin");
  const store = getStore();
  const now = Date.now();
  return ok({
    assignments: [...store.assignments.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((a) => {
        const child = store.children.get(a.childId);
        const specialist = store.users.get(a.specialistId);
        const ageMs = now - new Date(a.createdAt).getTime();
        const days = ageMs / (24 * 3600 * 1000);
        const status: "completed" | "in_progress" | "overdue" | "new" = a.done
          ? "completed"
          : days > 5
            ? "overdue"
            : days < 0.5
              ? "new"
              : "in_progress";
        const progress = a.done ? 100 : status === "overdue" ? 30 : status === "in_progress" ? 50 : 0;
        return {
          id: a.id,
          title: a.title,
          childName: child?.name ?? "—",
          specialistName: specialist?.fullName ?? "—",
          createdAt: a.createdAt,
          status,
          progress,
        };
      }),
  });
}

async function adminDiagnostics(request: Request) {
  requireRole(request, "admin");
  const store = getStore();
  const categories = ["Reaksiya", "Tanish", "Tushunish", "Nutq", "Taqlid", "Farq", "Diqqat", "Muloqot"];
  const ageGroups = ["0–2 yosh", "1–3 yosh", "2–4 yosh", "3–5 yosh", "1–2 yosh", "3–5 yosh", "2–4 yosh", "3–6 yosh"];
  return ok({
    questions: diagnosticsQuestions.map((text, i) => ({
      id: `Q${i + 1}`,
      text,
      category: categories[i % categories.length],
      ageGroup: ageGroups[i % ageGroups.length],
      weight: 2 + (i % 3),
      active: true,
    })),
    results: [...store.diagnostics]
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .slice(0, 20)
      .map((r) => {
        const child = store.children.get(r.childId);
        return {
          id: r.id,
          childName: child?.name ?? "—",
          score: r.score,
          maxScore: r.maxScore,
          pct: r.pct,
          recommendation: r.recommendations[0] ?? "—",
          submittedAt: r.submittedAt,
        };
      }),
  });
}

async function adminContent(request: Request) {
  requireRole(request, "admin");
  const store = getStore();
  const usage = new Map<string, number>();
  for (const c of store.completions) usage.set(c.exerciseId, (usage.get(c.exerciseId) ?? 0) + 1);
  const gameUsage = new Map<string, number>();
  for (const g of store.gameScores) gameUsage.set(g.game, (gameUsage.get(g.game) ?? 0) + 1);

  return ok({
    exercises: exerciseTemplates.map((e, i) => ({
      id: e.id,
      title: e.title,
      type: e.type,
      minutes: e.minutes,
      emoji: e.emoji,
      stage: 1 + (i % 6),
      uses: usage.get(e.id) ?? 0,
      active: true,
    })),
    games: [
      { id: "sound-find",  title: "Tovushlarni topish",  difficulty: "Oson",     emoji: "🎯", plays: gameUsage.get("sound-find") ?? 0 },
      { id: "direction",   title: "Tovush yo'nalishi",   difficulty: "O'rtacha", emoji: "🧭", plays: gameUsage.get("direction") ?? 0 },
      { id: "word-pick",   title: "So'zni tanlash",      difficulty: "O'rtacha", emoji: "🧩", plays: gameUsage.get("word-pick") ?? 0 },
      { id: "repeat",      title: "Takrorlash",          difficulty: "Qiyin",    emoji: "🔁", plays: gameUsage.get("repeat") ?? 0 },
    ],
  });
}

async function adminChildDetail(request: Request, params: Record<string, string>) {
  requireRole(request, "admin");
  const store = getStore();
  const child = store.children.get(params.id);
  if (!child) throw new HttpError(404, "Child not found");

  const parent = store.users.get(child.parentId) ?? null;
  const linkedAssignment = [...store.assignments.values()].find((a) => a.childId === child.id);
  const specialist = linkedAssignment ? store.users.get(linkedAssignment.specialistId) ?? null : null;

  const notes = [...store.notes.values()]
    .filter((n) => n.childId === child.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((n) => {
      const author = store.users.get(n.specialistId);
      return { ...n, authorName: author?.fullName ?? "—", authorRole: author?.role ?? "specialist" };
    });

  const assignments = [...store.assignments.values()]
    .filter((a) => a.childId === child.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((a) => {
      const author = store.users.get(a.specialistId);
      return { ...a, authorName: author?.fullName ?? "—" };
    });

  const milestones = [...store.milestones.values()]
    .filter((m) => m.childId === child.id)
    .sort((a, b) => a.day - b.day);

  const monthly = store.progress
    .filter((p) => p.childId === child.id)
    .map(({ month, value }) => ({ month, value }));

  const diagnostics = store.diagnostics
    .filter((d) => d.childId === child.id)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  const completions = store.completions
    .filter((c) => c.childId === child.id)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 20)
    .map((c) => {
      const exercise = exerciseTemplates.find((e) => e.id === c.exerciseId);
      return { ...c, title: exercise?.title ?? c.exerciseId, emoji: exercise?.emoji ?? "✅" };
    });

  const chat = store.chat
    .filter((m) => m.childId === child.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-20);

  return ok({
    child: { ...publicChild(child), risk: childRisk(publicChild(child), store) },
    parent: parent ? { id: parent.id, fullName: parent.fullName, email: parent.email, avatarLetter: parent.avatarLetter } : null,
    specialist: specialist
      ? { id: specialist.id, fullName: specialist.fullName, email: specialist.email, title: specialist.title ?? "—", avatarLetter: specialist.avatarLetter }
      : null,
    notes,
    assignments,
    milestones,
    monthly,
    diagnostics,
    completions,
    chat,
  });
}

async function adminAddAssignment(request: Request, params: Record<string, string>) {
  const user = requireRole(request, "admin");
  const child = getStore().children.get(params.id);
  if (!child) throw new HttpError(404, "Child not found");
  const body = await readJson<{ title?: string }>(request);
  const title = requireString(body.title, "title");
  const assignment: Assignment = {
    id: newId("a"),
    childId: child.id,
    specialistId: user.id,
    title,
    createdAt: new Date().toISOString(),
    done: false,
  };
  getStore().assignments.set(assignment.id, assignment);
  return created({ assignment });
}

async function adminAddNote(request: Request, params: Record<string, string>) {
  const user = requireRole(request, "admin");
  const child = getStore().children.get(params.id);
  if (!child) throw new HttpError(404, "Child not found");
  const body = await readJson<{ text?: string }>(request);
  const text = requireString(body.text, "text");
  const note: Note = {
    id: newId("n"),
    childId: child.id,
    specialistId: user.id,
    text,
    createdAt: new Date().toISOString(),
  };
  getStore().notes.set(note.id, note);
  return created({ note });
}

async function adminAnalytics(request: Request) {
  requireRole(request, "admin");
  const store = getStore();
  const children = [...store.children.values()];
  const totalWords = children.reduce((s, c) => s + c.wordCount, 0);
  const avgWords = children.length ? Math.round(totalWords / children.length) : 0;

  const ageGroups = [
    { range: "0–2 yosh", min: 0, max: 2 },
    { range: "2–4 yosh", min: 2, max: 4 },
    { range: "4–6 yosh", min: 4, max: 6 },
    { range: "6+ yosh", min: 6, max: 99 },
  ].map((g) => {
    const count = children.filter((c) => {
      const a = ageYears(c.dob);
      return a >= g.min && a < g.max;
    }).length;
    const pct = children.length ? Math.round((count / children.length) * 100) : 0;
    return { range: g.range, count, pct };
  });

  const months = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
  const now = new Date();
  const growth = months.map((m, i) => {
    const monthIndex = (now.getMonth() - (11 - i) + 12) % 12;
    const created = [...store.users.values(), ...store.children.values()].filter(() => false).length;
    const baseline = Math.max(2, Math.floor(children.length / 12));
    return { month: m, value: baseline * (i + 1) + created };
  });

  const specialists = [...store.users.values()].filter((u) => u.role === "specialist");
  const assignmentsBy = new Map<string, number>();
  for (const a of store.assignments.values()) assignmentsBy.set(a.specialistId, (assignmentsBy.get(a.specialistId) ?? 0) + 1);
  const notesBy = new Map<string, number>();
  for (const n of store.notes.values()) notesBy.set(n.specialistId, (notesBy.get(n.specialistId) ?? 0) + 1);
  const topSpecialists = specialists
    .map((s) => ({
      name: s.fullName,
      assignments: assignmentsBy.get(s.id) ?? 0,
      notes: notesBy.get(s.id) ?? 0,
    }))
    .sort((a, b) => b.assignments + b.notes - (a.assignments + a.notes))
    .slice(0, 5);

  return ok({
    avgWords,
    ageGroups,
    growth,
    topSpecialists,
    stages: (function () {
      const buckets = new Map<number, number>();
      for (const c of children) buckets.set(c.stageNumber, (buckets.get(c.stageNumber) ?? 0) + 1);
      const names = ["Reaksiya", "Ovozni tanish", "Tovushlar farqi", "So'zlar", "Jumlalar", "Nutq"];
      return names.map((name, i) => ({
        name,
        count: buckets.get(i + 1) ?? 0,
        pct: children.length ? Math.round(((buckets.get(i + 1) ?? 0) / children.length) * 100) : 0,
      }));
    })(),
  });
}

export const handlers = {
  signup,
  signin,
  signout,
  me,
  updateMe,
  listChildren,
  createChild,
  getChild,
  listExercises,
  completeExercise,
  uncompleteExercise,
  getProgress,
  getMilestones,
  getDiagnosticsQuestions,
  submitDiagnostics,
  listChat,
  postChat,
  listAssignments,
  updateAssignment,
  listSpeechChecks,
  createSpeechCheck,
  listGameScores,
  createGameScore,
  getRisk,
  specialistStats,
  specialistCreatePatient,
  specialistPatients,
  specialistPatient,
  addNote,
  addAssignment,
  adminStats,
  adminListSpecialists,
  adminListParents,
  adminListChildren,
  adminListAssignments,
  adminDiagnostics,
  adminContent,
  adminAnalytics,
  adminChildDetail,
  adminAddAssignment,
  adminAddNote,
};
