"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowDownToLine,
    ArrowUpRight,
    MoreHorizontal,
    Pencil,
    Search,
    Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { EditEventDialog } from "@/components/events/edit-event-dialog";
import { toastError, toastSuccess } from "@/lib/toast";
import { uz } from "@/lib/strings.uz";

type EventRow = {
    id: string;
    title: string;
    organizerId: number;
    startsAt: string;
    location: string;
    organizer?: { name?: string | null } | null;
};

type TabKey = "upcoming" | "past";

export function EventsTable({
    events,
    organizers,
}: {
    events: EventRow[];
    organizers: { id: number; name: string }[];
}) {
    const [query, setQuery] = useState("");
    const [tab, setTab] = useState<TabKey>("upcoming");
    const [editEvent, setEditEvent] = useState<EventRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<EventRow | null>(null);
    const [pendingDelete, setPendingDelete] = useState(false);
    const router = useRouter();
    const now = useMemo(() => new Date(), []);

    const normalizedQuery = query.trim().toLowerCase();

    const withStatus = useMemo(() => {
        return events.map((event) => {
            const startsAt = new Date(event.startsAt);
            const isPast = startsAt.getTime() < now.getTime();
            return {
                ...event,
                startsAtDate: startsAt,
                isPast,
            };
        });
    }, [events, now]);

    const counts = useMemo(() => {
        let upcoming = 0;
        let past = 0;
        for (const event of withStatus) {
            if (event.isPast) past += 1;
            else upcoming += 1;
        }
        return { upcoming, past };
    }, [withStatus]);

    const filtered = useMemo(() => {
        const byQuery = normalizedQuery
            ? withStatus.filter((event) =>
                  event.title.toLowerCase().includes(normalizedQuery)
              )
            : withStatus;

        return byQuery.filter((event) =>
            tab === "past" ? event.isPast : !event.isPast
        );
    }, [normalizedQuery, tab, withStatus]);

    const emptyState = (() => {
        if (events.length === 0) return "Hozircha tadbirlar yo'q.";
        if (filtered.length === 0) return "Mos natija topilmadi.";
        return null;
    })();

    async function confirmDelete() {
        if (!deleteTarget) return;
        setPendingDelete(true);
        try {
            const res = await fetch(`/api/events/${deleteTarget.id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to delete event");
            }
            setDeleteTarget(null);
            toastSuccess("Tadbir o'chirildi ✅");
            router.refresh();
        } catch (e) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        } finally {
            setPendingDelete(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant={tab === "upcoming" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTab("upcoming")}
                    >
                        <ArrowUpRight className="size-4" />
                        Kelgusi
                        <Badge
                            variant="secondary"
                            className="ml-2 rounded-md px-1.5 py-0 text-xs"
                        >
                            {counts.upcoming}
                        </Badge>
                    </Button>
                    <Button
                        variant={tab === "past" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTab("past")}
                    >
                        <ArrowDownToLine className="size-4" />
                        O'tgan
                        <Badge
                            variant="secondary"
                            className="ml-2 rounded-md px-1.5 py-0 text-xs"
                        >
                            {counts.past}
                        </Badge>
                    </Button>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={`${uz.search}...`}
                        className="pl-9"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                </div>
            </div>

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
                        {filtered.map((event) => (
                            <TableRow key={event.id}>
                                <TableCell className="font-medium">
                                    <Link
                                        href={`/events/${event.id}/registrations`}
                                        className="hover:underline"
                                    >
                                        {event.title}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    {event.organizer?.name ?? "—"}
                                </TableCell>
                                <TableCell>
                                    {event.startsAtDate.toLocaleString()}
                                </TableCell>
                                <TableCell>{event.location}</TableCell>
                                <TableCell className="flex items-center justify-between gap-2">
                                    <Badge
                                        variant={
                                            event.isPast
                                                ? "secondary"
                                                : "default"
                                        }
                                    >
                                        {event.isPast ? (
                                            <ArrowDownToLine className="size-3" />
                                        ) : (
                                            <ArrowUpRight className="size-3" />
                                        )}
                                        {event.isPast ? "O'tgan" : "Kelgusi"}
                                    </Badge>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                            >
                                                <MoreHorizontal className="size-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onSelect={() =>
                                                    setEditEvent(event)
                                                }
                                            >
                                                <Pencil className="size-4" />
                                                {uz.edit}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                variant="destructive"
                                                onSelect={() =>
                                                    setDeleteTarget(event)
                                                }
                                            >
                                                <Trash2 className="size-4" />
                                                {uz.delete}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {emptyState ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="h-24 text-center text-sm text-muted-foreground"
                                >
                                    {emptyState}
                                </TableCell>
                            </TableRow>
                        ) : null}
                    </TableBody>
                </Table>
            </div>

            <EditEventDialog
                event={
                    editEvent
                        ? {
                              id: editEvent.id,
                              title: editEvent.title,
                              organizerId: editEvent.organizerId,
                              startsAt: editEvent.startsAt,
                              location: editEvent.location,
                          }
                        : null
                }
                organizers={organizers}
                open={Boolean(editEvent)}
                onOpenChange={(open) => {
                    if (!open) setEditEvent(null);
                }}
            />

            <AlertDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tadbirni o'chirish?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu amalni ortga qaytarib bo'lmaydi. Tadbir butunlay
                            o'chiriladi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={pendingDelete}>
                            {uz.cancel}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-white hover:bg-destructive/90"
                            disabled={pendingDelete}
                        >
                            {pendingDelete ? "O'chirilmoqda..." : uz.delete}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
