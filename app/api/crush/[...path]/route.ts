import { NextRequest } from "next/server";

// Generic reverse proxy to a running `crush serve` instance.
//
// Why a proxy at all, instead of hitting crush serve directly from the
// browser: crush serve doesn't set CORS headers (it's designed for a
// TUI/API client on the same machine, not a browser page on a
// different origin/port), and SSE streams need the same treatment. This
// route also means the crush serve address only ever needs to be known
// server-side (CRUSH_SERVE_URL), never shipped to the client bundle.
//
// Every request/response is forwarded byte-for-byte; this route makes
// no assumptions about the JSON shape, so it stays correct even as
// crush's API surface grows.

const CRUSH_SERVE_URL = process.env.CRUSH_SERVE_URL || "http://127.0.0.1:36000";

async function proxy(req: NextRequest, path: string[]) {
  const targetUrl = `${CRUSH_SERVE_URL}/v1/${path.join("/")}${req.nextUrl.search}`;

  const isEventStream = path.at(-1) === "events";

  const init: RequestInit = {
    method: req.method,
    headers: {
      "Content-Type": req.headers.get("content-type") || "application/json",
    },
    // GET/DELETE have no body; guard against Next.js complaining about
    // a body on bodyless methods.
    body: ["GET", "HEAD", "DELETE"].includes(req.method) ? undefined : await req.text(),
    // @ts-expect-error -- duplex is required by undici for streamed bodies
    duplex: "half",
  };

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, init);
  } catch (err) {
    return new Response(
      JSON.stringify({
        message: `Could not reach crush serve at ${CRUSH_SERVE_URL}. Is it running? (${
          err instanceof Error ? err.message : String(err)
        })`,
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  if (isEventStream) {
    // Pass the SSE stream straight through, chunk by chunk, so the
    // client's EventSource-style reader sees frames as they arrive
    // rather than buffered.
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "application/json",
    },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
