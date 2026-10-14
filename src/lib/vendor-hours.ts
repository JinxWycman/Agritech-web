import type { OpeningHours } from "@/types/business";

const KENYA_UTC_OFFSET_MINUTES = 3 * 60;

function minutesSinceMidnight(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function isOpenNow(hours: OpeningHours, now: Date = new Date()): boolean {
  const local = new Date(now.getTime() + KENYA_UTC_OFFSET_MINUTES * 60_000);
  const weekday = local.getUTCDay();
  const minute = local.getUTCHours() * 60 + local.getUTCMinutes();

  for (const [dayText, interval] of Object.entries(hours)) {
    if (!interval) continue;
    const day = Number(dayText);
    if (!Number.isInteger(day) || day < 0 || day > 6) continue;
    const open = minutesSinceMidnight(interval.open);
    const close = minutesSinceMidnight(interval.close);
    if (open === null || close === null || open === close) continue;
    if (open < close && weekday === day && minute >= open && minute < close) return true;
    if (open > close && (weekday === day && minute >= open
      || weekday === (day + 1) % 7 && minute < close)) return true;
  }
  return false;
}
