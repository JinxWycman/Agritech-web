import { NextRequest, NextResponse } from "next/server";
import { allowedBackendPath, rewriteSetCookie, stripRefreshFromStaffPayload } from "@/lib/backend-allow";

/**
 * Same-origin proxy: browser → this Next.js route → FastAPI.
 * Stops CORS lag and keeps farmer phone webhooks off this website.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

const UPSTREAM = (process.env.API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000").replace(
  /\/$/,
  "",
);

const HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  "content-encoding",
]);

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, context: RouteContext) {
  const { path: segments } = await context.params;
  const allowed = allowedBackendPath(segments);
  if (!allowed) {
    return NextResponse.json({ detail: "Not found." }, { status: 404 });
  }

  const target = `${UPSTREAM}${allowed}${request.nextUrl.search}`;
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");
  const cookie = request.headers.get("cookie");
  const accept = request.headers.get("accept");
  if (authorization) headers.set("Authorization", authorization);
  if (contentType) headers.set("Content-Type", contentType);
  if (cookie) headers.set("Cookie", cookie);
  headers.set("Accept", accept || "application/json");

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
    redirect: "manual",
    signal: AbortSignal.timeout(12_000),
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch {
    return NextResponse.json(
      { detail: "Cannot reach the server." },
      { status: 502 },
    );
  }

  const https = request.nextUrl.protocol === "https:";
  const outbound = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP.has(lower) || lower === "set-cookie") return;
    outbound.set(key, value);
  });
  outbound.set("Cache-Control", "private, no-store");

  const cookies = typeof upstream.headers.getSetCookie === "function" ? upstream.headers.getSetCookie() : [];
  for (const cookieHeader of cookies) {
    outbound.append("Set-Cookie", rewriteSetCookie(cookieHeader, https));
  }

  const contentTypeOut = upstream.headers.get("content-type") || "";
  if (contentTypeOut.includes("application/json")) {
    let payload: unknown = null;
    try {
      payload = await upstream.json();
    } catch {
      payload = null;
    }
    return NextResponse.json(stripRefreshFromStaffPayload(allowed, payload), {
      status: upstream.status,
      headers: outbound,
    });
  }

  const body = await upstream.arrayBuffer();
  return new NextResponse(body, { status: upstream.status, headers: outbound });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
