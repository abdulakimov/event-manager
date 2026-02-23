import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { UserRegistrationsTabs } from "./registrations-tabs";
import { uz } from "@/lib/strings.uz";

export default async function UserDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ tab?: string }>;
}) {
    const { id } = await params;
    const { tab } = (await searchParams) ?? {};
    const currentTab = tab === "past" || tab === "canceled" ? tab : "active";
    const now = new Date();

    const student = await prisma.student.findUnique({
        where: { id },
        include: {
            facultyOrganizer: true,
            registrations: {
                include: {
                    event: {
                        include: { organizer: true },
                    },
                },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!student) return notFound();

    const totalRegistrations = student.registrations.length;
    const activeRegistrations = student.registrations.filter(
        (registration) =>
            registration.status === "ACTIVE" &&
            registration.event?.startsAt &&
            registration.event.startsAt >= now
    );
    const pastRegistrations = student.registrations.filter(
        (registration) =>
            registration.status === "ACTIVE" &&
            registration.event?.startsAt &&
            registration.event.startsAt < now
    );
    const canceledRegistrations = student.registrations.filter(
        (registration) => registration.status === "CANCELED"
    );

    const registrationsForTab =
        currentTab === "past"
            ? pastRegistrations
            : currentTab === "canceled"
            ? canceledRegistrations
            : activeRegistrations;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-xl font-semibold">
                        <Users className="size-5" />
                        {student.fullName}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {student.facultyOrganizer?.name ?? student.faculty ?? "—"}{" • "}{student.course}
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/users">
                        <ArrowLeft className="size-4" />
                        {uz.back}
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Jami tadbirlar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold">
                            {totalRegistrations}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Aktiv tadbirlar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold">
                            {activeRegistrations.length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>O'tgan tadbirlar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold">
                            {pastRegistrations.length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Bekor qilingan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold">
                            {canceledRegistrations.length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <CardTitle>Ro'yxatdan o'tishlar</CardTitle>
                        <UserRegistrationsTabs value={currentTab} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tadbir</TableHead>
                                    <TableHead>Tashkilotchi</TableHead>
                                    <TableHead>Boshlanish vaqti</TableHead>
                                    <TableHead>Manzil</TableHead>
                                    <TableHead>Ro'yxatdan o'tgan</TableHead>
                                    {currentTab === "canceled" ? (
                                        <TableHead>Bekor qilingan</TableHead>
                                    ) : null}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {registrationsForTab.map((registration) => (
                                    <TableRow key={registration.id}>
                                        <TableCell className="font-medium">
                                            {registration.event?.title ?? "—"}
                                        </TableCell>
                                        <TableCell>
                                            {registration.event?.organizer?.name ?? "—"}
                                        </TableCell>
                                        <TableCell>
                                            {registration.event?.startsAt
                                                ? registration.event.startsAt.toLocaleString()
                                                : "—"}
                                        </TableCell>
                                        <TableCell>
                                            {registration.event?.location ?? "—"}
                                        </TableCell>
                                        <TableCell>
                                            {registration.createdAt.toLocaleString()}
                                        </TableCell>
                                        {currentTab === "canceled" ? (
                                            <TableCell>
                                                {registration.canceledAt
                                                    ? registration.canceledAt.toLocaleString()
                                                    : "—"}
                                            </TableCell>
                                        ) : null}
                                    </TableRow>
                                ))}
                                {registrationsForTab.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={currentTab === "canceled" ? 6 : 5}
                                            className="h-24 text-center text-sm text-muted-foreground"
                                        >
                                            Hozircha ro'yxatdan o'tishlar yo'q.
                                        </TableCell>
                                    </TableRow>
                                ) : null}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Profil</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2 text-sm">
                        <div>
                            <span className="text-muted-foreground">Ism:</span>{" "}
                            {student.fullName}
                        </div>
                        <div>
                            <span className="text-muted-foreground">Telefon:</span>{" "}
                            {student.phone ?? "—"}
                        </div>
                        <div>
                            <span className="text-muted-foreground">Fakultet:</span>{" "}
                            {student.facultyOrganizer?.name ?? student.faculty ?? "—"}
                        </div>
                        <div>
                            <span className="text-muted-foreground">Kurs:</span>{" "}
                            {student.course}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
