"use client";

import { useState, useTransition } from "react";
import {
  Briefcase,
  Calendar,
  Clock,
  Home,
  DollarSign,
  Utensils,
  Bus,
  Shirt,
  Users,
  CheckCircle2,
  XCircle,
  MapPin,
  Plane,
  Sparkles,
  Info,
  Building2,
  FileCheck,
} from "lucide-react";
import { respondToJobOffer } from "@/actions/crm/jobs";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

interface Props {
  shareToken: string;
  status: string;
  studentName: string;
  advisorName: string;
  studentNote: string | null;
  respondedAt: string | null;
  job: {
    id: string;
    sponsor: string;
    program: string;
    jobCategory: string;
    jobTitle: string;
    placementType: string;
    location: string;
    state: string | null;
    arrivalAirport: string | null;
    hourlyWage: string;
    avgWorkingHours: number;
    accommodationCost: string | null;
    accommodationDeposit: string | null;
    food: string | null;
    transportation: string | null;
    workApparel: string | null;
    position: string | null;
    genderPreference: string;
    jobStartDate: string;
    jobEndDate: string;
    earlyLeaveInfo: string | null;
    numPlacements: number;
    bonus: string | null;
    additionalInfo: string | null;
  };
}

export default function JobOfferClient({
  shareToken,
  status,
  studentName,
  advisorName,
  studentNote,
  respondedAt,
  job,
}: Props) {
  const [note, setNote] = useState(studentNote || "");
  const [currentStatus, setCurrentStatus] = useState(status);
  const [lastRespondedAt, setLastRespondedAt] = useState<string | null>(respondedAt);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const weeklyEstGross = (
    Number(job.hourlyWage || 0) * (job.avgWorkingHours || 0)
  ).toFixed(0);

  function handleDecision(decision: "ACCEPTED" | "DECLINED") {
    setFeedback(null);
    startTransition(async () => {
      const res = await respondToJobOffer(shareToken, decision, note);
      if (res.success) {
        setCurrentStatus(decision);
        setLastRespondedAt(new Date().toISOString());
        setFeedback(
          decision === "ACCEPTED"
            ? "İş teklifini başarıyla onayladınız. Danışmanınıza bilgi iletildi."
            : "İş teklifini reddettiniz. Danışmanınız yeni iş seçenekleri için sizinle iletişime geçecektir.",
        );
      } else {
        alert(res.error);
      }
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Top Branding & Meta Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/advice-logo.svg"
                alt="Advice Yurtdışı Eğitim"
                className="h-9 w-auto object-contain"
              />
              <div className="h-6 w-px bg-slate-200" />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-bold text-[#1e3a8a]">
                <FileCheck className="h-3.5 w-3.5 text-[#1e3a8a]" />
                Work &amp; Travel Resmi İş Teklifi
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="text-slate-600">
                Öğrenci: <strong className="text-slate-900 font-bold">{studentName}</strong>
              </div>
              {advisorName && (
                <div className="text-slate-600 border-l border-slate-200 pl-4">
                  Danışman: <strong className="text-slate-900 font-bold">{advisorName}</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feedback Alert if submitted */}
        {feedback && (
          <div
            className={cn(
              "rounded-2xl border p-4 text-sm font-semibold flex items-center gap-3 transition-all",
              currentStatus === "ACCEPTED"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900",
            )}
          >
            {currentStatus === "ACCEPTED" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <Info className="h-5 w-5 text-amber-600 shrink-0" />
            )}
            <span>{feedback}</span>
          </div>
        )}

        {/* Job Offer Main Content Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header & Badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                <Building2 className="h-3.5 w-3.5 text-slate-500" />
                {job.sponsor} Sponsorluğunda
              </span>
              <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#1e3a8a] border border-blue-100">
                {job.jobCategory}
              </span>
              <span className="inline-flex items-center rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
                {job.placementType}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {job.jobTitle}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                {job.location} {job.state ? `(${job.state})` : ""}
              </span>
              {job.arrivalAirport && (
                <span className="flex items-center gap-1.5 text-slate-500 border-l border-slate-200 pl-4">
                  <Plane className="h-4 w-4 text-sky-500 shrink-0" />
                  Varış Havalimanı: <strong className="text-slate-800 font-medium">{job.arrivalAirport}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Highlights Banner: Hourly Wage & Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-emerald-50/30 to-slate-50/50 p-4 sm:p-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Saatlik Ücret
              </p>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-emerald-700">
                ${job.hourlyWage}{" "}
                <span className="text-xs font-semibold text-emerald-600">/ saat</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Haftalık Çalışma Saati
              </p>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-slate-800">
                Ort. {job.avgWorkingHours}{" "}
                <span className="text-xs font-medium text-slate-500">saat / hafta</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Tahmini Haftalık Brüt Gelir
              </p>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-slate-800">
                ~${weeklyEstGross}{" "}
                <span className="text-xs font-medium text-slate-500">/ hafta</span>
              </p>
            </div>
          </div>

          {/* Detailed Job Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                Pozisyon
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                {job.position || job.jobTitle}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Çalışma Tarihleri
              </div>
              <p className="text-xs font-bold text-slate-900">
                {formatDate(job.jobStartDate)} – {formatDate(job.jobEndDate)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                <Home className="h-3.5 w-3.5 text-slate-400" />
                Konaklama Ücreti
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                {job.accommodationCost
                  ? `$${job.accommodationCost} / hafta`
                  : "İşveren Sağlamıyor"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                Konaklama Depozitosu
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                {job.accommodationDeposit
                  ? `$${job.accommodationDeposit}`
                  : "Depozito Yok"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                <Utensils className="h-3.5 w-3.5 text-slate-400" />
                Yemek Olanakları
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                {job.food || "Belirtilmedi"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                <Bus className="h-3.5 w-3.5 text-slate-400" />
                Ulaşım Olanakları
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                {job.transportation || "Belirtilmedi"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                <Shirt className="h-3.5 w-3.5 text-slate-400" />
                İş Kıyafeti
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                {job.workApparel || "Belirtilmedi"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                Cinsiyet &amp; Erken Ayrılış
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                {job.genderPreference} · {job.earlyLeaveInfo || "Standart"}
              </p>
            </div>
          </div>

          {/* Bonus & Additional Notes */}
          {(job.bonus || job.additionalInfo) && (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs">
              {job.bonus && (
                <div className="flex items-start gap-2 text-emerald-800 font-medium">
                  <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-bold text-emerald-900">Sezon Sonu Bonusu:</strong>{" "}
                    {job.bonus}
                  </span>
                </div>
              )}
              {job.additionalInfo && (
                <div className="flex items-start gap-2 text-slate-700">
                  <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{job.additionalInfo}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Student Decision & Response Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Öğrenci İş Teklifi Onay ve Yanıt Formu
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Lütfen iş şartlarını ve konaklama koşullarını inceledikten sonra kararınızı iletin.
              </p>
            </div>

            {currentStatus === "ACCEPTED" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                İş Teklifini Onayladınız
                {lastRespondedAt && (
                  <span className="font-normal text-emerald-600/80">
                    ({formatDate(lastRespondedAt)})
                  </span>
                )}
              </span>
            )}
            {currentStatus === "DECLINED" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3.5 py-1.5 text-xs font-bold text-red-700">
                <XCircle className="h-4 w-4 text-red-600" />
                İş Teklifini Reddettiniz
                {lastRespondedAt && (
                  <span className="font-normal text-red-600/80">
                    ({formatDate(lastRespondedAt)})
                  </span>
                )}
              </span>
            )}
            {currentStatus !== "ACCEPTED" && currentStatus !== "DECLINED" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1.5 text-xs font-bold text-amber-700">
                <Clock className="h-4 w-4 text-amber-600" />
                Yanıtınız Bekleniyor
              </span>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              Danışmanınıza Notunuz (Opsiyonel)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Varsa arkadaş grubunuzla birlikte yerleşim talebiniz, sormak istediğiniz sorular veya karar gerekçeniz…"
              className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleDecision("DECLINED")}
              className={cn(
                "flex items-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50",
                currentStatus === "DECLINED" && "bg-red-50 ring-2 ring-red-300",
              )}
            >
              <XCircle className="h-4 w-4" />
              {currentStatus === "DECLINED" ? "Teklifi Reddettiniz" : "Bu İşi Reddet"}
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => handleDecision("ACCEPTED")}
              className={cn(
                "flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50",
                currentStatus === "ACCEPTED" && "bg-emerald-700 ring-2 ring-emerald-400",
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isPending
                ? "İşleniyor…"
                : currentStatus === "ACCEPTED"
                  ? "Teklifi Onayladınız"
                  : "İş Teklifini Onayla"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
