"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LockIcon, FileTextIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";

// When you add billing, replace this with: useUser() from Clerk + subscription, or API call
const HAS_CUSTOM_POLICY_ACCESS = false;

export default function CustomPolicyPage() {
    if (HAS_CUSTOM_POLICY_ACCESS) {
        // Future: show the actual custom policy editor when user has paid plan
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-semibold font-heading text-foreground">
                        Custom policy
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Define your own security rules (coming soon).
                    </p>
                </div>
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        Policy editor will appear here for paid plans.
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Locked state — shown to free / registered users
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-semibold font-heading text-foreground">
                    Custom policy
                </h1>
                <p className="text-muted-foreground mt-1">
                    Define your own security rules applied to every request through the gateway.
                </p>
            </div>

            <Card className="relative overflow-hidden border-primary/20 bg-muted/20">
                {/* Lock overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-[2px] z-10">
                    <div className="rounded-full bg-muted p-4 mb-4">
                        <LockIcon className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium text-foreground mb-1">Available on paid plans</p>
                    <p className="text-sm text-muted-foreground max-w-md text-center mb-6">
                        Custom policy lets you add your own security rules (e.g. block certain topics, enforce compliance wording) that run on every request alongside jailbreak and PII detection.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Button asChild>
                            <Link href="mailto:lidorpahima28@gmail.com?subject=Custom%20policy%20%2F%20Startup%20plan">
                                Contact sales to unlock
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/settings">Back to Settings</Link>
                        </Button>
                    </div>
                </div>

                {/* Blurred preview content so they see what they're missing */}
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <FileTextIcon className="h-4 w-4" />
                        Your custom rules
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Add rules in plain text or structured format. Each request is evaluated against these rules before reaching the LLM.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4 opacity-40 pointer-events-none select-none">
                    <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm font-mono">
                        # Example rule (locked)
                        <br />
                        Block any request that asks to generate phishing or scam content.
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm font-mono">
                        # Compliance
                        <br />
                        Require that responses do not contain medical or legal advice unless explicitly allowed.
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-muted/20 border-border">
                <CardContent className="py-6 flex items-start gap-4">
                    <ShieldCheckIcon className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-foreground">Included in Free: default guardrail</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Your requests are already protected by jailbreak, prompt-injection, and PII detection. Custom policy adds your own rules on top — available on Startup plan and above.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
