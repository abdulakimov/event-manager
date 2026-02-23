-- AlterTable
ALTER TABLE "Organizer" ALTER COLUMN "type" SET DEFAULT 'CLUB';

-- CreateIndex
CREATE INDEX "Organizer_type_idx" ON "Organizer"("type");
