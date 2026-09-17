import type { Program } from "@prisma/client";

export const SLUG_TO_PROGRAM: Record<string, Program> = {
  wat: "WORK_AND_TRAVEL",
  academy: "ACADEMY",
  language: "LANGUAGE_SCHOOL",
  "summer-camp": "SUMMER_CAMP",
  visa: "VISA_CONSULTING",
};

export const PROGRAM_TO_SLUG: Record<Program, string> = {
  WORK_AND_TRAVEL: "wat",
  ACADEMY: "academy",
  LANGUAGE_SCHOOL: "language",
  SUMMER_CAMP: "summer-camp",
  VISA_CONSULTING: "visa",
};

export const PROGRAM_TITLES: Record<string, string> = {
  wat: "Work and Travel (WAT)",
  academy: "Akademi (Lisans & Yüksek Lisans)",
  language: "Dil Okulları & Dil Eğitimi",
  "summer-camp": "Yaz Okulları & Gençlik Kampları",
  visa: "Vize Başvuruları & Danışmanlık",
};

export function getProgramFromSlug(slug: string): Program | null {
  return SLUG_TO_PROGRAM[slug] || null;
}
