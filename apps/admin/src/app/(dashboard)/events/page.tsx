import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import { EventsTable } from "@/components/events/events-table";
import { uz } from "@/lib/strings.uz";
import type { Event, Organizer } from "@prisma/client";

type OrganizerRow = Organizer;
type EventRow = Event & { organizer: Organizer | null };

export default async function EventsPage() {
    const adminContext = await getAdminContext();
    const isLeader =
        adminContext.role === "CLUB_LEADER" ||
        adminContext.role === "FACULTY_LEADER";
    if (isLeader && !adminContext.organizerId) {
        redirect("/dashboard");
    }

    const [organizers, events] = await Promise.all([
        prisma.organizer.findMany({
            where: isLeader ? { id: adminContext.organizerId ?? -1 } : undefined,
            orderBy: { name: "asc" },
        }),
        prisma.event.findMany({
            where: isLeader ? { organizerId: adminContext.organizerId ?? -1 } : undefined,
            orderBy: { startsAt: "asc" },
            include: { organizer: true },
        }),
    ]);

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold">Tadbirlar</h1>
                    <p className="text-sm text-muted-foreground">
                        Tadbirlarni boshqarish
                    </p>
                </div>

                <CreateEventDialog
                    organizers={organizers.map((o: OrganizerRow) => ({
                        id: o.id,
                        name: o.name,
                    }))}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{uz.events}</CardTitle>
                </CardHeader>

                <CardContent>
                    <EventsTable
                        events={events.map((event: EventRow) => ({
                            id: event.id,
                            title: event.title,
                            organizerId: event.organizerId,
                            startsAt: event.startsAt.toISOString(),
                            location: event.location,
                            organizer: event.organizer
                                ? { name: event.organizer.name }
                                : null,
                        }))}
                        organizers={organizers.map((o: OrganizerRow) => ({
                            id: o.id,
                            name: o.name,
                        }))}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
