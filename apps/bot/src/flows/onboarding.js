import { getSession, setSession, clearSession } from "../state/session.js";
import {
  courseInlineKeyboard,
  facultyInlineKeyboard,
  phoneRequestKeyboard,
  removeKeyboard,
} from "../ui/keyboards.js";
import { welcomeNew } from "../ui/messages.js";
import { editOrSendView, renderHome } from "../ui/views.js";

function normalizePhone(input) {
  if (!input) return "";
  const cleaned = input.replace(/[^0-9+]/g, "");
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

async function sendFacultyPrompt(ctx, prisma, session) {
  const faculties = await prisma.organizer.findMany({
    where: { type: "FACULTY" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  if (faculties.length === 0) {
    await ctx.reply(
      "Hozircha fakultetlar yo'q. Administrator bilan bog'laning."
    );
    return null;
  }

  const message = await ctx.reply(
    "Fakultetingizni tanlang:",
    facultyInlineKeyboard(faculties)
  );

  setSession(ctx.from.id, {
    ...session,
    uiMessageId: message.message_id,
  });

  return message.message_id;
}

async function editOrSend(ctx, text, markup) {
  try {
    await ctx.editMessageText(text, markup);
    return ctx.callbackQuery?.message?.message_id ?? null;
  } catch (e) {
    const message = await ctx.reply(text, markup);
    return message.message_id;
  }
}

export async function handleStart(ctx, prisma) {
  const from = ctx.from;
  if (!from) return;

  const telegramId = BigInt(from.id);
  const chatId = BigInt(ctx.chat?.id ?? from.id);

  const telegramUser = await prisma.telegramUser.upsert({
    where: { telegramId },
    update: {
      chatId,
      username: from.username ?? null,
      firstName: from.first_name ?? null,
      lastName: from.last_name ?? null,
    },
    create: {
      telegramId,
      chatId,
      username: from.username ?? null,
      firstName: from.first_name ?? null,
      lastName: from.last_name ?? null,
    },
  });

  const student = await prisma.student.findUnique({
    where: { telegramUserId: telegramUser.id },
  });

  const displayName =
    [from.first_name, from.last_name].filter(Boolean).join(" ") || "";

  if (student) {
    clearSession(telegramId);
    const view = renderHome({ fullName: student.fullName || displayName });
    const messageId = await editOrSendView(ctx, view, getSession(from.id));
    setSession(from.id, { uiMessageId: messageId });
    return;
  }

  setSession(telegramId, {
    step: "name",
    telegramUserId: telegramUser.id,
  });

  const { text, extra } = welcomeNew(displayName);
  await ctx.reply(text, extra);
  await ctx.reply("Ism va familiyangizni kiriting:");
}

export async function handleCancel(ctx) {
  const from = ctx.from;
  if (!from) return;
  clearSession(from.id);
  await ctx.reply("Bekor qilindi. /start buyrug'ini bosing.");
}

export async function handleText(ctx, prisma) {
  const from = ctx.from;
  if (!from) return;

  const session = getSession(from.id);
  if (!session) return;

  const text = ctx.message?.text?.trim();
  if (!text) return;

  if (session.step === "name") {
    if (text.length < 3) {
      await ctx.reply("Ism va familiya kamida 3 harf bo'lishi kerak.");
      return;
    }

    setSession(from.id, {
      ...session,
      step: "phone",
      fullName: text,
    });

    await ctx.reply("Telefon raqamingizni yuboring:", phoneRequestKeyboard());
    return;
  }

  if (session.step === "phone") {
    const phone = normalizePhone(text);
    if (phone.length < 7) {
      await ctx.reply("Telefon raqami noto'g'ri. Qayta kiriting.");
      return;
    }

    const next = {
      ...session,
      step: "faculty",
      phone,
    };

    setSession(from.id, next);
    await ctx.reply("Rahmat!", removeKeyboard());
    await sendFacultyPrompt(ctx, prisma, next);
  }
}

export async function handleContact(ctx, prisma) {
  const from = ctx.from;
  if (!from) return;
  const session = getSession(from.id);
  if (!session || session.step !== "phone") return;

  const phone = normalizePhone(ctx.message?.contact?.phone_number ?? "");
  if (!phone || phone.length < 7) {
    await ctx.reply("Telefon raqami noto'g'ri. Qayta kiriting.");
    return;
  }

  const next = {
    ...session,
    step: "faculty",
    phone,
  };

  setSession(from.id, next);
  await ctx.reply("Rahmat!", removeKeyboard());
  await sendFacultyPrompt(ctx, prisma, next);
}

export async function handleFacultyCallback(ctx, prisma) {
  const from = ctx.from;
  if (!from) return;
  const session = getSession(from.id);
  if (!session || session.step !== "faculty") return;

  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith("faculty:")) return;

  const facultyId = Number(data.split(":")[1]);
  if (!Number.isInteger(facultyId)) return;

  const faculty = await prisma.organizer.findUnique({
    where: { id: facultyId },
    select: { id: true, name: true, type: true },
  });

  if (!faculty || faculty.type !== "FACULTY") {
    await ctx.answerCbQuery("Fakultet topilmadi", { show_alert: true });
    return;
  }

  const next = {
    ...session,
    step: "course",
    facultyOrganizerId: faculty.id,
    facultyName: faculty.name,
  };

  setSession(from.id, next);
  await ctx.answerCbQuery();

  const messageId = await editOrSend(
    ctx,
    "Kursingizni tanlang:",
    courseInlineKeyboard()
  );

  if (messageId) {
    setSession(from.id, { ...next, uiMessageId: messageId });
  }
}

export async function handleCourseCallback(ctx, prisma) {
  const from = ctx.from;
  if (!from) return;
  const session = getSession(from.id);
  if (!session || session.step !== "course") return;

  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith("course:")) return;

  const course = Number(data.split(":")[1]);
  if (!Number.isInteger(course)) return;

  await prisma.student.create({
    data: {
      telegramUserId: session.telegramUserId,
      telegramId: String(from.id),
      fullName: session.fullName,
      phone: session.phone,
      faculty: session.facultyName,
      facultyOrganizerId: session.facultyOrganizerId,
      course,
    },
  });

  clearSession(from.id);
  await ctx.answerCbQuery();

  const view = renderHome({ fullName: session.fullName });
  const messageId = await editOrSendView(ctx, view, { uiMessageId: session.uiMessageId });
  setSession(from.id, { uiMessageId: messageId });
}
