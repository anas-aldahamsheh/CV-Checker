import { NextResponse } from "next/server";
import { MAX_REQUEST_CHARS } from "@/lib/env";
import { requestKey, takeRateLimit } from "@/lib/rate-limit";
export function apiGuard(request: Request, limit = 20, scope = "api", maxContentLength = MAX_REQUEST_CHARS * 2) { const contentLength = Number(request.headers.get("content-length") ?? 0); if (contentLength > maxContentLength) return NextResponse.json({ error: "Request body is too large." }, { status: 413 }); const rate = takeRateLimit(`${scope}:${requestKey(request)}`, limit); if (!rate.allowed) return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }); return null; }
export async function safeJson(request: Request) { const raw = await request.text(); if (raw.length > MAX_REQUEST_CHARS) throw new Error("Request body is too large."); return JSON.parse(raw) as unknown; }
