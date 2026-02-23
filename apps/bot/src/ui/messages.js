export function escapeHtml(input) {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function withHtml(text) {
  return { text, extra: { parse_mode: "HTML" } };
}

export function welcomeExisting(name) {
  const safeName = escapeHtml(name || "");
  return withHtml(
    `Assalomu alaykum, <b>${safeName}</b>\nEvent Manager botiga xush kelibsiz!\nQuyidagi menyudan foydalaning:`
  );
}

export function welcomeNew(name) {
  const safeName = escapeHtml(name || "");
  return withHtml(
    `Assalomu alaykum, <b>${safeName}</b>\nEvent Manager botiga xush kelibsiz!`
  );
}

export function profileMessage({ name, phone, faculty, courseText }) {
  return withHtml(
    `<b>Profil</b>\n<b>Ism:</b> ${escapeHtml(name)}\n<b>Telefon:</b> ${escapeHtml(
      phone
    )}\n<b>Fakultet:</b> ${escapeHtml(faculty)}\n<b>Kurs:</b> ${escapeHtml(
      courseText
    )}`
  );
}

export function eventsListMessage(items) {
  const lines = items.map((item, idx) => {
    return `${idx + 1}) <b>${escapeHtml(item.title)}</b>\n${escapeHtml(
      item.date
    )}  ⏳ ${escapeHtml(item.timeLeft)}`;
  });

  return withHtml(`<b>Tadbirlar</b>\n${lines.join("\n\n")}`);
}

export function eventDetailMessage({
  title,
  organizer,
  date,
  timeLeft,
  location,
  notice,
}) {
  const org = organizer ? `<b>Tashkilotchi:</b> ${escapeHtml(organizer)}\n` : "";
  const prefix = notice ? `${escapeHtml(notice)}\n\n` : "";
  return withHtml(
    `${prefix}<b>${escapeHtml(title)}</b>\n${org}<b>Vaqt:</b> ${escapeHtml(
      date
    )}\n⏳ <b>Qolgan vaqt:</b> ${escapeHtml(
      timeLeft
    )}\n<b>Manzil:</b> ${escapeHtml(location)}`
  );
}

export function reminderMessage({ title, date, timeLeft, location }) {
  return withHtml(
    `⏰ <b>Eslatma</b>\n<b>${escapeHtml(title)}</b>\n${escapeHtml(
      date
    )}  ⏳ ${escapeHtml(timeLeft)}\n${escapeHtml(
      location
    )}\n\nKela olmasangiz bekor qiling:`
  );
}
