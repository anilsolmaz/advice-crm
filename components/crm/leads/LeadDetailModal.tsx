// components/crm/leads/LeadDetailModal.tsx
"use client";

import { useFormState, useFormStatus } from "react-dom";
import { X, User, Phone, Mail, MapPin, MessageSquare, Send, UserPlus } from "lucide-react";
import type { CRMLead, CRMAdvisorNote } from "@/types/crm";
import type { Program, LeadSource } from "@prisma/client";
import { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS, PROGRAM_LABELS } from "@/types/crm";
import { LeadStatusBadge } from "./LeadStatusBadge";
import { ProgramBadge } from "@/components/crm/common/ProgramBadge";
import { updateLead, convertLeadToStudent, addLeadNote } from "@/actions/crm/leads";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { useTransition } from "react";

function NoteSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      <Send className="h-3.5 w-3.5" />
      {pending ? "Kaydediliyor…" : "Not Ekle"}
    </button>
  );
}

interface Props {
  lead: any;
  notes?: CRMAdvisorNote[];
  onClose: () => void;
}

export function LeadDetailModal({ lead, notes = [], onClose }: Props) {
  const [noteState, noteAction] = useFormState(
    addLeadNote.bind(null, lead.id),
    { success: false, error: "" },
  );
  const [isPending, startTransition] = useTransition();

  function handleConvert() {
    if (!confirm(`"${lead.fullName}" adlı adayı kayıtlı öğrenciye dönüştürmek istediğinize emin misiniz?`))
      return;
    startTransition(() => {
      convertLeadToStudent(lead.id);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ── Modal header ──────────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-lg font-bold">
              {lead.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{lead.fullName}</h2>
              <div className="mt-1 flex items-center gap-2">
                <LeadStatusBadge status={lead.status} />
                <ProgramBadge program={lead.program as Program} showIcon />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lead.status !== "REGISTERED" && (
              <button
                onClick={handleConvert}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Kesin Kayıt (Aktar)
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: details */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Contact info */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                İletişim Bilgileri
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow icon={<Mail className="h-4 w-4" />} label="E-Posta" value={lead.email} />
                <InfoRow icon={<Phone className="h-4 w-4" />} label="Telefon" value={lead.phone} />
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Kaynak"
                  value={LEAD_SOURCE_LABELS[lead.source as LeadSource] || lead.source}
                />
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Danışman"
                  value={lead.advisor?.fullName ?? "Atanmamış"}
                />
              </div>
            </section>

            {/* Program-Specific Evaluation Section */}
            <section className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <ProgramBadge program={lead.program as Program} size="sm" />
                <span>Ön Değerlendirme & Program Kriterleri</span>
              </h3>

              {lead.program === "WORK_AND_TRAVEL" && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <InfoRow label="İngilizce Seviyesi" value={lead.englishLevel || "B1 (Orta Seviye)"} />
                  <InfoRow label="Daha Önce WAT Deneyimi" value={lead.priorWat === true ? "Evet" : "Hayır (İlk Katılım)"} />
                  <InfoRow label="Üniversite & Sınıf" value={lead.universityInfo || "Belirtilmemiş"} />
                  <InfoRow label="Tercih Edilen İş / Eyalet" value={lead.jobPreference || "Genel Servis / Cankurtaran"} />
                </div>
              )}

              {lead.program === "ACADEMY" && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <InfoRow label="Hedef Ülke" value={lead.targetCountry || "İngiltere / Almanya"} />
                  <InfoRow label="Hedef Bölüm / Seviye" value={lead.targetProgram || "Yüksek Lisans (MSc)"} />
                  <InfoRow label="Diploma Notu (GPA)" value={lead.gpa || "3.20 / 4.00"} />
                  <InfoRow label="Dil Sınav Notu" value={lead.testScore || "IELTS: 6.5 (Hedef)"} />
                </div>
              )}

              {lead.program === "LANGUAGE_SCHOOL" && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <InfoRow label="Hedef Ülke" value={lead.targetCountry || "Malta / İrlanda / İngiltere"} />
                  <InfoRow label="Planlanan Eğitim Süresi" value={lead.durationWeeks ? `${lead.durationWeeks} Hafta` : "12-24 Hafta"} />
                  <InfoRow label="Mevcut Dil Düzeyi" value={lead.currentLevel || "A2 - Pre-Intermediate"} />
                  <InfoRow label="Konaklama Tercihi" value={lead.accommodation || "Aile Yanı / Yurt"} />
                </div>
              )}

              {lead.program === "SUMMER_CAMP" && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <InfoRow label="Öğrenci Yaşı / Sınıfı" value={lead.studentAge ? `${lead.studentAge} Yaş` : "12-16 Yaş Grubu"} />
                  <InfoRow label="Hedef Ülke & Kamp" value={lead.targetCountry || "İngiltere (Londra/Oxford)"} />
                  <InfoRow label="Kamp Süresi" value={lead.durationWeeks ? `${lead.durationWeeks} Hafta` : "2-3 Hafta"} />
                  <InfoRow label="Veli İletişim Bilgisi" value={lead.guardianContact || "Kayıtlı İletişim"} />
                </div>
              )}

              {lead.program === "VISA_CONSULTING" && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <InfoRow label="Hedef Ülke / Vize Türü" value={lead.targetCountry || "Schengen (Almanya / İtalya)"} />
                  <InfoRow label="Meslek / Gelir Durumu" value={lead.occupation || "Özel Sektör Çalışanı / SGK"} />
                  <InfoRow label="Geçmiş Vize Geçmişi" value={lead.travelHistory || "Daha Önce Schengen Mevcut"} />
                  <InfoRow label="Hedef Seyahat Tarihi" value={lead.travelDate || "Önümüzdeki Sezon"} />
                </div>
              )}
            </section>

            {/* Dates */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Tarih Bilgileri
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Kayıt Tarihi" value={formatDate(lead.createdAt)} />
                {lead.convertedAt && (
                  <InfoRow
                    label="Dönüştürme Tarihi"
                    value={formatDate(lead.convertedAt)}
                  />
                )}
              </div>
            </section>

            {/* Notes */}
            {lead.notes && (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Görüşme Detayı / Notlar
                </h3>
                <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {lead.notes}
                </p>
              </section>
            )}
          </div>

          {/* Right: advisor note log */}
          <div className="flex w-80 flex-shrink-0 flex-col border-l border-gray-100">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                Danışman Notları
              </h3>
            </div>

            {/* Note list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {notes.length === 0 && !lead.notes && (
                <p className="text-xs text-gray-400 text-center pt-4">
                  Henüz not eklenmemiş.
                </p>
              )}
              {lead.notes && (
                <div className="rounded-lg bg-blue-50/60 border border-blue-100/80 p-3">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                    Görüşme ve Aday Geçmişi
                  </span>
                  <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {lead.notes}
                  </div>
                </div>
              )}
              {notes.map((note) => (
                <div key={note.id} className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">
                      {note.authorName}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {formatDateTime(note.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {note.note}
                  </p>
                </div>
              ))}
            </div>

            {/* Note form */}
            <div className="border-t border-gray-100 p-4">
              <form action={noteAction} className="space-y-2">
                <textarea
                  name="note"
                  rows={3}
                  placeholder="Not ekle…"
                  className="w-full resize-none rounded-lg border border-gray-200 p-2.5 text-xs text-gray-700 placeholder-gray-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-200"
                />
                {!noteState.success && noteState.error && (
                  <p className="text-xs text-red-600">{noteState.error}</p>
                )}
                <div className="flex justify-end">
                  <NoteSubmitButton />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="mt-0.5 text-gray-400">{icon}</span>}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
          {label}
        </p>
        <p className="text-sm text-gray-700">{value ?? "—"}</p>
      </div>
    </div>
  );
}
