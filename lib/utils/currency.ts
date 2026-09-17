// lib/utils/currency.ts
// ─────────────────────────────────────────────────────────────────────────────
// Currency formatting for the CRM and portal UIs.
// Default locale is tr-TR (Turkish number formatting).
// Decimal values from Prisma arrive as strings — parse before formatting.
// ─────────────────────────────────────────────────────────────────────────────
import type { Currency } from "@prisma/client";

const CURRENCY_LOCALE_MAP: Record<Currency, string> = {
  TRY: "tr-TR",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
};

/**
 * Formats a monetary amount with the correct locale and currency symbol.
 *
 * @param amount    Number or string (Prisma Decimal) to format.
 * @param currency  One of: TRY | USD | EUR | GBP
 * @returns         e.g. "1.500,00 ₺" | "$2,500.00" | "1.200,00 €"
 */
export function formatCurrency(
  amount: number | string,
  currency: Currency,
): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(value)) return "—";

  return new Intl.NumberFormat(CURRENCY_LOCALE_MAP[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Returns whether an installment due date has passed and the installment
 * is not yet paid — used for OVERDUE badge logic.
 */
export function isOverdue(dueDate: Date, isPaid: boolean): boolean {
  if (isPaid) return false;
  return dueDate < new Date();
}
