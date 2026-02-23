import { formatDateTime, timeLeftText } from "../utils/datetime.js";
import { editOrSendView, renderEventDetail, renderEventsEmpty, renderEventsList } from "../ui/views.js";
import { getSession, setSession } from "../state/session.js";

function toShortTitle(title) {
  const trimmed = title.trim();
  if (trimmed.length <= 28) return trimmed;
  return `${trimmed.slice(0, 26)}…`;
}

async function getStudentForCtx(ctx, prisma) {
  const from = ctx.from;
  if (!from) return null;

  const telegramUser = await prisma.telegramUser.findUnique({
    where: { telegramId: BigInt(from.id) },
  });
  if (!telegramUser) return null;

  const student = await prisma.student.findUnique({
    where: { telegramUserId: telegramUser.id },
  });

  return student;
}

async function getRegistration(prisma, eventId, studentId) {
  if (!studentId) return null;
  return prisma.eventRegistration.findUnique({
    where: {
      eventId_studentId: {
        eventId,
        studentId,
      },
    },
  });
}

export async function showEventsList(ctx, prisma) {
  const events = await prisma.event.findMany({
    where: { startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    take: 10,
    include: { organizer: true },
  });

  const session = getSession(ctx.from.id) || {};
  const noFallback = ctx.callbackQuery?.data === "events:refresh";

  if (events.length === 0) {
    const view = renderEventsEmpty();
    const messageId = await editOrSendView(ctx, view, session, !noFallback);
    if (messageId) {
      setSession(ctx.from.id, { ...session, uiMessageId: messageId });
    }
    return;
  }

  const items = events.map((e) => ({
    title: e.title,
    date: formatDateTime(e.startsAt),
    timeLeft: timeLeftText(e.startsAt),
    shortTitle: toShortTitle(e.title),
    id: e.id,
  }));

  const view = renderEventsList(items);
  const messageId = await editOrSendView(ctx, view, session, !noFallback);
  if (messageId) {
    setSession(ctx.from.id, { ...session, uiMessageId: messageId });
  }
}

export async function showEventDetail(ctx, prisma, eventId, notice) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organizer: true },
  });

  if (!event) {
    await ctx.answerCbQuery("Tadbir topilmadi", { show_alert: true });
    return;
  }

  const student = await getStudentForCtx(ctx, prisma);
  const registration = await getRegistration(prisma, eventId, student?.id);
  const status = registration?.status ?? null;

  const detail = {
    id: event.id,
    title: event.title,
    organizer: event.organizer?.name,
    date: formatDateTime(event.startsAt),
    timeLeft: timeLeftText(event.startsAt),
    location: event.location,
  };

  const view = renderEventDetail(detail, status, notice);
  const session = getSession(ctx.from.id) || {};
  const messageId = await editOrSendView(ctx, view, session);
  if (messageId) {
    setSession(ctx.from.id, { ...session, uiMessageId: messageId });
  }
}

export async function registerForEvent(ctx, prisma, eventId) {
  const from = ctx.from;
  if (!from) return;

  const telegramUser = await prisma.telegramUser.findUnique({
    where: { telegramId: BigInt(from.id) },
  });
  if (!telegramUser) {
    await ctx.answerCbQuery("Avval /start ni bosing", { show_alert: true });
    return;
  }

  const student = await prisma.student.findUnique({
    where: { telegramUserId: telegramUser.id },
  });

  if (!student) {
    await ctx.answerCbQuery("Avval ro'yxatdan o'ting", { show_alert: true });
    return;
  }

  const existing = await getRegistration(prisma, eventId, student.id);

  if (existing && existing.status === "ACTIVE") {
    await ctx.answerCbQuery("Siz allaqachon ro'yxatdan o'tgansiz ✅", {
      show_alert: true,
    });
    return;
  }

  if (existing && existing.status === "CANCELED") {
    await prisma.eventRegistration.update({
      where: { id: existing.id },
      data: {
        status: "ACTIVE",
        canceledAt: null,
      },
    });
    await ctx.answerCbQuery("Ro'yxatdan o'tdingiz ✅");
    await showEventDetail(ctx, prisma, eventId, "Ro'yxatdan o'tdingiz ✅");
    return;
  }

  await prisma.eventRegistration.create({
    data: {
      studentId: student.id,
      eventId,
      status: "ACTIVE",
    },
  });

  await ctx.answerCbQuery("Ro'yxatdan o'tdingiz ✅");
  await showEventDetail(ctx, prisma, eventId, "Ro'yxatdan o'tdingiz ✅");
}

export async function cancelRegistration(ctx, prisma, eventId) {
  const from = ctx.from;
  if (!from) return;

  const telegramUser = await prisma.telegramUser.findUnique({
    where: { telegramId: BigInt(from.id) },
  });
  if (!telegramUser) {
    await ctx.answerCbQuery("Avval /start ni bosing", { show_alert: true });
    return;
  }

  const student = await prisma.student.findUnique({
    where: { telegramUserId: telegramUser.id },
  });

  if (!student) {
    await ctx.answerCbQuery("Avval ro'yxatdan o'ting", { show_alert: true });
    return;
  }

  const existing = await getRegistration(prisma, eventId, student.id);
  if (!existing) {
    await ctx.answerCbQuery("Siz ro'yxatdan o'tmagansiz", { show_alert: true });
    return;
  }

  if (existing.status === "CANCELED") {
    await ctx.answerCbQuery("Allaqachon bekor qilingan", { show_alert: true });
    return;
  }

  await prisma.eventRegistration.update({
    where: { id: existing.id },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
    },
  });

  await ctx.answerCbQuery("Bekor qilindi ✅");
  await showEventDetail(
    ctx,
    prisma,
    eventId,
    "✅ Bekor qilindi. Xohlasangiz keyin qayta ro'yxatdan o'tishingiz mumkin."
  );
}
