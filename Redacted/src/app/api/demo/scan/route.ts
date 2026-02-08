import { NextResponse } from "next/server";

const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

// Simple in-memory rate limiter: max 10 requests per IP per 60 seconds
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.reset) {
        rateLimitMap.set(ip, { count: 1, reset: now + RATE_LIMIT_WINDOW });
        return false;
    }
    entry.count++;
    return entry.count > RATE_LIMIT_MAX;
}

/**
 * POST /api/demo/scan
 * Public endpoint (no auth) for the homepage demo.
 * Forwards text to backend guardrail and returns the result.
 */
export async function POST(req: Request) {
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    if (isRateLimited(ip)) {
        return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
    }

    try {
        const { text } = (await req.json()) as { text?: string };
        if (!text || typeof text !== "string" || text.trim().length === 0) {
            return NextResponse.json({ error: "text is required" }, { status: 400 });
        }
        if (text.length > 1000) {
            return NextResponse.json({ error: "text too long (max 1000 chars)" }, { status: 400 });
        }

        // Call the backend guardrail directly (guardrail.analyze_security)
        // We use the backend /v1/chat/completions but just need the security result
        // Instead, call a lightweight internal route or inline the check
        const res = await fetch(`${BACKEND_URL}/demo-scan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: text.trim() }),
        });

        if (!res.ok) {
            const errText = await res.text();
            return NextResponse.json({ error: errText || "Scan failed" }, { status: 502 });
        }

        const result = await res.json();
        return NextResponse.json(result);
    } catch (e) {
        console.error("Demo scan error:", e);
        return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
}
