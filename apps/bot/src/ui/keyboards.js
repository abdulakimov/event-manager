import { Markup } from "telegraf";

export function phoneRequestKeyboard() {
  return Markup.keyboard([
    [Markup.button.contactRequest("Telefon raqamini yuborish")],
  ])
    .resize()
    .oneTime(true);
}

export function removeKeyboard() {
  return Markup.removeKeyboard();
}

export function facultyInlineKeyboard(faculties) {
  return Markup.inlineKeyboard(
    faculties.map((f) => [
      Markup.button.callback(f.name, `faculty:${f.id}`),
    ])
  );
}

export function courseInlineKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("1", "course:1"),
      Markup.button.callback("2", "course:2"),
      Markup.button.callback("3", "course:3"),
      Markup.button.callback("4", "course:4"),
      Markup.button.callback("5", "course:5"),
    ],
  ]);
}

export function reminderKeyboard(eventId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback("❌ Qatnasholmayman", `cancel:${eventId}`)],
    [Markup.button.callback("📌 Tadbirni ko'rish", `event:${eventId}`)],
  ]);
}

export function profileEditMenuKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("✏️ Ism", "profile:edit:name")],
    [Markup.button.callback("📞 Telefon", "profile:edit:phone")],
    [Markup.button.callback("🏛 Fakultet", "profile:edit:faculty")],
    [Markup.button.callback("🎓 Kurs", "profile:edit:course")],
    [Markup.button.callback("🗑 Ma'lumotlarni o'chirish", "profile:reset")],
    [Markup.button.callback("⬅️ Orqaga", "profile:back")],
  ]);
}

export function profileResetKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("Ha, o'chirish", "profile:reset:confirm")],
    [Markup.button.callback("Bekor", "profile:reset:cancel")],
  ]);
}
