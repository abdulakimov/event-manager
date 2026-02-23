"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Pencil, Trash2, Unlock } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { toastError, toastSuccess } from "@/lib/toast";

const SUPERADMIN_EMAIL = "xurshidbekabdulakimov@gmail.com";

type Organizer = {
    id: number;
    name: string;
    type: "CLUB" | "FACULTY";
};

type AdminUserRow = {
    id: number;
    email: string;
    name: string | null;
    role: string;
    organizerId: number | null;
    organizerName: string | null;
    isActive: boolean;
    createdAt: string;
};

const ROLE_OPTIONS = [
    { value: "EDITOR", label: "Editor" },
    { value: "CLUB_LEADER", label: "Klub rahbari" },
    { value: "FACULTY_LEADER", label: "Fakultet rahbari" },
];

export function AdminsTable({
    admins,
    organizers,
}: {
    admins: AdminUserRow[];
    organizers: Organizer[];
}) {
    const router = useRouter();
    const [editAdmin, setEditAdmin] = useState<AdminUserRow | null>(null);
    const [deleteAdmin, setDeleteAdmin] = useState<AdminUserRow | null>(null);
    const [role, setRole] = useState("EDITOR");
    const [organizerId, setOrganizerId] = useState("");
    const [isPending, startTransition] = useTransition();

    const availableOrganizers = useMemo(() => {
        if (role === "CLUB_LEADER") {
            return organizers.filter((org) => org.type === "CLUB");
        }
        if (role === "FACULTY_LEADER") {
            return organizers.filter((org) => org.type === "FACULTY");
        }
        return [];
    }, [role, organizers]);

    const openEdit = (admin: AdminUserRow) => {
        setRole(admin.role);
        setOrganizerId(admin.organizerId ? String(admin.organizerId) : "");
        setEditAdmin(admin);
    };

    const submitEdit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editAdmin) return;

        startTransition(async () => {
            const res = await fetch(`/api/admins/${editAdmin.id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    role,
                    organizerId: organizerId || null,
                }),
            });
            if (!res.ok) {
                const msg = await res.text();
                toastError(msg || "Xatolik");
                return;
            }
            setEditAdmin(null);
            toastSuccess("Admin yangilandi ✅");
            router.refresh();
        });
    };

    const toggleActive = (admin: AdminUserRow) => {
        startTransition(async () => {
            const res = await fetch(`/api/admins/${admin.id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ isActive: !admin.isActive }),
            });
            if (!res.ok) {
                const msg = await res.text();
                toastError(msg || "Xatolik");
                return;
            }
            toastSuccess(admin.isActive ? "Admin bloklandi ✅" : "Admin blokdan chiqarildi ✅");
            router.refresh();
        });
    };

    const confirmDelete = () => {
        if (!deleteAdmin) return;
        startTransition(async () => {
            const res = await fetch(`/api/admins/${deleteAdmin.id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const msg = await res.text();
                toastError(msg || "Xatolik");
                return;
            }
            setDeleteAdmin(null);
            toastSuccess("Admin o'chirildi ✅");
            router.refresh();
        });
    };

    return (
        <TooltipProvider>
            <>
            <TableBody>
                {admins.map((admin) => {
                    const isSuperAdminAccount = admin.email === SUPERADMIN_EMAIL;
                    const toggleLabel = admin.isActive ? "Bloklash" : "Blokdan chiqarish";
                    return (
                        <TableRow key={admin.id}>
                        <TableCell className="font-medium">
                            <div className="space-y-1">
                                <div>{admin.name ?? "—"}</div>
                                <div className="text-xs text-muted-foreground">
                                    {admin.email}
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="secondary">{admin.role}</Badge>
                        </TableCell>
                        <TableCell>{admin.organizerName ?? "—"}</TableCell>
                        <TableCell>
                            <Badge variant={admin.isActive ? "default" : "secondary"}>
                                {admin.isActive ? "Aktiv" : "O'chirilgan"}
                            </Badge>
                        </TableCell>
                        <TableCell>{new Date(admin.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            onClick={() => openEdit(admin)}
                                            disabled={isSuperAdminAccount}
                                        >
                                            <Pencil className="size-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Tahrirlash</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="icon"
                                            variant={admin.isActive ? "secondary" : "default"}
                                            onClick={() => toggleActive(admin)}
                                            disabled={isPending || isSuperAdminAccount}
                                        >
                                            {admin.isActive ? (
                                                <Lock className="size-4" />
                                            ) : (
                                                <Unlock className="size-4" />
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{toggleLabel}</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            onClick={() => setDeleteAdmin(admin)}
                                            disabled={isPending || isSuperAdminAccount}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Butunlay o'chirish</TooltipContent>
                                </Tooltip>
                            </div>
                        </TableCell>
                    </TableRow>
                );
            })}

            {admins.length === 0 ? (
                <TableRow>
                    <TableCell
                        colSpan={6}
                        className="h-24 text-center text-sm text-muted-foreground"
                    >
                        Adminlar yo'q.
                    </TableCell>
                </TableRow>
            ) : null}

            <Dialog open={Boolean(editAdmin)} onOpenChange={(open) => {
                if (!open) setEditAdmin(null);
            }}>
                {editAdmin ? (
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adminni tahrirlash</DialogTitle>
                        </DialogHeader>
                        <form className="space-y-3" onSubmit={submitEdit}>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Rol</label>
                                <select
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
                                    <label className="text-sm font-medium">Tashkilot</label>
                                    <select
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                        value={organizerId}
                                        onChange={(event) =>
                                            setOrganizerId(event.target.value)
                                        }
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

                            <DialogFooter>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? "Saqlanmoqda..." : "Saqlash"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                ) : null}
            </Dialog>

            <AlertDialog
                open={Boolean(deleteAdmin)}
                onOpenChange={(open) => {
                    if (!open) setDeleteAdmin(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Adminni o'chirish?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu amalni ortga qaytarib bo'lmaydi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-white hover:bg-destructive/90"
                            disabled={isPending}
                        >
                            {isPending ? "O'chirilmoqda..." : "O'chirish"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            </TableBody>
            </>
        </TooltipProvider>
    );
}
