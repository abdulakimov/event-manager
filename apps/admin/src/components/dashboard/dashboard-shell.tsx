import { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export function DashboardShell({
                                   user,
                                   adminContext,
                                   children,
                               }: {
    user: { name?: string | null; email?: string | null; image?: string | null };
    adminContext: {
        email: string | null;
        role: string | null;
        organizerId: number | null;
        isSuperadmin: boolean;
    };
    children: ReactNode;
}) {
    return (
        <div className="min-h-screen w-full flex bg-background">
            <Sidebar user={user} adminContext={adminContext} />

            <div className="flex-1 min-w-0">
                <Topbar user={user} adminContext={adminContext} />
                <Separator />
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
