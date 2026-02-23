import { Markup } from "telegraf";
import { escapeHtml, profileMessage, eventsListMessage, eventDetailMessage } from "./messages.js";

export function renderHome(student) {
  const name = student?.fullName ? `<b>${escapeHtml(student.fullName)}</b>` : "";
  const text = name
    ? `<b>Kabinet</b>\n${name}\n\nKerakli bo'limni tanlang:`
    : `<b>Kabinet</b>\nKerakli bo'limni tanlang:`;

  return {
    text,
    extra: {
      parse_mode: "HTML",
      reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.callback("🎫 Tadbirlar", "nav:events"),
          Markup.button.callback("👤 Profil", "nav:profile"),
        ],
      ]).reply_markup,
    },
  };
}

export function renderProfile(student) {
  const courseText = student.course === 5 ? "Sirtqi" : String(student.course);
  const facultyName = student.facultyOrganizer?.name ?? student.faculty ?? "—";
  const { text, extra } = profileMessage({
    name: student.fullName,
    phone: student.phone ?? "—",
    faculty: facultyName,
    courseText,
  });

  return {
    text,
    extra: {
      ...extra,
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("✏️ Ma'lumotlarni o'zgartirish", "profile:menu")],
        [Markup.button.callback("⬅️ Orqaga", "nav:home")],
      ]).reply_markup,
    },
  };
}

export function renderEventsList(items) {
  const { text, extra } = eventsListMessage(items);
  const rows = items.map((e) => [
    Markup.button.callback(e.shortTitle, `event:${e.id}`),
  ]);
  rows.push([
    Markup.button.callback("🔄 Yangilash", "events:refresh"),
    Markup.button.callback("⬅️ Orqaga", "nav:home"),
  ]);

  return {
    text,
    extra: {
      ...extra,
      reply_markup: Markup.inlineKeyboard(rows).reply_markup,
    },
  };
}

export function renderEventsEmpty() {
  return {
    text: "Hozircha tadbirlar yo'q.",
    extra: {
      parse_mode: "HTML",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅️ Orqaga", "nav:home")],
      ]).reply_markup,
    },
  };
}

export function renderEventDetail(detail, registrationStatus, notice) {
  const { text, extra } = eventDetailMessage({
    ...detail,
    notice,
  });

  let actionLabel = "✅ Ro'yxatdan o'tish";
  let actionCallback = `reg:${detail.id}`;

  if (registrationStatus === "ACTIVE") {
    actionLabel = "❌ Qatnasholmayman";
    actionCallback = `cancel:${detail.id}`;
  } else if (registrationStatus === "CANCELED") {
    actionLabel = "✅ Qayta ro'yxatdan o'tish";
    actionCallback = `reg:${detail.id}`;
  }

  return {
    text,
    extra: {
      ...extra,
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback(actionLabel, actionCallback)],
        [Markup.button.callback("⬅️ Orqaga", "nav:events")],
      ]).reply_markup,
    },
  };
}

export async function editOrSendView(ctx, view, session, allowFallback = true) {
  const chatId = ctx.chat?.id ?? ctx.from?.id;

  try {
    if (ctx.callbackQuery?.message?.message_id) {
      await ctx.editMessageText(view.text, view.extra);
      return ctx.callbackQuery.message.message_id;
    }
  } catch (e) {
    if (!allowFallback) return null;
  }

  if (!allowFallback) return null;

  if (chatId && session?.uiMessageId) {
    try {
      await ctx.telegram.editMessageText(
        chatId,
        session.uiMessageId,
        undefined,
        view.text,
        view.extra
      );
      return session.uiMessageId;
    } catch (e) {
      // fallback
    }
  }

  const message = await ctx.reply(view.text, view.extra);
  return message.message_id;
}
