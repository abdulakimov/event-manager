-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('ACTIVE', 'CANCELED');

-- AlterTable
ALTER TABLE "EventRegistration" ADD COLUMN     "canceledAt" TIMESTAMP(3),
ADD COLUMN     "remindedDayBeforeAt" TIMESTAMP(3),
ADD COLUMN     "remindedHalfHourAt" TIMESTAMP(3),
ADD COLUMN     "status" "RegistrationStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "EventRegistration_status_idx" ON "EventRegistration"("status");

-- CreateIndex
CREATE INDEX "EventRegistration_eventId_status_idx" ON "EventRegistration"("eventId", "status");
