"use client";

import { useEffect, useRef } from "react";
import { workspaceEventsUrl } from "@/lib/crush-client";
import type { SSEFrame } from "@/lib/types";

/**
 * Subscribes to GET /v1/workspaces/{id}/events for as long as the
 * component is mounted. A workspace on the crush serve side stays alive
 * only while at least one SSE stream is attached to it (see the
 * "Sharing a workspace across clients" section of the Crush README), so
 * this hook doubles as the thing that keeps the workspace from being
 * torn down while the app is open.
 *
 * `onFrame` is called for every parsed event; the caller switches on
 * `frame.type` (message / session / permission_request / ...) rather
 * than this hook trying to fan out to a dozen separate callbacks.
 */
export function useWorkspaceEvents(
  workspaceId: string | null,
  clientId: string | null,
  onFrame: (frame: SSEFrame) => void,
) {
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    if (!workspaceId || !clientId) return;

    let cancelled = false;
    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (cancelled) return;
      source = new EventSource(workspaceEventsUrl(workspaceId!, clientId!));

      source.onmessage = (ev) => {
        try {
          const frame = JSON.parse(ev.data) as SSEFrame;
          onFrameRef.current(frame);
        } catch (err) {
          console.error("Failed to parse SSE frame", err, ev.data);
        }
      };

      source.onerror = () => {
        source?.close();
        if (!cancelled) {
          // The workspace/proxy may have gone away momentarily (e.g.
          // crush serve restarted); back off briefly and reattach
          // rather than giving up the stream entirely.
          retryTimer = setTimeout(connect, 2000);
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      source?.close();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [workspaceId, clientId]);
}
