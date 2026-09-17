// lib/utils/approval.ts
// Centralized labels and human-friendly Turkish formatting for approval diff views.
import { formatDate, formatDateTime } from "./date";

export const APPROVAL_FIELD_LABELS: Record<string, string> = {
  // Kimlik & Kişisel Bilgiler
  nationalId: "T.C. Kimlik Numarası",
  dateOfBirth: "Doğum Tarihi",
  placeOfBirth: "Doğum Yeri",
  nationality: "Uyruk",
  gender: "Cinsiyet",
  maritalStatus: "Medeni Durum",
  motherName: "Anne Adı",
  fatherName: "Baba Adı",

  // İletişim & Adres
  addressLine1: "Açık Adres",
  addressLine2: "Adres (Devam)",
  city: "Şehir",
  district: "İlçe",
  postalCode: "Posta Kodu",
  country: "Ülke",

  // Acil Durum İletişimi
  emergencyContactName: "Acil Durum Kişisi",
  emergencyContactRelationship: "Yakınlık Derecesi",
  emergencyContactPhone: "Acil Durum Telefonu",

  // Pasaport Detayları
  passportNumber: "Pasaport Numarası",
  passportIssueDate: "Pasaport Veriliş Tarihi",
  passportExpiry: "Pasaport Geçerlilik Tarihi",
  passportCountry: "Pasaport Veren Ülke",

  // Akademik Bilgiler
  highSchoolName: "Lise Adı",
  highSchoolGpa: "Lise Not Ortalaması",
  universityName: "Üniversite",
  universityGpa: "Üniversite Not Ortalaması (GPA)",
  academicLevel: "Akademik Seviye",
  fieldOfStudy: "Bölüm",

  // WAT Operasyonel Detaylar
  sponsorName: "Sponsor Kuruluş",
  sponsorDsNumber: "DS-2019 Numarası",
  jobTitle: "İş / Pozisyon",
  employerName: "İşveren Kurum",
  employerState: "Eyalet (State)",
  jobStartDate: "İş Başlangıç Tarihi",
  jobEndDate: "İş Bitiş Tarihi",
  usArrivalDate: "ABD Varış Tarihi",
  usDepartureDate: "ABD Ayrılış Tarihi",
  visaInterviewDate: "Vize Randevu Tarihi",
  visaApproved: "Vize Onay Durumu",
  sevisId: "SEVIS ID",
  insurancePolicyNo: "Sigorta Poliçe No",
  insuranceProvider: "Sigorta Şirketi",
  insuranceExpiry: "Sigorta Bitiş Tarihi",

  // Akademi
  targetCountry: "Hedef Ülke",
  targetUniversity: "Hedef Üniversite",
  targetProgram: "Hedef Program",
  intakeYear: "Başvuru Yılı",
  intakeSeason: "Başvuru Dönemi",

  // Evrak Bilgileri
  type: "Belge Türü",
  fileName: "Dosya Adı",
  fileUrl: "Dosya Bağlantısı",
  documentType: "Belge Türü",
  notes: "Açıklama / Notlar",
};

const DATE_FIELD_KEYS = new Set([
  "dateOfBirth",
  "passportIssueDate",
  "passportExpiry",
  "jobStartDate",
  "jobEndDate",
  "usArrivalDate",
  "usDepartureDate",
  "visaInterviewDate",
  "insuranceExpiry",
  "createdAt",
  "updatedAt",
  "convertedAt",
  "reviewedAt",
]);

/**
 * Checks whether a value represents an ISO date or standard YYYY-MM-DD string.
 */
function isIsoDateString(val: string): boolean {
  if (typeof val !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z?)?$/.test(val.trim());
}

/**
 * Formats any raw diff value (especially ISO timestamps, booleans, enums) into
 * a natural, human-friendly Turkish representation for approval screens.
 */
export function formatApprovalValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";

  const str = String(value).trim();
  if (str === "" || str === "null" || str === "undefined") return "—";

  // Boolean values
  if (typeof value === "boolean") {
    return value ? "Evet (Onaylandı)" : "Hayır (Bekliyor)";
  }

  // Dates: explicitly recognized keys or matching ISO timestamps
  if (DATE_FIELD_KEYS.has(key) || isIsoDateString(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      // Midnight timestamps (e.g. 2029-08-20T00:00:00.000Z) or date-only strings
      // represent pure calendar dates — format in UTC to avoid time-zone day shifts.
      if (str.includes("T00:00:00") || !str.includes("T")) {
        return formatDate(d, {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        });
      }
      return formatDateTime(d);
    }
  }

  // Coded enum-like fields
  if (key === "gender") {
    if (str.toUpperCase() === "MALE" || str.toUpperCase() === "ERKEK") return "Erkek";
    if (str.toUpperCase() === "FEMALE" || str.toUpperCase() === "KADIN") return "Kadın";
  }

  if (key === "maritalStatus") {
    if (str.toUpperCase() === "SINGLE" || str.toUpperCase() === "BEKAR") return "Bekar";
    if (str.toUpperCase() === "MARRIED" || str.toUpperCase() === "EVLI") return "Evli";
  }

  return str;
}
