"use client";

import { APP_NAME } from "@/utils/constants/site";
import type { LucideIcon } from "lucide-react";
import {
    ActivityIcon,
    FileTextIcon,
    HelpCircle,
    KeyRoundIcon,
    LayoutDashboardIcon,
    LockIcon,
    ScrollTextIcon,
    SettingsIcon,
} from "lucide-react";
import Image from "next/image";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils";

const navItems: { label: string; href: string; icon: LucideIcon; locked?: boolean }[] = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboardIcon },
    { label: "API Keys", href: "/dashboard/api-keys", icon: KeyRoundIcon },
    { label: "Logs", href: "/dashboard/logs", icon: ScrollTextIcon },
    { label: "Custom policy", href: "/dashboard/custom-policy", icon: FileTextIcon, locked: true },
    { label: "Settings", href: "/dashboard/settings", icon: HelpCircle },
];

const Sidebar = () => {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex md:flex-col md:w-56 lg:w-64 border-r border-border bg-card/30 shrink-0">
            <div className="p-4 border-b border-border">
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/icons/logo.png"
                        alt={APP_NAME}
                        width={28}
                        height={28}
                        className="object-contain"
                    />
                    <span className="text-lg font-bold font-heading !leading-none text-foreground">
                        {APP_NAME}
                    </span>
                </Link>
            </div>
            <nav className="flex-1 p-3 space-y-0.5">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    const locked = "locked" in item && item.locked;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="flex-1">{item.label}</span>
                            {locked && <LockIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
