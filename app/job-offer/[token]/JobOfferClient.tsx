"use client";

import { useState, useTransition } from "react";
import {
  Plane,
  CheckCircle2,
  XCircle,
  MapPin,
  DollarSign,
  Calendar,
  Home,
  Briefcase,
} from "lucide-react";
import { respondToJobOffer } from "@/actions/crm/jobs";
import { formatDate } from "@/lib/utils/date";

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
  job,
}: Props) {
  const [note, setNote] = useState(studentNote || "");
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isPending, startTransition] = useTransition();

  function handleDecision(decision: "ACCEPTED" | "DECLINED") {
    startTransition(async () => {
      const res = await respondToJobOffer(shareToken, decision, note);
      if (res.success) {
        setCurrentStatus(decision);
      } else {
        alert(res.error);
      }
    });
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Boarding Pass Top Header */}
        <div className="overflow-hidden rounded-3xl bg-[#0f172a] text-white shadow-2xl border border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-6 py-4 bg-white text-slate-900">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/advice-logo.svg"
                alt="Advice Yurtdışı Eğitim"
                className="h-9 w-auto object-contain"
              />
              <span className="rounded-full bg-[#0f172a] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                Work &amp; Travel Resmi İş Teklifi
              </span>
            </div>
            <div className="text-xs font-mono text-slate-500">
              YOLCU / ÖĞRENCİ:{" "}
              <strong className="text-slate-900">{studentName}</strong>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
                  <Plane className="h-4 w-4" />
                  <span>
                    {job.sponsor} SPONSORLU · {job.jobCategory} ·{" "}
                    {job.placementType}
                  </span>
                </div>
                <h1 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                  {job.jobTitle}
                </h1>
                <p className="mt-1 text-sm text-slate-300 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-rose-400" />
                  {job.location} {job.state ? `(${job.state})` : ""} · Varış
                  Havalimanı: {job.arrivalAirport || "Belirtilmedi"}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-500/20 border border-emerald-400/30 px-4 py-3 text-right">
                <span className="block text-[10px] font-bold uppercase text-emerald-300">
                  SAATLİK ÜCRET (HOURLY WAGE)
                </span>
                <span className="text-2xl font-black text-emerald-300">
                  ${job.hourlyWage} / saat
                </span>
                <span className="block text-[11px] text-slate-300">
                  Ort. {job.avgWorkingHours} saat / hafta
                </span>
              </div>
            </div>

            {/* 22-Field Detail Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div className="rounded-xl bg-slate-800/90 p-3 border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Pozisyon
                </span>
                <span className="text-xs sm:text-sm font-bold text-white">
                  {job.position || job.jobTitle}
                </span>
              </div>
              <div className="rounded-xl bg-slate-800/90 p-3 border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Çalışma Tarihleri
                </span>
                <span className="text-xs font-bold text-white">
                  {formatDate(job.jobStartDate)} – {formatDate(job.jobEndDate)}
                </span>
              </div>
              <div className="rounded-xl bg-slate-800/90 p-3 border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Konaklama Ücreti
                </span>
                <span className="text-xs sm:text-sm font-bold text-white">
                  {job.accommodationCost
                    ? `$${job.accommodationCost} / hafta`
                    : "İşveren Sağlamıyor"}
                </span>
              </div>
              <div className="rounded-xl bg-slate-800/90 p-3 border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Konaklama Depozitosu
                </span>
                <span className="text-xs sm:text-sm font-bold text-white">
                  {job.accommodationDeposit
                    ? `$${job.accommodationDeposit}`
                    : "Yok"}
                </span>
              </div>
              <div className="rounded-xl bg-slate-800/90 p-3 border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Yemek (Food)
                </span>
                <span className="text-xs font-bold text-white">
                  {job.food || "Belirtilmedi"}
                </span>
              </div>
              <div className="rounded-xl bg-slate-800/90 p-3 border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Ulaşım (Transportation)
                </span>
                <span className="text-xs font-bold text-white">
                  {job.transportation || "Belirtilmedi"}
                </span>
              </div>
              <div className="rounded-xl bg-slate-800/90 p-3 border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  İş Kıyafeti (Apparel)
                </span>
                <span className="text-xs font-bold text-white">
                  {job.workApparel || "Belirtilmedi"}
                </span>
              </div>
              <div className="rounded-xl bg-slate-800/90 p-3 border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Cinsiyet &amp; Erken Ayrılış
                </span>
                <span className="text-xs font-bold text-white">
                  {job.genderPreference} · {job.earlyLeaveInfo || "Standart"}
                </span>
              </div>
            </div>

            {(job.bonus || job.additionalInfo) && (
              <div className="rounded-2xl bg-slate-800/70 border border-slate-700 p-4 space-y-1.5 text-xs">
                {job.bonus && (
                  <p className="font-bold text-emerald-300">
                    ★ Sezon Sonu Bonusu: {job.bonus}
                  </p>
                )}
                {job.additionalInfo && (
                  <p className="text-slate-300 leading-relaxed">
                    {job.additionalInfo}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Student Decision Box */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[#0f172a]">
              Öğrenci İş Teklifi Onay Formu
            </h2>

            {currentStatus === "ACCEPTED" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" /> İş Teklifini Onayladınız
              </span>
            )}
            {currentStatus === "DECLINED" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-4 py-1.5 text-xs font-bold text-red-800">
                <XCircle className="h-4 w-4" /> İş Teklifini Reddettiniz
              </span>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Danışmanınıza Notunuz (Opsiyonel)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Varsa arkadaş grubunuzla birlikte yerleşim talebiniz veya sorularınız…"
              className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleDecision("DECLINED")}
              className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-xs sm:text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Bu İşi Reddet
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => handleDecision("ACCEPTED")}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs sm:text-sm font-black text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isPending ? "İşleniyor…" : "İşi Onayla / Kabul Et"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
