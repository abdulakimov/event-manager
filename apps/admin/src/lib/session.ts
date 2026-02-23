import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getSession() {
    // better-auth header/cookie orqali session o'qiydi
    return auth.api.getSession({ headers: await headers() });
}

export async function getCurrentUserEmail() {
    const session = await getSession();
    return session?.user?.email ?? null;
}

export async function getAdminContext() {
    const session = await getSession();
    const email = session?.user?.email ?? null;
    const sessionName = session?.user?.name?.trim() || null;
    if (!email) {
        return {
            email: null,
            role: null,
            organizerId: null,
            isSuperadmin: false,
        };
    }

    if (email === "xurshidbekabdulakimov@gmail.com") {
        return {
            email,
            role: "SUPERADMIN" as const,
            organizerId: null,
            isSuperadmin: true,
        };
    }

    const adminUser = await prisma.adminUser.findUnique({
        where: { email },
        select: { role: true, organizerId: true, isActive: true, name: true },
    });

    if (adminUser && !adminUser.name?.trim() && sessionName) {
        await prisma.adminUser.update({
            where: { email },
            data: { name: sessionName },
        });
    }

    if (adminUser && adminUser.isActive === false) {
        return {
            email,
            role: null,
            organizerId: null,
            isSuperadmin: false,
        };
    }

    const role = adminUser?.role ?? null;
    const organizerId = adminUser?.organizerId ?? null;
    const isSuperadmin = role === "SUPERADMIN";

    return {
        email,
        role,
        organizerId,
        isSuperadmin,
    };
}
