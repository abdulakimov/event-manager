import { getSession, setSession, clearSession } from "../state/session.js";
import {
  courseInlineKeyboard,
  facultyInlineKeyboard,
  phoneRequestKeyboard,
  removeKeyboard,
  profileEditMenuKeyboard,
  profileResetKeyboard,
} from "../ui/keyboards.js";
import { editOrSendView, renderProfile } from "../ui/views.js";

async function getStudentForCtx(ctx, prisma) {
  const from = ctx.from;
  if (!from) return null;

  const telegramUser = await prisma.telegramUser.findUnique({
    where: { telegramId: BigInt(from.id) },
  });
  if (!telegramUser) return null;

  const student = await prisma.student.findUnique({
    where: { telegramUserId: telegramUser.id },
    include: { facultyOrganizer: true },
  });

  return { student, telegramUser };
}

export async function showProfile(ctx, prisma) {
  const result = await getStudentForCtx(ctx, prisma);
  if (!result || !result.student) {
    await ctx.reply("Avval ro'yxatdan o'ting");
    return;
  }

  const view = renderProfile(result.student);
  const session = getSession(ctx.from.id) || {};
  const messageId = await editOrSendView(ctx, view, session);
  setSession(ctx.from.id, { ...session, uiMessageId: messageId });
}

export async function showProfileMenu(ctx) {
  const session = getSession(ctx.from.id) || {};
  const view = {
    text: "Ma'lumotlarni o'zgartirish",
    extra: {
      parse_mode: "HTML",
      reply_markup: profileEditMenuKeyboard().reply_markup,
    },
  };

  const messageId = await editOrSendView(ctx, view, session);
  setSession(ctx.from.id, { ...session, uiMessageId: messageId });
}

export async function startEditName(ctx, prisma) {
  const result = await getStudentForCtx(ctx, prisma);
  if (!result || !result.student) {
    await ctx.reply("Avval ro'yxatdan o'ting");
    return;
  }

  setSession(ctx.from.id, { mode: "edit:name" });
  const session = getSession(ctx.from.id) || {};
  await editOrSendView(
    ctx,
    { text: "Yangi ism va familiyangizni yuboring", extra: { parse_mode: "HTML" } },
    session
  );
}

export async function startEditPhone(ctx, prisma) {
  const result = await getStudentForCtx(ctx, prisma);
  if (!result || !result.student) {
    await ctx.reply("Avval ro'yxatdan o'ting");
    return;
  }

  setSession(ctx.from.id, { mode: "edit:phone" });
  const session = getSession(ctx.from.id) || {};
  await editOrSendView(
    ctx,
    { text: "Telefon raqamingizni yuboring:", extra: { parse_mode: "HTML" } },
    session
  );
  await ctx.reply("Telefon raqamini yuboring", phoneRequestKeyboard());
}

export async function startEditFaculty(ctx, prisma) {
  const result = await getStudentForCtx(ctx, prisma);
  if (!result || !result.student) {
    await ctx.reply("Avval ro'yxatdan o'ting");
    return;
  }

  const faculties = await prisma.organizer.findMany({
    where: { type: "FACULTY" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  if (faculties.length === 0) {
    await ctx.reply("Hozircha fakultetlar yo'q.");
    return;
  }

  setSession(ctx.from.id, { mode: "edit:faculty" });
  const session = getSession(ctx.from.id) || {};
  await editOrSendView(
    ctx,
    { text: "Fakultetingizni tanlang:", extra: facultyInlineKeyboard(faculties) },
    session
  );
}

export async function startEditCourse(ctx, prisma) {
  const result = await getStudentForCtx(ctx, prisma);
  if (!result || !result.student) {
    await ctx.reply("Avval ro'yxatdan o'ting");
    return;
  }

  setSession(ctx.from.id, { mode: "edit:course" });
  const session = getSession(ctx.from.id) || {};
  await editOrSendView(
    ctx,
    { text: "Kursingizni tanlang:", extra: courseInlineKeyboard() },
    session
  );
}

export async function handleProfileFacultyCallback(ctx, prisma) {
  const session = getSession(ctx.from.id);
  if (!session || session.mode !== "edit:faculty") return false;

  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith("faculty:")) return false;

  const facultyId = Number(data.split(":")[1]);
  if (!Number.isInteger(facultyId)) return false;

  const faculty = await prisma.organizer.findUnique({
    where: { id: facultyId },
    select: { id: true, name: true, type: true },
  });

  if (!faculty || faculty.type !== "FACULTY") {
    await ctx.answerCbQuery("Fakultet topilmadi", { show_alert: true });
    return true;
  }

  const result = await getStudentForCtx(ctx, prisma);
  if (!result || !result.student) return true;

  await prisma.student.update({
    where: { id: result.student.id },
    data: {
      facultyOrganizerId: faculty.id,
      faculty: faculty.name,
    },
  });

  clearSession(ctx.from.id);
  await ctx.answerCbQuery("Yangilandi ✅");
  await showProfile(ctx, prisma);
  return true;
}

export async function handleProfileCourseCallback(ctx, prisma) {
  const session = getSession(ctx.from.id);
  if (!session || session.mode !== "edit:course") return false;

  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith("course:")) return false;

  const course = Number(data.split(":")[1]);
  if (!Number.isInteger(course)) return false;

  const result = await getStudentForCtx(ctx, prisma);
  if (!result || !result.student) return true;

  await prisma.student.update({
    where: { id: result.student.id },
    data: { course },
  });

  clearSession(ctx.from.id);
  await ctx.answerCbQuery("Yangilandi ✅");
  await showProfile(ctx, prisma);
  return true;
}

export async function showResetConfirm(ctx) {
  const session = getSession(ctx.from.id) || {};
  const view = {
    text: "⚠️ Rostdan ham ma'lumotlarni o'chirmoqchimisiz?",
    extra: {
      parse_mode: "HTML",
      reply_markup: profileResetKeyboard().reply_markup,
    },
  };
  const messageId = await editOrSendView(ctx, view, session);
  setSession(ctx.from.id, { ...session, uiMessageId: messageId });
}

export async function handleResetConfirm(ctx, prisma) {
  const result = await getStudentForCtx(ctx, prisma);
  if (!result || !result.student) return;

  await prisma.student.delete({ where: { id: result.student.id } });
  clearSession(ctx.from.id);

  await ctx.answerCbQuery();

  const view = {
    text: "Ism va familiyangizni kiriting:",
    extra: { parse_mode: "HTML" },
  };
  const messageId = await editOrSendView(ctx, view, getSession(ctx.from.id));

  setSession(ctx.from.id, {
    step: "name",
    telegramUserId: result.telegramUser.id,
    uiMessageId: messageId,
  });
}

export async function handleResetCancel(ctx, prisma) {
  await ctx.answerCbQuery();
  await showProfile(ctx, prisma);
}

export async function handleProfileEditText(ctx, prisma) {
  const session = getSession(ctx.from.id);
  if (!session || !session.mode) return false;

  const text = ctx.message?.text?.trim();
  if (!text) return false;

  const result = await getStudentForCtx(ctx, prisma);
  if (!result || !result.student) return true;

  if (session.mode === "edit:name") {
    if (text.length < 3) {
      await ctx.reply("Ism va familiya kamida 3 harf bo'lishi kerak.");
      return true;
    }
    await prisma.student.update({
      where: { id: result.student.id },
      data: { fullName: text },
    });
    clearSession(ctx.from.id);
    await showProfile(ctx, prisma);
    return true;
  }

  if (session.mode === "edit:phone") {
    const phone = text.replace(/[^0-9+]/g, "");
    if (phone.length < 7) {
      await ctx.reply("Telefon raqami noto'g'ri. Qayta kiriting.");
      return true;
    }
    await prisma.student.update({
      where: { id: result.student.id },
      data: { phone },
    });
    clearSession(ctx.from.id);
    await ctx.reply("Rahmat!", removeKeyboard());
    await showProfile(ctx, prisma);
    return true;
  }

  return false;
}

export async function handleProfileEditContact(ctx, prisma) {
  const session = getSession(ctx.from.id);
  if (!session || session.mode !== "edit:phone") return false;

  const phone = ctx.message?.contact?.phone_number ?? "";
  if (!phone || phone.length < 7) {
    await ctx.reply("Telefon raqami noto'g'ri. Qayta kiriting.");
    return true;
  }

  const result = await getStudentForCtx(ctx, prisma);
  if (!result || !result.student) return true;

  await prisma.student.update({
    where: { id: result.student.id },
    data: { phone },
  });

  clearSession(ctx.from.id);
  await ctx.reply("Rahmat!", removeKeyboard());
  await showProfile(ctx, prisma);
  return true;
}
