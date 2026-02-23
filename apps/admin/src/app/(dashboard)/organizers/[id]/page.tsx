import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Calendar, Users, ArrowLeft, CalendarCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
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

type RecentEventRow = Awaited<ReturnType<typeof prisma.event.findMany>>[number];

export default async function OrganizerDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const adminContext = await getAdminContext();
    const isLeader =
        adminContext.role === "CLUB_LEADER" ||
        adminContext.role === "FACULTY_LEADER";
    if (isLeader) {
        redirect("/dashboard");
    }

    const { id } = await params;
    const organizerId = Number(id);
    if (!Number.isInteger(organizerId)) return notFound();

    const [organizer, totalEvents, totalAttendees, recentEvents] =
        await Promise.all([
            prisma.organizer.findUnique({ where: { id: organizerId } }),
            prisma.event.count({ where: { organizerId } }),
            prisma.eventRegistration.count({
                where: { event: { organizerId } },
            }),
            prisma.event.findMany({
                where: { organizerId },
                orderBy: { startsAt: "desc" },
                take: 10,
            }),
        ]);

    if (!organizer) return notFound();

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-md border bg-muted grid place-items-center text-xs text-muted-foreground">
                        {organizer.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={organizer.logoUrl}
                                alt={organizer.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            "—"
                        )}
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">{organizer.name}</h1>
                        <div className="text-sm text-muted-foreground">
                            {organizer.leaderName
                                ? `Rahbar: ${organizer.leaderName}`
                                : "Rahbar: —"}
                        </div>
                        {organizer.foundedAt ? (
                            <div className="text-sm text-muted-foreground">
                                Tashkil topgan:{" "}
                                {organizer.foundedAt.toLocaleDateString()}
                            </div>
                        ) : null}
                    </div>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/organizers">
                        <ArrowLeft className="size-4" />
                        {uz.back}
                    </Link>
                </Button>
            </div>

            {organizer.description ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Tavsif</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        {organizer.description}
                    </CardContent>
                </Card>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Calendar className="size-4" />
                            Jami tadbirlar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold">
                        {totalEvents}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Users className="size-4" />
                            Jami qatnashchilar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold">
                        {totalAttendees}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>So'nggi tadbirlar</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sarlavha</TableHead>
                                    <TableHead>Boshlanish vaqti</TableHead>
                                    <TableHead>Manzil</TableHead>
                                    <TableHead>{uz.status}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentEvents.map((event: RecentEventRow) => (
                                    <TableRow key={event.id}>
                                        <TableCell className="font-medium">
                                            {event.title}
                                        </TableCell>
                                        <TableCell>
                                            {event.startsAt.toLocaleString()}
                                        </TableCell>
                                        <TableCell>{event.location}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    event.startsAt.getTime() <
                                                    Date.now()
                                                        ? "secondary"
                                                        : "default"
                                                }
                                            >
                                                <CalendarCheck className="size-3" />
                                                {event.startsAt.getTime() <
                                                Date.now()
                                                    ? "O'tgan" : "Kelgusi"}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {recentEvents.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="h-24 text-center text-sm text-muted-foreground"
                                        >
                                            Hozircha tadbirlar yo'q.
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

