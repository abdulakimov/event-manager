import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateOrganizerDialog } from "@/components/organizers/create-organizer-dialog";
import { OrganizersTable } from "@/components/organizers/organizers-table";
import { uz } from "@/lib/strings.uz";

export const dynamic = "force-dynamic";


export default async function OrganizersPage() {
    const adminContext = await getAdminContext();
    const isLeader =
        adminContext.role === "CLUB_LEADER" ||
        adminContext.role === "FACULTY_LEADER";
    if (isLeader) {
        redirect("/dashboard");
    }

    const [organizers, leaderOptions] = await Promise.all([
        prisma.organizer.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                leaderAdminUser: {
                    select: { id: true, name: true, email: true },
                },
            },
        }),
        prisma.adminUser.findMany({
            where: { role: { in: ["CLUB_LEADER", "FACULTY_LEADER"] } },
            orderBy: { email: "asc" },
            select: { id: true, name: true, email: true, role: true },
        }),
    ]);

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold">Tashkilotchilar</h1>
                    <p className="text-sm text-muted-foreground">
                        Klublar va fakultetlarni boshqarish
                    </p>
                </div>

                <CreateOrganizerDialog
                    leaderOptions={leaderOptions}
                    isSuperadmin={adminContext.isSuperadmin}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{uz.organizers}</CardTitle>
                </CardHeader>
                <CardContent>
                    {organizers.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
                            <div className="text-sm text-muted-foreground">
                                Hozircha tashkilotchilar yo'q. Birinchi
                                tashkilotchini yarating.
                            </div>
                            <CreateOrganizerDialog
                                leaderOptions={leaderOptions}
                                isSuperadmin={adminContext.isSuperadmin}
                            />
                        </div>
                    ) : (
                        <OrganizersTable
                            organizers={organizers.map((org) => ({
                                id: org.id,
                                name: org.name,
                                description: org.description,
                                leaderName: org.leaderName,
                                leaderAdminUserId: org.leaderAdminUser?.id ?? null,
                                leaderAdminUser: org.leaderAdminUser
                                    ? {
                                          name: org.leaderAdminUser.name,
                                          email: org.leaderAdminUser.email,
                                      }
                                    : null,
                                foundedAt: org.foundedAt
                                    ? org.foundedAt.toISOString()
                                    : null,
                                createdAt: org.createdAt.toISOString(),
                                logoUrl: org.logoUrl,
                                type: org.type,
                            }))}
                            leaderOptions={leaderOptions}
                            isSuperadmin={adminContext.isSuperadmin}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


