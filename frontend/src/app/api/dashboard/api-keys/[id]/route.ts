import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LLM_PROVIDERS, type ProviderId } from "@/utils/constants/providers";

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

function maskKey(key: string): string {
    return key.length > 4 ? `••••••••${key.slice(-4)}` : "••••";
}

const validProviders = new Set(LLM_PROVIDERS.map((p) => p.id));

/** GET: single key (for edit form) – no raw customer key returned */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    try {
        const key = await prisma.apiKey.findFirst({
            where: { id, clerkId: userId },
        });
        if (!key) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        return NextResponse.json({
            id: key.id,
            gatewayKeyMasked: maskKey(key.gatewayKey),
            provider: key.provider,
            providerName: LLM_PROVIDERS.find((p) => p.id === key.provider)?.name ?? key.provider,
            model: key.model,
            name: key.name,
            createdAt: key.createdAt.toISOString(),
        });
    } catch (e) {
        console.error("API key get error:", e);
        return NextResponse.json({ error: "Failed to load key" }, { status: 500 });
    }
}

/** PATCH: update provider, model, name, and/or customer API key; re-register in backend */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    try {
        const key = await prisma.apiKey.findFirst({
            where: { id, clerkId: userId },
        });
        if (!key) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        const body = await req.json().catch(() => ({}));
        const {
            provider: providerIn,
            providerCustomName,
            model: modelIn,
            customerApiKey: customerApiKeyIn,
            name: nameIn,
        } = body as {
            provider?: string;
            providerCustomName?: string;
            model?: string;
            customerApiKey?: string;
            name?: string;
        };

        const providerToStore =
            providerIn === "other"
                ? (providerCustomName?.trim() || "Other")
                : providerIn ?? key.provider;
        if (providerIn != null && providerIn !== "other" && !validProviders.has(providerIn as ProviderId)) {
            return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
        }
        const modelStr = typeof modelIn === "string" ? modelIn.trim() : (key.model ?? "");
        const customerApiKey = typeof customerApiKeyIn === "string" && customerApiKeyIn.trim()
            ? customerApiKeyIn.trim()
            : key.customerApiKey;
        const name = nameIn !== undefined ? (typeof nameIn === "string" ? nameIn.trim() || null : null) : key.name;

        const updated = await prisma.apiKey.update({
            where: { id },
            data: {
                provider: providerToStore,
                model: modelStr || null,
                customerApiKey,
                name,
            },
        });

        // Re-register in backend so gateway uses new config
        const registerRes = await fetch(`${BACKEND_URL}/register-key`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                gateway_key: key.gatewayKey,
                provider: providerToStore,
                model: modelStr || key.model || "",
                target_api_key: customerApiKey,
            }),
        });
        if (!registerRes.ok) {
            const text = await registerRes.text();
            throw new Error(text || "Backend failed to update key");
        }

        const providerDisplayName =
            providerToStore === "other"
                ? providerToStore
                : (LLM_PROVIDERS.find((p) => p.id === updated.provider)?.name ?? updated.provider);
        return NextResponse.json({
            id: updated.id,
            gatewayKeyMasked: maskKey(updated.gatewayKey),
            provider: updated.provider,
            providerName: providerDisplayName,
            model: updated.model,
            name: updated.name,
            createdAt: updated.createdAt.toISOString(),
        });
    } catch (e) {
        console.error("API key update error:", e);
        return NextResponse.json(
            { error: e instanceof Error ? e.message : "Failed to update key" },
            { status: 500 }
        );
    }
}

/** DELETE: unregister from backend and delete from DB */
export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    try {
        const key = await prisma.apiKey.findFirst({
            where: { id, clerkId: userId },
        });
        if (!key) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        // Unregister from backend first
        await fetch(`${BACKEND_URL}/unregister-key`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gateway_key: key.gatewayKey }),
        });
        await prisma.apiKey.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error("API key delete error:", e);
        return NextResponse.json({ error: "Failed to delete key" }, { status: 500 });
    }
}
