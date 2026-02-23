"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, FileText, MapPin, Pencil, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toastError, toastSuccess } from "@/lib/toast";
import { uz } from "@/lib/strings.uz";

type OrganizerOption = { id: number; name: string };

type EventPayload = {
    id: string;
    title: string;
    organizerId: number;
    startsAt: string;
    location: string;
};

function toDateTimeLocal(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 16);
}

export function EditEventDialog({
    event,
    organizers,
    open,
    onOpenChange,
}: {
    event: EventPayload | null;
    organizers: OrganizerOption[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [pending, setPending] = useState(false);
    const [title, setTitle] = useState("");
    const [organizerId, setOrganizerId] = useState("");
    const [startsAt, setStartsAt] = useState("");
    const [location, setLocation] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (!event) return;
        setTitle(event.title ?? "");
        setOrganizerId(
            String(event.organizerId ?? organizers[0]?.id ?? "")
        );
        setStartsAt(toDateTimeLocal(event.startsAt));
        setLocation(event.location ?? "");
    }, [event, organizers]);

    async function submit() {
        if (!event) return;
        setPending(true);
        try {
            const res = await fetch(`/api/events/${event.id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    title,
                    organizerId,
                    startsAt,
                    location,
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to update event");
            }

            onOpenChange(false);
            toastSuccess("Tadbir yangilandi ✅");
            router.refresh();
        } catch (e) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        } finally {
            setPending(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pencil className="size-4" />
                        Tadbirni tahrirlash
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                            <FileText className="size-4 text-muted-foreground" />
                            Sarlavha
                        </Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masalan: React Workshop" />
                    </div>

                    <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                            <Users className="size-4 text-muted-foreground" />
                            Tashkilotchi
                        </Label>
                        <select
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                            value={organizerId}
                            onChange={(e) => setOrganizerId(e.target.value)}
                        >
                            {organizers.map((o) => (
                                <option key={o.id} value={o.id}>
                                    {o.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                            <CalendarClock className="size-4 text-muted-foreground" />
                            Boshlanish vaqti
                        </Label>
                        <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
                    </div>

                    <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                            <MapPin className="size-4 text-muted-foreground" />
                            Manzil
                        </Label>
                        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="4-bino, 203-xona" />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
                            {uz.cancel}
                        </Button>
                        <Button
                            onClick={submit}
                            disabled={
                                pending ||
                                !title.trim() ||
                                !organizerId ||
                                !startsAt ||
                                !location.trim()
                            }
                        >
                            {pending ? "Saqlanmoqda..." : uz.save}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
