"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Building2,
    CalendarDays,
    LayoutDashboard,
    Users,
    ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { uz } from "@/lib/strings.uz";

const nav = [
    { href: "/dashboard", label: uz.dashboard, icon: LayoutDashboard },
    { href: "/events", label: uz.events, icon: CalendarDays },
    { href: "/organizers", label: uz.organizers, icon: Building2 },
    { href: "/users", label: uz.users, icon: Users },
    { href: "/admins", label: uz.admins, icon: ShieldCheck },
];

export function getNavItems(adminContext: {
    role: string | null;
    isSuperadmin: boolean;
}) {
    const role = adminContext.role;
    const isLeader = role === "CLUB_LEADER" || role === "FACULTY_LEADER";
    return nav.filter((item) => {
        if (item.href === "/admins") return adminContext.isSuperadmin;
        if (item.href === "/organizers") return !isLeader;
        return true;
    });
}

type SidebarUser = {
    name?: string | null;
    email?: string | null;
    image?: string | null;
};

export function SidebarContent({
    user,
    navItems,
}: {
    user?: SidebarUser;
    navItems: typeof nav;
}) {
    const pathname = usePathname();
    const initials =
        user?.name
            ?.split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((s) => s[0]?.toUpperCase())
            .join("") ?? "AD";

    return (
        <div className="flex h-screen flex-col">
            <div className="px-3 py-4">
                <div className="text-lg font-semibold leading-none">
                    Event Manager
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Admin</div>
            </div>

            <Separator />

            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
                {navItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" &&
                            pathname.startsWith(item.href));
                    return (
                        <Button
                            key={item.href}
                            asChild
                            variant="ghost"
                            className={`w-full justify-start gap-2 ${
                                isActive
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground"
                            }`}
                        >
                            <Link href={item.href}>
                                <item.icon className="size-4" />
                                {item.label}
                            </Link>
                        </Button>
                    );
                })}
            </nav>

            <Separator />

            <div className="mt-auto px-3 py-4">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.image ?? undefined} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                            {user?.name ?? "Admin"}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                            {user?.email ?? "Administrator"}
                        </div>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={async () => {
                        await authClient.signOut();
                        window.location.href = "/login";
                    }}
                >
                    Chiqish
                </Button>
            </div>
        </div>
    );
}

export function Sidebar({
    user,
    adminContext,
}: {
    user?: SidebarUser;
    adminContext: {
        role: string | null;
        isSuperadmin: boolean;
    };
}) {
    const filteredNav = getNavItems(adminContext);

    return (
        <aside className="hidden md:block w-64 shrink-0 border-r bg-muted/40 min-h-screen sticky top-0">
            <SidebarContent user={user} navItems={filteredNav} />
        </aside>
    );
}
