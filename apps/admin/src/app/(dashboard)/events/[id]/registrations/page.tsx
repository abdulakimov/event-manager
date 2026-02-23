import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/session";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uz } from "@/lib/strings.uz";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { RegistrationsTabs } from "./registrations-tabs";

type EventWithRegistrations = Awaited<
    ReturnType<typeof prisma.event.findUnique>
>;
type RegistrationRow = NonNullable<EventWithRegistrations>["registrations"][number];

export default async function EventRegistrationsPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ status?: string }>;
}) {
    const { id } = await params;
    const adminContext = await getAdminContext();
    const isLeader =
        adminContext.role === "CLUB_LEADER" ||
        adminContext.role === "FACULTY_LEADER";
    const { status } = (await searchParams) ?? {};
    const currentStatus =
        status === "CANCELED" || status === "ACTIVE" ? status : "ACTIVE";
    const isCanceled = currentStatus === "CANCELED";

    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            organizer: true,
            registrations: {
                where: { status: currentStatus },
                include: { student: true },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!event) return notFound();
    if (
        isLeader &&
        (!adminContext.organizerId ||
            event.organizerId !== adminContext.organizerId)
    ) {
        redirect("/dashboard");
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-xl font-semibold">
                        <Users className="size-5" />
                        Ro'yxatdan o'tganlar
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {event.title} • {event.organizer.name}
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/events">
                        <ArrowLeft className="size-4" />
                        {uz.back}
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <CardTitle>Ro'yxatdan o'tishlar</CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                            <RegistrationsTabs value={currentStatus} />
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/api/events/${id}/registrations/export`}>
                                    Excelga yuklash
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Talaba</TableHead>
                                    <TableHead>Telegram ID</TableHead>
                                    <TableHead>Fakultet</TableHead>
                                    <TableHead>Kurs</TableHead>
                                    {isCanceled ? (
                                        <TableHead>Bekor qilingan</TableHead>
                                    ) : null}
                                    <TableHead>Ro'yxatdan o'tgan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {event.registrations.map((registration: RegistrationRow) => (
                                    <TableRow key={registration.id}>
                                        <TableCell className="font-medium">
                                            {registration.student.fullName}
                                        </TableCell>
                                        <TableCell>
                                            {registration.student.telegramId}
                                        </TableCell>
                                        <TableCell>
                                            {registration.student.faculty}
                                        </TableCell>
                                        <TableCell>
                                            {registration.student.course}
                                        </TableCell>
                                        {isCanceled ? (
                                            <TableCell>
                                                {registration.canceledAt
                                                    ? registration.canceledAt.toLocaleString()
                                                    : "—"}
                                            </TableCell>
                                        ) : null}
                                        <TableCell>
                                            {registration.createdAt.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {event.registrations.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={isCanceled ? 6 : 5}
                                            className="h-24 text-center text-sm text-muted-foreground"
                                        >
                                            Hozircha ro'yxatdan o'tganlar yo'q.
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


