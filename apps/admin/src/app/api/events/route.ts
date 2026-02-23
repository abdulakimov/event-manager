import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/session";

export async function POST(req: Request) {
    const adminContext = await getAdminContext();
    const isLeader =
        adminContext.role === "CLUB_LEADER" ||
        adminContext.role === "FACULTY_LEADER";
    const body = await req.json().catch(() => null);
    if (!body) return new NextResponse("Invalid JSON", { status: 400 });

    const { title, organizerId, startsAt, location } = body as {
        title?: string;
        organizerId?: string | number;
        startsAt?: string;
        location?: string;
    };

    const organizerIdValue = organizerId == null ? "" : String(organizerId);

    if (!title?.trim() || !organizerIdValue.trim() || !startsAt || !location?.trim()) {
        return new NextResponse("Missing fields", { status: 400 });
    }

    const organizerIdNumber = Number(organizerIdValue);
    if (!Number.isInteger(organizerIdNumber)) {
        return new NextResponse("Invalid organizerId", { status: 400 });
    }
    if (
        isLeader &&
        adminContext.organizerId &&
        organizerIdNumber !== adminContext.organizerId
    ) {
        return new NextResponse("Forbidden", { status: 403 });
    }
    if (isLeader && !adminContext.organizerId) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const date = new Date(startsAt);
    if (Number.isNaN(date.getTime())) {
        return new NextResponse("Invalid startsAt", { status: 400 });
    }

    // ✅ organizerId borligini tekshirish (chiroyli error uchun)
    const organizer = await prisma.organizer.findUnique({ where: { id: organizerIdNumber } });
    if (!organizer) return new NextResponse("Invalid organizerId", { status: 400 });

    const event = await prisma.event.create({
        data: {
            title: title.trim(),
            organizerId: organizerIdNumber,
            startsAt: date,
            location: location.trim(),
        },
    });

    return NextResponse.json({ id: event.id });
}
