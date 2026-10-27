// lib/utils/phone.ts

/**
 * Formats a raw phone input string into the Turkish standard:
 * (5XX) XXX XX XX
 */
export function formatTurkishPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length > 2) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 10);

  if (!digits) return "";
  if (digits.length <= 3) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  if (digits.length <= 8) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
}

/**
 * Validates whether a given Turkish phone string is a complete 10-digit number
 */
export function isValidTurkishPhone(raw: string): boolean {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length > 2) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.length === 10;
}
