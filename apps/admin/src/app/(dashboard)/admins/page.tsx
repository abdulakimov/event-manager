import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminContext, getSession } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { AdminsTable } from "./admins-table";
import { RequestsTable } from "../requests/requests-table";
import { uz } from "@/lib/strings.uz";

async function approveAccessRequest(formData: FormData) {
    "use server";

    const adminContext = await getAdminContext();
    if (!adminContext.isSuperadmin) {
        redirect("/dashboard");
    }

    const requestId = Number(formData.get("requestId"));
    const email = String(formData.get("email"));
    const requestName = (formData.get("requestName") as string | null) ?? null;
    const role = String(formData.get("role"));
    const organizerIdRaw = formData.get("organizerId");
    const note = (formData.get("note") as string | null)?.trim() || null;

    const organizerId = organizerIdRaw ? Number(organizerIdRaw) : null;
    const requiresOrganizer = role === "CLUB_LEADER" || role === "FACULTY_LEADER";
    if (requiresOrganizer && !organizerId) {
        throw new Error("Organizer is required for leader roles");
    }

    const session = await getSession();
    const existingAdmin = await prisma.adminUser.findUnique({
        where: { email },
        select: { name: true },
    });
    const nextName =
        requestName?.trim() ||
        session?.user?.name?.trim() ||
        existingAdmin?.name ||
        null;

    const adminUser = await prisma.adminUser.upsert({
        where: { email },
        update: {
            role: role as "EDITOR" | "CLUB_LEADER" | "FACULTY_LEADER" | "SUPERADMIN",
            organizerId: requiresOrganizer ? organizerId : null,
            name: nextName,
        },
        create: {
            email,
            role: role as "EDITOR" | "CLUB_LEADER" | "FACULTY_LEADER" | "SUPERADMIN",
            organizerId: requiresOrganizer ? organizerId : null,
            name: nextName,
        },
    });

    if (requiresOrganizer && organizerId) {
        const organizer = await prisma.organizer.findUnique({
            where: { id: organizerId },
            select: { leaderName: true },
        });
        const fallbackName = organizer?.leaderName ?? adminUser.name ?? null;
        await prisma.organizer.update({
            where: { id: organizerId },
            data: {
                leaderAdminUserId: adminUser.id,
                leaderName: requestName?.trim() || fallbackName,
            },
        });
    }

    await prisma.accessRequest.update({
        where: { id: requestId },
        data: {
            status: "APPROVED",
            reviewedAt: new Date(),
            reviewedBy: adminContext.email,
            note,
        },
    });
}

async function rejectAccessRequest(formData: FormData) {
    "use server";

    const adminContext = await getAdminContext();
    if (!adminContext.isSuperadmin) {
        redirect("/dashboard");
    }

    const requestId = Number(formData.get("requestId"));
    const note = (formData.get("note") as string | null)?.trim() || null;

    await prisma.accessRequest.update({
        where: { id: requestId },
        data: {
            status: "REJECTED",
            reviewedAt: new Date(),
            reviewedBy: adminContext.email,
            note,
        },
    });
}

export default async function AdminsPage() {
    const adminContext = await getAdminContext();
    if (!adminContext.isSuperadmin) {
        redirect("/dashboard");
    }

    const [admins, organizers, requests] = await Promise.all([
        prisma.adminUser.findMany({
            orderBy: { createdAt: "desc" },
            include: { organizer: true },
        }),
        prisma.organizer.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true, type: true },
        }),
        prisma.accessRequest.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: "asc" },
        }),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">Adminlar</h1>
                <p className="text-sm text-muted-foreground">
                    Adminlarni boshqarish va so'rovlarni ko'rib chiqish
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{uz.admins}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ism / Email</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Tashkilot</TableHead>
                                    <TableHead>{uz.status}</TableHead>
                                    <TableHead>Yaratilgan</TableHead>
                                    <TableHead className="text-right">Amallar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <AdminsTable
                                admins={admins.map((admin) => ({
                                    id: admin.id,
                                    email: admin.email,
                                    name: admin.name,
                                    role: admin.role,
                                    organizerId: admin.organizerId,
                                    organizerName: admin.organizer?.name ?? null,
                                    isActive: admin.isActive,
                                    createdAt: admin.createdAt.toISOString(),
                                }))}
                                organizers={organizers}
                            />
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{uz.requests}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Ism</TableHead>
                                    <TableHead>Izoh</TableHead>
                                    <TableHead>So'rov vaqti</TableHead>
                                    <TableHead className="text-right">Amal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((request) => (
                                    <RequestsTable
                                        key={request.id}
                                        request={request}
                                        organizers={organizers}
                                        onApprove={approveAccessRequest}
                                        onReject={rejectAccessRequest}
                                    />
                                ))}
                                {requests.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="h-24 text-center text-sm text-muted-foreground"
                                        >
                                            Kutilayotgan so'rovlar yo'q.
                                        </TableCell>
                                    </TableRow>
                                ) : null}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
