"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { TableCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toastError, toastSuccess } from "@/lib/toast";

type Organizer = {
    id: number;
    name: string;
    type: "CLUB" | "FACULTY";
};

type AccessRequest = {
    id: number;
    email: string;
    name: string | null;
    message: string | null;
    createdAt: Date;
};

const ROLE_OPTIONS = [
    { value: "EDITOR", label: "Editor" },
    { value: "CLUB_LEADER", label: "Klub rahbari" },
    { value: "FACULTY_LEADER", label: "Fakultet rahbari" },
];

export function RequestsTable({
    request,
    organizers,
    onApprove,
    onReject,
}: {
    request: AccessRequest;
    organizers: Organizer[];
    onApprove: (formData: FormData) => void | Promise<void>;
    onReject: (formData: FormData) => void | Promise<void>;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [role, setRole] = useState("EDITOR");
    const [note, setNote] = useState("");
    const [rejectNote, setRejectNote] = useState("");

    const availableOrganizers = useMemo(() => {
        if (role === "CLUB_LEADER") {
            return organizers.filter((org: Organizer) => org.type === "CLUB");
        }
        if (role === "FACULTY_LEADER") {
            return organizers.filter((org: Organizer) => org.type === "FACULTY");
        }
        return [];
    }, [role, organizers]);

    const handleApprove = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            try {
                await onApprove(formData);
                toastSuccess("So'rov tasdiqlandi ✅");
                router.refresh();
            } catch (e) {
                toastError(e instanceof Error ? e.message : "Xatolik");
            }
        });
    };

    const handleReject = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            try {
                await onReject(formData);
                toastSuccess("So'rov rad etildi ✅");
                router.refresh();
            } catch (e) {
                toastError(e instanceof Error ? e.message : "Xatolik");
            }
        });
    };

    return (
        <TableRow>
            <TableCell className="font-medium">{request.email}</TableCell>
            <TableCell>{request.name ?? "—"}</TableCell>
            <TableCell className="max-w-[260px] truncate">
                {request.message ?? "—"}
            </TableCell>
            <TableCell>{request.createdAt.toLocaleString()}</TableCell>
            <TableCell className="text-right">
                <div className="flex flex-wrap justify-end gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button size="sm" title="So'rovni tasdiqlash">
                                Tasdiqlash
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>So'rovni tasdiqlash</DialogTitle>
                            </DialogHeader>
                            <form className="space-y-3" onSubmit={handleApprove}>
                                <input type="hidden" name="requestId" value={request.id} />
                                <input type="hidden" name="email" value={request.email} />
                                <input
                                    type="hidden"
                                    name="requestName"
                                    value={request.name ?? ""}
                                />

                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Rol</label>
                                    <select
                                        name="role"
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                        value={role}
                                        onChange={(event) => setRole(event.target.value)}
                                    >
                                        {ROLE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {(role === "CLUB_LEADER" || role === "FACULTY_LEADER") && (
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">
                                            Tashkilot
                                        </label>
                                        <select
                                            name="organizerId"
                                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                            required
                                        >
                                            {availableOrganizers.map((org) => (
                                                <option key={org.id} value={org.id}>
                                                    {org.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Izoh</label>
                                    <Textarea
                                        name="note"
                                        placeholder="Izoh (ixtiyoriy)"
                                        value={note}
                                        onChange={(event) => setNote(event.target.value)}
                                    />
                                </div>

                                <DialogFooter>
                                    <Button type="submit" disabled={isPending}>
                                        {isPending ? "Saqlanmoqda..." : "Tasdiqlash"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline" title="So'rovni rad etish">
                                Rad etish
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>So'rovni rad etish</DialogTitle>
                            </DialogHeader>
                            <form className="space-y-3" onSubmit={handleReject}>
                                <input type="hidden" name="requestId" value={request.id} />
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Izoh</label>
                                    <Textarea
                                        name="note"
                                        placeholder="Izoh (ixtiyoriy)"
                                        value={rejectNote}
                                        onChange={(event) => setRejectNote(event.target.value)}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" variant="destructive" disabled={isPending}>
                                        {isPending ? "Yuborilmoqda..." : "Rad etish"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </TableCell>
        </TableRow>
    );
}
