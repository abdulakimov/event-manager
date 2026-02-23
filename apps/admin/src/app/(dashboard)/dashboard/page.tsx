import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/session";
import Link from "next/link";
import {
    Calendar,
    CalendarCheck,
    CalendarClock,
    CalendarDays,
    Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { uz } from "@/lib/strings.uz";
import type { Event, Organizer } from "@prisma/client";

type OrganizerWithCount = Organizer & { _count: { events: number } };
type RecentEventRow = Event & { organizer: Organizer | null };

function toStatusLabel(startsAt: Date) {
    return startsAt.getTime() < Date.now() ? "O'tgan" : "Kelgusi";
}

export default async function DashboardPage() {
    const adminContext = await getAdminContext();
    const isLeader =
        adminContext.role === "CLUB_LEADER" ||
        adminContext.role === "FACULTY_LEADER";
    const organizerFilter =
        isLeader && adminContext.organizerId
            ? { organizerId: adminContext.organizerId }
            : undefined;
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const [
        totalEvents,
        upcomingEvents,
        pastEvents,
        todayEvents,
        recentEvents,
        topOrganizers,
    ] = await Promise.all([
        prisma.event.count({ where: organizerFilter }),
        prisma.event.count({
            where: { ...organizerFilter, startsAt: { gte: now } },
        }),
        prisma.event.count({
            where: { ...organizerFilter, startsAt: { lt: now } },
        }),
        prisma.event.count({
            where: {
                ...organizerFilter,
                startsAt: { gte: startOfDay, lte: endOfDay },
            },
        }),
        prisma.event.findMany({
            where: organizerFilter,
            orderBy: { startsAt: "desc" },
            take: 10,
            include: { organizer: true },
        }),
        prisma.organizer.findMany({
            where: isLeader && adminContext.organizerId
                ? { id: adminContext.organizerId }
                : undefined,
            orderBy: { events: { _count: "desc" } },
            take: 5,
            include: { _count: { select: { events: true } } },
        }),
    ]);

    const isEmpty = totalEvents === 0;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                            <CalendarClock className="size-4" />
                            Kelgusi tadbirlar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold">
                        {upcomingEvents}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <CalendarCheck className="size-4" />
                            O'tgan tadbirlar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold">
                        {pastEvents}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <CalendarDays className="size-4" />
                            Bugungi tadbirlar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold">
                        {todayEvents}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Top tashkilotchilar</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tashkilotchi</TableHead>
                                    <TableHead>Tadbirlar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topOrganizers.map((organizer: OrganizerWithCount) => (
                                    <TableRow key={organizer.id}>
                                        <TableCell className="font-medium">
                                            {organizer.name}
                                        </TableCell>
                                        <TableCell>
                                            {organizer._count.events}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {topOrganizers.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={2}
                                            className="h-24 text-center text-sm text-muted-foreground"
                                        >
                                            Hozircha tashkilotchilar yo'q.
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
                    <CardTitle>So'nggi tadbirlar</CardTitle>
                </CardHeader>
                <CardContent>
                    {isEmpty ? (
                        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
                            <div className="text-sm text-muted-foreground">
                                Hozircha tadbirlar yo'q. Birinchi tadbirni
                                yaratib boshlang.
                            </div>
                            <Button asChild>
                                <Link href="/events">
                                    <Plus className="size-4" />
                                    Tadbir yaratish
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sarlavha</TableHead>
                                        <TableHead>Tashkilotchi</TableHead>
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
                                                {event.organizer?.name ?? "—"}
                                            </TableCell>
                                            <TableCell>
                                                {event.startsAt.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {event.location}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        event.startsAt.getTime() <
                                                        Date.now()
                                                            ? "secondary"
                                                            : "default"
                                                    }
                                                >
                                                    {toStatusLabel(event.startsAt)}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {recentEvents.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="h-24 text-center text-sm text-muted-foreground"
                                            >
                                                Hozircha tadbir yo'q.
                                            </TableCell>
                                        </TableRow>
                                    ) : null}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


