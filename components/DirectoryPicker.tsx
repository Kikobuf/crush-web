"use client";

import { useEffect, useState } from "react";

interface Entry {
  name: string;
  path: string;
}
interface ListResponse {
  path: string | null;
  parent: string | null;
  shortcuts: Entry[];
  entries: Entry[];
  message?: string;
}

export function DirectoryPicker({
  initialPath,
  onSelect,
  onClose,
}: {
  initialPath?: string;
  onSelect: (path: string) => void;
  onClose: () => void;
}) {
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function load(path?: string) {
    setLoading(true);
    setError(null);
    const url = path ? `/api/fs?path=${encodeURIComponent(path)}` : "/api/fs";
    fetch(url)
      .then(async (res) => {
        const body: ListResponse = await res.json();
        if (!res.ok) throw new Error(body.message || `Could not open ${path}`);
        setData(body);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(initialPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showingRoots = data?.path == null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-t-lg border border-stage-600 bg-stage-900 sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-stage-600 px-4 py-3">
          <h2 className="font-display text-sm tracking-wide text-ink-500">CHOOSE A FOLDER</h2>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-100">
            ✕
          </button>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap border-b border-stage-600 px-3 py-2 font-mono text-xs text-ink-500">
          <button onClick={() => load(undefined)} className="shrink-0 hover:text-glam">
            roots
          </button>
          {!showingRoots &&
            data!.path!.split(/([\\/])/).reduce<{ acc: string; nodes: React.ReactNode[] }>(
              (state, part) => {
                if (part === "\\" || part === "/") {
                  state.acc += part;
                  return state;
                }
                if (!part) return state;
                state.acc += part;
                const pathSoFar = state.acc;
                state.nodes.push(
                  <span key={pathSoFar} className="shrink-0">
                    <span className="mx-0.5 text-ink-500/50">/</span>
                    <button onClick={() => load(pathSoFar)} className="hover:text-glam">
                      {part}
                    </button>
                  </span>,
                );
                return state;
              },
              { acc: "", nodes: [] },
            ).nodes}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <p className="px-4 py-6 text-sm text-ink-500">Loading…</p>}
          {error && <p className="px-4 py-6 text-sm text-red-400">{error}</p>}

          {!loading && !error && data && (
            <>
              {showingRoots && data.shortcuts.length > 0 && (
                <div className="border-b border-stage-700 py-1">
                  {data.shortcuts.map((s) => (
                    <button
                      key={s.path}
                      onClick={() => load(s.path)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-ink-100 hover:bg-stage-800"
                    >
                      <span className="text-glam">★</span>
                      {s.name}
                    </button>
                  ))}
                </div>
              )}

              {!showingRoots && data.parent && (
                <button
                  onClick={() => load(data.parent!)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-ink-500 hover:bg-stage-800"
                >
                  .. <span className="text-ink-500">up a level</span>
                </button>
              )}

              {data.entries.length === 0 && !showingRoots && (
                <p className="px-4 py-6 text-sm text-ink-500">No subfolders here.</p>
              )}

              {data.entries.map((e) => (
                <button
                  key={e.path}
                  onClick={() => load(e.path)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-ink-100 hover:bg-stage-800"
                >
                  <span className="text-ink-500">📁</span>
                  {e.name}
                </button>
              ))}
            </>
          )}
        </div>

        {!showingRoots && (
          <div className="flex items-center justify-between gap-2 border-t border-stage-600 p-3">
            <p className="min-w-0 flex-1 truncate font-mono text-xs text-ink-500">{data!.path}</p>
            <button
              onClick={() => onSelect(data!.path!)}
              className="shrink-0 rounded bg-glam px-4 py-2 text-sm font-medium text-stage-950 hover:bg-glam-soft"
            >
              Select this folder
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
