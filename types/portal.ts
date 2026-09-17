// types/portal.ts
// ─────────────────────────────────────────────────────────────────────────────
// Strongly-typed frontend representations for the Student Self-Service Portal.
//
// These types are intentionally narrow:
//   • Only fields a student is allowed to SEE are exposed (RLS mirrors this)
//   • Advisor-internal fields (rejectionReason internals, authorId, etc.) are
//     replaced with portal-friendly equivalents
//   • All status/enum values are annotated with Turkish UI labels inline
//
// Convention: "Portal" prefix marks types for the (portal) route group only.
// ─────────────────────────────────────────────────────────────────────────────
import type {
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

// ── Portal student identity ───────────────────────────────────────────────────

export type PortalUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  program: Program;
};

// ── Portal student profile (read-only view) ───────────────────────────────────

export type PortalStudentProfile = {
  // Personal
  nationalId: string;
  dateOfBirth: Date;
  placeOfBirth: string;
  nationality: string;
  gender: string | null;
  maritalStatus: string | null;
  motherName: string | null;
  fatherName: string | null;
  // Contact
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  district: string | null;
  postalCode: string | null;
  country: string;
  // Emergency
  emergencyContactName: string | null;
  emergencyContactRelationship: string | null;
  emergencyContactPhone: string | null;
  // Passport
  passportNumber: string | null;
  passportIssueDate: Date | null;
  passportExpiry: Date | null;
  passportCountry: string | null;
};

/** Form data shape the student submits when editing their profile */
export type PortalProfileEditPayload = Partial<PortalStudentProfile>;

// ── Pending approval (portal view — student perspective) ──────────────────────

/**
 * What a student sees when they have a pending change awaiting advisor review.
 * The `rejectionReason` is only populated when status = REVISION_REQUESTED.
 */
export type PortalApprovalStatus = {
  id: string;
  entityType: ApprovalEntityType;
  status: ApprovalStatus;
  /** Turkish-language feedback from the advisor when revision was requested. */
  rejectionReason: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
};

// ── Document (portal view) ────────────────────────────────────────────────────

export type PortalDocument = {
  id: string;
  type: DocumentType;
  /** Original filename shown to the student */
  fileName: string;
  /** Supabase Storage public or signed URL */
  fileUrl: string;
  verificationStatus: VerificationStatus;
  /** Advisor feedback shown only when REVISION_REQUESTED */
  rejectionReason: string | null;
  expiryDate: Date | null;
  uploadedAt: Date;
};

/** Form data shape for a portal document upload */
export type PortalDocumentUploadPayload = {
  type: DocumentType;
  file: File;
  expiryDate?: Date;
  notes?: string;
};

// ── Payment & Installment (portal view) ──────────────────────────────────────

export type PortalInstallment = {
  id: string;
  sequence: number;
  amount: string;       // Decimal as string — formatted with formatCurrency()
  currency: Currency;
  dueDate: Date;
  isPaid: boolean;
  paidAt: Date | null;
};

export type PortalPayment = {
  id: string;
  description: string;
  totalAmount: string;  // Decimal as string
  currency: Currency;
  status: PaymentStatus;
  dueDate: Date | null;
  installments: PortalInstallment[];
};

// ── Program details (portal read-only) ───────────────────────────────────────

/** Shared fields all program detail views expose to the student */
export type PortalProgramBase = {
  program: Program;
  startDate: Date | null;
  endDate: Date | null;
  targetCountry: string | null;
  notes: string | null;
};

export type PortalWatDetail = PortalProgramBase & {
  program: "WORK_AND_TRAVEL";
  sponsorName: string | null;
  jobTitle: string | null;
  employerName: string | null;
  usArrivalDate: Date | null;
  visaApproved: boolean;
  insuranceProvider: string | null;
  insuranceExpiry: Date | null;
};

export type PortalAcademyDetail = PortalProgramBase & {
  program: "ACADEMY";
  targetUniversity: string | null;
  targetProgram: string | null;
  academicLevel: AcademicLevel | null;
  intakeYear: number | null;
  intakeSeason: string | null;
  ieltsOverall: string | null;
  toeflTotal: number | null;
  applicationStatus: string | null;
};

export type PortalLanguageDetail = PortalProgramBase & {
  program: "LANGUAGE_SCHOOL";
  schoolName: string | null;
  courseType: string | null;
  weeksDuration: number | null;
  accommodationType: string | null;
  currentLanguageLevel: string | null;
};

export type PortalSummerCampDetail = PortalProgramBase & {
  program: "SUMMER_CAMP";
  campName: string | null;
  programType: string | null;
  ageGroup: string | null;
  flightArranged: boolean;
  airportTransfer: boolean;
};

export type PortalVisaDetail = PortalProgramBase & {
  program: "VISA_CONSULTING";
  visaType: VisaType;
  destinationCountry: string;
  appointmentDate: Date | null;
  decisionStatus: string | null;
};

export type PortalProgramDetail =
  | PortalWatDetail
  | PortalAcademyDetail
  | PortalLanguageDetail
  | PortalSummerCampDetail
  | PortalVisaDetail;

// ── Progress stepper ──────────────────────────────────────────────────────────

export type PortalStep = {
  key: string;
  /** Turkish label shown in the stepper UI */
  label: string;
  isComplete: boolean;
  isLocked: boolean;
  href: string;
};

// ── Full portal dashboard payload ────────────────────────────────────────────

/** Everything the /anasayfa dashboard needs, returned by a single server query */
export type PortalDashboard = {
  user: PortalUser;
  profile: PortalStudentProfile | null;
  programDetail: PortalProgramDetail | null;
  pendingApprovals: PortalApprovalStatus[];
  recentDocuments: PortalDocument[];
  upcomingInstallments: PortalInstallment[];
  steps: PortalStep[];
};

// ── Turkish UI label maps ─────────────────────────────────────────────────────

export const PORTAL_VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  PENDING: "İnceleniyor",
  APPROVED: "Onaylandı",
  REVISION_REQUESTED: "Düzeltme Gerekiyor",
} as const;

export const PORTAL_APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  PENDING: "İnceleme Bekliyor",
  APPROVED: "Onaylandı",
  REVISION_REQUESTED: "Revize İstendi",
} as const;

export const PORTAL_PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Beklemede",
  PARTIALLY_PAID: "Kısmi Ödendi",
  PAID: "Ödendi",
  OVERDUE: "Gecikmiş",
  CANCELLED: "İptal Edildi",
} as const;

export const PORTAL_PROGRAM_LABELS: Record<Program, string> = {
  WORK_AND_TRAVEL: "Work & Travel",
  ACADEMY: "Akademi",
  LANGUAGE_SCHOOL: "Dil Okulu",
  SUMMER_CAMP: "Yaz Okulu",
  VISA_CONSULTING: "Vize Danışmanlığı",
} as const;

export const PORTAL_DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
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
