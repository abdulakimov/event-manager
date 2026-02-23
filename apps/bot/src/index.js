import "dotenv/config";
import { Telegraf } from "telegraf";
import { prisma } from "./db.js";
import {
  handleCancel,
  handleContact,
  handleCourseCallback,
  handleFacultyCallback,
  handleStart,
  handleText,
} from "./flows/onboarding.js";
import {
  cancelRegistration,
  showEventsList,
  showEventDetail,
  registerForEvent,
} from "./flows/events.js";
import {
  handleProfileCourseCallback,
  handleProfileEditContact,
  handleProfileEditText,
  handleProfileFacultyCallback,
  handleResetCancel,
  handleResetConfirm,
  showProfile,
  showProfileMenu,
  showResetConfirm,
  startEditCourse,
  startEditFaculty,
  startEditName,
  startEditPhone,
} from "./flows/profile.js";
import { startReminderWorker } from "./jobs/reminders.js";
import { editOrSendView, renderHome } from "./ui/views.js";
import { getSession, setSession } from "./state/session.js";

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error("BOT_TOKEN is required");
}

const bot = new Telegraf(token);

async function showHome(ctx) {
  const from = ctx.from;
  if (!from) return;

  const telegramUser = await prisma.telegramUser.findUnique({
    where: { telegramId: BigInt(from.id) },
  });
  if (!telegramUser) {
    await ctx.reply("Avval /start ni bosing");
    return;
  }

  const student = await prisma.student.findUnique({
    where: { telegramUserId: telegramUser.id },
  });
  if (!student) {
    await ctx.reply("Avval ro'yxatdan o'ting");
    return;
  }

  const view = renderHome(student);
  const session = getSession(from.id) || {};
  const messageId = await editOrSendView(ctx, view, session);
  setSession(from.id, { ...session, uiMessageId: messageId });
}

bot.start((ctx) => handleStart(ctx, prisma));

bot.command("cancel", async (ctx) => {
  await handleCancel(ctx);
});

bot.command("ping", async (ctx) => {
  const count = await prisma.telegramUser.count();
  await ctx.reply(`pong (users: ${count})`);
});

bot.on("contact", async (ctx) => {
  const handled = await handleProfileEditContact(ctx, prisma);
  if (handled) return;
  await handleContact(ctx, prisma);
});

bot.on("text", async (ctx, next) => {
  const handled = await handleProfileEditText(ctx, prisma);
  if (handled) return;
  await handleText(ctx, prisma);
  if (typeof next === "function") {
    return next();
  }
});

bot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery?.data ?? "";

  if (data === "nav:home") {
    await ctx.answerCbQuery();
    await showHome(ctx);
    return;
  }
  if (data === "nav:profile") {
    await ctx.answerCbQuery();
    await showProfile(ctx, prisma);
    return;
  }
  if (data === "nav:events") {
    await ctx.answerCbQuery();
    await showEventsList(ctx, prisma);
    return;
  }

  if (data === "profile:menu") {
    await ctx.answerCbQuery();
    await showProfileMenu(ctx);
    return;
  }
  if (data === "profile:back") {
    await ctx.answerCbQuery();
    await showHome(ctx);
    return;
  }
  if (data === "profile:edit:name") {
    await ctx.answerCbQuery();
    await startEditName(ctx, prisma);
    return;
  }
  if (data === "profile:edit:phone") {
    await ctx.answerCbQuery();
    await startEditPhone(ctx, prisma);
    return;
  }
  if (data === "profile:edit:faculty") {
    await ctx.answerCbQuery();
    await startEditFaculty(ctx, prisma);
    return;
  }
  if (data === "profile:edit:course") {
    await ctx.answerCbQuery();
    await startEditCourse(ctx, prisma);
    return;
  }
  if (data === "profile:reset") {
    await ctx.answerCbQuery();
    await showResetConfirm(ctx);
    return;
  }
  if (data === "profile:reset:confirm") {
    await handleResetConfirm(ctx, prisma);
    return;
  }
  if (data === "profile:reset:cancel") {
    await handleResetCancel(ctx, prisma);
    return;
  }

  if (data.startsWith("faculty:")) {
    const handled = await handleProfileFacultyCallback(ctx, prisma);
    if (handled) return;
    await handleFacultyCallback(ctx, prisma);
    return;
  }
  if (data.startsWith("course:")) {
    const handled = await handleProfileCourseCallback(ctx, prisma);
    if (handled) return;
    await handleCourseCallback(ctx, prisma);
    return;
  }
  if (data.startsWith("event:")) {
    const eventId = data.split(":")[1];
    await showEventDetail(ctx, prisma, eventId);
    return;
  }
  if (data.startsWith("reg:")) {
    const eventId = data.split(":")[1];
    await registerForEvent(ctx, prisma, eventId);
    return;
  }
  if (data.startsWith("cancel:")) {
    const eventId = data.split(":")[1];
    await cancelRegistration(ctx, prisma, eventId);
    return;
  }
  if (data === "events:back") {
    await showHome(ctx);
    return;
  }
  if (data === "events:refresh") {
    await showEventsList(ctx, prisma);
    return;
  }
});

bot.launch().then(() => {
  console.log("Bot started");
  startReminderWorker(bot, prisma);
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
