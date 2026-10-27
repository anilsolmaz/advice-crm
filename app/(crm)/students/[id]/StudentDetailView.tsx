"use client";

import { useState, useTransition } from "react";
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
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { toggleInstallmentPaid, advanceWatStep } from "@/actions/crm/students";
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
  staffList?: { id: string; fullName: string }[];
}

export function StudentDetailView({ student, staffList = [] }: Props) {
  const [activeTab, setActiveTab] = useState<
    "personal" | "program" | "applications" | "payments" | "documents" | "notes"
  >("program");
  const [isPending, startTransition] = useTransition();
  const [noteText, setNoteText] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);

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
          <button
            type="button"
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#1e3a8a] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-800"
          >
            <Mail className="h-4 w-4 text-sky-300" />
            Mail Gönder
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

      {/* ── Summary Hero Card ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4 lg:border-r border-slate-100 lg:pr-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0f172a] text-white font-bold text-xl shadow-md">
            {student.user.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900 truncate">
              {student.user.fullName}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Kayıt: {formatDate(student.createdAt)}
            </p>
            <p className="text-xs font-bold text-[#1e3a8a] mt-1">
              Danışman: {student.advisor?.fullName || "Atanmadı"}
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
          Application Süreçleri ({applications.length})
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
          Akademik Profil &amp; Kimlik
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
          onClick={() => setActiveTab("documents")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-colors",
            activeTab === "documents"
              ? "border-[#0f172a] text-[#0f172a]"
              : "border-transparent text-slate-500 hover:text-slate-900",
          )}
        >
          <FileText className="h-4 w-4" />
          Belgeler ({documents?.length || 0})
        </button>

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
          Takım İçi Conversation (@mention) ({notes?.length || 0})
        </button>
      </div>

      {/* ── 1. PROGRAM TAB ───────────────────────────────────────────────── */}
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

              {/* Assigned Student Job Links */}
              {jobAssignments.length > 0 && (
                <div className="rounded-xl border border-slate-200 p-4 space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Link2 className="h-4 w-4 text-[#1e3a8a]" />
                    Öğrenciye Gönderilen Özel İş Teklifi Linkleri
                  </h4>
                  <div className="space-y-2">
                    {jobAssignments.map((asg: any) => (
                      <div
                        key={asg.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-xs border border-slate-200"
                      >
                        <div>
                          <span className="font-bold text-slate-900">
                            {asg.job?.jobTitle} ({asg.job?.location})
                          </span>
                          <span className="ml-2 text-slate-500">
                            ${String(asg.job?.hourlyWage)}/saat
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                              asg.status === "ACCEPTED"
                                ? "bg-emerald-100 text-emerald-800"
                                : asg.status === "DECLINED"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800",
                            )}
                          >
                            {asg.status === "ACCEPTED"
                              ? "✓ ÖĞRENCİ ONAYLADI"
                              : asg.status === "DECLINED"
                              ? "✕ ÖĞRENCİ REDDETTİ"
                              : "YANIT BEKLENİYOR"}
                          </span>
                          <a
                            href={`/job-offer/${asg.shareToken}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-[#1e3a8a] hover:underline"
                          >
                            /job-offer/{asg.shareToken} →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ödeme Planı ve Taksit Takibi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Öğrencinin sözleşme bedeli, taksitleri ve muhasebe hareketleri
              </p>
            </div>
            <Link
              href="/accounting"
              className="rounded-xl bg-[#0f172a] px-3.5 py-2 text-xs font-bold text-white"
            >
              Muhasebe Modülüne Git →
            </Link>
          </div>

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
                            {inst.isPaid ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" /> Ödendi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
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
                              {inst.isPaid ? "Ödenmedi Yap" : "Ödendi İşaretle"}
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
              Kayıtlı ödeme planı bulunamadı.
            </p>
          )}
        </div>
      )}

      {/* ── 5. DOCUMENTS TAB ─────────────────────────────────────────────── */}
      {activeTab === "documents" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Yüklenen Evraklar ve Belgeler
          </h3>
          {documents && documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {DOCUMENT_TYPE_LABELS[
                          doc.type as keyof typeof DOCUMENT_TYPE_LABELS
                        ] || doc.type}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {doc.fileName}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-bold",
                      doc.verificationStatus === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800",
                    )}
                  >
                    {doc.verificationStatus}
                  </span>
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

      {/* ── 6. TEAM CONVERSATION (@MENTION) TAB (§9) ─────────────────────── */}
      {activeTab === "notes" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
              <AtSign className="h-4 w-4 text-blue-600" />
              Takım İçi Conversation (@mention) &amp; Danışman Notları
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ekip arkadaşlarınızı etiketlemek için aşağıdan ismine tıklayın veya{" "}
              <code>@İsim</code> yazın. Etiketlenen kişiye anında bildirim gider.
            </p>
          </div>

          {/* Quick @mention pills */}
          {staffList.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400">
                Hızlı Etiketle:
              </span>
              {staffList.map((st) => {
                const firstName = st.fullName.split(" ")[0];
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() =>
                      setNoteText((prev) => `${prev} @${firstName} `.trimStart())
                    }
                    className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-[#1e3a8a] hover:bg-blue-100"
                  >
                    @{firstName} ({st.fullName})
                  </button>
                );
              })}
            </div>
          )}

          {/* New note form */}
          <form
            action={(fd) => {
              noteAction(fd);
              setNoteText("");
            }}
            className="space-y-3"
          >
            <textarea
              name="note"
              rows={3}
              required
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Örn: @Recep öğrencinin DS-2019 belgesi geldi, @Selim konaklama komisyonunu kontrol edebilir misin?"
              className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-800 focus:border-[#0f172a] focus:outline-none"
            />
            <div className="flex justify-end">
              <NoteSubmitButton />
            </div>
          </form>

          {/* Notes Timeline */}
          <div className="divide-y divide-slate-100">
            {notes && notes.length > 0 ? (
              notes.map((n: any) => (
                <div key={n.id} className="py-4 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0f172a]">
                      {n.author.fullName}
                    </span>
                    <span className="text-slate-400">
                      {formatDateTime(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {n.note}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">
                Kayıtlı mesaj bulunamadı.
              </p>
            )}
          </div>
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
