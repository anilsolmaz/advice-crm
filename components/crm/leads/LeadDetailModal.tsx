// components/crm/leads/LeadDetailModal.tsx
"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  X,
  PhoneCall,
  UserPlus,
  Save,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import type { CRMLeadRow, CRMAdvisorNote, Program } from "@/types/crm";
import {
  LEAD_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
  PROGRAM_LABELS,
} from "@/types/crm";
import { LeadStatusBadge } from "./LeadStatusBadge";
import { ProgramBadge } from "@/components/crm/common/ProgramBadge";
import {
  updateLead,
  logLeadCall,
  postponeLeadFollowUp,
  convertLeadToStudent,
} from "@/actions/crm/leads";

function SaveButton({ label = "Değişiklikleri Kaydet" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-1.5 rounded-xl bg-[#0f172a] px-4 py-2 text-xs font-bold text-white hover:bg-[#1e3a8a] disabled:opacity-50 transition-colors"
    >
      <Save className="h-3.5 w-3.5 text-sky-400" />
      {pending ? "Kaydediliyor…" : label}
    </button>
  );
}

const CALL_OUTCOMES = [
  { value: "REACHED", label: "Ulaşıldı / Görüşüldü", suggestedDays: 3 },
  { value: "INTERESTED", label: "Çok İlgili / Tekrar Aranacak", suggestedDays: 2 },
  { value: "UNREACHABLE", label: "Ulaşılamadı / Cevap Yok", suggestedDays: 1 },
  { value: "BUSY", label: "Meşgul / Sonra Ara Dedi", suggestedDays: 1 },
  { value: "UNINTERESTED", label: "İlgilenmiyor", suggestedDays: 0 },
  { value: "REGISTERED", label: "Kayıt Oldu", suggestedDays: 0 },
];

interface Props {
  lead: CRMLeadRow;
  advisors?: { id: string; fullName: string }[];
  notes?: CRMAdvisorNote[];
  onClose: () => void;
}

export function LeadDetailModal({
  lead,
  advisors = [],
  onClose,
}: Props) {
  const [editState, editAction] = useFormState(
    updateLead.bind(null, lead.id),
    { success: false, error: "" },
  );
  const [callSaved, setCallSaved] = useState(false);
  const [callOutcome, setCallOutcome] = useState("REACHED");
  const [callNotes, setCallNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  // Suggested next follow-up date when call outcome changes
  const defaultFollowUpStr = lead.followUpAt
    ? new Date(lead.followUpAt).toISOString().slice(0, 10)
    : "";
  const [nextFollowUpDate, setNextFollowUpDate] = useState(defaultFollowUpStr);

  function handleOutcomeSelect(outcomeVal: string) {
    const found = CALL_OUTCOMES.find((o) => o.value === outcomeVal);
    if (found && found.suggestedDays > 0) {
      const next = new Date();
      next.setDate(next.getDate() + found.suggestedDays);
      setNextFollowUpDate(next.toISOString().slice(0, 10));
    }
  }

  function handleConvert() {
    if (
      !confirm(
        `"${lead.fullName}" adlı adayı kayıtlı öğrenciye dönüştürmek istediğinize emin misiniz?`,
      )
    )
      return;
    startTransition(() => {
      convertLeadToStudent(lead.id);
    });
  }

  function handlePostpone(days: number) {
    startTransition(() => {
      postponeLeadFollowUp(lead.id, days);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ── Modal Header ──────────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-slate-200 bg-[#0f172a] p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1e3a8a] text-sky-300 text-lg font-black border border-sky-400/30">
              {lead.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{lead.fullName}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <LeadStatusBadge status={lead.status} />
                <ProgramBadge program={lead.program as Program} showIcon />
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                  Arama Sayısı: {lead.callCount ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lead.status !== "REGISTERED" && (
              <button
                type="button"
                onClick={handleConvert}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Kesin Kayıt (Öğrenciye Aktar)
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────── */}
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* LEFT 7 COLS: Full Lead Edit Form (§2) */}
          <div className="lg:col-span-7 p-6 space-y-5 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0f172a] uppercase tracking-wider">
                Aday Bilgilerini Düzenle (Tüm Alanlar)
              </h3>
              {editState.success && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> Güncellendi
                </span>
              )}
            </div>

            {!editState.success && editState.error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span>{editState.error}</span>
              </div>
            )}

            <form action={editAction} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    defaultValue={lead.fullName}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#0f172a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Telefon Numarası
                  </label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={lead.phone}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#0f172a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    E-Posta Adresi
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={lead.email}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#0f172a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Şehir
                  </label>
                  <input
                    type="text"
                    name="city"
                    defaultValue={lead.city ?? ""}
                    placeholder="Örn: İstanbul, Ankara, İzmir"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#0f172a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Program
                  </label>
                  <select
                    name="program"
                    defaultValue={lead.program}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    {Object.entries(PROGRAM_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Aday Durumu
                  </label>
                  <select
                    name="status"
                    defaultValue={lead.status}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Kaynak
                  </label>
                  <select
                    name="source"
                    defaultValue={lead.source}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    {Object.entries(LEAD_SOURCE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Atanan Danışman
                  </label>
                  <select
                    name="advisorId"
                    defaultValue={lead.advisorId ?? ""}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="">Atanmamış</option>
                    {advisors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Sponsor (WAT / Kamp)
                  </label>
                  <select
                    name="sponsor"
                    defaultValue={lead.sponsor ?? ""}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="">Belirtilmedi</option>
                    <option value="AWA">AWA</option>
                    <option value="UWT">UWT</option>
                    <option value="IEE">IEE</option>
                    <option value="Life Adventures">Life Adventures</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Vize Durumu
                  </label>
                  <select
                    name="visaStatus"
                    defaultValue={lead.visaStatus ?? ""}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="">Belirtilmedi</option>
                    <option value="PENDING">Beklemede</option>
                    <option value="APPOINTMENT_SET">Randevu Alındı</option>
                    <option value="APPROVED">Onaylandı</option>
                    <option value="REJECTED">Reddedildi</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Sonraki Aranma / Takip Tarihi (Follow-Up)
                  </label>
                  <input
                    type="date"
                    name="followUpAt"
                    defaultValue={defaultFollowUpStr}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Görüşme Detayı &amp; Notlar
                  </label>
                  <textarea
                    name="notes"
                    rows={4}
                    defaultValue={lead.notes ?? ""}
                    placeholder="Adayın İngilizce seviyesi, üniversitesi, bütçesi ve özel notlar…"
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <SaveButton label="Lead Bilgilerini Güncelle" />
              </div>
            </form>
          </div>

          {/* RIGHT 5 COLS: Call Outcome Logger & Follow-Up Postpone (§2) */}
          <div className="lg:col-span-5 bg-slate-50/70 p-6 space-y-5 overflow-y-auto">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-[#1e3a8a]" />
                  <h3 className="text-sm font-bold text-[#0f172a]">
                    Arama Sonucu &amp; Follow-Up Gir
                  </h3>
                </div>
                {callSaved && (
                  <span className="text-xs font-bold text-emerald-600">
                    ✓ Kaydedildi
                  </span>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setCallSaved(false);
                  startTransition(async () => {
                    const res = await logLeadCall(
                      lead.id,
                      callOutcome,
                      callNotes,
                      nextFollowUpDate,
                    );
                    if (res.success) {
                      setCallSaved(true);
                      setCallNotes("");
                    }
                  });
                }}
                className="space-y-3"
              >
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Arama Sonucu
                  </label>
                  <select
                    name="outcome"
                    value={callOutcome}
                    onChange={(e) => {
                      setCallOutcome(e.target.value);
                      handleOutcomeSelect(e.target.value);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900"
                  >
                    {CALL_OUTCOMES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Önerilen / Sonraki Follow-Up Tarihi
                  </label>
                  <input
                    type="date"
                    name="nextFollowUpAt"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Görüşme Özeti
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="Örn: Öğrenciye fiyat bilgisi verildi, ailesiyle konuşup Cuma günü dönecek…"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-1.5 rounded-xl bg-[#0f172a] px-4 py-2 text-xs font-bold text-white hover:bg-[#1e3a8a] disabled:opacity-50"
                  >
                    {isPending
                      ? "Kaydediliyor…"
                      : "Aramayı Kaydet & Takibi Güncelle"}
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Follow-Up Postpone Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <CalendarClock className="h-4 w-4 text-amber-600" />
                <span>Tek Tıkla Follow-Up Ertele</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { d: 1, label: "Yarına Ertele (+1G)" },
                  { d: 3, label: "+3 Gün Ertele" },
                  { d: 7, label: "Haftaya Ertele (+7G)" },
                ].map((btn) => (
                  <button
                    key={btn.d}
                    type="button"
                    onClick={() => handlePostpone(btn.d)}
                    disabled={isPending}
                    className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-2 text-[11px] font-bold text-slate-700 hover:bg-[#0f172a] hover:text-white transition-colors"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick WhatsApp Card */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-950">
                  Hızlı WhatsApp İletişimi
                </p>
                <p className="text-[11px] text-emerald-700">{lead.phone}</p>
              </div>
              <a
                href={`https://wa.me/90${lead.phone.replace(/\D/g, "").replace(/^0/, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp Aç
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
