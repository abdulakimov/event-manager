import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminContext, getSession } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { RequestsTable } from "./requests-table";
import { uz } from "@/lib/strings.uz";

type AccessRequestRow = Awaited<
    ReturnType<typeof prisma.accessRequest.findMany>
>[number];

async function approveAccessRequest(formData: FormData) {
    "use server";

    const adminContext = await getAdminContext();
    if (!adminContext.isSuperadmin) {
        redirect("/dashboard");
    }

    const requestId = Number(formData.get("requestId"));
    const email = String(formData.get("email"));
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
        (formData.get("requestName") as string | null)?.trim() ||
        session?.user?.name?.trim() ||
        existingAdmin?.name ||
        null;

    await prisma.adminUser.upsert({
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

export default async function RequestsPage() {
    const adminContext = await getAdminContext();
    if (!adminContext.isSuperadmin) {
        redirect("/dashboard");
    }
    redirect("/admins");

    const [requests, organizers] = await Promise.all([
        prisma.accessRequest.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: "asc" },
        }),
        prisma.organizer.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true, type: true },
        }),
    ]);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-semibold">So'rovlar</h1>
                <p className="text-sm text-muted-foreground">
                    Kutilayotgan admin so'rovlarini ko'rib chiqing
                </p>
            </div>

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
                                {requests.map((request: AccessRequestRow) => (
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
