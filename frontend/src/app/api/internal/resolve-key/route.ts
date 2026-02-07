import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;

/**
 * Backend (gateway) calls this to resolve a gateway key → get provider + customer API key.
 * Protected by INTERNAL_API_SECRET header.
 *
 * How to use (Backend):
 * 1. Request arrives with header X-API-Key: sk-redacted-xxx
 * 2. Validate key is in VALID_API_KEYS (already registered via /register-key).
 * 3. Call: GET <FRONTEND_URL>/api/internal/resolve-key?key=sk-redacted-xxx
 *    with header: Internal-Secret: <INTERNAL_API_SECRET>
 * 4. Response: { provider: "openrouter", customerApiKey: "sk-..." }
 * 5. Use customerApiKey to call the LLM provider (OpenRouter, OpenAI, etc.).
 */
export async function GET(req: Request) {
    const secret = req.headers.get("Internal-Secret");
    if (!INTERNAL_SECRET || secret !== INTERNAL_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    if (!key) {
        return NextResponse.json({ error: "Missing key query param" }, { status: 400 });
    }
    try {
        const row = await prisma.apiKey.findUnique({
            where: { gatewayKey: key },
        });
        if (!row) {
            return NextResponse.json({ error: "Unknown key" }, { status: 404 });
        }
        return NextResponse.json({
            provider: row.provider,
            customerApiKey: row.customerApiKey,
            model: row.model ?? undefined,
        });
    } catch (e) {
        console.error("Resolve key error:", e);
        return NextResponse.json({ error: "Failed to resolve key" }, { status: 500 });
    }
}
