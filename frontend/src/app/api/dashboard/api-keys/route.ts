import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LLM_PROVIDERS, type ProviderId } from "@/utils/constants/providers";
import crypto from "crypto";

// Use || so empty string gets default; in Docker use http://backend:8000
const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_API_KEY;

function maskKey(key: string): string {
    return key.length > 4 ? `••••••••${key.slice(-4)}` : "••••";
}

function generateGatewayKey(): string {
    return `sk-redacted-${crypto.randomBytes(24).toString("base64url")}`;
}

const validProviders = new Set(LLM_PROVIDERS.map((p) => p.id));

/** GET: list gateway keys for current user (masked, with provider) */
export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const keys = await prisma.apiKey.findMany({
            where: { clerkId: userId },
            orderBy: { createdAt: "desc" },
        });
        const list = keys.map((k) => ({
            id: k.id,
            gatewayKeyMasked: maskKey(k.gatewayKey),
            provider: k.provider,
            providerName: LLM_PROVIDERS.find((p) => p.id === k.provider)?.name ?? k.provider,
            model: k.model,
            name: k.name,
            createdAt: k.createdAt.toISOString(),
        }));
        return NextResponse.json({ keys: list });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("API keys list error:", message, e);
        return NextResponse.json(
            { error: "Failed to list keys", details: process.env.NODE_ENV === "development" ? message : undefined },
            { status: 500 }
        );
    }
}

/** POST: connect a provider with customer's API key → we create gateway key and save */
export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const body = await req.json();
        const { provider, providerCustomName, customerApiKey, model, name } = body as {
            provider?: string;
            providerCustomName?: string;
            customerApiKey?: string;
            model?: string;
            name?: string;
        };
        if (!provider || !validProviders.has(provider as ProviderId)) {
            return NextResponse.json(
                { error: "Invalid provider. Use one of: " + Array.from(validProviders).join(", ") },
                { status: 400 }
            );
        }
        if (!customerApiKey || typeof customerApiKey !== "string" || customerApiKey.trim().length === 0) {
            return NextResponse.json({ error: "customerApiKey is required" }, { status: 400 });
        }
        const modelStr = typeof model === "string" ? model.trim() : "";
        if (!modelStr) {
            return NextResponse.json({ error: "model is required. We send requests to this model on your behalf." }, { status: 400 });
        }
        // When "other", store the custom name as provider
        const providerToStore =
            provider === "other"
                ? (providerCustomName?.trim() || "Other")
                : provider;
        const gatewayKey = generateGatewayKey();
        const created = await prisma.apiKey.create({
            data: {
                gatewayKey,
                provider: providerToStore,
                model: modelStr,
                customerApiKey: customerApiKey.trim(),
                name: name?.trim() || null,
                clerkId: userId,
            },
        });
        // Register key in backend so it can be used for auth (must match RegisterKeyRequest)
        const registerRes = await fetch(`${BACKEND_URL}/register-key`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                gateway_key: gatewayKey,
                provider: providerToStore,
                model: modelStr,
                target_api_key: customerApiKey.trim(),
            }),
        });
        if (!registerRes.ok) {
            // Rollback: delete from DB so we don't have orphan key
            await prisma.apiKey.delete({ where: { id: created.id } }).catch(() => {});
            const text = await registerRes.text();
            throw new Error(text || "Backend failed to register key");
        }
        const providerDisplayName =
            provider === "other" ? providerToStore : (LLM_PROVIDERS.find((p) => p.id === created.provider)?.name ?? created.provider);
        return NextResponse.json({
            id: created.id,
            gatewayKey: created.gatewayKey,
            provider: created.provider,
            providerName: providerDisplayName,
            model: created.model,
            createdAt: created.createdAt.toISOString(),
        });
    } catch (e) {
        console.error("API key create error:", e);
        return NextResponse.json(
            { error: e instanceof Error ? e.message : "Failed to create key" },
            { status: 500 }
        );
    }
}
