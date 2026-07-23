"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "crush-web:client-id";

// crush serve requires every session-scoped/event call to carry a
// client_id UUID (see requireClientID in internal/server/proto.go). It
// also uses that ID to compute AttachedClients / drive workspace
// teardown, so this needs to be stable across reloads for a given
// browser rather than freshly generated every render.
export function useClientId(): string | null {
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = uuidv4();
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    setClientId(id);
  }, []);

  return clientId;
}
