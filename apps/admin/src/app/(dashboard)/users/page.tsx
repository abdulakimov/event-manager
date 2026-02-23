import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { uz } from "@/lib/strings.uz";

const COURSE_OPTIONS = [1, 2, 3, 4, 5];

function parseNumber(value?: string) {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

export default async function UsersPage({
    searchParams,
}: {
    searchParams?: Promise<{
        q?: string;
        faculty?: string;
        course?: string;
        sort?: string;
    }>;
}) {
    const { q, faculty, course, sort } = (await searchParams) ?? {};
    const query = q?.trim();
    const facultyId = parseNumber(faculty);
    const courseValue = parseNumber(course);
    const sortValue = sort === "active" ? "active" : "newest";
    const now = new Date();

    const faculties = await prisma.organizer.findMany({
        where: { type: "FACULTY" },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
    });

    const students = await prisma.student.findMany({
        where: {
            ...(query
                ? {
                      OR: [
                          {
                              fullName: {
                                  contains: query,
                                  mode: "insensitive",
                              },
                          },
                          {
                              phone: { contains: query, mode: "insensitive" },
                          },
                      ],
                  }
                : {}),
            ...(facultyId ? { facultyOrganizerId: facultyId } : {}),
            ...(courseValue ? { course: courseValue } : {}),
        },
        include: {
            facultyOrganizer: true,
            registrations: {
                include: {
                    event: { select: { startsAt: true } },
                },
            },
        },
        orderBy:
            sortValue === "newest"
                ? { createdAt: "desc" }
                : { createdAt: "desc" },
        take: sortValue === "active" ? 200 : undefined,
    });

    const rows = students.map((student) => {
        const totalRegistrations = student.registrations.length;
        const activeRegistrations = student.registrations.filter(
            (registration) =>
                registration.status === "ACTIVE" &&
                registration.event?.startsAt &&
                registration.event.startsAt >= now
        ).length;

        return {
            student,
            totalRegistrations,
            activeRegistrations,
        };
    });

    const sortedRows =
        sortValue === "active"
            ? [...rows].sort((a, b) => {
                  if (b.activeRegistrations !== a.activeRegistrations) {
                      return b.activeRegistrations - a.activeRegistrations;
                  }
                  return b.student.createdAt.getTime() - a.student.createdAt.getTime();
              })
            : rows;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold">Talabalar</h1>
                    <p className="text-sm text-muted-foreground">
                        Talabalar ro'yxati va statistikalar
                    </p>
                </div>

                <form className="flex w-full flex-wrap items-center gap-2 md:w-auto">
                    <Input
                        name="q"
                        placeholder="Ism yoki telefon"
                        defaultValue={query}
                        className="w-full md:w-64"
                    />
                    <select
                        name="faculty"
                        defaultValue={facultyId ?? ""}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                        <option value="">Barchasi</option>
                        {faculties.map((fac) => (
                            <option key={fac.id} value={fac.id}>
                                {fac.name}
                            </option>
                        ))}
                    </select>
                    <select
                        name="course"
                        defaultValue={courseValue ?? ""}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                        <option value="">Barchasi</option>
                        {COURSE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option === 5 ? "Sirtqi" : option}
                            </option>
                        ))}
                    </select>
                    <select
                        name="sort"
                        defaultValue={sortValue}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                        <option value="active">Eng aktiv</option>
                        <option value="newest">Yangi</option>
                    </select>
                    <Button type="submit" variant="outline">
                        {uz.search}
                    </Button>
                </form>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{uz.users}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ism</TableHead>
                                    <TableHead>Telefon</TableHead>
                                    <TableHead>Fakultet</TableHead>
                                    <TableHead>Kurs</TableHead>
                                    <TableHead>Jami tadbirlar</TableHead>
                                    <TableHead>Aktiv tadbirlar</TableHead>
                                    <TableHead className="text-right">Amal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedRows.map(
                                    ({
                                        student,
                                        totalRegistrations,
                                        activeRegistrations,
                                    }) => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium">
                                            {student.fullName}
                                        </TableCell>
                                        <TableCell>
                                            {student.phone ?? "—"}
                                        </TableCell>
                                        <TableCell>
                                            {student.facultyOrganizer?.name ??
                                                student.faculty ??
                                                "—"}
                                        </TableCell>
                                        <TableCell>{student.course}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {totalRegistrations}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {activeRegistrations}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/users/${student.id}`}>
                                                    Ko'rish
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {sortedRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="h-24 text-center text-sm text-muted-foreground"
                                        >
                                            Hozircha studentlar yo'q.
                                        </TableCell>
                                    </TableRow>
                                ) : null}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
