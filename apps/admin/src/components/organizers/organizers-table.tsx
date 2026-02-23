"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MoreHorizontal, Pencil, Search, Trash2, User } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { EditOrganizerDialog } from "@/components/organizers/edit-organizer-dialog";
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
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toastError, toastSuccess } from "@/lib/toast";
import { uz } from "@/lib/strings.uz";

type OrganizerRow = {
    id: number;
    name: string;
    description?: string | null;
    leaderName: string | null;
    leaderAdminUserId?: number | null;
    leaderAdminUser?: { name: string | null; email: string } | null;
    foundedAt: string | null;
    createdAt: string;
    logoUrl: string | null;
    type?: "CLUB" | "FACULTY";
};

export function OrganizersTable({
    organizers,
    leaderOptions,
    isSuperadmin,
}: {
    organizers: OrganizerRow[];
    leaderOptions: { id: number; name: string | null; email: string; role: string }[];
    isSuperadmin: boolean;
}) {
    const [query, setQuery] = useState("");
    const [editOrganizer, setEditOrganizer] =
        useState<OrganizerRow | null>(null);
    const [deleteTarget, setDeleteTarget] =
        useState<OrganizerRow | null>(null);
    const [pendingDelete, setPendingDelete] = useState(false);
    const router = useRouter();
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = useMemo(() => {
        if (!normalizedQuery) return organizers;
        return organizers.filter((org) =>
            org.name.toLowerCase().includes(normalizedQuery)
        );
    }, [organizers, normalizedQuery]);

    return (
        <div className="space-y-4">
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder={`${uz.search}...`}
                    className="pl-9"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Logo</TableHead>
                            <TableHead>Nomi</TableHead>
                            <TableHead>Turi</TableHead>
                            <TableHead>Rahbar</TableHead>
                            <TableHead>Tashkil topgan</TableHead>
                            <TableHead>Yaratilgan</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((org) => (
                            <TableRow key={org.id}>
                                <TableCell>
                                    <div className="h-9 w-9 rounded-md border bg-muted overflow-hidden grid place-items-center text-xs text-muted-foreground">
                                        {org.logoUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={org.logoUrl}
                                                alt={org.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            "—"
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <a
                                        href={`/organizers/${org.id}`}
                                        className="hover:underline"
                                    >
                                        {org.name}
                                    </a>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            org.type === "FACULTY"
                                                ? "secondary"
                                                : "default"
                                        }
                                    >
                                        {org.type === "FACULTY"
                                            ? "Fakultet"
                                            : "Klub"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <User className="size-4 text-muted-foreground" />
                                        <div className="space-y-1">
                                            <div className="text-sm">
                                                {org.leaderAdminUser ? (
                                                    org.leaderAdminUser.name?.trim() ||
                                                    org.leaderAdminUser.email
                                                ) : (
                                                    org.leaderName ?? "—"
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {org.leaderAdminUser ? (
                                                    <>
                                                        {org.leaderAdminUser.name?.trim() ? (
                                                            <span className="text-xs text-muted-foreground">
                                                                {org.leaderAdminUser.email}
                                                            </span>
                                                        ) : null}
                                                        <Badge variant="default">
                                                            Tasdiqlangan
                                                        </Badge>
                                                    </>
                                                ) : (
                                                    <Badge variant="secondary">Manual</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="size-4" />
                                        {org.foundedAt
                                            ? new Date(
                                                  org.foundedAt
                                              ).toLocaleDateString()
                                            : "—"}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {new Date(
                                        org.createdAt
                                    ).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon-sm">
                                                <MoreHorizontal className="size-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onSelect={() =>
                                                    setEditOrganizer(org)
                                                }
                                            >
                                                <Pencil className="size-4" />
                                                {uz.edit}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                variant="destructive"
                                                onSelect={() =>
                                                    setDeleteTarget(org)
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
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="h-24 text-center text-sm text-muted-foreground"
                                >
                                    Tashkilotchilar topilmadi.
                                </TableCell>
                            </TableRow>
                        ) : null}
                    </TableBody>
                </Table>
            </div>

            <EditOrganizerDialog
                organizer={
                    editOrganizer
                        ? {
                              id: editOrganizer.id,
                              name: editOrganizer.name,
                              description: editOrganizer.description ?? null,
                              leaderName: editOrganizer.leaderName,
                              leaderAdminUserId: editOrganizer.leaderAdminUserId ?? null,
                              foundedAt: editOrganizer.foundedAt,
                              logoUrl: editOrganizer.logoUrl,
                              type: editOrganizer.type,
                          }
                        : null
                }
                leaderOptions={leaderOptions}
                isSuperadmin={isSuperadmin}
                open={Boolean(editOrganizer)}
                onOpenChange={(open) => {
                    if (!open) setEditOrganizer(null);
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
                        <AlertDialogTitle>Tashkilotchini o'chirish?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu amalni ortga qaytarib bo'lmaydi. Tashkilotchi
                            butunlay o'chiriladi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={pendingDelete}>
                            {uz.cancel}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (!deleteTarget) return;
                                setPendingDelete(true);
                                try {
                                    const res = await fetch(
                                        `/api/organizers/${deleteTarget.id}`,
                                        { method: "DELETE" }
                                    );
                                    if (!res.ok) {
                                        const msg = await res.text();
                                        throw new Error(
                                            msg || "Failed to delete organizer"
                                        );
                                    }
                                    setDeleteTarget(null);
                                    toastSuccess("Tashkilotchi o'chirildi ✅");
                                    router.refresh();
                                } catch (e) {
                                    toastError(
                                        e instanceof Error ? e.message : "Xatolik"
                                    );
                                } finally {
                                    setPendingDelete(false);
                                }
                            }}
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




