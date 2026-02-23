import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/session";

const SUPERADMIN_EMAIL = "xurshidbekabdulakimov@gmail.com";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const adminContext = await getAdminContext();
    if (!adminContext.isSuperadmin) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const { id } = await params;
    const adminId = Number(id);
    if (!Number.isInteger(adminId)) {
        return new NextResponse("Invalid admin id", { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return new NextResponse("Invalid JSON", { status: 400 });

    const { role, organizerId, isActive } = body as {
        role?: string;
        organizerId?: number | string | null;
        isActive?: boolean;
    };

    if (role === "SUPERADMIN" && adminContext.email !== SUPERADMIN_EMAIL) {
        return new NextResponse("Bu amal faqat superadmin uchun", { status: 403 });
    }

    const admin = await prisma.adminUser.findUnique({
        where: { id: adminId },
    });
    if (!admin) return new NextResponse("Admin not found", { status: 404 });
    if (admin.email === SUPERADMIN_EMAIL) {
        return new NextResponse("Cannot modify superadmin", { status: 403 });
    }

    const updateData: {
        role?: "EDITOR" | "CLUB_LEADER" | "FACULTY_LEADER" | "SUPERADMIN";
        organizerId?: number | null;
        isActive?: boolean;
        disabledAt?: Date | null;
        disabledBy?: string | null;
    } = {};

    if (typeof isActive === "boolean") {
        updateData.isActive = isActive;
        updateData.disabledAt = isActive ? null : new Date();
        updateData.disabledBy = isActive ? null : adminContext.email;
    }

    if (role) {
        if (!["EDITOR", "CLUB_LEADER", "FACULTY_LEADER", "SUPERADMIN"].includes(role)) {
            return new NextResponse("Invalid role", { status: 400 });
        }
        updateData.role = role as
            | "EDITOR"
            | "CLUB_LEADER"
            | "FACULTY_LEADER"
            | "SUPERADMIN";
    }

    if (role) {
        const isLeader = role === "CLUB_LEADER" || role === "FACULTY_LEADER";
        if (!isLeader) {
            updateData.organizerId = null;
        } else {
            if (organizerId == null || organizerId === "") {
                return new NextResponse("Organizer is required", { status: 400 });
            }
            const organizerIdNumber = Number(organizerId);
            if (!Number.isInteger(organizerIdNumber)) {
                return new NextResponse("Invalid organizerId", { status: 400 });
            }

            const organizer = await prisma.organizer.findUnique({
                where: { id: organizerIdNumber },
                select: { type: true },
            });
            if (!organizer) {
                return new NextResponse("Organizer not found", { status: 404 });
            }

            if (
                (role === "CLUB_LEADER" && organizer.type !== "CLUB") ||
                (role === "FACULTY_LEADER" && organizer.type !== "FACULTY")
            ) {
                return new NextResponse("Organizer type mismatch", { status: 400 });
            }
            updateData.organizerId = organizerIdNumber;
        }
    }

    const updated = await prisma.adminUser.update({
        where: { id: adminId },
        data: updateData,
    });

    return NextResponse.json({ id: updated.id });
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const adminContext = await getAdminContext();
    if (!adminContext.isSuperadmin) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const { id } = await params;
    const adminId = Number(id);
    if (!Number.isInteger(adminId)) {
        return new NextResponse("Invalid admin id", { status: 400 });
    }

    const admin = await prisma.adminUser.findUnique({
        where: { id: adminId },
    });
    if (!admin) return new NextResponse("Admin not found", { status: 404 });
    if (admin.email === SUPERADMIN_EMAIL) {
        return new NextResponse("Cannot delete superadmin", { status: 403 });
    }

    await prisma.adminUser.delete({ where: { id: adminId } });

    const existingRequest = await prisma.accessRequest.findFirst({
        where: { email: admin.email },
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true },
    });
    if (existingRequest) {
        await prisma.accessRequest.update({
            where: { id: existingRequest.id },
            data: {
                status: "PENDING",
                message: null,
                reviewedAt: null,
                reviewedBy: null,
                note: null,
            },
        });
    }

    return NextResponse.json({ id: adminId });
}
