import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/session";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const adminContext = await getAdminContext();
    const isLeader =
        adminContext.role === "CLUB_LEADER" ||
        adminContext.role === "FACULTY_LEADER";

    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            organizer: true,
            registrations: {
                where: { status: "ACTIVE" },
                include: { student: { include: { facultyOrganizer: true } } },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!event) {
        return new NextResponse("Event not found", { status: 404 });
    }
    if (
        isLeader &&
        (!adminContext.organizerId ||
            event.organizerId !== adminContext.organizerId)
    ) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Registrations");

    sheet.addRow(["Event", event.title]);
    sheet.addRow(["Organizer", event.organizer?.name ?? "-"]);
    sheet.addRow(["Starts At", event.startsAt.toLocaleString()]);
    sheet.addRow([]);

    const header = [
        "#",
        "Full Name",
        "Phone",
        "Course",
        "Faculty",
        "Telegram ID",
        "Registered At",
    ];
    sheet.addRow(header);

    event.registrations.forEach((registration, index) => {
        sheet.addRow([
            index + 1,
            registration.student.fullName,
            registration.student.phone ?? "",
            registration.student.course,
            registration.student.facultyOrganizer?.name ??
                registration.student.faculty ??
                "",
            registration.student.telegramId ?? "",
            registration.createdAt.toLocaleString(),
        ]);
    });

    sheet.columns = [
        { width: 6 },
        { width: 28 },
        { width: 18 },
        { width: 10 },
        { width: 24 },
        { width: 18 },
        { width: 22 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const sanitizedTitle = event.title.replace(/[\\/:*?"<>|]+/g, " ").trim();
    const count = event.registrations.length;
    const filename = `${sanitizedTitle} - ${count} ta talaba.xlsx`;

    return new NextResponse(buffer, {
        status: 200,
        headers: {
            "Content-Type":
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}
