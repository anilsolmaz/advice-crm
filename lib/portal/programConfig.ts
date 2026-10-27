// lib/portal/programConfig.ts
import type { DocumentType, Program } from "@prisma/client";
import type { ProgramStepItem } from "@/components/portal/dashboard/ProgramStepperWizard";

export interface RequiredDocConfig {
  type: DocumentType;
  label: string;
  description?: string;
}

/**
 * Program-specific required document lists.
 * Ensures each program (WAT, Academy, Language School, Summer Camp, Visa)
 * tracks its own real required documents.
 */
export const PROGRAM_REQUIRED_DOCS: Record<Program, RequiredDocConfig[]> = {
  WORK_AND_TRAVEL: [
    { type: "DS_2019", label: "DS-2019 Formu" },
    { type: "CV", label: "İngilizce CV" },
    { type: "CRIMINAL_RECORD", label: "Adli Sicil Kaydı" },
    { type: "CONTRACT", label: "Sözleşme" },
    { type: "SEVIS_RECEIPT", label: "SEVIS Makbuzu" },
    { type: "HEALTH_INSURANCE", label: "Sağlık Sigortası" },
    { type: "PASSPORT", label: "Pasaport" },
    { type: "JOB_OFFER", label: "İş Teklifi" },
    { type: "TRANSCRIPT", label: "Transkript" },
    { type: "STUDENT_CERTIFICATE", label: "Öğrenci Belgesi" },
  ],
  ACADEMY: [
    { type: "PASSPORT", label: "Pasaport" },
    { type: "TRANSCRIPT", label: "Akademik Transkript" },
    { type: "DIPLOMA", label: "Diploma / Mezuniyet" },
    { type: "CV", label: "Akademik CV" },
    { type: "REFERENCE_LETTER", label: "Referans & Niyet Mektubu" },
    { type: "LANGUAGE_SCORE_REPORT", label: "Dil Belgesi (IELTS/TOEFL)" },
    { type: "BANK_STATEMENT", label: "Banka Sponsor Dökümü" },
    { type: "CONTRACT", label: "Danışmanlık Sözleşmesi" },
  ],
  LANGUAGE_SCHOOL: [
    { type: "PASSPORT", label: "Pasaport" },
    { type: "CONTRACT", label: "Kayıt Sözleşmesi" },
    { type: "SPONSOR_LETTER", label: "Sponsor / Kabul Belgesi" },
    { type: "BANK_STATEMENT", label: "Banka Hesap Dökümü" },
    { type: "VISA_APPLICATION_FORM", label: "Vize Başvuru Formu" },
    { type: "HEALTH_INSURANCE", label: "Seyahat Sağlık Sigortası" },
    { type: "STUDENT_CERTIFICATE", label: "Öğrenci / Mezuniyet Belgesi" },
  ],
  SUMMER_CAMP: [
    { type: "PASSPORT", label: "Pasaport" },
    { type: "SPONSOR_LETTER", label: "Veli Muvafakatnamesi" },
    { type: "CONTRACT", label: "Kayıt Sözleşmesi" },
    { type: "HEALTH_INSURANCE", label: "Seyahat Sağlık Sigortası" },
    { type: "STUDENT_CERTIFICATE", label: "Öğrenci Belgesi" },
    { type: "VISA_APPLICATION_FORM", label: "Vize Başvuru Formu" },
  ],
  VISA_CONSULTING: [
    { type: "PASSPORT", label: "Pasaport" },
    { type: "VISA_APPLICATION_FORM", label: "Vize Başvuru Formu" },
    { type: "BANK_STATEMENT", label: "Banka Hesap Dökümü" },
    { type: "HEALTH_INSURANCE", label: "Seyahat Sağlık Sigortası" },
    { type: "PHOTO", label: "Biyometrik Fotoğraf" },
    { type: "SPONSOR_LETTER", label: "Sponsor / Dilekçe Mektubu" },
  ],
};

/**
 * Dynamically calculates the student's progress steps based on their program AND real DB state
 * (documents uploaded/approved, job offers accepted, installments paid, DS-160/visa status).
 */
export function buildProgramSteps(student: any): ProgramStepItem[] {
  const program: Program = student.program;
  const docs: any[] = student.documents || [];
  const docTypes = new Set(docs.map((d) => d.type));
  const approvedDocTypes = new Set(
    docs.filter((d) => d.verificationStatus === "APPROVED").map((d) => d.type),
  );

  const allInstallments: any[] = (student.payments || []).flatMap(
    (p: any) => p.installments || [],
  );
  const hasPaidAll =
    allInstallments.length > 0 && allInstallments.every((i) => i.isPaid);

  if (program === "WORK_AND_TRAVEL") {
    const wat = student.watDetail;
    const stageOrder = [
      "PRE_REGISTRATION",
      "JOB_SELECTION",
      "JOB_PLACEMENT",
      "PAYMENT_COMPLETED",
      "VISA_APPOINTMENT",
      "VISA_APPROVED",
      "ORIENTATION",
      "DEPARTURE",
    ];
    const manualIdx = Math.max(
      0,
      stageOrder.indexOf(wat?.currentStage || "PRE_REGISTRATION"),
    );

    const hasContract = docTypes.has("CONTRACT") || manualIdx >= 1;
    const hasJobAssigned =
      (student.watJobAssignments || []).length > 0 ||
      Boolean(wat?.jobTitle) ||
      manualIdx >= 2;
    const hasJobPlaced =
      (student.watJobAssignments || []).some(
        (a: any) => a.status === "ACCEPTED",
      ) ||
      Boolean(wat?.employerName && wat?.jobTitle) ||
      docTypes.has("JOB_OFFER") ||
      manualIdx >= 3;
    const isPaymentDone = hasPaidAll || manualIdx >= 4;
    const hasVisaAppt =
      wat?.ds160Status === "COMPLETED" ||
      wat?.ds160Status === "SUBMITTED" ||
      Boolean(wat?.visaAppointmentDate) ||
      manualIdx >= 5;
    const isVisaApproved = Boolean(wat?.visaApproved) || manualIdx >= 6;
    const isOrientationDone =
      Boolean(wat?.orientationCompleted) || manualIdx >= 7;
    const isDeparted = wat?.currentStage === "DEPARTURE";

    const completionFlags = [
      hasContract,
      hasJobAssigned,
      hasJobPlaced,
      isPaymentDone,
      hasVisaAppt,
      isVisaApproved,
      isOrientationDone,
      isDeparted,
    ];

    // Current step is the first incomplete step (or last step if all complete)
    let currentIdx = completionFlags.findIndex((c) => !c);
    if (currentIdx === -1) currentIdx = 7;
    if (manualIdx > currentIdx) currentIdx = manualIdx;

    const labels = [
      { label: "Ön Kayıt", desc: "Sözleşme ve ön kayıt tamamlandı" },
      { label: "İş Seçimi", desc: "İş havuzu ve teklif inceleme" },
      { label: "İş Yerleşimi", desc: "İş teklifi onayı ve DS-2019 süreci" },
      { label: "Ücret Tamamlandı", desc: "Program ödemesi kapandı" },
      { label: "Vize Randevusu", desc: "DS-160 formu ve vize randevusu" },
      { label: "Vize Onayı", desc: "J-1 vizesi onaylandı" },
      { label: "Oryantasyon", desc: "Uçuş öncesi bilgilendirme" },
      { label: "Amerika'ya Gidiş", desc: "Uçuş ve programa başlangıç" },
    ];

    return labels.map((item, idx) => ({
      id: idx + 1,
      label: item.label,
      description: item.desc,
      isCompleted: idx < currentIdx || completionFlags[idx],
      isCurrent: idx === currentIdx,
    }));
  }

  if (program === "LANGUAGE_SCHOOL") {
    const ld = student.languageDetail;
    const flags = [
      Boolean(ld?.agreementsDone) || docTypes.has("CONTRACT"),
      Boolean(ld?.agreementsSignedDone) || approvedDocTypes.has("CONTRACT"),
      Boolean(ld?.grossInvoiceDone),
      Boolean(ld?.netInvoiceDone) || hasPaidAll,
      Boolean(ld?.letterOfAcceptanceDone) || docTypes.has("SPONSOR_LETTER"),
    ];
    let currentIdx = flags.findIndex((c) => !c);
    if (currentIdx === -1) currentIdx = 4;

    const labels = [
      { label: "Sözleşme Hazırlığı", desc: "Okul kayıt formu ve anlaşma" },
      { label: "İmzalı Sözleşme", desc: "Öğrenci ve okul imzası" },
      { label: "Okul Faturası", desc: "Gross Invoice oluşturuldu" },
      { label: "Ödeme & Tahsilat", desc: "Okul ödemesi tamamlandı" },
      { label: "Kabul Mektubu", desc: "Resmi kabul belgesi ve vize" },
    ];

    return labels.map((item, idx) => ({
      id: idx + 1,
      label: item.label,
      description: item.desc,
      isCompleted: flags[idx] || idx < currentIdx,
      isCurrent: idx === currentIdx,
    }));
  }

  if (program === "ACADEMY") {
    const apps: any[] = student.academicApplications || [];
    const hasApp = apps.length > 0;
    const hasSent = apps.some((a) => a.status !== "PREPARING");
    const hasOffer =
      apps.some((a) => a.status.includes("OFFER") || a.status === "ENROLLED") ||
      docTypes.has("REFERENCE_LETTER");
    const hasEnrolled = apps.some((a) => a.status === "ENROLLED");

    const flags = [
      docTypes.has("PASSPORT") || docTypes.has("TRANSCRIPT"),
      hasApp,
      hasSent,
      hasOffer,
      hasPaidAll,
      hasEnrolled,
    ];
    let currentIdx = flags.findIndex((c) => !c);
    if (currentIdx === -1) currentIdx = 5;

    const labels = [
      { label: "Akademik Evraklar", desc: "Transkript, CV ve dil belgesi" },
      { label: "Üniversite Seçimi", desc: "Başvuru listesi oluşturuldu" },
      { label: "Başvuru Gönderimi", desc: "Üniversitelere başvuru yapıldı" },
      { label: "Kabul Mektubu", desc: "Üniversite kabul mektubu geldi" },
      { label: "Harç & Ödeme", desc: "Depozito ve danışmanlık ödemesi" },
      { label: "Vize & Kayıt", desc: "Öğrenci vizesi ve kesin kayıt" },
    ];

    return labels.map((item, idx) => ({
      id: idx + 1,
      label: item.label,
      description: item.desc,
      isCompleted: flags[idx] || idx < currentIdx,
      isCurrent: idx === currentIdx,
    }));
  }

  if (program === "SUMMER_CAMP") {
    const sc = student.summerCampDetail;
    const flags = [
      docTypes.has("CONTRACT") || docTypes.has("PASSPORT"),
      docTypes.has("SPONSOR_LETTER"),
      hasPaidAll,
      Boolean(sc?.visaAppointmentDate) || sc?.visaStatus === "APPROVED",
      sc?.visaStatus === "APPROVED",
    ];
    let currentIdx = flags.findIndex((c) => !c);
    if (currentIdx === -1) currentIdx = 4;

    const labels = [
      { label: "Kayıt & Grup Tahsisi", desc: "Kamp merkezi ve tarih seçimi" },
      { label: "Veli Muvafakatnamesi", desc: "Noter onaylı veli izin belgesi" },
      { label: "Ödeme Tamamlandı", desc: "Kamp paket ödemesi" },
      { label: "Vize Başvurusu", desc: "UKVI / Schengen vize randevusu" },
      { label: "Vize Onayı & Uçuş", desc: "Grup uçuşu ve kampa katılım" },
    ];

    return labels.map((item, idx) => ({
      id: idx + 1,
      label: item.label,
      description: item.desc,
      isCompleted: flags[idx] || idx < currentIdx,
      isCurrent: idx === currentIdx,
    }));
  }

  // VISA_CONSULTING default
  const vd = student.visaDetail;
  const flags = [
    docTypes.has("PASSPORT"),
    docTypes.has("VISA_APPLICATION_FORM") && docTypes.has("BANK_STATEMENT"),
    hasPaidAll,
    Boolean(vd?.appointmentDate),
    vd?.decisionStatus === "APPROVED",
  ];
  let currentIdx = flags.findIndex((c) => !c);
  if (currentIdx === -1) currentIdx = 4;

  const labels = [
    { label: "Dosya Açılışı", desc: "Pasaport ve vize türü belirleme" },
    { label: "Evrak Hazırlığı", desc: "Banka, sigorta ve başvuru formu" },
    { label: "Harç & Ücret", desc: "Konsolosluk ve danışmanlık ücreti" },
    { label: "Konsolosluk Randevusu", desc: "Biyometri ve mülakat" },
    { label: "Vize Sonucu", desc: "Pasaport teslimi ve vize onayı" },
  ];

  return labels.map((item, idx) => ({
    id: idx + 1,
    label: item.label,
    description: item.desc,
    isCompleted: flags[idx] || idx < currentIdx,
    isCurrent: idx === currentIdx,
  }));
}
