import { redirect } from "next/navigation";
import { getAdminContext, getSession } from "@/lib/session";
import { DashboardShell } from "../../components/dashboard/dashboard-shell";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();
    if (!session?.user) redirect("/login");

    const adminContext = await getAdminContext();
    if (!adminContext.role && !adminContext.isSuperadmin) {
        redirect("/request");
    }

    return (
        <DashboardShell user={session.user} adminContext={adminContext}>
            {children}
        </DashboardShell>
    );
}
