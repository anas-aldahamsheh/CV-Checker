type Counter = { count: number; resetAt: number };
const counters = new Map<string, Counter>();
const WINDOW_MS = 60_000;
export function takeRateLimit(key: string, maxRequests = 20) { const now = Date.now(); const current = counters.get(key); if (!current || current.resetAt <= now) { counters.set(key, { count: 1, resetAt: now + WINDOW_MS }); return { allowed: true, retryAfterSeconds: 0 }; } current.count += 1; return { allowed: current.count <= maxRequests, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1_000) }; }
export function requestKey(request: Request) { return request.headers.get("x-nf-client-connection-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous"; }
