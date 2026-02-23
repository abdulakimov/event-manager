/*
  Warnings:

  - A unique constraint covering the columns `[telegramUserId]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `telegramUserId` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "telegramUserId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Student_telegramUserId_key" ON "Student"("telegramUserId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_telegramUserId_fkey" FOREIGN KEY ("telegramUserId") REFERENCES "TelegramUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
