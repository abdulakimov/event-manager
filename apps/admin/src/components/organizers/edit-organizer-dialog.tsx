"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Building2,
    Calendar,
    FileText,
    Image,
    Pencil,
    User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LogoUploadField } from "@/components/organizers/logo-upload-field";
import { toastError, toastSuccess } from "@/lib/toast";

type OrganizerPayload = {
    id: number;
    name: string;
    description: string | null;
    leaderName: string | null;
    leaderAdminUserId?: number | null;
    foundedAt: string | null;
    logoUrl: string | null;
    type?: "CLUB" | "FACULTY";
};

export function EditOrganizerDialog({
    organizer,
    leaderOptions,
    isSuperadmin,
    open,
    onOpenChange,
}: {
    organizer: OrganizerPayload | null;
    leaderOptions: { id: number; name: string | null; email: string; role: string }[];
    isSuperadmin: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [pending, setPending] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; form?: string }>({});

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [leaderName, setLeaderName] = useState("");
    const [leaderAdminUserId, setLeaderAdminUserId] = useState<string>("");
    const [foundedAt, setFoundedAt] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [type, setType] = useState("CLUB");
    const router = useRouter();

    const maxDate = useMemo(
        () => new Date().toISOString().slice(0, 10),
        []
    );

    useEffect(() => {
        if (!organizer) return;
        setName(organizer.name ?? "");
        setDescription(organizer.description ?? "");
        setLeaderName(organizer.leaderName ?? "");
        setLeaderAdminUserId(
            organizer.leaderAdminUserId ? String(organizer.leaderAdminUserId) : ""
        );
        setFoundedAt(
            organizer.foundedAt ? organizer.foundedAt.slice(0, 10) : ""
        );
        setLogoUrl(organizer.logoUrl ?? "");
        setType(organizer.type ?? "CLUB");
    }, [organizer]);

    function validate() {
        const nextErrors: typeof errors = {};
        if (!name.trim()) nextErrors.name = "Nomi majburiy.";
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    async function submit() {
        if (!organizer || !validate()) return;
        setPending(true);
        try {
            const res = await fetch(`/api/organizers/${organizer.id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    name,
                    description,
                    leaderName,
                    ...(isSuperadmin
                        ? { leaderAdminUserId: leaderAdminUserId || null }
                        : {}),
                    foundedAt,
                    logoUrl,
                    type,
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                if (msg.includes("Missing fields")) {
                    validate();
                    setErrors((prev) => ({
                        ...prev,
                        form: "Iltimos, majburiy maydonlarni toâ€˜ldiring.",
                    }));
                    return;
                }
                if (msg.includes("Invalid foundedAt")) {
                    setErrors((prev) => ({
                        ...prev,
                        form: "Tashkil topgan sana notoâ€˜gâ€˜ri.",
                    }));
                    return;
                }
                throw new Error(msg || "Failed to update organizer");
            }

            onOpenChange(false);
            toastSuccess("Tashkilotchi yangilandi âœ…");
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
                        Tashkilotchini tahrirlash
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                            <Building2 className="size-4 text-muted-foreground" />
                            Nomi
                        </Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Masalan: IT Club"
                        />
                        {errors.name ? (
                            <p className="text-sm text-destructive">
                                {errors.name}
                            </p>
                        ) : null}
                    </div>

                    <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                            <FileText className="size-4 text-muted-foreground" />
                            Tavsif
                        </Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Qisqacha tavsif"
                            rows={3}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                            <User className="size-4 text-muted-foreground" />
                            Rahbar
                        </Label>
                        <Input
                            value={leaderName}
                            onChange={(e) => setLeaderName(e.target.value)}
                            placeholder="Masalan: Ali Valiyev"
                        />
                    </div>
                    {isSuperadmin ? (
                        <div className="grid gap-2">
                            <Label className="flex items-center gap-2">
                                <User className="size-4 text-muted-foreground" />
                                Rahbar (admin)
                            </Label>
                            <select
                                className="h-10 rounded-md border bg-background px-3 text-sm"
                                value={leaderAdminUserId}
                                onChange={(e) => {
                                    const nextId = e.target.value;
                                    setLeaderAdminUserId(nextId);
                                    if (!nextId) {
                                        setLeaderName("");
                                        return;
                                    }
                                    const selected = leaderOptions.find(
                                        (option) => String(option.id) === nextId
                                    );
                                    if (selected) {
                                        const nextName =
                                            selected.name?.trim() || selected.email;
                                        setLeaderName(nextName);
                                    }
                                }}
                            >
                                <option value="">— Rahbar tanlanmagan —</option>
                                {leaderOptions.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.name
                                            ? `${option.name} (${option.email})`
                                            : option.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : null}

                    <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                            <Calendar className="size-4 text-muted-foreground" />
                            Tashkil topgan sana
                        </Label>
                        <Input
                            type="date"
                            value={foundedAt}
                            max={maxDate}
                            onChange={(e) => setFoundedAt(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                            <Building2 className="size-4 text-muted-foreground" />
                            Turi
                        </Label>
                        <select
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="CLUB">Klub</option>
                            <option value="FACULTY">Fakultet</option>
                        </select>
                    </div>

                    <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                            <Image className="size-4 text-muted-foreground" />
                            Logo
                        </Label>
                        <LogoUploadField value={logoUrl} onChange={setLogoUrl} />
                    </div>

                    {errors.form ? (
                        <div className="text-sm text-destructive">
                            {errors.form}
                        </div>
                    ) : null}

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={pending}
                        >
                            Bekor qilish
                        </Button>
                        <Button onClick={submit} disabled={pending || !name.trim()}>
                            {pending ? "Saqlanmoqda..." : "Saqlash"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

