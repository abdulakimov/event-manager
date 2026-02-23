-- CreateTable
CREATE TABLE "TelegramStudent" (
    "id" SERIAL NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "fullName" TEXT NOT NULL,
    "faculty" TEXT NOT NULL,
    "course" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramEventRegistration" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramEventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramStudent_telegramId_key" ON "TelegramStudent"("telegramId");

-- CreateIndex
CREATE INDEX "TelegramEventRegistration_studentId_idx" ON "TelegramEventRegistration"("studentId");

-- CreateIndex
CREATE INDEX "TelegramEventRegistration_eventId_idx" ON "TelegramEventRegistration"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramEventRegistration_studentId_eventId_key" ON "TelegramEventRegistration"("studentId", "eventId");

-- AddForeignKey
ALTER TABLE "TelegramEventRegistration" ADD CONSTRAINT "TelegramEventRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "TelegramStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramEventRegistration" ADD CONSTRAINT "TelegramEventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
