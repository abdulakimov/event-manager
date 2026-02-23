"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, FileText, MapPin, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toastError, toastSuccess } from "@/lib/toast";
import { uz } from "@/lib/strings.uz";

type OrganizerOption = { id: number; name: string };

export function CreateEventDialog({
    organizers,
    onCreated,
}: {
    organizers: OrganizerOption[];
    onCreated?: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);
    const router = useRouter();
    const [errors, setErrors] = useState<{
        title?: string;
        organizerId?: string;
        startsAt?: string;
        location?: string;
        form?: string;
    }>({});

    const [title, setTitle] = useState("");
    const [organizerId, setOrganizerId] = useState(
        String(organizers[0]?.id ?? "")
    );
    const [startsAt, setStartsAt] = useState("");
    const [location, setLocation] = useState("");
    const minDateTime = useMemo(
        () => new Date().toISOString().slice(0, 16),
        []
    );

    function validate() {
        const nextErrors: typeof errors = {};
        if (!title.trim()) nextErrors.title = "Sarlavha majburiy.";
        if (!organizerId.trim()) {
            nextErrors.organizerId = organizers.length
                ? "Tashkilotchini tanlang."
                : "Tashkilotchilar mavjud emas.";
        }
        if (!startsAt) nextErrors.startsAt = "Boshlanish vaqtini tanlang.";
        if (startsAt && Number.isNaN(new Date(startsAt).getTime())) {
            nextErrors.startsAt = "Vaqt formati noto‘g‘ri.";
        }
        if (!location.trim()) nextErrors.location = "Manzil majburiy.";
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    async function submit() {
        if (!validate()) return;
        setPending(true);
        try {
            const res = await fetch("/api/events", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ title, organizerId, startsAt, location }),
            });

            if (!res.ok) {
                const msg = await res.text();
                if (msg.includes("Missing fields")) {
                    validate();
                    setErrors((prev) => ({
                        ...prev,
                        form: "Iltimos, barcha maydonlarni to‘ldiring.",
                    }));
                    return;
                }
                if (msg.includes("Invalid startsAt")) {
                    setErrors((prev) => ({
                        ...prev,
                        startsAt: "Vaqt formati noto‘g‘ri.",
                    }));
                    return;
                }
                if (msg.includes("Invalid organizerId")) {
                    setErrors((prev) => ({
                        ...prev,
                        organizerId: "Tashkilotchini qayta tanlang.",
                    }));
                    return;
                }
                throw new Error(msg || "Failed to create event");
            }

            setOpen(false);
            setTitle("");
            setLocation("");
            setStartsAt("");
            setErrors({});
            onCreated?.();
            toastSuccess("Tadbir yaratildi ✅");
            router.refresh();
        } catch (e) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        } finally {
            setPending(false);
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);
                if (nextOpen) setErrors({});
            }}
        >
            <DialogTrigger asChild>
                <Button>
                    <Plus className="size-4" />
                    Tadbir qo‘shish
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Yangi tadbir</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                            <FileText className="size-4 text-muted-foreground" />
                            Sarlavha
                        </Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Masalan: React Workshop"
                        />
                        {errors.title ? (
                            <p className="text-sm text-destructive">
                                {errors.title}
                            </p>
                        ) : null}
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
                        {errors.organizerId ? (
                            <p className="text-sm text-destructive">
                                {errors.organizerId}
                            </p>
                        ) : null}
                    </div>

                    <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                            <CalendarClock className="size-4 text-muted-foreground" />
                            Boshlanish vaqti
                        </Label>
                        <Input
                            type="datetime-local"
                            value={startsAt}
                            min={minDateTime}
                            onChange={(e) => setStartsAt(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Mahalliy vaqt bo‘yicha tanlanadi.
                        </p>
                        {errors.startsAt ? (
                            <p className="text-sm text-destructive">
                                {errors.startsAt}
                            </p>
                        ) : null}
                    </div>

                    <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                            <MapPin className="size-4 text-muted-foreground" />
                            Manzil
                        </Label>
                        <Input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="4-bino, 203-xona"
                        />
                        {errors.location ? (
                            <p className="text-sm text-destructive">
                                {errors.location}
                            </p>
                        ) : null}
                    </div>

                    {errors.form ? (
                        <div className="text-sm text-destructive">
                            {errors.form}
                        </div>
                    ) : null}

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={pending}
                        >
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
