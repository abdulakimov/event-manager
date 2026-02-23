import { PrismaClient, OrganizerType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    await prisma.organizer.createMany({
        data: [
            { type: OrganizerType.CLUB, name: "IT Club" },
            { type: OrganizerType.CLUB, name: "Art Club" },
            { type: OrganizerType.FACULTY, name: "Computer Science Fakulteti" },
        ],
        skipDuplicates: true,
    });
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
