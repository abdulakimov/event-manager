-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "facultyOrganizerId" INTEGER;

-- CreateIndex
CREATE INDEX "Student_facultyOrganizerId_idx" ON "Student"("facultyOrganizerId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_facultyOrganizerId_fkey" FOREIGN KEY ("facultyOrganizerId") REFERENCES "Organizer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
