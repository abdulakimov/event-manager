"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { SidebarContent, getNavItems } from "@/components/dashboard/sidebar";
import { uz } from "@/lib/strings.uz";

export function Topbar({
    user,
    adminContext,
}: {
    user: { name?: string | null; email?: string | null; image?: string | null };
    adminContext: {
        role: string | null;
        isSuperadmin: boolean;
    };
}) {
    const pathname = usePathname();
    const { title, subtitle } = useMemo(() => {
        if (pathname === "/dashboard") {
            return { title: uz.dashboard, subtitle: "Umumiy ko'rinish" };
        }
        if (pathname.startsWith("/events")) {
            return { title: uz.events, subtitle: uz.events };
        }
        if (pathname.startsWith("/organizers")) {
            return { title: uz.organizers, subtitle: uz.organizers };
        }
        if (pathname.startsWith("/users")) {
            return { title: uz.users, subtitle: uz.users };
        }
        if (pathname.startsWith("/admins")) {
            return { title: uz.admins, subtitle: uz.admins };
        }
        return { title: uz.admins, subtitle: "" };
    }, [pathname]);

    const navItems = getNavItems(adminContext);

    return (
        <div className="h-14 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="md:hidden"
                            aria-label="Open sidebar"
                        >
                            <Menu className="size-4" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64">
                        <SidebarContent user={user} navItems={navItems} />
                    </SheetContent>
                </Sheet>
                <div>
                    <div className="text-sm font-medium">{title}</div>
                    {subtitle ? (
                        <div className="text-xs text-muted-foreground">
                            {subtitle}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
