"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckIcon, CopyIcon, LockIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

const GATEWAY_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

export default function SettingsPage() {
    const [copiedWhat, setCopiedWhat] = useState<"url" | "curl" | null>(null);

    const copy = (text: string, which: "url" | "curl") => {
        navigator.clipboard.writeText(text);
        setCopiedWhat(which);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopiedWhat(null), 2000);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-semibold font-heading text-foreground">
                    Settings
                </h1>
                <p className="text-muted-foreground mt-1">
                    Gateway endpoint and how to use it.
                </p>
            </div>

            {/* Gateway endpoint — so user knows where to point their app */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Gateway endpoint</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Point your app to this base URL. Send requests with <code className="px-1 py-0.5 rounded bg-muted text-xs">X-API-Key</code> set to your gateway key.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <code className="flex-1 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm break-all">
                            {GATEWAY_BASE}
                        </code>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            onClick={() => copy(GATEWAY_BASE, "url")}
                        >
                            {copiedWhat === "url" ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Chat completions: <code className="px-1 py-0.5 rounded bg-muted">POST {GATEWAY_BASE}/v1/chat/completions</code> · Scan only: <code className="px-1 py-0.5 rounded bg-muted">POST {GATEWAY_BASE}/scan</code>
                    </p>
                </CardContent>
            </Card>

            {/* Custom policy — locked for free, link to dedicated page */}
            <Card className="relative border-primary/20 bg-muted/10">
                <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <LockIcon className="h-3.5 w-3.5" />
                    <span>Paid plans</span>
                </div>
                <CardHeader>
                    <CardTitle className="text-base pr-20">Custom policy</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Add your own security rules (e.g. block certain topics, compliance wording) that run on every request. Available on Startup plan and above.
                    </p>
                </CardHeader>
                <CardContent>
                    <Link href="/dashboard/custom-policy">
                        <Button variant="secondary" className="w-full sm:w-auto">
                            View Custom policy
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            {/* API keys — get key from API Keys page */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Gateway key</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Create and manage your gateway keys (one per provider + model). Use a key in the <code className="px-1 py-0.5 rounded bg-muted">X-API-Key</code> header when calling the gateway.
                    </p>
                </CardHeader>
                <CardContent>
                    <Link href="/dashboard/api-keys">
                        <Button variant="secondary">Go to API Keys</Button>
                    </Link>
                </CardContent>
            </Card>

            {/* Quick example */}
            <Card className="bg-muted/20 border-primary/20">
                <CardHeader>
                    <CardTitle className="text-base">Example request</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Replace <code className="px-1 py-0.5 rounded bg-muted">YOUR_GATEWAY_KEY</code> with a key from API Keys.
                    </p>
                </CardHeader>
                <CardContent>
                    <pre className="rounded-lg border border-border bg-background p-4 text-xs overflow-x-auto">
{`curl -X POST ${GATEWAY_BASE}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_GATEWAY_KEY" \\
  -d '{"text": "Hello, world!"}'`}
                    </pre>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() =>
                            copy(
                                `curl -X POST ${GATEWAY_BASE}/v1/chat/completions -H "Content-Type: application/json" -H "X-API-Key: YOUR_GATEWAY_KEY" -d '{"text": "Hello, world!"}'`,
                                "curl"
                            )
                        }
                    >
                        {copiedWhat === "curl" ? <CheckIcon className="h-4 w-4 mr-1" /> : <CopyIcon className="h-4 w-4 mr-1" />}
                        Copy curl
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
