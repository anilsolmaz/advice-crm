// lib/utils/date.ts
// ─────────────────────────────────────────────────────────────────────────────
// Date formatting helpers — defaults to Turkish locale (tr-TR).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats a date for display in the Turkish UI.
 * @example formatDate(new Date()) → "10 Eylül 2026"
 */
export function formatDate(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
  locale = "tr-TR",
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Short date format: "10.09.2026"
 */
export function formatDateShort(date: Date | string | null | undefined): string {
  return formatDate(date, { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Date + time: "10 Eylül 2026, 15:30"
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  return formatDate(date, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Returns number of days until a future date (negative if past).
 */
export function daysUntil(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = d.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Re-exported from currency.ts for convenience.
 * Returns true if an installment is unpaid and past its due date.
 */
export { isOverdue } from "@/lib/utils/currency";
