// components/crm/students/modal/tabs/HistoryTab.tsx
"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  Pin,
  PinOff,
  Plus,
  MessageSquarePlus,
  User,
  Clock,
  PhoneCall,
  MessageCircle,
  Mail,
} from "lucide-react";
import type { CRMAdvisorNote, CRMStudentDetail } from "@/types/crm";
import { PROGRAM_LABELS } from "@/types/crm";
import { EmailComposeModal } from "@/components/crm/common/EmailComposeModal";
import { createAdvisorNote, toggleNotePin } from "@/actions/crm/notes";
import { formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0f172a] py-2.5 text-xs font-bold text-white hover:bg-[#1e3a8a] disabled:opacity-50 transition-colors"
    >
      <Plus className="h-3.5 w-3.5 text-sky-400" />
      {pending ? "Kaydediliyor…" : "Notu Kaydet"}
    </button>
  );
}

function extractNoteTitleAndBody(rawNote: string): {
  title: string;
  body: string;
  badgeClass: string;
} {
  const match = rawNote.match(/^\[([^\]]+)\]:?\s*([\s\S]*)$/);
  const title = match ? match[1].trim() : "Danışman Notu";
  const body = match ? match[2].trim() || rawNote : rawNote;

  const t = title.toLowerCase();
  let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
  if (t.includes("e-posta") || t.includes("mail")) {
    badgeClass = "bg-sky-50 text-sky-700 border-sky-200";
  } else if (t.includes("vize") || t.includes("evrak")) {
    badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
  } else if (t.includes("whatsapp") || t.includes("görüşme")) {
    badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (t.includes("muhasebe") || t.includes("ödeme") || t.includes("taksit")) {
    badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
  }

  return { title, body, badgeClass };
}

interface Props {
  notes: CRMAdvisorNote[];
  studentId: string;
  student?: CRMStudentDetail;
}

export function HistoryTab({ notes, studentId, student }: Props) {
  const [noteState, noteAction] = useFormState(
    createAdvisorNote.bind(null, studentId),
    { success: false, error: "" },
  );
  const [noteTitle, setNoteTitle] = useState("Görüşme Notu");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Pinned notes first, then chronological descending (newest on top)
  const sorted = [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const cleanWaPhone = (student?.user.phone || "")
    .replace(/\D/g, "")
    .replace(/^0/, "");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* SOL KOLON (7/12 — Yarıdan Geniş): SADECE Yukarıdan Aşağıya Not Kartları */}
      <div className="lg:col-span-7 flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0f172a]">
            Görüşme Detayı &amp; Notlar
          </h3>
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">
            {sorted.length} Kayıt
          </span>
        </div>

        <div className="max-h-[420px] overflow-y-auto space-y-2.5 pr-1">
          {sorted.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-6 text-center">
              <MessageSquarePlus className="h-7 w-7 text-slate-300 mb-2" />
              <p className="text-xs font-medium text-slate-400">
                Henüz kayıtlı görüşme veya danışman notu bulunmuyor.
              </p>
            </div>
          ) : (
            sorted.map((note) => {
              const parsed = extractNoteTitleAndBody(note.note);
              const pLower = parsed.title.toLowerCase();
              const isLog =
                !note.isPinned &&
                (pLower.includes("log") ||
                  ((pLower.includes("mail") || pLower.includes("whatsapp")) &&
                    parsed.body.length < 90));

              if (isLog) {
                return (
                  <div
                    key={note.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-2xs hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="text-slate-300 font-mono text-[10px]">---</span>
                      <span className="inline-flex items-center gap-1 font-bold text-[#1e3a8a] text-[11px] shrink-0">
                        {pLower.includes("mail")
                          ? "✉️"
                          : pLower.includes("whatsapp")
                          ? "💬"
                          : "⚡"}
                        {parsed.title}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="truncate text-slate-700 font-medium text-[11px]">
                        {parsed.body}
                      </span>
                      <span className="text-slate-300 font-mono text-[10px]">---</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-600">
                        {(note.authorName || "Danışman").replace(/\s*\(\s*Danışman\s*\)/gi, "")}
                      </span>
                      <span className="tabular-nums font-mono">
                        {formatDateTime(note.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={note.id}
                  className={cn(
                    "group relative rounded-xl border px-3.5 py-2.5 shadow-2xs transition-colors",
                    note.isPinned
                      ? "border-amber-200 bg-amber-50/70"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5 mb-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${parsed.badgeClass}`}
                      >
                        {parsed.title}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                        <User className="h-3 w-3 text-slate-400" />
                        {(note.authorName || "Danışman").replace(/\s*\(\s*Danışman\s*\)/gi, "")}
                      </span>
                      {note.isPinned && (
                        <span className="text-[10px] font-bold text-amber-600">
                          📌 Sabitli
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 tabular-nums">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {formatDateTime(note.createdAt)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          startTransition(() => {
                            void toggleNotePin(note.id, !note.isPinned);
                          })
                        }
                        disabled={isPending}
                        className="hidden items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-amber-600 group-hover:inline-flex"
                      >
                        {note.isPinned ? (
                          <PinOff className="h-3 w-3" />
                        ) : (
                          <Pin className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                    {parsed.body}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SAĞ KOLON (5/12): ÜSTTE YENİ NOT + ALTTA HIZLI İLETİŞİM KANALLARI */}
      <div className="lg:col-span-5 space-y-4">
        {/* 1. Üst: Yeni Not Ekleme Kartı */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <h4 className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
            <Plus className="h-4 w-4 text-[#1e3a8a]" />
            Yeni Not Ekle
          </h4>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-600">
              Not Başlığı / Türü
            </label>
            <select
              name="noteTitleSelector"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#0f172a] focus:outline-none"
            >
              <optgroup label="İletişim & Çağrı">
                <option value="Görüşme Notu">📞 Görüşme Notu</option>
                <option value="WhatsApp Görüşmesi">💬 WhatsApp Görüşmesi</option>
              </optgroup>
              <optgroup label="Süreç & Operasyon">
                <option value="Vize & Evrak Notu">📁 Vize & Evrak Notu</option>
                <option value="İş / Okul Yerleştirme">🎓 İş / Okul Yerleştirme</option>
                <option value="Ödeme & Taksit Notu">💳 Ödeme & Taksit Notu</option>
              </optgroup>
              <optgroup label="Danışman Notu">
                <option value="Özel Not">🔒 Özel Not</option>
              </optgroup>
            </select>
          </div>

          <form action={noteAction} className="space-y-2.5">
            <input type="hidden" name="noteTitle" value={noteTitle} />
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-600">
                Not İçeriği
              </label>
              <textarea
                name="note"
                rows={4}
                placeholder="Öğrenciyle ilgili görüşme, vize, evrak veya ödeme notunuzu buraya yazın…"
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-[#0f172a] focus:outline-none"
              />
            </div>
            {!noteState.success && noteState.error && (
              <p className="text-xs text-red-600">{noteState.error}</p>
            )}
            <SubmitButton />
          </form>
        </div>

        {/* 2. Alt: Hızlı İletişim Kanalları (Soldan Sağa Tam Genişlik) */}
        {student && (
          <div className="space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Hızlı İletişim Kanalları
            </p>

            {/* WhatsApp Kartı */}
            <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 transition-all">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <MessageCircle className="h-5 w-5" />
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
                  href={`https://wa.me/90${cleanWaPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-xs transition-colors shrink-0"
                >
                  <MessageCircle className="h-4 w-4" />
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
        )}
      </div>

      {showEmailModal && student && (
        <EmailComposeModal
          recipientName={student.user.fullName}
          recipientEmail={student.user.email}
          programLabel={PROGRAM_LABELS[student.program]}
          studentId={student.id}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </div>
  );
}
