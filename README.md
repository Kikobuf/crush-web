# crush-web

A local browser UI for [charmbracelet/crush](https://github.com/charmbracelet/crush),
built the way `pi-web` (https://github.com/agegr/pi-web) does it for the `pi`
coding agent — except Crush already ships a real REST + SSE API (`crush serve`),
so this talks to that directly instead of parsing session files off disk.

## What this is

- A session sidebar (title, cost, busy state, how many clients are attached)
- A live chat view: send prompts, watch the assistant's turn stream in via SSE
- Tool call / tool result rendering (collapsible), reasoning, shell commands
- Permission prompts and multi-question batches, answered from the browser
- Everything routes through a Next.js proxy (`/api/crush/*`) so `crush serve`'s
  address is never exposed to the browser and CORS isn't a problem

## What this is not (yet)

- No config editor, no skills management UI, no LSP diagnostics panel
- No file tree / diff viewer for edits the agent makes
- No auth beyond whatever's between you and this Next.js server — treat it
  like you'd treat a bare `crush serve` port: fine on localhost or behind a
  tunnel you control, not something to expose publicly as-is

Both are natural v2 additions once the core loop feels solid.

## Running it

1. Start Crush's server somewhere it can see your project(s):

   ```bash
   crush serve --port 36000
   ```

2. Point this app at it (defaults to `http://127.0.0.1:36000` already):

   ```bash
   export CRUSH_SERVE_URL=http://127.0.0.1:36000
   npm install
   npm run dev
   ```

3. Open http://localhost:3000, enter the absolute path to the project you
   started `crush serve` against (or one it can reach), and it creates/attaches
   a workspace.

If `crush serve` is on another machine (e.g. your Mac mini), tunnel it first
(SSH `-L`, Tailscale, etc.) and point `CRUSH_SERVE_URL` at the local end of
the tunnel — don't expose `crush serve` directly to the network, it has no
auth of its own.

## How the pieces fit together

```
browser  --fetch/EventSource-->  Next.js  --fetch-->  crush serve (REST + SSE)
                                  /api/crush/[...path]
```

- `lib/types.ts` — TypeScript mirror of Crush's `internal/proto` Go package
  (pulled from the actual source, since the wire format isn't documented
  anywhere public yet)
- `lib/crush-client.ts` — typed wrapper for every REST call this UI needs
- `app/api/crush/[...path]/route.ts` — the proxy; also the only place that
  needs to know `CRUSH_SERVE_URL`
- `hooks/useWorkspaceEvents.ts` — the SSE subscription; also what keeps the
  workspace alive server-side, since Crush tears a workspace down once its
  last SSE stream disconnects
- `components/AppShell.tsx` — owns session/message state and dispatches
  incoming SSE frames (`message`, `session`, `permission_request`,
  `question_batch_request`, ...) into it

## Multi-client behavior

Crush groups clients into workspaces by working directory: open this UI and
a `crush` TUI against the same path, and they share the session list and
message history live (that's what the "N viewing" badge in the sidebar
reflects). If someone else's turn is already in flight when you open a
session, you'll see it stream in rather than starting fresh.
