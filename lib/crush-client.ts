import type {
  AgentMessage,
  Message,
  PermissionGrant,
  QuestionAnswer,
  Session,
  Workspace,
} from "./types";

// All calls go through /api/crush/* (see app/api/crush/[...path]/route.ts),
// which forwards to `crush serve`. Nothing here talks to crush serve
// directly, so this file works the same whether crush serve is on the
// same machine or tunneled in from elsewhere.

const BASE = "/api/crush";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    let message = body;
    try {
      message = JSON.parse(body).message ?? body;
    } catch {
      /* not JSON, use raw body */
    }
    throw new Error(`${res.status} ${path}: ${message}`);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export const crush = {
  // -- workspaces --------------------------------------------------
  listWorkspaces: () => request<Workspace[]>("workspaces"),

  // client_id is required here, not optional — CreateWorkspace on the
  // server validates it as a UUID before doing anything else (see
  // backend.validateClientID in internal/backend/backend.go) and
  // registers this same client_id against the workspace immediately,
  // so it must be the same id this browser then uses to open the
  // /events SSE stream.
  createWorkspace: (path: string, clientId: string) =>
    request<Workspace>("workspaces", {
      method: "POST",
      body: JSON.stringify({ path, client_id: clientId }),
    }),

  getWorkspace: (workspaceId: string) => request<Workspace>(`workspaces/${workspaceId}`),

  deleteWorkspace: (workspaceId: string) =>
    request<void>(`workspaces/${workspaceId}`, { method: "DELETE" }),

  setCurrentSession: (workspaceId: string, clientId: string, sessionId: string) =>
    request<void>(`workspaces/${workspaceId}/current-session?client_id=${clientId}`, {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    }),

  // -- sessions ------------------------------------------------------
  listSessions: (workspaceId: string) =>
    request<Session[]>(`workspaces/${workspaceId}/sessions`),

  createSession: (workspaceId: string, title?: string) =>
    request<Session>(`workspaces/${workspaceId}/sessions`, {
      method: "POST",
      body: JSON.stringify(title ? { title } : {}),
    }),

  getSession: (workspaceId: string, sessionId: string) =>
    request<Session>(`workspaces/${workspaceId}/sessions/${sessionId}`),

  deleteSession: (workspaceId: string, sessionId: string) =>
    request<void>(`workspaces/${workspaceId}/sessions/${sessionId}`, { method: "DELETE" }),

  getMessages: (workspaceId: string, sessionId: string) =>
    request<Message[]>(`workspaces/${workspaceId}/sessions/${sessionId}/messages`),

  // -- agent ---------------------------------------------------------
  sendMessage: (workspaceId: string, msg: AgentMessage) =>
    request<void>(`workspaces/${workspaceId}/agent`, {
      method: "POST",
      body: JSON.stringify(msg),
    }),

  cancelSession: (workspaceId: string, sessionId: string) =>
    request<void>(`workspaces/${workspaceId}/agent/sessions/${sessionId}/cancel`, {
      method: "POST",
    }),

  // -- permissions & questions ----------------------------------------
  grantPermission: (workspaceId: string, grant: PermissionGrant) =>
    request<{ resolved: boolean }>(`workspaces/${workspaceId}/permissions/grant`, {
      method: "POST",
      body: JSON.stringify(grant),
    }),

  answerQuestion: (workspaceId: string, answer: QuestionAnswer) =>
    request<{ resolved: boolean }>(`workspaces/${workspaceId}/questions/answer`, {
      method: "POST",
      body: JSON.stringify(answer),
    }),
};

// SSE endpoint URL builder — consumed directly by hooks/useWorkspaceEvents.ts
// since EventSource needs a URL, not a fetch wrapper.
export function workspaceEventsUrl(workspaceId: string, clientId: string) {
  return `${BASE}/workspaces/${workspaceId}/events?client_id=${clientId}`;
}
