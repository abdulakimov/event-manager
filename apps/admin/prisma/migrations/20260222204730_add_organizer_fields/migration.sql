-- AlterTable
ALTER TABLE "Organizer" ADD COLUMN     "description" TEXT,
ADD COLUMN     "foundedAt" TIMESTAMP(3),
ADD COLUMN     "leaderName" TEXT,
ADD COLUMN     "logoUrl" TEXT;

-- CreateIndex
CREATE INDEX "Organizer_name_idx" ON "Organizer"("name");
