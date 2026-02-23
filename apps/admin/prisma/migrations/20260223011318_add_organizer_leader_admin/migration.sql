-- AlterTable
ALTER TABLE "Organizer" ADD COLUMN     "leaderAdminUserId" INTEGER;

-- CreateIndex
CREATE INDEX "Organizer_leaderAdminUserId_idx" ON "Organizer"("leaderAdminUserId");

-- AddForeignKey
ALTER TABLE "Organizer" ADD CONSTRAINT "Organizer_leaderAdminUserId_fkey" FOREIGN KEY ("leaderAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
