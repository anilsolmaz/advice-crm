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
  Building,
  ShieldCheck,
  Languages,
  Sun,
  Stamp,
  Home,
  HeartPulse,
} from "lucide-react";
import type { Program } from "@prisma/client";
import { PROGRAM_LABELS, DOCUMENT_TYPE_LABELS, CURRENCY_SYMBOLS } from "@/types/crm";
import { ProgramBadge } from "@/components/crm/common/ProgramBadge";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { toggleInstallmentPaid, advanceWatStep } from "@/actions/crm/students";
import { createAdvisorNote } from "@/actions/crm/notes";
import { useFormState, useFormStatus } from "react-dom";

function NoteSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      <Send className="h-3.5 w-3.5" />
      {pending ? "Ekleniyor…" : "Notu Kaydet"}
    </button>
  );
}

interface Props {
  student: any;
}

export function StudentDetailView({ student }: Props) {
  const [activeTab, setActiveTab] = useState<
    "personal" | "program" | "payments" | "documents" | "notes"
  >("personal");
  const [isPending, startTransition] = useTransition();

  const [noteState, noteAction] = useFormState(
    createAdvisorNote.bind(null, student.id),
    { success: true }
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

  function handleToggleInstallment(installmentId: string, currentPaid: boolean) {
    startTransition(() => {
      toggleInstallmentPaid(installmentId, !currentPaid);
    });
  }

  function handleAdvanceWat(step: number) {
    if (!confirm(`Bu aşamayı onaylayıp kaydetmek istiyor musunuz?`)) return;
    startTransition(() => {
      advanceWatStep(student.id, step);
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/students"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <ProgramBadge program={student.program as Program} showIcon size="md" />
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  student.isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    student.isActive ? "bg-emerald-500" : "bg-rose-500"
                  )}
                />
                {student.isActive ? "Aktif Kayıt" : "Pasif"}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 mt-1">
              {student.user.fullName}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Link
            href={`/students/${student.id}/cv`}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <FileText className="h-4 w-4 text-blue-600" />
            Öğrenci CV / Resume
          </Link>

          <Link
            href={`/students/${student.id}/makbuz`}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <CreditCard className="h-4 w-4 text-emerald-600" />
            Tahsilat Makbuzu
          </Link>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Dosyayı Yazdır
          </button>
        </div>
      </div>

      {/* ── Summary Hero Card ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4 lg:border-r border-gray-100 lg:pr-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xl shadow-md">
            {student.user.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-gray-900 truncate">
              {student.user.fullName}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Kayıt: {formatDate(student.createdAt)}
            </p>
            <p className="text-xs font-medium text-blue-600 mt-1">
              Danışman: {student.advisor?.fullName || "Atanmadı"}
            </p>
          </div>
        </div>

        <div className="space-y-2 lg:border-r border-gray-100 lg:px-6">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Mail className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="truncate">{student.user.email}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone className="h-4 w-4 text-gray-400 shrink-0" />
            <span>{student.user.phone || "Telefon girilmedi"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="truncate">
              {profile?.city ? `${profile.city}, ${profile.country || "Türkiye"}` : "Adres girilmedi"}
            </span>
          </div>
        </div>

        <div className="space-y-1 lg:border-r border-gray-100 lg:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Eğitim Bilgisi
          </p>
          <p className="text-xs font-bold text-gray-900">
            {profile?.universityName || "Üniversite belirtilmedi"}
          </p>
          <p className="text-xs text-gray-500">
            {profile?.fieldOfStudy ? `${profile.fieldOfStudy} · ` : ""}
            GPA: {profile?.universityGpa || "-"}
          </p>
        </div>

        <div className="space-y-1 lg:pl-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Mali Bakiye Özeti
          </p>
          {payments && payments.length > 0 ? (
            <div>
              <p className="text-lg font-bold text-gray-900">
                {payments[0].totalAmount} {payments[0].currency}
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">
                {payments[0].status === "PAID"
                  ? "✓ Tüm Ödemeler Tamamlandı"
                  : "Taksitler Devam Ediyor"}
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">Ödeme planı yok</p>
          )}
        </div>
      </div>

      {/* ── Tab Navigation ───────────────────────────────────────────────── */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("personal")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition-colors",
            activeTab === "personal"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          <User className="h-4 w-4" />
          Kişisel & Kimlik
        </button>

        <button
          onClick={() => setActiveTab("program")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition-colors",
            activeTab === "program"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          <Plane className="h-4 w-4" />
          Program Operasyonu
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition-colors",
            activeTab === "payments"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          <CreditCard className="h-4 w-4" />
          Ödemeler & Taksitler
        </button>

        <button
          onClick={() => setActiveTab("documents")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition-colors",
            activeTab === "documents"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          <FileText className="h-4 w-4" />
          Belgeler ({documents?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("notes")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition-colors",
            activeTab === "notes"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Danışman Notları ({notes?.length || 0})
        </button>
      </div>

      {/* ── Tab Contents ─────────────────────────────────────────────────── */}

      {/* 1. PERSONAL TAB */}
      {activeTab === "personal" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Kimlik & Pasaport */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Kimlik ve Pasaport Bilgileri
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block">T.C. Kimlik No:</span>
                <span className="font-semibold text-gray-800">{profile?.nationalId || "-"}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Uyruk:</span>
                <span className="font-semibold text-gray-800">{profile?.nationality || "T.C."}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Doğum Tarihi:</span>
                <span className="font-semibold text-gray-800">
                  {profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : "-"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Doğum Yeri:</span>
                <span className="font-semibold text-gray-800">{profile?.placeOfBirth || "-"}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Pasaport No:</span>
                <span className="font-semibold text-gray-800">{profile?.passportNumber || "-"}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Pasaport Bitiş:</span>
                <span className="font-semibold text-gray-800">
                  {profile?.passportExpiry ? formatDate(profile.passportExpiry) : "-"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Anne Adı:</span>
                <span className="font-semibold text-gray-800">{profile?.motherName || "-"}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Baba Adı:</span>
                <span className="font-semibold text-gray-800">{profile?.fatherName || "-"}</span>
              </div>
            </div>
          </div>

          {/* Acil Durum & Adres */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Acil Durum İletişim & Adres
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block">Acil Durum Kişisi:</span>
                <span className="font-semibold text-gray-800">{profile?.emergencyContactName || "-"}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Yakınlık Derecesi:</span>
                <span className="font-semibold text-gray-800">{profile?.emergencyContactRelationship || "-"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400 block">Acil Durum Telefonu:</span>
                <span className="font-semibold text-gray-800">{profile?.emergencyContactPhone || "-"}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-gray-100">
                <span className="text-gray-400 block">İkamet Adresi:</span>
                <span className="font-medium text-gray-700 leading-relaxed">
                  {profile?.addressLine1 ? (
                    <>
                      {profile.addressLine1}
                      {profile.district ? `, ${profile.district}` : ""}
                      {profile.city ? ` / ${profile.city}` : ""}
                    </>
                  ) : (
                    "Adres girilmemiş"
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PROGRAM TAB */}
      {activeTab === "program" && (
        <div className="space-y-6">
          {student.program === "WORK_AND_TRAVEL" && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Work and Travel 2026 Operasyon Takibi
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Sponsor, İş Teklifi, DS-2019 Belgesi ve SEVIS İlerlemesi
                  </p>
                </div>

                {/* Stepper advancement */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAdvanceWat(4)}
                    disabled={isPending}
                    className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    DS-2019 Geldi
                  </button>
                  <button
                    onClick={() => handleAdvanceWat(6)}
                    disabled={isPending}
                    className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                  >
                    Vize Onaylandı
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="rounded-xl bg-gray-50 p-3">
                  <span className="text-gray-400 block">Sponsor Kurum:</span>
                  <span className="font-bold text-gray-800 text-sm">{watDetail?.sponsorName || "CIEE"}</span>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <span className="text-gray-400 block">DS-2019 Numarası:</span>
                  <span className="font-bold text-gray-800 text-sm">{watDetail?.sponsorDsNumber || "Bekleniyor"}</span>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <span className="text-gray-400 block">SEVIS ID:</span>
                  <span className="font-bold text-gray-800 text-sm">{watDetail?.sevisId || "Oluşturulmadı"}</span>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <span className="text-gray-400 block">Sigorta Poliçesi:</span>
                  <span className="font-bold text-gray-800 text-sm">{watDetail?.insurancePolicyNo || "Aetna Global"}</span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  İşveren ve Konum Bilgileri
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 block">İşveren (Employer):</span>
                    <span className="font-semibold text-gray-900">{watDetail?.employerName || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Pozisyon (Job Title):</span>
                    <span className="font-semibold text-gray-900">{watDetail?.jobTitle || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Eyalet (State):</span>
                    <span className="font-semibold text-gray-900">{watDetail?.employerState || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Vize Durumu:</span>
                    <span className={cn("font-bold", watDetail?.visaApproved ? "text-emerald-600" : "text-amber-600")}>
                      {watDetail?.visaApproved ? "✓ Vize Alındı" : "Randevu / İnceleme Bekleniyor"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {student.program === "ACADEMY" && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-gray-900">
                Akademi / Üniversite Başvuru Takibi
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="rounded-xl bg-gray-50 p-3">
                  <span className="text-gray-400 block">Hedef Ülke:</span>
                  <span className="font-bold text-gray-800 text-sm">{academyDetail?.targetCountry || "-"}</span>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <span className="text-gray-400 block">Hedef Üniversite:</span>
                  <span className="font-bold text-gray-800 text-sm">{academyDetail?.targetUniversity || "-"}</span>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <span className="text-gray-400 block">Hedef Bölüm / Derece:</span>
                  <span className="font-bold text-gray-800 text-sm">{academyDetail?.targetProgram || "-"}</span>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <span className="text-gray-400 block">Başvuru Durumu:</span>
                  <span className="font-bold text-blue-600 text-sm">{academyDetail?.applicationStatus || "Hazırlık"}</span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Dil Sınavı Skorları (IELTS / TOEFL)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 block">IELTS Overall:</span>
                    <span className="font-bold text-emerald-600 text-sm">{academyDetail?.ieltsOverall || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Listening:</span>
                    <span className="font-semibold text-gray-800">{academyDetail?.ieltsListening || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Reading:</span>
                    <span className="font-semibold text-gray-800">{academyDetail?.ieltsReading || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Writing:</span>
                    <span className="font-semibold text-gray-800">{academyDetail?.ieltsWriting || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">TOEFL Total:</span>
                    <span className="font-bold text-blue-600 text-sm">{academyDetail?.toeflTotal || "-"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {student.program === "LANGUAGE_SCHOOL" && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Languages className="h-5 w-5 text-emerald-600" />
                    Dil Eğitimi ve Okul Operasyon Takibi
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Kabul Belgesi (LOA), konaklama rezervasyonu, ders yoğunluğu ve vize hazırlığı
                  </p>
                </div>
                <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  {languageDetail?.weeksDuration ? `${languageDetail.weeksDuration} Hafta Kurs` : "Kurs Süresi Belirtilmedi"}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="rounded-xl bg-gray-50 p-3">
                  <span className="text-gray-400 block">Hedef Ülke & Şehir:</span>
                  <span className="font-bold text-gray-800 text-sm">
                    {languageDetail?.targetCountry || "-"} {languageDetail?.targetCity ? `/ ${languageDetail.targetCity}` : ""}
                  </span>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <span className="text-gray-400 block">Tercih Edilen Okul:</span>
                  <span className="font-bold text-gray-800 text-sm">{languageDetail?.schoolName || "EC English / Kaplan"}</span>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <span className="text-gray-400 block">Kurs Türü / Yoğunluk:</span>
                  <span className="font-bold text-gray-800 text-sm">{languageDetail?.courseType || "Genel İngilizce (20 Ders)"}</span>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <span className="text-gray-400 block">Mevcut Seviye:</span>
                  <span className="font-bold text-emerald-600 text-sm">{languageDetail?.currentLanguageLevel || "B1 - Intermediate"}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl border border-gray-100 p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Home className="h-4 w-4 text-blue-500" />
                    Konaklama ve Yaşam Düzeni
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400 block">Konaklama Türü:</span>
                      <span className="font-semibold text-gray-800">{languageDetail?.accommodationType || "Aile Yanı (Homestay)"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Yemek / Pansiyon:</span>
                      <span className="font-semibold text-gray-800">Yarım Pansiyon (Kahvaltı + Akşam)</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Havalimanı Transferi:</span>
                      <span className="font-semibold text-emerald-600">✓ Çift Yön Karşılama Talep Edildi</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Sağlık Sigortası:</span>
                      <span className="font-semibold text-emerald-600">✓ Seyahat Sağlık Poliçesi Aktif</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    Tarihler ve Kabul Durumu
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400 block">Kurs Başlangıç:</span>
                      <span className="font-semibold text-gray-800">
                        {languageDetail?.startDate ? formatDate(languageDetail.startDate) : "Belirlenmedi"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Kurs Bitiş:</span>
                      <span className="font-semibold text-gray-800">
                        {languageDetail?.endDate ? formatDate(languageDetail.endDate) : "Belirlenmedi"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">LOA Kabul Mektubu:</span>
                      <span className="font-bold text-emerald-600">✓ Okuldan Teslim Alındı</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Vize Durumu:</span>
                      <span className="font-bold text-blue-600">Evraklar Hazırlanıyor</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {student.program === "SUMMER_CAMP" && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Sun className="h-5 w-5 text-amber-500" />
                    Yaz Okulu (7-18 Yaş Junior Kampı) Operasyon Takibi
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Veli muvafakatnamesi, sağlık/alerji beyanı, refakat ve transfer yönetimi
                  </p>
                </div>
                <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                  {summerCampDetail?.ageGroup ? `${summerCampDetail.ageGroup} Yaş Grubu` : "Junior (10-17 Yaş)"}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="rounded-xl bg-gray-50 p-3">
                  <span className="text-gray-400 block">Hedef Ülke & Şehir:</span>
                  <span className="font-bold text-gray-800 text-sm">{summerCampDetail?.targetCountry || "İngiltere / Londra"}</span>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <span className="text-gray-400 block">Kamp / Okul Adı:</span>
                  <span className="font-bold text-gray-800 text-sm">{summerCampDetail?.campName || "Kings Education Uxbridge"}</span>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <span className="text-gray-400 block">Program Formatı:</span>
                  <span className="font-bold text-gray-800 text-sm">{summerCampDetail?.programType || "Klasik Kamp + Aktiviteler"}</span>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <span className="text-gray-400 block">Konaklama:</span>
                  <span className="font-bold text-amber-700 text-sm">Kampüs İçi Yurt (Boarding)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Veli & İletişim */}
                <div className="rounded-xl border border-gray-100 p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-blue-500" />
                    Veli & Acil Durum Bilgileri
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-gray-400 block">Ebeveyn / Veli Ad Soyad:</span>
                      <span className="font-semibold text-gray-900">{summerCampDetail?.guardianName || "Veli Belirtilmedi"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Veli Telefonu:</span>
                      <span className="font-semibold text-gray-800">{summerCampDetail?.guardianPhone || "-"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Veli E-Postası:</span>
                      <span className="font-semibold text-gray-800">{summerCampDetail?.guardianEmail || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Refakat & Transfer */}
                <div className="rounded-xl border border-gray-100 p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Plane className="h-4 w-4 text-emerald-500" />
                    Ulaşım ve Refakat (UM Service)
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-gray-50 p-2.5">
                      <span className="text-gray-400 block">UM Refakat Hizmeti:</span>
                      <span className="font-bold text-emerald-600">✓ Talep Edildi</span>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2.5">
                      <span className="text-gray-400 block">Havalimanı Transfer:</span>
                      <span className={cn("font-bold", summerCampDetail?.airportTransfer ? "text-emerald-600" : "text-gray-700")}>
                        {summerCampDetail?.airportTransfer ? "✓ Çift Yön Transfer" : "Özel Karşılama"}
                      </span>
                    </div>
                    <div className="col-span-2 rounded-lg bg-amber-50/60 border border-amber-100 p-2.5 flex items-center gap-2">
                      <HeartPulse className="h-4 w-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold text-amber-900 block">Sağlık & Alerji Beyanı:</span>
                        <span className="text-amber-800">Kronik rahatsızlık veya gıda alerjisi bulunmamaktadır.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {student.program === "VISA_CONSULTING" && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Stamp className="h-5 w-5 text-rose-600" />
                    Turistik & Ziyaret Vizesi Operasyon Takibi
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Konsolosluk randevusu, biyometrik veri (parmak izi) ve finansal evrak incelemesi
                  </p>
                </div>
                <span className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                  {visaDetail?.destinationCountry || "Schengen / ABD / İngiltere"}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="rounded-xl bg-gray-50 p-3">
                  <span className="text-gray-400 block">Hedef Ülke:</span>
                  <span className="font-bold text-gray-800 text-sm">{visaDetail?.destinationCountry || "Almanya (Schengen)"}</span>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <span className="text-gray-400 block">Başvuru Merkezi:</span>
                  <span className="font-bold text-gray-800 text-sm">{visaDetail?.targetConsulate || "iDATA / VFS Global"}</span>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <span className="text-gray-400 block">Randevu Tarihi & Saati:</span>
                  <span className="font-bold text-rose-600 text-sm">
                    {visaDetail?.appointmentDate ? formatDateTime(visaDetail.appointmentDate) : "Slot Bekleniyor"}
                  </span>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <span className="text-gray-400 block">Karar Durumu:</span>
                  <span className="font-bold text-blue-600 text-sm">{visaDetail?.decisionStatus || "Dosya Hazırlanıyor"}</span>
                </div>
              </div>

              {/* 11 Maddelik Vize Evrak Kontrol Listesi */}
              <div className="rounded-xl border border-gray-100 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center justify-between">
                  <span>Konsolosluk Dosya ve Evrak Kontrol Listesi (11 Madde)</span>
                  <span className="text-[10px] text-emerald-600 font-semibold lowercase">8/11 evrak onaylandı</span>
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2 text-emerald-800 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    Pasaport (Geçerli)
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2 text-emerald-800 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    Biyometrik Fotoğraf
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2 text-emerald-800 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    Vukuatlı Nüfus Kayıt
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2 text-emerald-800 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    İkametgah Belgesi
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2 text-emerald-800 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    Maaş Bordroları (3 Ay)
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2 text-emerald-800 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    SGK İşe Giriş & Tescil
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2 text-emerald-800 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    Banka Dökümü (Kaşeli)
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2 text-emerald-800 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    Seyahat Sigortası (30k€)
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-2 text-amber-800 font-medium">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                    Otel & Uçak Rezervasyonu
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-2 text-amber-800 font-medium">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                    Şahsi Dilekçe / Niyet
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 text-gray-500 font-medium">
                    <AlertCircle className="h-4 w-4 text-gray-400 shrink-0" />
                    Varsa Tapu & Ruhsat
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. PAYMENTS TAB */}
      {activeTab === "payments" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Ödeme Planı ve Taksit Takibi
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Öğrencinin sözleşme bedeli ve ödeme makbuzları
              </p>
            </div>
          </div>

          {payments && payments.length > 0 ? (
            payments.map((payment: any) => (
              <div key={payment.id} className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Açıklama</p>
                    <p className="font-bold text-gray-900 text-sm">{payment.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Toplam Bedel</p>
                    <p className="text-lg font-bold text-gray-900">
                      {payment.totalAmount} {payment.currency}
                    </p>
                  </div>
                </div>

                {/* Installments Table */}
                <div className="overflow-hidden rounded-xl border border-gray-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-gray-500">Taksit No</th>
                        <th className="px-4 py-3 font-semibold text-gray-500">Vade Tarihi</th>
                        <th className="px-4 py-3 font-semibold text-gray-500">Tutar</th>
                        <th className="px-4 py-3 font-semibold text-gray-500">Ödeme Tarihi</th>
                        <th className="px-4 py-3 font-semibold text-gray-500">Durum</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-500">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {payment.installments.map((inst: any) => (
                        <tr key={inst.id} className="hover:bg-gray-50/60">
                          <td className="px-4 py-3 font-bold text-gray-700">#{inst.sequence}</td>
                          <td className="px-4 py-3 text-gray-600">{formatDate(inst.dueDate)}</td>
                          <td className="px-4 py-3 font-bold text-gray-900">
                            {inst.amount} {inst.currency}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {inst.paidAt ? formatDate(inst.paidAt) : "-"}
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
                              onClick={() => handleToggleInstallment(inst.id, inst.isPaid)}
                              disabled={isPending}
                              className={cn(
                                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
                                inst.isPaid
                                  ? "border border-gray-200 text-gray-600 hover:bg-gray-100"
                                  : "bg-emerald-600 text-white hover:bg-emerald-700"
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
            <p className="text-xs text-gray-400 text-center py-6">Kayıtlı ödeme planı bulunamadı.</p>
          )}
        </div>
      )}

      {/* 4. DOCUMENTS TAB */}
      {activeTab === "documents" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900">
            Yüklenen Evraklar ve Belgeler
          </h3>
          {documents && documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {DOCUMENT_TYPE_LABELS[doc.type as keyof typeof DOCUMENT_TYPE_LABELS] || doc.type}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate max-w-[200px]">
                        {doc.fileName}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                    {doc.verificationStatus}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-8">Henüz evrak yüklenmemiş.</p>
          )}
        </div>
      )}

      {/* 5. NOTES TAB */}
      {activeTab === "notes" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-gray-900">
            Danışman Notları & İşlem Geçmişi
          </h3>

          {/* New note form */}
          <form action={noteAction} className="space-y-3">
            <textarea
              name="note"
              rows={3}
              required
              placeholder="Öğrenci hakkında kalıcı danışman notu ekleyin…"
              className="w-full rounded-xl border border-gray-200 p-3 text-xs text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex justify-end">
              <NoteSubmitButton />
            </div>
          </form>

          {/* Notes Timeline */}
          <div className="divide-y divide-gray-100">
            {notes && notes.length > 0 ? (
              notes.map((n: any) => (
                <div key={n.id} className="py-4 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-900">{n.author.fullName}</span>
                    <span className="text-gray-400">{formatDateTime(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{n.note}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">Kayıtlı not bulunamadı.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
