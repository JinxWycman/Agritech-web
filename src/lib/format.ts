export function kes(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const amount = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(amount)) return String(value);
  return `KES ${amount.toLocaleString("en-KE")}`;
}

export function when(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function humanize(value: string | null | undefined): string {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function statusTone(status: string | null | undefined): string {
  const key = (status || "").toLowerCase();
  if (["paid", "completed", "live", "yes", "available"].includes(key)) return "green";
  if (["active"].includes(key)) return "green";
  if (key === "accepted") return "blue";
  if (["pending", "processing"].includes(key)) return "amber";
  if (["failed", "cancelled", "expired", "inactive", "off", "no"].includes(key)) return "red";
  return "zinc";
}
