const TOKEN_KEY = "hearak.token";
const ACTIVE_CHILD_KEY = "hearak.activeChildId";

const isBrowser = typeof window !== "undefined";

export function getToken(): string | null {
  if (!isBrowser) return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (!isBrowser) return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function getActiveChildId(): string | null {
  if (!isBrowser) return null;
  try {
    return window.localStorage.getItem(ACTIVE_CHILD_KEY);
  } catch {
    return null;
  }
}

const ACTIVE_CHILD_EVENT = "hearak:activeChildChanged";

export function setActiveChildId(id: string | null) {
  if (!isBrowser) return;
  try {
    if (id) window.localStorage.setItem(ACTIVE_CHILD_KEY, id);
    else window.localStorage.removeItem(ACTIVE_CHILD_KEY);
    window.dispatchEvent(new CustomEvent(ACTIVE_CHILD_EVENT, { detail: id }));
  } catch {
    /* ignore */
  }
}

export function subscribeActiveChild(listener: () => void): () => void {
  if (!isBrowser) return () => {};
  window.addEventListener(ACTIVE_CHILD_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(ACTIVE_CHILD_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  searchParams?: Record<string, string | number | undefined | null>;
};

function buildUrl(path: string, searchParams?: RequestOptions["searchParams"]): string {
  if (!searchParams) return path;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v === undefined || v === null) continue;
    params.append(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["authorization"] = `Bearer ${token}`;
  if (opts.body !== undefined) headers["content-type"] = "application/json";

  const response = await fetch(buildUrl(path, opts.searchParams), {
    method: opts.method ?? "GET",
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    signal: opts.signal,
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data = text ? safeParse(text) : null;
  if (!response.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : null) ?? `Request failed (${response.status})`;
    throw new ApiError(response.status, message);
  }
  return data as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
