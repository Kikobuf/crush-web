"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { crush } from "@/lib/crush-client";
import { useClientId } from "@/hooks/useClientId";
import { useWorkspaceEvents } from "@/hooks/useWorkspaceEvents";
import type {
  Message,
  PermissionRequest,
  QuestionRequest,
  QuestionResponse,
  Session,
  Workspace,
} from "@/lib/types";
import { WorkspacePicker } from "./WorkspacePicker";
import { SessionSidebar } from "./SessionSidebar";
import { ChatWindow } from "./ChatWindow";
import { PermissionPrompt } from "./PermissionPrompt";
import { QuestionPrompt } from "./QuestionPrompt";

const RECENT_KEY = "crush-web:recent-paths";

// Every SSE payload wraps the actual object one level deeper:
// { type, payload: { type: created|updated|deleted, payload: T } }.
function unwrap<T>(frame: { payload: { payload: unknown } }): T {
  return frame.payload.payload as T;
}

export function AppShell() {
  const clientId = useClientId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [recentPaths, setRecentPaths] = useState<string[]>([]);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    searchParams.get("session"),
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);

  const [pendingPermission, setPendingPermission] = useState<PermissionRequest | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<QuestionRequest | null>(null);

  // -- recent paths, persisted locally ---------------------------------
  useEffect(() => {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (raw) setRecentPaths(JSON.parse(raw));
  }, []);

  function rememberPath(path: string) {
    setRecentPaths((prev) => {
      const next = [path, ...prev.filter((p) => p !== path)].slice(0, 8);
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }

  // -- open / attach a workspace ----------------------------------------
  const openWorkspace = useCallback(
    async (path: string) => {
      setConnectError(null);
      if (!clientId) {
        // clientId is generated client-side on mount (see useClientId);
        // this should only be hit if someone clicks Open in the ~0ms
        // window before that effect has run.
        setConnectError("Still initializing — try again in a moment.");
        return;
      }
      try {
        const ws = await crush.createWorkspace(path, clientId);
        setWorkspace(ws);
        rememberPath(path);
        const list = await crush.listSessions(ws.id);
        setSessions(list);
        setConnected(true);
      } catch (err) {
        setConnectError(err instanceof Error ? err.message : String(err));
      }
    },
    [clientId],
  );

  // -- load message history whenever the active session changes ---------
  useEffect(() => {
    if (!workspace || !activeSessionId) {
      setMessages([]);
      return;
    }
    crush
      .getMessages(workspace.id, activeSessionId)
      .then(setMessages)
      .catch((err) => console.error("Failed to load messages", err));
  }, [workspace, activeSessionId]);

  // keep the URL shareable / reflect the active session
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeSessionId) params.set("session", activeSessionId);
    else params.delete("session");
    router.replace(`?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  // -- SSE dispatch -------------------------------------------------------
  useWorkspaceEvents(workspace?.id ?? null, clientId, (frame) => {
    switch (frame.type) {
      case "session": {
        const session = unwrap<Session>(frame);
        setSessions((prev) => {
          const idx = prev.findIndex((s) => s.id === session.id);
          if (frame.payload.type === "deleted") return prev.filter((s) => s.id !== session.id);
          if (idx === -1) return [...prev, session];
          const next = [...prev];
          next[idx] = session;
          return next;
        });
        break;
      }
      case "message": {
        const message = unwrap<Message>(frame);
        if (message.session_id !== activeSessionId) break;
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === message.id);
          if (idx === -1) return [...prev, message];
          const next = [...prev];
          next[idx] = message;
          return next;
        });
        break;
      }
      case "permission_request": {
        setPendingPermission(unwrap<PermissionRequest>(frame));
        break;
      }
      case "permission_notification": {
        setPendingPermission((cur) =>
          cur && cur.tool_call_id === unwrap<{ tool_call_id: string }>(frame).tool_call_id
            ? null
            : cur,
        );
        break;
      }
      case "question_batch_request": {
        setPendingQuestion(unwrap<QuestionRequest>(frame));
        break;
      }
      case "question_batch_notification": {
        setPendingQuestion((cur) =>
          cur && cur.id === unwrap<{ batch_id: string }>(frame).batch_id ? null : cur,
        );
        break;
      }
      default:
        break;
    }
  });

  async function handleCreateSession() {
    if (!workspace) return;
    const session = await crush.createSession(workspace.id);
    setSessions((prev) => [...prev, session]);
    setActiveSessionId(session.id);
  }

  async function handleSend(text: string) {
    if (!workspace || !activeSessionId) return;
    await crush.sendMessage(workspace.id, { session_id: activeSessionId, prompt: text });
  }

  async function handleCancel() {
    if (!workspace || !activeSessionId) return;
    await crush.cancelSession(workspace.id, activeSessionId);
  }

  async function handlePermissionAnswer(action: "allow" | "allow_session" | "deny") {
    if (!workspace || !pendingPermission) return;
    await crush.grantPermission(workspace.id, { permission: pendingPermission, action });
    setPendingPermission(null);
  }

  async function handleQuestionAnswer(responses: QuestionResponse[]) {
    if (!workspace || !pendingQuestion) return;
    await crush.answerQuestion(workspace.id, {
      batch_request_id: pendingQuestion.id,
      responses,
    });
    setPendingQuestion(null);
  }

  if (!workspace) {
    return <WorkspacePicker recent={recentPaths} onOpen={openWorkspace} error={connectError} />;
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  return (
    <div className="flex h-dvh">
      <SessionSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelect={setActiveSessionId}
        onCreate={handleCreateSession}
      />
      <ChatWindow
        session={activeSession}
        messages={messages}
        connected={connected}
        onSend={handleSend}
        onCancel={handleCancel}
      />

      {pendingPermission && (
        <PermissionPrompt request={pendingPermission} onAnswer={handlePermissionAnswer} />
      )}
      {pendingQuestion && (
        <QuestionPrompt request={pendingQuestion} onAnswer={handleQuestionAnswer} />
      )}
    </div>
  );
}
