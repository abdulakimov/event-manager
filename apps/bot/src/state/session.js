const sessions = new Map();

export function getSession(telegramId) {
  return sessions.get(String(telegramId)) || null;
}

export function setSession(telegramId, data) {
  sessions.set(String(telegramId), data);
}

export function clearSession(telegramId) {
  sessions.delete(String(telegramId));
}
