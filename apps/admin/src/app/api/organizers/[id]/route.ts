import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/session";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const adminContext = await getAdminContext();
    const isLeader =
        adminContext.role === "CLUB_LEADER" ||
        adminContext.role === "FACULTY_LEADER";
    if (isLeader) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) return new NextResponse("Invalid JSON", { status: 400 });

    const {
        name,
        description,
        leaderName,
        leaderAdminUserId,
        foundedAt,
        logoUrl,
        type,
    } = body as {
        name?: string;
        description?: string;
        leaderName?: string;
        leaderAdminUserId?: number | string | null;
        foundedAt?: string;
        logoUrl?: string;
        type?: "CLUB" | "FACULTY";
    };

    if (!name?.trim()) {
        return new NextResponse("Missing fields", { status: 400 });
    }

    if (type && type !== "CLUB" && type !== "FACULTY") {
        return new NextResponse("Invalid type", { status: 400 });
    }

    let foundedAtDate: Date | null = null;
    if (foundedAt) {
        const parsed = new Date(foundedAt);
        if (Number.isNaN(parsed.getTime())) {
            return new NextResponse("Invalid foundedAt", { status: 400 });
        }
        foundedAtDate = parsed;
    }

    const organizerId = Number(id);
    if (!Number.isInteger(organizerId)) {
        return new NextResponse("Invalid organizerId", { status: 400 });
    }

    const organizer = await prisma.organizer.findUnique({
        where: { id: organizerId },
    });
    if (!organizer) return new NextResponse("Organizer not found", { status: 404 });

    let leaderAdminUserIdNumber: number | null = null;
    let clearLeaderName = false;
    if (leaderAdminUserId !== undefined) {
        if (!adminContext.isSuperadmin) {
            return new NextResponse("Forbidden", { status: 403 });
        }
        if (leaderAdminUserId === null || leaderAdminUserId === "") {
            leaderAdminUserIdNumber = null;
            clearLeaderName = true;
        } else {
            const parsed = Number(leaderAdminUserId);
            if (!Number.isInteger(parsed)) {
                return new NextResponse("Invalid leaderAdminUserId", { status: 400 });
            }
            leaderAdminUserIdNumber = parsed;
        }
    }

    let leaderAdminUserRecord: { name: string | null; email: string } | null = null;
    if (leaderAdminUserId !== undefined && leaderAdminUserIdNumber) {
        leaderAdminUserRecord = await prisma.adminUser.findUnique({
            where: { id: leaderAdminUserIdNumber },
            select: { name: true, email: true },
        });
    }

    const updated = await prisma.organizer.update({
        where: { id: organizerId },
        data: {
            name: name.trim(),
            description: description?.trim() || null,
            leaderName:
                leaderAdminUserId !== undefined && leaderAdminUserIdNumber
                    ? leaderAdminUserRecord?.name?.trim() ||
                      leaderAdminUserRecord?.email ||
                      null
                    : clearLeaderName
                    ? null
                    : leaderName?.trim() || null,
            ...(leaderAdminUserId !== undefined
                ? { leaderAdminUserId: leaderAdminUserIdNumber }
                : {}),
            foundedAt: foundedAtDate,
            logoUrl: logoUrl?.trim() || null,
            ...(type ? { type } : {}),
        },
    });

    return NextResponse.json({ id: updated.id });
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const adminContext = await getAdminContext();
    const isLeader =
        adminContext.role === "CLUB_LEADER" ||
        adminContext.role === "FACULTY_LEADER";
    if (isLeader) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const { id } = await params;
    const organizerId = Number(id);
    if (!Number.isInteger(organizerId)) {
        return new NextResponse("Invalid organizerId", { status: 400 });
    }

    const organizer = await prisma.organizer.findUnique({
        where: { id: organizerId },
    });
    if (!organizer) return new NextResponse("Organizer not found", { status: 404 });

    const eventCount = await prisma.event.count({
        where: { organizerId },
    });
    if (eventCount > 0) {
        return new NextResponse(
            "Cannot delete organizer with existing events",
            { status: 400 }
        );
    }

    await prisma.organizer.delete({ where: { id: organizerId } });
    return NextResponse.json({ id: organizerId });
}
