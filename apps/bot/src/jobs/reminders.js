import { formatDateTime, timeLeftText } from "../utils/datetime.js";
import { reminderKeyboard } from "../ui/keyboards.js";
import { reminderMessage } from "../ui/messages.js";

const DAY_BEFORE_MS = 24 * 60 * 60 * 1000;
const HALF_HOUR_MS = 30 * 60 * 1000;
const WINDOW_MS = 10 * 60 * 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getWindow(now, offsetMs) {
  const target = new Date(now.getTime() + offsetMs);
  const start = new Date(target.getTime() - WINDOW_MS);
  const end = new Date(target.getTime() + WINDOW_MS);
  return { start, end };
}

async function fetchRegistrations(prisma, windowStart, windowEnd, fieldName) {
  return prisma.eventRegistration.findMany({
    where: {
      status: "ACTIVE",
      [fieldName]: null,
      event: {
        startsAt: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
    },
    include: {
      event: { include: { organizer: true } },
      student: { include: { telegramUser: true } },
    },
  });
}

async function sendReminder(bot, registration) {
  const chatId = registration.student?.telegramUser?.chatId;
  if (!chatId) return false;

  const event = registration.event;
  const { text, extra } = reminderMessage({
    title: event.title,
    date: formatDateTime(event.startsAt),
    timeLeft: timeLeftText(event.startsAt),
    location: event.location,
  });

  await bot.telegram.sendMessage(chatId, text, {
    ...extra,
    reply_markup: reminderKeyboard(event.id).reply_markup,
  });

  return true;
}

export function startReminderWorker(bot, prisma) {
  let running = false;

  console.log("reminder worker started");

  const tick = async () => {
    if (running) return;
    running = true;

    const now = new Date();
    console.log(`reminder tick ${now.toISOString()}`);

    const dayBeforeWindow = getWindow(now, DAY_BEFORE_MS);
    const halfHourWindow = getWindow(now, HALF_HOUR_MS);

    console.log(
      `day-before window: ${dayBeforeWindow.start.toISOString()} -> ${dayBeforeWindow.end.toISOString()}`
    );
    console.log(
      `half-hour window: ${halfHourWindow.start.toISOString()} -> ${halfHourWindow.end.toISOString()}`
    );

    try {
      const dayBeforeRegs = await fetchRegistrations(
        prisma,
        dayBeforeWindow.start,
        dayBeforeWindow.end,
        "remindedDayBeforeAt"
      );
      console.log(`reminder candidates day-before: ${dayBeforeRegs.length}`);

      for (const reg of dayBeforeRegs) {
        try {
          const ok = await sendReminder(bot, reg);
          if (ok) {
            await prisma.eventRegistration.update({
              where: { id: reg.id },
              data: { remindedDayBeforeAt: new Date() },
            });
          }
        } catch (e) {
          console.error("Reminder send failed (day-before)", e);
        }
        await sleep(150);
      }

      const halfHourRegs = await fetchRegistrations(
        prisma,
        halfHourWindow.start,
        halfHourWindow.end,
        "remindedHalfHourAt"
      );
      console.log(`reminder candidates half-hour: ${halfHourRegs.length}`);

      for (const reg of halfHourRegs) {
        try {
          const ok = await sendReminder(bot, reg);
          if (ok) {
            await prisma.eventRegistration.update({
              where: { id: reg.id },
              data: { remindedHalfHourAt: new Date() },
            });
          }
        } catch (e) {
          console.error("Reminder send failed (half-hour)", e);
        }
        await sleep(150);
      }
    } finally {
      running = false;
    }
  };

  tick();
  setInterval(tick, 30 * 1000);
}
