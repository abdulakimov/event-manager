import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/session";

export async function GET() {
    const adminContext = await getAdminContext();
    const isLeader =
        adminContext.role === "CLUB_LEADER" ||
        adminContext.role === "FACULTY_LEADER";
    if (isLeader) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const organizers = await prisma.organizer.findMany({
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(organizers);
}

export async function POST(req: Request) {
    const adminContext = await getAdminContext();
    const isLeader =
        adminContext.role === "CLUB_LEADER" ||
        adminContext.role === "FACULTY_LEADER";
    if (isLeader) {
        return new NextResponse("Forbidden", { status: 403 });
    }

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

    let leaderAdminUserIdNumber: number | null = null;
    let leaderAdminUserRecord: { name: string | null; email: string } | null = null;
    if (leaderAdminUserId !== undefined) {
        if (!adminContext.isSuperadmin) {
            return new NextResponse("Forbidden", { status: 403 });
        }
        if (leaderAdminUserId === null || leaderAdminUserId === "") {
            leaderAdminUserIdNumber = null;
        } else {
            const parsed = Number(leaderAdminUserId);
            if (!Number.isInteger(parsed)) {
                return new NextResponse("Invalid leaderAdminUserId", { status: 400 });
            }
            leaderAdminUserIdNumber = parsed;
            leaderAdminUserRecord = await prisma.adminUser.findUnique({
                where: { id: leaderAdminUserIdNumber },
                select: { name: true, email: true },
            });
            if (!leaderAdminUserRecord) {
                return new NextResponse("Leader admin not found", { status: 404 });
            }
        }
    }

    const organizer = await prisma.organizer.create({
        data: {
            name: name.trim(),
            description: description?.trim() || null,
            leaderName:
                leaderAdminUserId !== undefined && leaderAdminUserIdNumber
                    ? leaderAdminUserRecord?.name?.trim() ||
                      leaderAdminUserRecord?.email ||
                      null
                    : leaderName?.trim() || null,
            ...(leaderAdminUserId !== undefined
                ? { leaderAdminUserId: leaderAdminUserIdNumber }
                : {}),
            foundedAt: foundedAtDate,
            logoUrl: logoUrl?.trim() || null,
            type: type ?? "CLUB",
        },
    });

    return NextResponse.json({ id: organizer.id });
}
