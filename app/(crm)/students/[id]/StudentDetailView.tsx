"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  GraduationCap,
  Plane,
  CreditCard,
  FileText,
  MessageSquare,
  Printer,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Plus,
  ShieldCheck,
  Languages,
  Sun,
  Stamp,
  Home,
  HeartPulse,
  AtSign,
  DollarSign,
  Link2,
  Trash2,
} from "lucide-react";
import type { Program } from "@prisma/client";
import { DOCUMENT_TYPE_LABELS, PROGRAM_LABELS } from "@/types/crm";
import { ProgramBadge } from "@/components/crm/common/ProgramBadge";
import { EmailComposeModal } from "@/components/crm/common/EmailComposeModal";
import { GenderAvatar } from "@/components/crm/common/GenderAvatar";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import {
  toggleInstallmentPaid,
  advanceWatStep,
  updateWatDetail,
  reviewStudentDocument,
  uploadDocumentByAdvisor,
  createStudentPaymentPlan,
  enrollExistingStudentInNewProgram,
} from "@/actions/crm/students";
import { createStudentJobLink } from "@/actions/crm/jobs";
import { createAdvisorNote } from "@/actions/crm/notes";
import {
  createAcademicApplication,
  updateAcademicApplication,
  deleteAcademicApplication,
  updateLanguageStages,
} from "@/actions/crm/schools";
import { recordWatAccommodationSale } from "@/actions/crm/accounting";
import { useFormState, useFormStatus } from "react-dom";

function NoteSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-1.5 rounded-xl bg-[#0f172a] px-4 py-2 text-xs font-bold text-white hover:bg-[#1e3a8a] disabled:opacity-50 transition-colors"
    >
      <Send className="h-3.5 w-3.5 text-sky-400" />
      {pending ? "Gönderiliyor…" : "Not / @Mention Gönder"}
    </button>
  );
}

interface Props {
  student: any;
  siblingEnrollments?: {
    id: string;
    program: Program;
    termYear: number;
    enrollmentLabel: string | null;
    isActive: boolean;
  }[];
  staffList?: { id: string; fullName: string }[];
  availableWatJobs?: {
    id: string;
    sponsor: string;
    jobTitle: string;
    location: string;
    hourlyWage: string;
  }[];
}

export function StudentDetailView({
  student,
  siblingEnrollments = [],
  staffList = [],
  availableWatJobs = [],
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    | "personal"
    | "program"
    | "applications"
    | "payments"
    | "documents"
    | "notes"
    | "logs"
  >("notes");
  const [isPending, startTransition] = useTransition();
  const [noteText, setNoteText] = useState("");
  const [noteTitle, setNoteTitle] = useState("Görüşme Notu");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showNewProgramModal, setShowNewProgramModal] = useState(false);
  const [newProgramForm, setNewProgramForm] = useState({
    program: "LANGUAGE_SCHOOL" as Program,
    termYear: 2026,
    enrollmentLabel: "",
  });

  // Editable WAT Placement & Visa State
  const [watForm, setWatForm] = useState({
    sponsorName: student.watDetail?.sponsorName || "AWA",
    sponsorDsNumber: student.watDetail?.sponsorDsNumber || "",
    sevisId: student.watDetail?.sevisId || "",
    employerName: student.watDetail?.employerName || "",
    jobTitle: student.watDetail?.jobTitle || "",
    employerState: student.watDetail?.employerState || "",
    currentStage: student.watDetail?.currentStage || "PRE_REGISTRATION",
    passportDeadline: student.watDetail?.passportDeadline
      ? new Date(student.watDetail.passportDeadline).toISOString().slice(0, 10)
      : "2026-03-15",
    visaDeadline: student.watDetail?.visaDeadline
      ? new Date(student.watDetail.visaDeadline).toISOString().slice(0, 10)
      : "2026-04-20",
    visaApproved: Boolean(student.watDetail?.visaApproved),
  });
  const [selectedJobPoolId, setSelectedJobPoolId] = useState(
    availableWatJobs[0]?.id || "",
  );
  const [watSavedMsg, setWatSavedMsg] = useState<string | null>(null);

  // Advisor New Payment Plan State
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);
  const [newPaymentForm, setNewPaymentForm] = useState({
    description: "Program Kayıt & Danışmanlık Bedeli",
    totalAmount: "3200",
    currency: "USD" as "USD" | "EUR" | "GBP" | "TRY",
    installmentCount: 3,
    firstDueDate: new Date().toISOString().slice(0, 10),
  });

  // Advisor Document Upload State
  const [advisorDocType, setAdvisorDocType] = useState("DS_2019");
  const [advisorDocFile, setAdvisorDocFile] = useState<File | null>(null);
  const [isUploadingAdvisorDoc, setIsUploadingAdvisorDoc] = useState(false);

  // WAT Accommodation Commission state
  const [accSold, setAccSold] = useState<boolean>(
    !!student.watDetail?.accommodationSold,
  );
  const [accComm, setAccComm] = useState<string>(
    student.watDetail?.accommodationCommission
      ? String(student.watDetail.accommodationCommission)
      : "250",
  );

  // Language 5-Stage state
  const ld = student.languageDetail;
  const [langStages, setLangStages] = useState({
    agreementsDone: !!ld?.agreementsDone,
    agreementsDate: ld?.agreementsDate
      ? new Date(ld.agreementsDate).toISOString().slice(0, 10)
      : "",
    agreementsSignedDone: !!ld?.agreementsSignedDone,
    agreementsSignedDate: ld?.agreementsSignedDate
      ? new Date(ld.agreementsSignedDate).toISOString().slice(0, 10)
      : "",
    grossInvoiceDone: !!ld?.grossInvoiceDone,
    grossInvoiceDate: ld?.grossInvoiceDate
      ? new Date(ld.grossInvoiceDate).toISOString().slice(0, 10)
      : "",
    grossInvoiceAmount: ld?.grossInvoiceAmount
      ? String(ld.grossInvoiceAmount)
      : "3600",
    netInvoiceDone: !!ld?.netInvoiceDone,
    netInvoiceDate: ld?.netInvoiceDate
      ? new Date(ld.netInvoiceDate).toISOString().slice(0, 10)
      : "",
    netInvoiceAmount: ld?.netInvoiceAmount
      ? String(ld.netInvoiceAmount)
      : "2880",
    letterOfAcceptanceDone: !!ld?.letterOfAcceptanceDone,
    letterOfAcceptanceDate: ld?.letterOfAcceptanceDate
      ? new Date(ld.letterOfAcceptanceDate).toISOString().slice(0, 10)
      : "",
  });

  // New Academic Application state
  const [newApp, setNewApp] = useState({
    institutionName: "",
    country: "Almanya",
    courseName: "",
    degree: "M.Sc.",
    intake: "Fall 2026",
    priority: 1,
    status: "PREPARING",
    applicationDeadline: "2026-07-15",
    visaDeadline: "2026-08-30",
    notes: "",
  });

  const [noteState, noteAction] = useFormState(
    createAdvisorNote.bind(null, student.id),
    { success: true },
  );

  const profile = student.profile;
  const watDetail = student.watDetail;
  const academyDetail = student.academyDetail;
  const languageDetail = student.languageDetail;
  const summerCampDetail = student.summerCampDetail;
  const visaDetail = student.visaDetail;
  const payments = student.payments;
  const documents = student.documents;
  const notes = student.advisorNotes;
  const applications = student.academicApplications || [];
  const jobAssignments = student.watJobAssignments || [];

  function handleToggleInstallment(installmentId: string, currentPaid: boolean) {
    startTransition(() => {
      toggleInstallmentPaid(installmentId, !currentPaid);
    });
  }

  function handleAdvanceWat(step: number) {
    startTransition(() => {
      advanceWatStep(student.id, step);
    });
  }

  function handleSaveWatAccommodation() {
    startTransition(async () => {
      const res = await recordWatAccommodationSale(
        student.id,
        accSold,
        accComm,
      );
      if (res.success) {
        alert(
          "WAT Konaklama satışı güncellendi ve komisyon tutarı Muhasebe tablosuna otomatik yansıtıldı.",
        );
      }
    });
  }

  function handleSaveLanguageStages() {
    startTransition(async () => {
      const res = await updateLanguageStages({
        studentId: student.id,
        ...langStages,
      });
      if (res.success) {
        alert(
          "Dil okulu 5 aşama bilgileri kaydedildi ve Gross/Net fatura komisyon farkı Muhasebe'ye aktarıldı.",
        );
      }
    });
  }

  function handleCreateApp(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createAcademicApplication({
        studentId: student.id,
        ...newApp,
      });
      if (res.success) {
        setNewApp({ ...newApp, institutionName: "", courseName: "", notes: "" });
      } else {
        alert(res.error);
      }
    });
  }

  function handleUpdateAppStatus(appId: string, status: string) {
    startTransition(async () => {
      await updateAcademicApplication(appId, { status });
    });
  }

  function handleDeleteApp(appId: string) {
    if (!confirm("Başvuru kartını silmek istediğinize emin misiniz?")) return;
    startTransition(async () => {
      await deleteAcademicApplication(appId);
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/students"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <ProgramBadge
                program={student.program as Program}
                showIcon
                size="md"
              />
              {student.groupName && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                  Grup: {student.groupName}
                </span>
              )}
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  student.isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700",
                )}
              >
                {student.isActive ? "Aktif Kayıt" : "Pasif"}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0f172a] mt-1">
              {student.user.fullName}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {student.user.phone && (
            <a
              href={`https://wa.me/90${student.user.phone.replace(/\D/g, "").replace(/^0/, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              WhatsApp&apos;tan Ulaş
            </a>
          )}

          <button
            type="button"
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#1e3a8a] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-800 transition-colors"
          >
            <Mail className="h-4 w-4 text-sky-300" />
            Mail Gönder
          </button>

          <button
            type="button"
            onClick={() => setShowNewProgramModal((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-800 shadow-sm hover:bg-indigo-100"
          >
            <Plus className="h-4 w-4 text-indigo-600" />
            Yeni Program / Dönem Ekle
          </button>

          <Link
            href={`/students/${student.id}/cv`}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <FileText className="h-4 w-4 text-blue-600" />
            Öğrenci CV / Resume
          </Link>

          <Link
            href={`/students/${student.id}/makbuz`}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <CreditCard className="h-4 w-4 text-emerald-600" />
            Tahsilat Makbuzu
          </Link>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl bg-[#0f172a] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#1e3a8a]"
          >
            <Printer className="h-4 w-4" />
            Dosyayı Yazdır
          </button>
        </div>
      </div>

      {/* ── Multi-Program / Multi-Year Switcher & New Program Enrollment Modal ── */}
      {siblingEnrollments.length > 1 && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
            <span>Bu Öğrencinin Kayıtlı Olduğu Tüm Program &amp; Dönem Dosyaları:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {siblingEnrollments.map((sib) => {
              const isCurrent = sib.id === student.id;
              return (
                <Link
                  key={sib.id}
                  href={`/students/${sib.id}`}
                  className={cn(
                    "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all",
                    isCurrent
                      ? "bg-[#0f172a] text-white shadow-xs"
                      : "border border-indigo-200 bg-white text-indigo-900 hover:bg-indigo-100",
                  )}
                >
                  {sib.enrollmentLabel ||
                    `${PROGRAM_LABELS[sib.program]} (${sib.termYear})`}
                  {isCurrent && " (Aktif Dosya)"}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {showNewProgramModal && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-indigo-950">
                {student.user.fullName} ({student.user.email}) İçin Yeni Program / Dönem Kaydı Aç
              </h3>
              <p className="text-xs text-indigo-800/80 mt-0.5">
                Öğrencinin kimlik, pasaport ve iletişim bilgileri otomatik kopyalanır; öğrenci kendi portalında &ldquo;Programım&rdquo; sekmesinde her iki programı da ayrı ayrı görebilir ve ödemelerini tek ekrandan takip edebilir.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="mb-1 block font-semibold text-slate-700">
                Yeni Program Türü
              </label>
              <select
                value={newProgramForm.program}
                onChange={(e) =>
                  setNewProgramForm({
                    ...newProgramForm,
                    program: e.target.value as Program,
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold"
              >
                <option value="LANGUAGE_SCHOOL">Dil Okulu (Language School)</option>
                <option value="WORK_AND_TRAVEL">Work and Travel</option>
                <option value="ACADEMY">Akademik Program (Üniversite/Master)</option>
                <option value="SUMMER_CAMP">Yaz Kampı (Summer School)</option>
                <option value="VISA_CONSULTING">Vize Danışmanlığı</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-slate-700">
                Başvuru / Dönem Yılı
              </label>
              <select
                value={newProgramForm.termYear}
                onChange={(e) =>
                  setNewProgramForm({
                    ...newProgramForm,
                    termYear: Number(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold"
              >
                {[2025, 2026, 2027, 2028].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr} Dönemi
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block font-semibold text-slate-700">
                Dosya Başlığı (Opsiyonel)
              </label>
              <input
                type="text"
                value={newProgramForm.enrollmentLabel}
                onChange={(e) =>
                  setNewProgramForm({
                    ...newProgramForm,
                    enrollmentLabel: e.target.value,
                  })
                }
                placeholder="Örn: Dil Okulu 2026 - Londra Kaplan veya Work & Travel 2027"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNewProgramModal(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
            >
              İptal
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const res = await enrollExistingStudentInNewProgram({
                    sourceStudentId: student.id,
                    program: newProgramForm.program as any,
                    termYear: newProgramForm.termYear,
                    enrollmentLabel: newProgramForm.enrollmentLabel,
                  });
                  if (res.success && res.newStudentId) {
                    setShowNewProgramModal(false);
                    router.push(`/students/${res.newStudentId}`);
                  } else if (!res.success) {
                    alert(res.error);
                  }
                });
              }}
              className="rounded-xl bg-[#0f172a] px-4 py-2 text-xs font-bold text-white hover:bg-[#1e3a8a]"
            >
              Yeni Program Kaydını Oluştur &amp; Dosyaya Git →
            </button>
          </div>
        </div>
      )}

      {/* ── Summary Hero Card ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4 lg:border-r border-slate-100 lg:pr-6">
          <GenderAvatar
            avatarUrl={student.user.avatarUrl}
            gender={profile?.gender}
            name={student.user.fullName}
            size="xl"
            className="ring-2 ring-slate-100 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-slate-900 truncate">
              {student.user.fullName}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Kayıt: {formatDate(student.createdAt)}
            </p>
            <p className="text-xs font-semibold text-slate-600 mt-1">
              Danışman:{" "}
              <strong className="text-[#1e3a8a]">
                {(student.advisor?.fullName || "Atanmadı").replace(
                  /\s*\(\s*Danışman\s*\)/gi,
                  "",
                )}
              </strong>
            </p>
          </div>
        </div>

        <div className="space-y-2 lg:border-r border-slate-100 lg:px-6">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Mail className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="truncate">{student.user.email}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Phone className="h-4 w-4 text-slate-400 shrink-0" />
            <span>{student.user.phone || "Telefon girilmedi"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="truncate">
              {profile?.city
                ? `${profile.city}, ${profile.country || "Türkiye"}`
                : "Adres girilmedi"}
            </span>
          </div>
        </div>

        <div className="space-y-1 lg:border-r border-slate-100 lg:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Eğitim &amp; İngilizce Profili
          </p>
          <p className="text-xs font-bold text-slate-900">
            {profile?.universityName ||
              profile?.highSchoolName ||
              "Kurum belirtilmedi"}
          </p>
          <p className="text-xs text-slate-500">
            {profile?.fieldOfStudy ? `${profile.fieldOfStudy} · ` : ""}
            GPA: {profile?.universityGpa ? String(profile.universityGpa) : "-"}
          </p>
          <p className="text-[11px] font-semibold text-blue-700">
            İngilizce: {profile?.englishProficiency || "B2 Upper-Intermediate"}
          </p>
        </div>

        <div className="space-y-1 lg:pl-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Mali Bakiye Özeti
          </p>
          {payments && payments.length > 0 ? (
            <div>
              <p className="text-lg font-bold text-slate-900">
                {String(payments[0].totalAmount)} {payments[0].currency}
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">
                {payments[0].status === "PAID"
                  ? "✓ Tüm Ödemeler Tamamlandı"
                  : "Taksitler Devam Ediyor"}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Ödeme planı yok</p>
          )}
        </div>
      </div>

      {/* ── Tab Navigation ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap border-b border-slate-200">
        <button
          onClick={() => setActiveTab("notes")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-colors",
            activeTab === "notes"
              ? "border-[#0f172a] text-[#0f172a]"
              : "border-transparent text-slate-500 hover:text-slate-900",
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Notlar &amp; İletişim ({notes?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("program")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-colors",
            activeTab === "program"
              ? "border-[#0f172a] text-[#0f172a]"
              : "border-transparent text-slate-500 hover:text-slate-900",
          )}
        >
          <Plane className="h-4 w-4" />
          Program Operasyonu &amp; Aşamalar
        </button>

        <button
          onClick={() => setActiveTab("applications")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-colors",
            activeTab === "applications"
              ? "border-[#0f172a] text-[#0f172a]"
              : "border-transparent text-slate-500 hover:text-slate-900",
          )}
        >
          <GraduationCap className="h-4 w-4" />
          Başvuru Süreçleri ({applications.length})
        </button>

        <button
          onClick={() => setActiveTab("documents")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-colors",
            activeTab === "documents"
              ? "border-[#0f172a] text-[#0f172a]"
              : "border-transparent text-slate-500 hover:text-slate-900",
          )}
        >
          <FileText className="h-4 w-4" />
          Belgeler &amp; Evrak ({documents?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-colors",
            activeTab === "payments"
              ? "border-[#0f172a] text-[#0f172a]"
              : "border-transparent text-slate-500 hover:text-slate-900",
          )}
        >
          <CreditCard className="h-4 w-4" />
          Ödemeler &amp; Muhasebe
        </button>

        <button
          onClick={() => setActiveTab("personal")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-colors",
            activeTab === "personal"
              ? "border-[#0f172a] text-[#0f172a]"
              : "border-transparent text-slate-500 hover:text-slate-900",
          )}
        >
          <User className="h-4 w-4" />
          Profil, Kimlik &amp; Eğitim
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-colors",
            activeTab === "logs"
              ? "border-[#0f172a] text-[#0f172a]"
              : "border-transparent text-slate-500 hover:text-slate-900",
          )}
        >
          <Clock className="h-4 w-4" />
          İşlem Geçmişi &amp; Loglar ({student.activityLogs?.length || 0})
        </button>
      </div>

      {/* ── 1. NOTLAR & İLETİŞİM SEKME İÇERİĞİ (Sol: Notlar, Sağ: Yeni Not & İletişim) ── */}
      {activeTab === "notes" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* SOL KOLON (7/12 — Yarıdan Geniş): SADECE Yukarıdan Aşağıya Not Kartları */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#0f172a]">
                Görüşme Detayı &amp; Danışman Notları
              </h3>
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                {notes?.length || 0} Kayıt
              </span>
            </div>

            <div className="max-h-[480px] overflow-y-auto space-y-2.5 pr-1">
              {notes && notes.length > 0 ? (
                notes.map((n: any) => {
                  const raw = String(n.note || "");
                  const bracketMatch = raw.match(/^\[([^\]]+)\]:?\s*([\s\S]*)$/);
                  const parsedTitle = bracketMatch
                    ? bracketMatch[1].trim()
                    : "Danışman Notu";
                  const parsedBody = bracketMatch
                    ? bracketMatch[2].trim() || raw
                    : raw;
                  const tLower = parsedTitle.toLowerCase();
                  const badgeCls =
                    tLower.includes("e-posta") || tLower.includes("mail")
                      ? "bg-sky-50 text-sky-700 border-sky-200"
                      : tLower.includes("vize") || tLower.includes("evrak")
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : tLower.includes("whatsapp") || tLower.includes("görüşme")
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : tLower.includes("muhasebe") || tLower.includes("taksit")
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-slate-100 text-slate-700 border-slate-200";

                  const isLog =
                    tLower.includes("log") ||
                    ((tLower.includes("mail") || tLower.includes("whatsapp")) &&
                      parsedBody.length < 90);

                  if (isLog) {
                    return (
                      <div
                        key={n.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-2xs hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="text-slate-300 font-mono text-[10px]">---</span>
                          <span className="inline-flex items-center gap-1 font-bold text-[#1e3a8a] text-[11px] shrink-0">
                            {tLower.includes("mail")
                              ? "✉️"
                              : tLower.includes("whatsapp")
                              ? "💬"
                              : "⚡"}
                            {parsedTitle}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="truncate text-slate-700 font-medium text-[11px]">
                            {parsedBody}
                          </span>
                          <span className="text-slate-300 font-mono text-[10px]">---</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-600">
                            {(n.author?.fullName || "Danışman").replace(/\s*\(\s*Danışman\s*\)/gi, "")}
                          </span>
                          <span className="tabular-nums font-mono">
                            {formatDateTime(n.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={n.id}
                      className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5 mb-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${badgeCls}`}
                          >
                            {parsedTitle}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                            <User className="h-3 w-3 text-slate-400" />
                            {(n.author?.fullName || "Danışman").replace(/\s*\(\s*Danışman\s*\)/gi, "")}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 tabular-nums">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {formatDateTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                        {parsedBody}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-slate-400">
                  <FileText className="h-6 w-6 mb-1.5 text-slate-300" />
                  <p className="text-xs font-medium">
                    Henüz kayıtlı görüşme veya danışman notu bulunmuyor.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* SAĞ KOLON (5/12): ÜSTTE YENİ NOT + ALTTA HIZLI İLETİŞİM KANALLARI */}
          <div className="lg:col-span-5 space-y-4">
            {/* 1. ÜST: Yeni Not & @Mention Ekleme Kartı */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h4 className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-[#1e3a8a]" />
                  Yeni Not / Görüşme Detayı Ekle
                </h4>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-600">
                  Not Başlığı / Türü
                </label>
                <select
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#0f172a] focus:outline-none"
                >
                  <option value="Görüşme Notu">Görüşme Notu</option>
                  <option value="Vize & Evrak Notu">Vize &amp; Evrak Notu</option>
                  <option value="WhatsApp Görüşmesi">WhatsApp Görüşmesi</option>
                  <option value="İş / Okul Yerleştirme">İş / Okul Yerleştirme</option>
                  <option value="Muhasebe & Taksit Notu">Muhasebe &amp; Taksit Notu</option>
                  <option value="Özel Not">Özel Not</option>
                </select>
              </div>

              {staffList.length > 0 && (
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400">
                    Ekip Arkadaşını Etiketle (@mention):
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    {staffList.map((st) => {
                      const firstName = st.fullName.split(" ")[0];
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() =>
                            setNoteText((prev) =>
                              `${prev} @${firstName} `.trimStart(),
                            )
                          }
                          className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#1e3a8a] hover:bg-blue-100"
                        >
                          @{firstName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <form
                action={(fd) => {
                  noteAction(fd);
                  setNoteText("");
                }}
                className="space-y-2.5"
              >
                <input type="hidden" name="noteTitle" value={noteTitle} />
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">
                    Not İçeriği
                  </label>
                  <textarea
                    name="note"
                    rows={4}
                    required
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Öğrenciyle ilgili görüşme, vize, iş teklifi veya ödeme notunu yazın…"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-[#0f172a] focus:outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <NoteSubmitButton />
                </div>
              </form>
            </div>

            {/* 2. ALT: Hızlı İletişim Kanalları (Soldan Sağa Tam Genişlik) */}
            <div className="space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Hızlı İletişim Kanalları
              </p>

              {/* WhatsApp Kartı */}
              <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-950">
                      Hızlı WhatsApp İletişimi
                    </p>
                    <p className="text-sm font-semibold text-emerald-800">
                      {student.user.phone || "Telefon girilmedi"}
                    </p>
                  </div>
                </div>
                {student.user.phone ? (
                  <a
                    href={`https://wa.me/90${student.user.phone.replace(/\D/g, "").replace(/^0/, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-xs transition-colors shrink-0"
                  >
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp&apos;ı Aç
                  </a>
                ) : null}
              </div>

              {/* E-Posta Kartı */}
              <div className="flex items-center justify-between rounded-2xl border border-sky-200 bg-sky-50/70 p-3.5 transition-all">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1e3a8a] text-white shadow-xs">
                    <Mail className="h-5 w-5 text-sky-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-sky-950">
                      E-Posta Gönderimi
                    </p>
                    <p className="text-sm font-semibold text-sky-900 truncate">
                      {student.user.email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#1e3a8a] px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-800 shadow-xs transition-colors shrink-0"
                >
                  <Mail className="h-4 w-4 text-sky-300" />
                  Mail Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. PROGRAM OPERASYONU SEKME İÇERİĞİ ─────────────────────────── */}
      {activeTab === "program" && (
        <div className="space-y-6">
          {student.program === "WORK_AND_TRAVEL" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#0f172a]">
                    Work and Travel Operasyon, İş Linki, DS-160 &amp; Konaklama Komisyonu
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sponsor: {watDetail?.sponsorName || "AWA"} · DS-2019:{" "}
                    {watDetail?.sponsorDsNumber || "Bekleniyor"} · SEVIS:{" "}
                    {watDetail?.sevisId || "Bekleniyor"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAdvanceWat(4)}
                    disabled={isPending}
                    className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    DS-2019 Geldi
                  </button>
                  <button
                    onClick={() => handleAdvanceWat(6)}
                    disabled={isPending}
                    className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Vize Onaylandı
                  </button>
                </div>
              </div>

              {/* Deadlines & DS-160 Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="rounded-xl border border-red-200 bg-red-50/40 p-4">
                  <span className="text-[10px] font-bold uppercase text-red-700 block">
                    Pasaport &amp; Vize Son Teslim Tarihi (Deadline)
                  </span>
                  <p className="mt-1 font-bold text-slate-900">
                    Pasaport Deadline:{" "}
                    {watDetail?.passportDeadline
                      ? formatDate(watDetail.passportDeadline)
                      : "15 Mart 2026"}
                  </p>
                  <p className="font-bold text-red-700 mt-0.5">
                    Vize Deadline:{" "}
                    {watDetail?.visaDeadline
                      ? formatDate(watDetail.visaDeadline)
                      : "20 Nisan 2026"}
                  </p>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                  <span className="text-[10px] font-bold uppercase text-blue-800 block">
                    DS-160 Formu Durumu
                  </span>
                  <p className="mt-1 font-black text-blue-950 text-sm">
                    {watDetail?.ds160Status === "COMPLETED"
                      ? "✓ Öğrenci Doldurdu (Tamamlandı)"
                      : watDetail?.ds160Status || "Öğrenciden Bekleniyor"}
                  </p>
                  <p className="text-slate-600 mt-0.5 font-mono">
                    Confirmation No:{" "}
                    {watDetail?.ds160ConfirmationNo || "Henüz girilmedi"}
                  </p>
                </div>

                {/* WAT Accommodation Sold & Commission (§4 & §8) */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                    WAT Konaklama Satışı &amp; Komisyon
                  </span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 font-bold text-slate-900">
                      <input
                        type="checkbox"
                        checked={accSold}
                        onChange={(e) => setAccSold(e.target.checked)}
                      />
                      <span>Konaklama Satıldı</span>
                    </label>
                    <input
                      type="number"
                      value={accComm}
                      onChange={(e) => setAccComm(e.target.value)}
                      className="w-24 rounded-lg border border-emerald-300 bg-white px-2 py-1 font-bold text-emerald-900"
                      placeholder="$ Komisyon"
                    />
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleSaveWatAccommodation}
                      className="rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800"
                    >
                      Muhasebeye Yansıt
                    </button>
                  </div>
                </div>
              </div>

              {/* Editable WAT Placement, Visa & Stage Form */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#0f172a] uppercase tracking-wider">
                    İş Yerleştirme, DS-2019, Vize &amp; Aşama Bilgilerini Düzenle
                  </h4>
                  {watSavedMsg && (
                    <span className="font-bold text-emerald-700">
                      ✓ {watSavedMsg}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="mb-1 block font-semibold text-slate-600">
                      Güncel Aşama (8 Adım)
                    </label>
                    <select
                      value={watForm.currentStage}
                      onChange={(e) =>
                        setWatForm({ ...watForm, currentStage: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-semibold"
                    >
                      <option value="PRE_REGISTRATION">1. Ön Kayıt</option>
                      <option value="JOB_SELECTION">2. İş Seçimi</option>
                      <option value="JOB_PLACEMENT">3. İş Yerleşimi</option>
                      <option value="PAYMENT_COMPLETED">4. Ücret Tamamlandı</option>
                      <option value="VISA_APPOINTMENT">5. Vize Randevusu</option>
                      <option value="VISA_APPROVED">6. Vize Onayı</option>
                      <option value="ORIENTATION">7. Oryantasyon</option>
                      <option value="DEPARTURE">8. Amerika&apos;ya Gidiş</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-slate-600">
                      Sponsor Kuruluş
                    </label>
                    <select
                      value={watForm.sponsorName}
                      onChange={(e) =>
                        setWatForm({ ...watForm, sponsorName: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
                    >
                      <option value="AWA">AWA</option>
                      <option value="UWT">UWT</option>
                      <option value="IEE">IEE</option>
                      <option value="Life Adventures">Life Adventures</option>
                      <option value="Intrax">Intrax</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-slate-600">
                      İşveren (Employer)
                    </label>
                    <input
                      type="text"
                      value={watForm.employerName}
                      onChange={(e) =>
                        setWatForm({ ...watForm, employerName: e.target.value })
                      }
                      placeholder="Örn: Wilderness Resort"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-slate-600">
                      İş Pozisyonu
                    </label>
                    <input
                      type="text"
                      value={watForm.jobTitle}
                      onChange={(e) =>
                        setWatForm({ ...watForm, jobTitle: e.target.value })
                      }
                      placeholder="Örn: Lifeguard / Server"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-slate-600">
                      ABD Eyaleti / Şehir
                    </label>
                    <input
                      type="text"
                      value={watForm.employerState}
                      onChange={(e) =>
                        setWatForm({ ...watForm, employerState: e.target.value })
                      }
                      placeholder="Örn: Wisconsin Dells, WI"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-slate-600">
                      DS-2019 Numarası
                    </label>
                    <input
                      type="text"
                      value={watForm.sponsorDsNumber}
                      onChange={(e) =>
                        setWatForm({
                          ...watForm,
                          sponsorDsNumber: e.target.value,
                        })
                      }
                      placeholder="N00..."
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-slate-600">
                      SEVIS ID
                    </label>
                    <input
                      type="text"
                      value={watForm.sevisId}
                      onChange={(e) =>
                        setWatForm({ ...watForm, sevisId: e.target.value })
                      }
                      placeholder="N00..."
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-slate-600">
                      Pasaport Deadline
                    </label>
                    <input
                      type="date"
                      value={watForm.passportDeadline}
                      onChange={(e) =>
                        setWatForm({
                          ...watForm,
                          passportDeadline: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-slate-600">
                      Vize Deadline
                    </label>
                    <input
                      type="date"
                      value={watForm.visaDeadline}
                      onChange={(e) =>
                        setWatForm({ ...watForm, visaDeadline: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
                    />
                  </div>

                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={watForm.visaApproved}
                        onChange={(e) =>
                          setWatForm({
                            ...watForm,
                            visaApproved: e.target.checked,
                          })
                        }
                      />
                      <span>Vize Onaylandı</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      startTransition(async () => {
                        const res = await updateWatDetail(student.id, {
                          sponsorName: watForm.sponsorName,
                          sponsorDsNumber: watForm.sponsorDsNumber || null,
                          sevisId: watForm.sevisId || null,
                          employerName: watForm.employerName || null,
                          jobTitle: watForm.jobTitle || null,
                          employerState: watForm.employerState || null,
                          currentStage: watForm.currentStage,
                          passportDeadline: watForm.passportDeadline
                            ? new Date(watForm.passportDeadline)
                            : null,
                          visaDeadline: watForm.visaDeadline
                            ? new Date(watForm.visaDeadline)
                            : null,
                          visaApproved: watForm.visaApproved,
                        });
                        if (res.success) {
                          setWatSavedMsg("WAT ve Vize bilgileri kaydedildi!");
                          setTimeout(() => setWatSavedMsg(null), 3000);
                        }
                      });
                    }}
                    className="rounded-xl bg-[#0f172a] px-4 py-2 text-xs font-bold text-white hover:bg-[#1e3a8a]"
                  >
                    İş &amp; Vize Bilgilerini Kaydet
                  </button>
                </div>
              </div>

              {/* Direct Job Assignment from WAT Job Pool */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-[#1e3a8a] flex items-center gap-1.5">
                      <Link2 className="h-4 w-4" />
                      İş Havuzundan Bu Öğrenciye Özel İş Teklifi Ata
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Seçtiğiniz iş öğrencinin portalına düşer; öğrenci onayladığında işveren ve aşama otomatik güncellenir.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedJobPoolId}
                      onChange={(e) => setSelectedJobPoolId(e.target.value)}
                      className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                    >
                      {availableWatJobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          [{j.sponsor}] {j.jobTitle} ({j.location}) — ${j.hourlyWage}/saat
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={isPending || !selectedJobPoolId}
                      onClick={() => {
                        startTransition(async () => {
                          const res = await createStudentJobLink(
                            selectedJobPoolId,
                            student.id,
                          );
                          if (res.success) {
                            setWatSavedMsg(
                              "İş teklifi öğrenci portalına tanımlandı ve bildirim gönderildi!",
                            );
                          }
                        });
                      }}
                      className="rounded-xl bg-[#1e3a8a] px-4 py-2 text-xs font-bold text-white hover:bg-blue-800"
                    >
                      Öğrenciye İş Teklifi Gönder
                    </button>
                  </div>
                </div>
              </div>

              {/* Assigned Student Job Links & Full History */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Link2 className="h-4 w-4 text-[#1e3a8a]" />
                    Öğrenci İş Teklifi Geçmişi (Job Offer History — {jobAssignments.length} Kayıt)
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Reddedilen, onaylanan ve bekleyen tüm teklif kayıtları
                  </span>
                </div>

                {jobAssignments.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">
                    Bu öğrenciye henüz iş teklifi atanmamış. Yukarıdaki havuzdan iş seçip gönderebilirsiniz.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {jobAssignments.map((asg: any) => (
                      <div
                        key={asg.id}
                        className={cn(
                          "flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl p-3.5 text-xs border",
                          asg.status === "ACCEPTED"
                            ? "bg-emerald-50/40 border-emerald-200"
                            : asg.status === "DECLINED"
                              ? "bg-rose-50/30 border-rose-200"
                              : "bg-slate-50 border-slate-200",
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                                asg.status === "ACCEPTED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : asg.status === "DECLINED"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800",
                              )}
                            >
                              {asg.status === "ACCEPTED"
                                ? "✓ ÖĞRENCİ ONAYLADI"
                                : asg.status === "DECLINED"
                                  ? "✕ ÖĞRENCİ REDDETTİ"
                                  : "⏳ YANIT BEKLENİYOR"}
                            </span>
                            <span className="font-bold text-slate-900">
                              [{asg.job?.sponsor}] {asg.job?.jobTitle} ({asg.job?.location})
                            </span>
                            <span className="font-semibold text-emerald-700">
                              ${String(asg.job?.hourlyWage)}/saat
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Atama Tarihi: {formatDateTime(asg.createdAt)}
                            {asg.assignedBy?.fullName && (
                              <> · Atayan: <strong>{asg.assignedBy.fullName}</strong></>
                            )}
                            {asg.respondedAt && (
                              <> · Yanıt Tarihi: <strong>{formatDateTime(asg.respondedAt)}</strong></>
                            )}
                          </p>
                          {asg.studentNote && (
                            <p className="text-xs font-semibold text-rose-900 bg-white/80 border border-rose-200/70 rounded-lg px-2.5 py-1.5 mt-1">
                              Öğrenci Yanıt Notu: &ldquo;{asg.studentNote}&rdquo;
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <a
                            href={`/job-offer/${asg.shareToken}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-[#1e3a8a] hover:bg-blue-50"
                          >
                            Teklif Sayfasını Aç →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LANGUAGE SCHOOL 5-STAGE TRACKER (§6 & §8) */}
          {(student.program === "LANGUAGE_SCHOOL" || languageDetail) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
                    <Languages className="h-5 w-5 text-emerald-600" />
                    Dil Okulu Süreç &amp; Fatura Takibi
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Agreements, Agreements Signed, Gross Invoice, Net Invoice ve Letter of Acceptance (LOA) takibi.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSaveLanguageStages}
                  className="rounded-xl bg-[#0f172a] px-4 py-2 text-xs font-bold text-white hover:bg-[#1e3a8a]"
                >
                  5 Aşamayı Kaydet &amp; Komisyonu Muhasebeye Aktar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                {/* Stage 1 */}
                <div className="rounded-xl border border-slate-200 p-3.5 space-y-2 bg-slate-50/60">
                  <label className="flex items-center gap-2 font-bold text-slate-900">
                    <input
                      type="checkbox"
                      checked={langStages.agreementsDone}
                      onChange={(e) =>
                        setLangStages({
                          ...langStages,
                          agreementsDone: e.target.checked,
                        })
                      }
                    />
                    <span>1. Agreements</span>
                  </label>
                  <input
                    type="date"
                    value={langStages.agreementsDate}
                    onChange={(e) =>
                      setLangStages({
                        ...langStages,
                        agreementsDate: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1"
                  />
                </div>

                {/* Stage 2 */}
                <div className="rounded-xl border border-slate-200 p-3.5 space-y-2 bg-slate-50/60">
                  <label className="flex items-center gap-2 font-bold text-slate-900">
                    <input
                      type="checkbox"
                      checked={langStages.agreementsSignedDone}
                      onChange={(e) =>
                        setLangStages({
                          ...langStages,
                          agreementsSignedDone: e.target.checked,
                        })
                      }
                    />
                    <span>2. Agreements Signed</span>
                  </label>
                  <input
                    type="date"
                    value={langStages.agreementsSignedDate}
                    onChange={(e) =>
                      setLangStages({
                        ...langStages,
                        agreementsSignedDate: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1"
                  />
                </div>

                {/* Stage 3: Gross Invoice */}
                <div className="rounded-xl border border-blue-200 p-3.5 space-y-2 bg-blue-50/40">
                  <label className="flex items-center gap-2 font-bold text-blue-950">
                    <input
                      type="checkbox"
                      checked={langStages.grossInvoiceDone}
                      onChange={(e) =>
                        setLangStages({
                          ...langStages,
                          grossInvoiceDone: e.target.checked,
                        })
                      }
                    />
                    <span>3. Gross Invoice (€)</span>
                  </label>
                  <input
                    type="number"
                    value={langStages.grossInvoiceAmount}
                    onChange={(e) =>
                      setLangStages({
                        ...langStages,
                        grossInvoiceAmount: e.target.value,
                      })
                    }
                    placeholder="Gross Tutar"
                    className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1 font-bold"
                  />
                  <input
                    type="date"
                    value={langStages.grossInvoiceDate}
                    onChange={(e) =>
                      setLangStages({
                        ...langStages,
                        grossInvoiceDate: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1"
                  />
                </div>

                {/* Stage 4: Net Invoice */}
                <div className="rounded-xl border border-emerald-200 p-3.5 space-y-2 bg-emerald-50/40">
                  <label className="flex items-center gap-2 font-bold text-emerald-950">
                    <input
                      type="checkbox"
                      checked={langStages.netInvoiceDone}
                      onChange={(e) =>
                        setLangStages({
                          ...langStages,
                          netInvoiceDone: e.target.checked,
                        })
                      }
                    />
                    <span>4. Net Invoice (€)</span>
                  </label>
                  <input
                    type="number"
                    value={langStages.netInvoiceAmount}
                    onChange={(e) =>
                      setLangStages({
                        ...langStages,
                        netInvoiceAmount: e.target.value,
                      })
                    }
                    placeholder="Net Tutar"
                    className="w-full rounded-lg border border-emerald-200 bg-white px-2 py-1 font-bold"
                  />
                  <input
                    type="date"
                    value={langStages.netInvoiceDate}
                    onChange={(e) =>
                      setLangStages({
                        ...langStages,
                        netInvoiceDate: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-emerald-200 bg-white px-2 py-1"
                  />
                </div>

                {/* Stage 5: Letter of Acceptance */}
                <div className="rounded-xl border border-purple-200 p-3.5 space-y-2 bg-purple-50/40">
                  <label className="flex items-center gap-2 font-bold text-purple-950">
                    <input
                      type="checkbox"
                      checked={langStages.letterOfAcceptanceDone}
                      onChange={(e) =>
                        setLangStages({
                          ...langStages,
                          letterOfAcceptanceDone: e.target.checked,
                        })
                      }
                    />
                    <span>5. Letter of Acceptance</span>
                  </label>
                  <input
                    type="date"
                    value={langStages.letterOfAcceptanceDate}
                    onChange={(e) =>
                      setLangStages({
                        ...langStages,
                        letterOfAcceptanceDate: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-purple-200 bg-white px-2 py-1"
                  />
                </div>
              </div>
            </div>
          )}

          {student.program === "SUMMER_CAMP" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
                <Sun className="h-5 w-5 text-amber-500" />
                Yaz Okulu &amp; UKVI Grup Vize Bilgileri
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="rounded-xl bg-slate-50 p-3">
                  <span className="text-slate-400 block">Kamp / Merkez</span>
                  <span className="font-bold text-slate-900">
                    {summerCampDetail?.campName || "Oxford Campus"}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <span className="text-slate-400 block">Veli Adı &amp; Tel</span>
                  <span className="font-bold text-slate-900">
                    {summerCampDetail?.guardianName || "—"} (
                    {summerCampDetail?.guardianPhone || "—"})
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <span className="text-slate-400 block">UKVI Link</span>
                  {summerCampDetail?.ukviLink ? (
                    <a
                      href={summerCampDetail.ukviLink}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-blue-700 hover:underline"
                    >
                      UKVI Başvuru Linki →
                    </a>
                  ) : (
                    <span>Belirtilmedi</span>
                  )}
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <span className="text-slate-400 block">Randevu Tarihi</span>
                  <span className="font-bold text-purple-800">
                    {summerCampDetail?.visaAppointmentDate
                      ? formatDate(summerCampDetail.visaAppointmentDate)
                      : "Bekleniyor"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 2. ACADEMIC APPLICATIONS TAB (§6) ────────────────────────────── */}
      {activeTab === "applications" && (
        <div className="space-y-6">
          {/* Application Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applications.map((app: any) => {
              const isDeadlineOverdue =
                app.applicationDeadline &&
                new Date(app.applicationDeadline) < new Date() &&
                app.status === "PREPARING";
              return (
                <div
                  key={app.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-blue-700">
                          {app.appCode}
                        </span>
                        <span className="rounded-full bg-[#0f172a] px-2.5 py-0.5 text-[10px] font-bold text-white">
                          Priority {app.priority}
                        </span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          {app.intake}
                        </span>
                      </div>
                      <h4 className="mt-1 text-base font-bold text-slate-900">
                        {app.courseName} ({app.degree})
                      </h4>
                      <p className="text-xs font-semibold text-slate-600">
                        {app.institutionName} · {app.country}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteApp(app.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Application Deadline
                      </span>
                      <span
                        className={cn(
                          "font-bold",
                          isDeadlineOverdue ? "text-red-600" : "text-slate-800",
                        )}
                      >
                        {app.applicationDeadline
                          ? formatDate(app.applicationDeadline)
                          : "—"}
                        {isDeadlineOverdue && " (OVERDUE!)"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Visa Deadline
                      </span>
                      <span className="font-bold text-slate-800">
                        {app.visaDeadline ? formatDate(app.visaDeadline) : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-500">
                      Başvuru Durumu:
                    </span>
                    <select
                      value={app.status}
                      onChange={(e) =>
                        handleUpdateAppStatus(app.id, e.target.value)
                      }
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-[#0f172a]"
                    >
                      <option value="PREPARING">Hazırlanıyor (Preparing)</option>
                      <option value="APPLIED">Başvuruldu (Applied)</option>
                      <option value="CONDITIONAL_OFFER">
                        Şartlı Kabul (Conditional Offer)
                      </option>
                      <option value="UNCONDITIONAL_OFFER">
                        Kesin Kabul (Unconditional Offer)
                      </option>
                      <option value="REJECTED">Reddedildi (Rejected)</option>
                      <option value="ENROLLED">Kayıt Tamamlandı (Enrolled)</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add New Application Form */}
          <form
            onSubmit={handleCreateApp}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 text-xs"
          >
            <h3 className="text-sm font-bold text-[#0f172a]">
              Yeni Üniversite / Okul Başvurusu (Application) Ekle
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Üniversite / Kurum Adı *
                </label>
                <input
                  type="text"
                  required
                  value={newApp.institutionName}
                  onChange={(e) =>
                    setNewApp({ ...newApp, institutionName: e.target.value })
                  }
                  placeholder="Örn: Technical University of Munich"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Bölüm / Program Adı (Course Name) *
                </label>
                <input
                  type="text"
                  required
                  value={newApp.courseName}
                  onChange={(e) =>
                    setNewApp({ ...newApp, courseName: e.target.value })
                  }
                  placeholder="Örn: M.Sc. Informatics"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Ülke (Country)
                </label>
                <input
                  type="text"
                  value={newApp.country}
                  onChange={(e) =>
                    setNewApp({ ...newApp, country: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Derece (Degree)
                </label>
                <input
                  type="text"
                  value={newApp.degree}
                  onChange={(e) =>
                    setNewApp({ ...newApp, degree: e.target.value })
                  }
                  placeholder="B.Sc. / M.Sc. / MBA"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Intake (Dönem)
                </label>
                <input
                  type="text"
                  value={newApp.intake}
                  onChange={(e) =>
                    setNewApp({ ...newApp, intake: e.target.value })
                  }
                  placeholder="Fall 2026 / Spring 2027"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Öncelik Sırası (Priority)
                </label>
                <select
                  value={newApp.priority}
                  onChange={(e) =>
                    setNewApp({ ...newApp, priority: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                >
                  <option value={1}>Priority 1 (1. Tercih)</option>
                  <option value={2}>Priority 2 (2. Tercih)</option>
                  <option value={3}>Priority 3 (3. Tercih)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Application Deadline
                </label>
                <input
                  type="date"
                  value={newApp.applicationDeadline}
                  onChange={(e) =>
                    setNewApp({
                      ...newApp,
                      applicationDeadline: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Visa Deadline
                </label>
                <input
                  type="date"
                  value={newApp.visaDeadline}
                  onChange={(e) =>
                    setNewApp({ ...newApp, visaDeadline: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-xl bg-[#0f172a] py-2.5 font-bold text-white hover:bg-[#1e3a8a]"
                >
                  + Başvuru Kartı Ekle
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── 3. PERSONAL & ACADEMIC PROFILE TAB (§6) ──────────────────────── */}
      {activeTab === "personal" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-600" />
              Akademik Profil, Mezuniyet &amp; Çalışma Deneyimi
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Mezuniyet Durumu:</span>
                <span className="font-bold text-slate-800">
                  {profile?.graduationStatus || "Son Sınıf / Mezun Adayı"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Mezuniyet Tarihi:</span>
                <span className="font-bold text-slate-800">
                  {profile?.graduationDate
                    ? formatDate(profile.graduationDate)
                    : "Haziran 2026"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Üniversite &amp; Bölüm:</span>
                <span className="font-bold text-slate-800">
                  {profile?.universityName || "-"} ({profile?.fieldOfStudy || "-"})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">GPA / Not Ortalaması:</span>
                <span className="font-bold text-slate-800">
                  {profile?.universityGpa ? String(profile.universityGpa) : "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">İngilizce Seviyesi:</span>
                <span className="font-bold text-blue-700">
                  {profile?.englishProficiency || "B2 / IELTS 6.5"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Pasaport No &amp; Bitiş:</span>
                <span className="font-bold text-slate-800">
                  {profile?.passportNumber || "-"} (
                  {profile?.passportExpiry
                    ? formatDate(profile.passportExpiry)
                    : "-"}
                  )
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-100">
                <span className="text-slate-400 block">
                  Çalışma / Staj Deneyimi (Work Experience):
                </span>
                <p className="font-medium text-slate-700 mt-0.5">
                  {profile?.workExperience ||
                    "Staj ve yarı zamanlı çalışma deneyimi mevcut."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Kimlik, Veli &amp; Acil Durum İletişimi
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">T.C. Kimlik No:</span>
                <span className="font-semibold text-slate-800">
                  {profile?.nationalId || "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Doğum Tarihi &amp; Yeri:</span>
                <span className="font-semibold text-slate-800">
                  {profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : "-"}{" "}
                  / {profile?.placeOfBirth || "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Acil Durum Kişisi:</span>
                <span className="font-semibold text-slate-800">
                  {profile?.emergencyContactName || "-"} (
                  {profile?.emergencyContactRelationship || "-"})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Acil Durum Telefon:</span>
                <span className="font-semibold text-slate-800">
                  {profile?.emergencyContactPhone || "-"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. PAYMENTS TAB ──────────────────────────────────────────────── */}
      {activeTab === "payments" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ödeme Planı ve Taksit Takibi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Öğrencinin yüklediği havale dekontları, elden ödeme bildirimleri ve taksit onayları
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowNewPaymentForm((v) => !v)}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Yeni Ödeme / Taksit Planı Ekle
              </button>
              <Link
                href="/accounting"
                className="rounded-xl bg-[#0f172a] px-3.5 py-2 text-xs font-bold text-white"
              >
                Muhasebe Modülüne Git →
              </Link>
            </div>
          </div>

          {showNewPaymentForm && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3 text-xs">
              <h4 className="font-bold text-[#1e3a8a]">
                Öğrenci İçin Yeni Ödeme &amp; Taksit Planı Oluştur
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div className="sm:col-span-2">
                  <label className="mb-1 block font-semibold text-slate-700">
                    Açıklama
                  </label>
                  <input
                    type="text"
                    value={newPaymentForm.description}
                    onChange={(e) =>
                      setNewPaymentForm({
                        ...newPaymentForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Toplam Tutar
                  </label>
                  <input
                    type="number"
                    value={newPaymentForm.totalAmount}
                    onChange={(e) =>
                      setNewPaymentForm({
                        ...newPaymentForm,
                        totalAmount: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Döviz &amp; Taksit Sayısı
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={newPaymentForm.currency}
                      onChange={(e) =>
                        setNewPaymentForm({
                          ...newPaymentForm,
                          currency: e.target.value as any,
                        })
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-bold"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="TRY">TRY</option>
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={newPaymentForm.installmentCount}
                      onChange={(e) =>
                        setNewPaymentForm({
                          ...newPaymentForm,
                          installmentCount: Number(e.target.value),
                        })
                      }
                      className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center font-bold"
                      title="Taksit Sayısı"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    İlk Taksit Vadesi
                  </label>
                  <input
                    type="date"
                    value={newPaymentForm.firstDueDate}
                    onChange={(e) =>
                      setNewPaymentForm({
                        ...newPaymentForm,
                        firstDueDate: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewPaymentForm(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600"
                >
                  İptal
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      const res = await createStudentPaymentPlan({
                        studentId: student.id,
                        description: newPaymentForm.description,
                        totalAmount: Number(newPaymentForm.totalAmount),
                        currency: newPaymentForm.currency,
                        installmentCount: newPaymentForm.installmentCount,
                        firstDueDate: newPaymentForm.firstDueDate,
                      });
                      if (res.success) {
                        setShowNewPaymentForm(false);
                      }
                    });
                  }}
                  className="rounded-lg bg-[#0f172a] px-4 py-1.5 font-bold text-white hover:bg-[#1e3a8a]"
                >
                  Ödeme Planını Oluştur
                </button>
              </div>
            </div>
          )}

          {payments && payments.length > 0 ? (
            payments.map((payment: any) => (
              <div key={payment.id} className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">
                      Açıklama
                    </p>
                    <p className="font-bold text-slate-900 text-sm">
                      {payment.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">
                      Toplam Bedel
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {String(payment.totalAmount)} {payment.currency}
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-500">
                          Taksit No
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-500">
                          Vade Tarihi
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-500">
                          Tutar
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-500">
                          Yöntem / Dekont
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-500">
                          Durum
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-500">
                          İşlem
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payment.installments.map((inst: any) => (
                        <tr key={inst.id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-bold text-slate-700">
                            #{inst.sequence}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatDate(inst.dueDate)}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {String(inst.amount)} {inst.currency}
                          </td>
                          <td className="px-4 py-3">
                            {inst.receiptUrl ? (
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#1e3a8a]">
                                  {inst.paymentMethod === "CASH_ELDEN"
                                    ? "Elden Ödeme Bildirimi"
                                    : "Havale Dekontu"}
                                </span>
                                {inst.receiptUrl !== "ELDEN_BILDIRIM" && (
                                  <a
                                    href={inst.receiptUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-bold text-blue-600 hover:underline"
                                  >
                                    Dekontu Aç →
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {inst.isPaid ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" /> Ödendi
                              </span>
                            ) : inst.receiptUrl ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                                <Clock className="h-3 w-3" /> Dekont Onayı Bekliyor
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                <Clock className="h-3 w-3" /> Bekliyor
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() =>
                                handleToggleInstallment(inst.id, inst.isPaid)
                              }
                              disabled={isPending}
                              className={cn(
                                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
                                inst.isPaid
                                  ? "border border-slate-200 text-slate-600 hover:bg-slate-100"
                                  : "bg-emerald-600 text-white hover:bg-emerald-700",
                              )}
                            >
                              {inst.isPaid
                                ? "Ödenmedi Yap"
                                : "Tahsilatı Onayla (Ödendi)"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">
              Kayıtlı ödeme planı bulunamadı. Sağ üstteki butondan yeni taksit planı ekleyebilirsiniz.
            </p>
          )}
        </div>
      )}

      {/* ── 5. DOCUMENTS TAB ─────────────────────────────────────────────── */}
      {activeTab === "documents" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Yüklenen Evraklar, Onay &amp; Danışman Belge Yükleme
              </h3>
              <p className="text-xs text-slate-500">
                Öğrencinin yüklediği belgeleri onaylayabilir veya DS-2019, Job Offer, Sözleşme gibi belgeleri doğrudan yükleyebilirsiniz.
              </p>
            </div>
          </div>

          {/* Advisor Direct Document Upload Bar */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-bold text-slate-700">
                Öğrenci Dosyasına Belge Ekle:
              </span>
              <select
                value={advisorDocType}
                onChange={(e) => setAdvisorDocType(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold"
              >
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <input
                type="file"
                onChange={(e) => setAdvisorDocFile(e.target.files?.[0] || null)}
                className="rounded-lg border border-slate-200 bg-white p-1 text-xs"
              />
            </div>
            <button
              type="button"
              disabled={!advisorDocFile || isUploadingAdvisorDoc}
              onClick={async () => {
                if (!advisorDocFile) return;
                setIsUploadingAdvisorDoc(true);
                try {
                  const fd = new FormData();
                  fd.append("file", advisorDocFile);
                  fd.append("studentId", student.id);
                  fd.append("docType", advisorDocType);
                  const upRes = await fetch("/api/upload", {
                    method: "POST",
                    body: fd,
                  });
                  const upJson = await upRes.json();
                  if (upJson.success) {
                    await uploadDocumentByAdvisor({
                      studentId: student.id,
                      type: advisorDocType,
                      fileName: advisorDocFile.name,
                      fileUrl: upJson.fileUrl,
                    });
                    setAdvisorDocFile(null);
                  }
                } finally {
                  setIsUploadingAdvisorDoc(false);
                }
              }}
              className="rounded-xl bg-[#0f172a] px-4 py-2 font-bold text-white hover:bg-[#1e3a8a] disabled:opacity-50"
            >
              {isUploadingAdvisorDoc
                ? "Yükleniyor…"
                : "Belgeyi Yükle & Onayla"}
            </button>
          </div>

          {documents && documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {DOCUMENT_TYPE_LABELS[
                            doc.type as keyof typeof DOCUMENT_TYPE_LABELS
                          ] || doc.type}
                        </p>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold text-blue-600 hover:underline truncate max-w-[220px] block"
                        >
                          {doc.fileName} (Dosyayı Aç →)
                        </a>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                        doc.verificationStatus === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : doc.verificationStatus === "PENDING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800",
                      )}
                    >
                      {doc.verificationStatus === "APPROVED"
                        ? "Onaylandı"
                        : doc.verificationStatus === "PENDING"
                        ? "Onay Bekliyor"
                        : "Revize İstendi"}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    {doc.verificationStatus !== "APPROVED" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(() => {
                            reviewStudentDocument(doc.id, "APPROVED");
                          })
                        }
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                      >
                        ✓ Onayla
                      </button>
                    )}
                    {doc.verificationStatus !== "REVISION_REQUESTED" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          const reason = prompt(
                            "Revize / Red sebebini yazınız:",
                            "Belge okunaklı değil, lütfen yeniden yükleyin.",
                          );
                          if (reason) {
                            startTransition(() => {
                              reviewStudentDocument(
                                doc.id,
                                "REVISION_REQUESTED",
                                reason,
                              );
                            });
                          }
                        }}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
                      >
                        ✕ Revize İste
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">
              Henüz evrak yüklenmemiş.
            </p>
          )}
        </div>
      )}

      {/* ── 7. ACTIVITY LOGS (SİSTEM KAYITLARI) TAB ──────────────────────── */}
      {activeTab === "logs" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Öğrenci Dosyası İşlem Geçmişi &amp; Sistem Logları
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              İş teklifi atamaları, kabul/ret yanıtları, belge yükleme ve onayları, dekont bildirimleri ve taksit tahsilatlarının kronolojik veritabanı kayıtları.
            </p>
          </div>

          {!student.activityLogs || student.activityLogs.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              Henüz bu dosyada kayıtlı sistem logu bulunmamaktadır.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {student.activityLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                        {log.actionType}
                      </span>
                      <span className="font-bold text-slate-900">
                        {log.title}
                      </span>
                    </div>
                    {log.description && (
                      <p className="text-slate-600">{log.description}</p>
                    )}
                  </div>
                  <div className="text-left sm:text-right text-[11px] text-slate-400 shrink-0">
                    {log.actorName && (
                      <p className="font-semibold text-slate-600">
                        {log.actorName} ({log.actorRole || "Sistem"})
                      </p>
                    )}
                    <p>{formatDateTime(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showEmailModal && (
        <EmailComposeModal
          recipientName={student.user.fullName}
          recipientEmail={student.user.email}
          programLabel={PROGRAM_LABELS[student.program as Program]}
          studentId={student.id}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </div>
  );
}
