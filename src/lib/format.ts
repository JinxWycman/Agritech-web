export type Locale = string;
const localeTag = (locale: Locale) => locale === "sw" ? "sw-KE" : "en-KE";

export function formatKes(value: number, locale: Locale): string {
  return new Intl.NumberFormat(localeTag(locale), { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);
}

export function formatDate(value: string | number | Date, locale: Locale, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "medium", timeZone: "UTC", ...options }).format(new Date(value));
}

export function formatDateTime(value: string | number | Date, locale: Locale, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "medium", timeStyle: "short", timeZone: "UTC", ...options }).format(new Date(value));
}

export function formatNumber(value: number, locale: Locale, options: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat(localeTag(locale), options).format(value);
}

// Legacy admin screens still consume these locale-default formatters.
export function kes(value: number | string | null | undefined): string {
  const amount = typeof value === "string" ? Number(value) : value;
  if (amount == null || !Number.isFinite(amount)) return "—";
  return `KSh ${new Intl.NumberFormat("en-KE").format(amount)}`;
}

export function when(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function humanize(value: string | null | undefined): string {
  return value ? value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "—";
}

export function statusTone(status: string | null | undefined) {
  if (!status) return "zinc";
  if (["paid", "active", "completed", "success"].includes(status.toLowerCase())) return "green";
  if (["failed", "cancelled", "error"].includes(status.toLowerCase())) return "red";
  return "amber";
}
