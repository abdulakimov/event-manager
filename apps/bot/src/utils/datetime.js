export function formatDateTime(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export function timeLeftText(date) {
  const target = new Date(date);
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return "Tugagan";

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days >= 2) return `${days} kun qoldi`;
  if (hours >= 1) return `${hours} soat qoldi`;
  if (minutes >= 1) return `${minutes} daqiqa qoldi`;
  return "Hozir boshlanadi";
}
