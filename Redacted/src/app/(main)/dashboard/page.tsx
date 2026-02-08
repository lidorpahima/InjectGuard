"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClerk } from "@clerk/nextjs";
import {
    ActivityIcon,
    KeyRoundIcon,
    Loader2Icon,
    ShieldAlertIcon,
    TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type LogEntry = {
    id: string;
    status: "passed" | "blocked";
    createdAt: string;
    provider?: string;
    model?: string;
};

type KeyEntry = { id: string };

function formatTimeAgo(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 60_000) return "Just now";
    if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
    if (diffMs < 86400_000) return `${Math.floor(diffMs / 3600_000)}h ago`;
    return d.toLocaleDateString(undefined, { dateStyle: "short" });
}

const DashboardPage = () => {
    const { user } = useClerk();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [keys, setKeys] = useState<KeyEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [logsRes, keysRes] = await Promise.all([
                fetch("/api/dashboard/logs"),
                fetch("/api/dashboard/api-keys"),
            ]);
            if (logsRes.ok) {
                const data = await logsRes.json();
                setLogs(data.logs ?? []);
            }
            if (keysRes.ok) {
                const data = await keysRes.json();
                setKeys(data.keys ?? []);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const total = logs.length;
    const blocked = logs.filter((l) => l.status === "blocked").length;
    const passed = total - blocked;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const last7Days = logs.filter((l) => new Date(l.createdAt).getTime() >= sevenDaysAgo).length;
    const recentLogs = logs.slice(0, 8);

    return (
        <div className="space-y-8">
            {/* Welcome */}
            <div>
                <h1 className="text-2xl md:text-3xl font-semibold font-heading text-foreground">
                    Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
                </h1>
                <p className="text-muted-foreground mt-1">
                    Here’s what’s happening with your gateway.
                </p>
            </div>

            {/* Stat cards — real data from logs + keys */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total requests
                        </CardTitle>
                        <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold font-heading">
                            {loading ? "—" : total}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Last 200 recorded</p>
                    </CardContent>
                </Card>
                <Card className="border-destructive/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Blocked
                        </CardTitle>
                        <ShieldAlertIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold font-heading">
                            {loading ? "—" : blocked}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Threats stopped</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Passed
                        </CardTitle>
                        <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold font-heading">
                            {loading ? "—" : passed}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Sent to model</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Gateway keys
                        </CardTitle>
                        <KeyRoundIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold font-heading">
                            {loading ? "—" : keys.length}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Connected</p>
                    </CardContent>
                </Card>
            </div>

            {/* Overview + Recent activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Overview</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Traffic through your gateway (from logs).
                        </p>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : total === 0 ? (
                            <div className="rounded-lg border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center py-12 px-4 text-center">
                                <ActivityIcon className="h-10 w-10 text-muted-foreground/50 mb-4" />
                                <p className="text-sm font-medium text-foreground">No data yet</p>
                                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                    Send requests through your gateway to see metrics here. Add a key in API Keys, then use it with <code className="px-1 py-0.5 rounded bg-muted">X-API-Key</code>.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex gap-6 flex-wrap">
                                    <div>
                                        <p className="text-2xl font-semibold text-foreground">{last7Days}</p>
                                        <p className="text-xs text-muted-foreground">Requests (last 7 days)</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-semibold text-green-600 dark:text-green-500">{passed}</p>
                                        <p className="text-xs text-muted-foreground">Passed</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-semibold text-destructive">{blocked}</p>
                                        <p className="text-xs text-muted-foreground">Blocked</p>
                                    </div>
                                </div>
                                <Link href="/dashboard/logs" className="text-sm text-primary hover:underline">
                                    View all logs →
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Recent activity</CardTitle>
                        <Link href="/dashboard/logs" className="text-xs text-primary hover:underline">
                            Logs
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : recentLogs.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center py-8 px-4 text-center">
                                <p className="text-sm text-muted-foreground">No recent requests</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Logs will show here once traffic flows.
                                </p>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {recentLogs.map((log) => (
                                    <li key={log.id} className="flex items-center justify-between gap-2 text-sm">
                                        <span className="text-muted-foreground shrink-0 w-16">{formatTimeAgo(log.createdAt)}</span>
                                        <Badge variant={log.status === "passed" ? "default" : "destructive"} className="font-normal text-xs">
                                            {log.status}
                                        </Badge>
                                        <span className="truncate text-muted-foreground">{log.model ?? log.provider ?? "—"}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick link — show when no keys */}
            {!loading && keys.length === 0 && (
                <Card className="bg-muted/20 border-primary/20">
                    <CardContent className="py-6">
                        <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Next step:</span>{" "}
                            <Link href="/dashboard/api-keys" className="text-primary hover:underline">Add a gateway key</Link>
                            {" "}in API Keys, then point your app to the gateway (see{" "}
                            <Link href="/dashboard/settings" className="text-primary hover:underline">How to use</Link>
                            ). Need help?{" "}
                            <a href="mailto:lidorpahima28@gmail.com?subject=Dashboard%20support" className="text-primary hover:underline">
                                Contact support
                            </a>
                            .
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default DashboardPage;
