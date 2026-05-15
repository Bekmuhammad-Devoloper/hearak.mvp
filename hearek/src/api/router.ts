import { HttpError } from "./auth";
import { handlers } from "./handlers";

type Params = Record<string, string>;
type Handler = (request: Request, params: Params, url: URL) => Promise<Response> | Response;

type Route = { method: string; pattern: RegExp; keys: string[]; handler: Handler };

function compile(path: string): { pattern: RegExp; keys: string[] } {
  const keys: string[] = [];
  const re = path
    .replace(/\/$/, "")
    .replace(/:(\w+)/g, (_, key) => {
      keys.push(key);
      return "([^/]+)";
    });
  return { pattern: new RegExp(`^${re}/?$`), keys };
}

function route(method: string, path: string, handler: Handler): Route {
  const { pattern, keys } = compile(path);
  return { method: method.toUpperCase(), pattern, keys, handler };
}

const routes: Route[] = [
  route("POST", "/api/auth/signup", handlers.signup),
  route("POST", "/api/auth/signin", handlers.signin),
  route("POST", "/api/auth/signout", handlers.signout),
  route("GET", "/api/me", handlers.me),
  route("PATCH", "/api/me", handlers.updateMe),

  route("GET", "/api/children", handlers.listChildren),
  route("POST", "/api/children", handlers.createChild),
  route("GET", "/api/children/:id", handlers.getChild),

  route("GET", "/api/children/:id/exercises", handlers.listExercises),
  route("POST", "/api/children/:id/exercises/:exerciseId/complete", handlers.completeExercise),
  route("DELETE", "/api/children/:id/exercises/:exerciseId/complete", handlers.uncompleteExercise),

  route("GET", "/api/children/:id/progress", handlers.getProgress),
  route("GET", "/api/children/:id/milestones", handlers.getMilestones),

  route("GET", "/api/diagnostics/questions", handlers.getDiagnosticsQuestions),
  route("POST", "/api/children/:id/diagnostics", handlers.submitDiagnostics),

  route("GET", "/api/chat", handlers.listChat),
  route("POST", "/api/chat", handlers.postChat),

  route("GET", "/api/children/:id/assignments", handlers.listAssignments),
  route("PATCH", "/api/assignments/:assignmentId", handlers.updateAssignment),

  route("GET", "/api/children/:id/speech-checks", handlers.listSpeechChecks),
  route("POST", "/api/children/:id/speech-checks", handlers.createSpeechCheck),

  route("GET", "/api/children/:id/game-scores", handlers.listGameScores),
  route("POST", "/api/children/:id/game-scores", handlers.createGameScore),

  route("GET", "/api/children/:id/risk", handlers.getRisk),

  route("GET", "/api/specialist/stats", handlers.specialistStats),
  route("GET", "/api/specialist/patients", handlers.specialistPatients),
  route("POST", "/api/specialist/patients", handlers.specialistCreatePatient),
  route("GET", "/api/specialist/patients/:id", handlers.specialistPatient),
  route("POST", "/api/specialist/patients/:id/notes", handlers.addNote),
  route("POST", "/api/specialist/patients/:id/assignments", handlers.addAssignment),

  route("GET", "/api/admin/stats",        handlers.adminStats),
  route("GET", "/api/admin/specialists",  handlers.adminListSpecialists),
  route("GET", "/api/admin/parents",      handlers.adminListParents),
  route("GET", "/api/admin/children",     handlers.adminListChildren),
  route("GET", "/api/admin/assignments",  handlers.adminListAssignments),
  route("GET", "/api/admin/diagnostics",  handlers.adminDiagnostics),
  route("GET", "/api/admin/content",      handlers.adminContent),
  route("GET", "/api/admin/analytics",    handlers.adminAnalytics),
];

const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "access-control-allow-headers": "content-type,authorization",
  "access-control-max-age": "86400",
};

function withCors(response: Response): Response {
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    response.headers.set(k, v);
  }
  return response;
}

function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: err.status,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
  console.error("[api] unexpected error", err);
  return new Response(JSON.stringify({ error: "Internal server error" }), {
    status: 500,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export function isApiRequest(request: Request): boolean {
  const url = new URL(request.url);
  return url.pathname === "/api" || url.pathname.startsWith("/api/");
}

export async function handleApi(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }));
  }
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || url.pathname;

  for (const r of routes) {
    if (r.method !== request.method) continue;
    const match = r.pattern.exec(path);
    if (!match) continue;
    const params: Params = {};
    r.keys.forEach((key, i) => {
      params[key] = decodeURIComponent(match[i + 1]);
    });
    try {
      const response = await r.handler(request, params, url);
      return withCors(response);
    } catch (err) {
      return withCors(errorResponse(err));
    }
  }

  return withCors(
    new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8" },
    }),
  );
}
