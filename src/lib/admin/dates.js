// Date helpers pinned to Bangladesh time, so "today" and "this month" mean the
// same thing for the owner no matter where the server is hosted.
const TIME_ZONE = 'Asia/Dhaka';

export function todayInDhaka() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date()); // YYYY-MM-DD
}

export function startOfMonthInDhaka() {
  return `${todayInDhaka().slice(0, 8)}01`;
}

// Calendar arithmetic on a YYYY-MM-DD string.
export function shiftDate(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// "14 Oct, 2:34 pm"
export function formatOrderDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: TIME_ZONE,
  }).format(date);
}

// YYYY-MM-DD -> "14 Oct 2026"
export function formatLedgerDate(isoDate) {
  if (!isoDate) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T12:00:00Z`));
}

export function formatToday() {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: TIME_ZONE,
  }).format(new Date());
}
