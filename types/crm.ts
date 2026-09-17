// types/crm.ts
// ─────────────────────────────────────────────────────────────────────────────
// Strongly-typed frontend representations for the Staff / Advisor (CRM) portal.
//
// These types are derived from Prisma models but shaped for UI consumption:
//   • Null fields use explicit `| null` (not optional ?) for exhaustive rendering
//   • Nested relations are inlined where always needed for a given view
//   • Monetary amounts remain Decimal-compatible (string) to preserve precision
//
// Convention: "CRM" prefix marks types intended for the (crm) route group only.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  Role,
  LeadStatus,
  LeadSource,
  Program,
  ApprovalStatus,
  ApprovalEntityType,
  DocumentType,
  VerificationStatus,
  Currency,
  PaymentStatus,
  AcademicLevel,
  VisaType,
} from "@prisma/client";

// ── Re-export enums so CRM components import from a single location ───────────

export type {
  Role,
  LeadStatus,
  LeadSource,
  Program,
  ApprovalStatus,
  ApprovalEntityType,
  DocumentType,
  VerificationStatus,
  Currency,
  PaymentStatus,
  AcademicLevel,
  VisaType,
};

// ── User ──────────────────────────────────────────────────────────────────────

export type CRMUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: Role;
  isActive: boolean;
  createdAt: Date;
};

// ── Lead ─────────────────────────────────────────────────────────────────────

export type CRMLead = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  program: Program;
  notes: string | null;
  advisorId: string | null;
  advisor: Pick<CRMUser, "id" | "fullName" | "avatarUrl"> | null;
  convertedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Subset used in the leads table view (avoids over-fetching) */
export type CRMLeadRow = Pick<
  CRMLead,
  "id" | "fullName" | "email" | "phone" | "status" | "program" | "source" | "advisorId" | "createdAt"
>;

// ── Student ───────────────────────────────────────────────────────────────────

export type CRMStudentRow = {
  id: string;
  fullName: string;
  email: string;
  program: Program;
  isActive: boolean;
  advisorId: string | null;
  advisorName: string | null;
  createdAt: Date;
};

export type CRMStudentDetail = {
  id: string;
  userId: string;
  leadId: string | null;
  advisorId: string | null;
  program: Program;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: CRMUser;
  profile: CRMStudentProfile | null;
};

// ── Student Profile ───────────────────────────────────────────────────────────

export type CRMStudentProfile = {
  id: string;
  studentId: string;
  nationalId: string;
  dateOfBirth: Date;
  placeOfBirth: string;
  nationality: string;
  gender: string | null;
  maritalStatus: string | null;
  motherName: string | null;
  fatherName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  district: string | null;
  postalCode: string | null;
  country: string;
  emergencyContactName: string | null;
  emergencyContactRelationship: string | null;
  emergencyContactPhone: string | null;
  passportNumber: string | null;
  passportIssueDate: Date | null;
  passportExpiry: Date | null;
  passportCountry: string | null;
  highSchoolName: string | null;
  highSchoolGpa: string | null;   // Decimal serialized as string
  universityName: string | null;
  universityGpa: string | null;   // Decimal serialized as string
  academicLevel: AcademicLevel | null;
  fieldOfStudy: string | null;
  updatedAt: Date;
};

// ── Program Details ───────────────────────────────────────────────────────────

export type CRMWatDetail = {
  id: string;
  studentId: string;
  sponsorName: string | null;
  sponsorDsNumber: string | null;
  jobTitle: string | null;
  employerName: string | null;
  employerState: string | null;
  jobStartDate: Date | null;
  jobEndDate: Date | null;
  usArrivalDate: Date | null;
  usDepartureDate: Date | null;
  visaInterviewDate: Date | null;
  visaApproved: boolean;
  sevisId: string | null;
  insurancePolicyNo: string | null;
  insuranceProvider: string | null;
  insuranceExpiry: Date | null;
  notes: string | null;
  updatedAt: Date;
};

export type CRMAcademyDetail = {
  id: string;
  studentId: string;
  targetCountry: string | null;
  targetUniversity: string | null;
  targetProgram: string | null;
  academicLevel: AcademicLevel | null;
  intakeYear: number | null;
  intakeSeason: string | null;
  highSchoolGpa: string | null;
  highSchoolSystem: string | null;
  universityGpa: string | null;
  ieltsOverall: string | null;
  ieltsListening: string | null;
  ieltsReading: string | null;
  ieltsWriting: string | null;
  ieltsSpeaking: string | null;
  ieltsTestDate: Date | null;
  ieltsExpiryDate: Date | null;
  toeflTotal: number | null;
  toeflReading: number | null;
  toeflListening: number | null;
  toeflSpeaking: number | null;
  toeflWriting: number | null;
  toeflTestDate: Date | null;
  toeflExpiryDate: Date | null;
  duolingoScore: number | null;
  satScore: number | null;
  greScore: number | null;
  gmatScore: number | null;
  applicationStatus: string | null;
  offerLetterUrl: string | null;
  notes: string | null;
  updatedAt: Date;
};

// ── Pending Approval (CRM advisor view) ──────────────────────────────────────

export type CRMPendingApproval = {
  id: string;
  studentId: string;
  studentName: string;
  entityType: ApprovalEntityType;
  entityId: string | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown>;
  status: ApprovalStatus;
  rejectionReason: string | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
};

// ── Document ──────────────────────────────────────────────────────────────────

export type CRMDocument = {
  id: string;
  studentId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number | null;
  mimeType: string | null;
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
  uploadedByStudent: boolean;
  expiryDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ── Payment & Installment ─────────────────────────────────────────────────────

export type CRMInstallment = {
  id: string;
  paymentId: string;
  sequence: number;
  amount: string;     // Decimal as string
  currency: Currency;
  dueDate: Date;
  isPaid: boolean;
  paidAt: Date | null;
  paidAmount: string | null;
  receiptUrl: string | null;
  notes: string | null;
};

export type CRMPayment = {
  id: string;
  studentId: string;
  description: string;
  totalAmount: string;  // Decimal as string
  currency: Currency;
  status: PaymentStatus;
  dueDate: Date | null;
  notes: string | null;
  createdAt: Date;
  installments: CRMInstallment[];
};

// ── Advisor Note ──────────────────────────────────────────────────────────────

export type CRMAdvisorNote = {
  id: string;
  studentId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  note: string;
  isPinned: boolean;
  createdAt: Date;
};

// ── Program-specific union (for type-narrowing in program tab) ────────────────

export type CRMProgramDetail =
  | { program: "WORK_AND_TRAVEL"; detail: CRMWatDetail | null }
  | { program: "ACADEMY"; detail: CRMAcademyDetail | null }
  | { program: "LANGUAGE_SCHOOL"; detail: CRMLanguageDetail | null }
  | { program: "SUMMER_CAMP"; detail: CRMSummerCampDetail | null }
  | { program: "VISA_CONSULTING"; detail: CRMVisaDetail | null };

export type CRMLanguageDetail = {
  id: string;
  studentId: string;
  targetCountry: string | null;
  targetCity: string | null;
  schoolName: string | null;
  courseType: string | null;
  startDate: Date | null;
  endDate: Date | null;
  weeksDuration: number | null;
  accommodationType: string | null;
  currentLanguageLevel: string | null;
  notes: string | null;
  updatedAt: Date;
};

export type CRMSummerCampDetail = {
  id: string;
  studentId: string;
  targetCountry: string | null;
  campName: string | null;
  campProvider: string | null;
  programType: string | null;
  startDate: Date | null;
  endDate: Date | null;
  ageGroup: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  flightArranged: boolean;
  airportTransfer: boolean;
  notes: string | null;
  updatedAt: Date;
};

export type CRMVisaDetail = {
  id: string;
  studentId: string;
  visaType: VisaType;
  destinationCountry: string;
  targetConsulate: string | null;
  applicationDate: Date | null;
  appointmentDate: Date | null;
  decisionDate: Date | null;
  decisionStatus: string | null;
  rejectionReason: string | null;
  reapplicationPlanned: boolean;
  travelInsuranceExpiry: Date | null;
  itineraryReady: boolean;
  notes: string | null;
  updatedAt: Date;
};

// ── Turkish display labels ────────────────────────────────────────────────────

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  INTERESTED: "İlgileniyor",
  CONSIDERING_NEXT_YEAR: "Gelecek Yıl Düşünüyor",
  UNINTERESTED: "İlgilenmiyor",
  NOT_CONSIDERING: "Değerlendirmiyor",
  REGISTERED: "Kayıtlı",
} as const;

export const PROGRAM_LABELS: Record<Program, string> = {
  WORK_AND_TRAVEL: "Work & Travel",
  ACADEMY: "Akademi",
  LANGUAGE_SCHOOL: "Dil Okulu",
  SUMMER_CAMP: "Yaz Okulu",
  VISA_CONSULTING: "Vize Danışmanlığı",
} as const;

export const PROGRAM_STYLES: Record<
  Program,
  {
    badge: string;
    badgeSolid: string;
    text: string;
    border: string;
    bg: string;
    dot: string;
  }
> = {
  WORK_AND_TRAVEL: {
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    badgeSolid: "bg-blue-600 text-white",
    text: "text-blue-600",
    border: "border-blue-200",
    bg: "bg-blue-50",
    dot: "bg-blue-500",
  },
  ACADEMY: {
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    badgeSolid: "bg-purple-600 text-white",
    text: "text-purple-600",
    border: "border-purple-200",
    bg: "bg-purple-50",
    dot: "bg-purple-500",
  },
  LANGUAGE_SCHOOL: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeSolid: "bg-emerald-600 text-white",
    text: "text-emerald-600",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
  },
  SUMMER_CAMP: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    badgeSolid: "bg-amber-600 text-white",
    text: "text-amber-600",
    border: "border-amber-200",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
  },
  VISA_CONSULTING: {
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    badgeSolid: "bg-rose-600 text-white",
    text: "text-rose-600",
    border: "border-rose-200",
    bg: "bg-rose-50",
    dot: "bg-rose-500",
  },
} as const;

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WEBSITE: "Web Sitesi",
  SOCIAL_MEDIA: "Sosyal Medya",
  REFERRAL: "Referans",
  FAIR: "Fuar",
  PHONE: "Telefon",
  WALK_IN: "Ofise Geldi",
  OTHER: "Diğer",
} as const;

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  PASSPORT: "Pasaport",
  NATIONAL_ID: "TC Kimlik Kartı",
  TRANSCRIPT: "Transkript",
  DIPLOMA: "Diploma",
  LANGUAGE_SCORE_REPORT: "Dil Sınavı Sonuç Belgesi",
  BANK_STATEMENT: "Banka Dökümü",
  PHOTO: "Fotoğraf",
  VISA_APPLICATION_FORM: "Vize Başvuru Formu",
  SPONSOR_LETTER: "Sponsor Mektubu",
  HEALTH_INSURANCE: "Sağlık Sigortası",
  REFERENCE_LETTER: "Referans Mektubu",
  OTHER: "Diğer",
} as const;

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Beklemede",
  PARTIALLY_PAID: "Kısmi Ödendi",
  PAID: "Ödendi",
  OVERDUE: "Gecikmiş",
  CANCELLED: "İptal",
} as const;

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  TRY: "₺",
  USD: "$",
  EUR: "€",
  GBP: "£",
} as const;

export const ACADEMIC_LEVEL_LABELS: Record<AcademicLevel, string> = {
  HIGH_SCHOOL: "Lise",
  UNDERGRADUATE: "Lisans",
  MASTERS: "Yüksek Lisans",
  PHD: "Doktora",
} as const;
