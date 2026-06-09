/** Format a number as Thai Baht, e.g. 1250 -> "฿1,250". */
export function formatBaht(amount: number): string {
  return `฿${amount.toLocaleString("th-TH")}`;
}

/** Format an ISO-ish date string into a short Thai date, e.g. "8 มิ.ย. 2569". */
export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format an ISO-ish date string into a friendly Thai date-time. */
export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
