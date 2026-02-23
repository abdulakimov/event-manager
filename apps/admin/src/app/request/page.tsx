import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequestSignInButton } from "./sign-in-button";
import { RequestAccessForm } from "./request-form";

async function submitAccessRequest(
    _prevState: { status?: string; message?: string },
    formData: FormData
) {
    "use server";

    const session = await getSession();
    const email = session?.user?.email ?? null;
    if (!email) {
        return { status: "error", message: "Email topilmadi." };
    }

    const message = (formData.get("message") as string | null)?.trim() || null;
    const name = session?.user?.name ?? null;

    const existing = await prisma.accessRequest.findFirst({
        where: { email },
        orderBy: { createdAt: "desc" },
    });

    if (existing?.status === "APPROVED") {
        return { status: "noop" };
    }

    if (existing?.status === "PENDING") {
        if (message && message !== existing.message) {
            await prisma.accessRequest.update({
                where: { id: existing.id },
                data: { message },
            });
        }
        return { status: "success" };
    }

    if (existing?.status === "REJECTED") {
        await prisma.accessRequest.update({
            where: { id: existing.id },
            data: {
                status: "PENDING",
                message,
                reviewedAt: null,
                reviewedBy: null,
                note: null,
                name,
            },
        });
        return { status: "success" };
    }

    await prisma.accessRequest.create({
        data: {
            email,
            name,
            message,
            status: "PENDING",
        },
    });

    return { status: "success" };
}

export default async function RequestAccessPage() {
    const session = await getSession();

    if (!session?.user) {
        return (
            <div className="min-h-screen grid place-items-center p-6">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Ruxsat so'rash</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Davom etish uchun Google bilan kiring.
                        </p>
                        <RequestSignInButton />
                    </CardContent>
                </Card>
            </div>
        );
    }

    const accessRequest = await prisma.accessRequest.findFirst({
        where: { email: session.user.email ?? "" },
        orderBy: { createdAt: "desc" },
    });
    const adminUser = await prisma.adminUser.findUnique({
        where: { email: session.user.email ?? "" },
        select: { id: true, isActive: true },
    });

    if (accessRequest?.status === "APPROVED" && !adminUser) {
        await prisma.accessRequest.update({
            where: { id: accessRequest.id },
            data: {
                status: "PENDING",
                message: null,
                reviewedAt: null,
                reviewedBy: null,
                note: null,
            },
        });
    }

    const statusText =
        accessRequest?.status === "PENDING"
            ? "So'rov yuborilgan, kuting."
            : accessRequest?.status === "REJECTED"
            ? "So'rov rad etilgan."
            : "Admin ruxsatini so'rang.";

    return (
        <div className="min-h-screen grid place-items-center p-6">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Ruxsat so'rash</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Salom, {session.user.name ?? session.user.email}
                        </p>
                        <p className="mt-1 text-sm">{statusText}</p>
                        {accessRequest?.status === "REJECTED" && accessRequest.note ? (
                            <p className="mt-2 text-sm text-muted-foreground">
                                Izoh: {accessRequest.note}
                            </p>
                        ) : null}
                    </div>

                    {accessRequest?.status === "APPROVED" && adminUser ? (
                        <Button asChild>
                            <Link href="/dashboard">Dashboardga o'tish</Link>
                        </Button>
                    ) : (
                        <RequestAccessForm
                            action={submitAccessRequest}
                            defaultMessage={adminUser ? accessRequest?.message ?? "" : ""}
                            disabled={adminUser ? accessRequest?.status === "PENDING" : false}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
