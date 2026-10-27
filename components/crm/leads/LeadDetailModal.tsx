// components/crm/leads/LeadDetailModal.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
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
  Mail,
  User,
  Clock,
  Plus,
  FileText,
} from "lucide-react";
import type { CRMLeadRow, CRMAdvisorNote, Program } from "@/types/crm";
import {
  LEAD_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
  PROGRAM_LABELS,
} from "@/types/crm";
import { LeadStatusBadge } from "./LeadStatusBadge";
import { ProgramBadge } from "@/components/crm/common/ProgramBadge";
import { EmailComposeModal } from "@/components/crm/common/EmailComposeModal";
import {
  updateLead,
  updateLeadStatus,
  appendLeadNoteCard,
  logLeadCall,
  postponeLeadFollowUp,
  convertLeadToStudent,
} from "@/actions/crm/leads";
import type { LeadStatus } from "@prisma/client";

interface ParsedNoteCard {
  id: string;
  dateTime: string;
  author: string;
  sourceOrTitle: string;
  content: string;
}

function getBadgeStyleForSource(sourceOrTitle: string): string {
  const s = sourceOrTitle.toLowerCase();
  if (s.includes("kayıt oldu") || s.includes("kesin kayıt")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (s.includes("ulaşıldı") || s.includes("ilgileniyor") || s.includes("çok ilgili")) {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  if (s.includes("ulaşılamadı") || s.includes("meşgul") || s.includes("cevap yok")) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (s.includes("ilgilenmiyor")) {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  if (s.includes("e-posta") || s.includes("mail")) {
    return "bg-sky-50 text-sky-700 border-sky-200";
  }
  if (s.includes("ilk kayıt") || s.includes("meta") || s.includes("google") || s.includes("web") || s.includes("aktarım")) {
    return "bg-indigo-50 text-indigo-700 border-indigo-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function parseLeadNoteCards(
  rawNotes: string | null | undefined,
  lead: CRMLeadRow,
): ParsedNoteCard[] {
  if (!rawNotes || !rawNotes.trim()) return [];

  // Split into individual blocks: each `[...]: ...` line or separated paragraph becomes its own card
  const rawLines = rawNotes.split(/\r?\n/);
  const blocks: string[] = [];
  let currentBlock = "";

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentBlock.trim()) {
        blocks.push(currentBlock.trim());
        currentBlock = "";
      }
      continue;
    }
    if (/^\[[^\]]+\]:/.test(trimmed)) {
      if (currentBlock.trim()) {
        blocks.push(currentBlock.trim());
      }
      currentBlock = trimmed;
    } else {
      currentBlock = currentBlock ? `${currentBlock}\n${trimmed}` : trimmed;
    }
  }
  if (currentBlock.trim()) {
    blocks.push(currentBlock.trim());
  }

  const createdFallbackDate = lead.createdAt
    ? new Date(lead.createdAt).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "İlk Kayıt";

  const sourceLabel = LEAD_SOURCE_LABELS[lead.source] || lead.source;

  const cards: ParsedNoteCard[] = blocks.map((block, idx) => {
    const bracketMatch = block.match(/^\[([^\]]+)\]:\s*([\s\S]*)$/);
    if (bracketMatch) {
      const header = bracketMatch[1].trim();
      const content = bracketMatch[2].trim() || "—";

      if (header.includes("·")) {
        const parts = header.split("·").map((p) => p.trim());
        return {
          id: `note-${idx}`,
          dateTime: parts[0] || createdFallbackDate,
          author: parts[1] || lead.advisorName || "Danışman",
          sourceOrTitle: parts.slice(2).join(" · ") || "Görüşme Notu",
          content,
        };
      }

      if (header.includes(" - ")) {
        const parts = header.split(" - ").map((p) => p.trim());
        return {
          id: `note-${idx}`,
          dateTime: parts[0] || createdFallbackDate,
          author: parts[1] || lead.advisorName || "Danışman",
          sourceOrTitle: parts[2] || "Hızlı Not",
          content,
        };
      }

      return {
        id: `note-${idx}`,
        dateTime: header,
        author: lead.advisorName || "Danışman",
        sourceOrTitle: "Görüşme Notu",
        content,
      };
    }

    // Plain-text initial note (e.g. "laalal" or webhook/import note)
    let inferredTitle = `İlk Kayıt Notu (${sourceLabel})`;
    if (block.startsWith("Meta Lead Ads")) {
      inferredTitle = "Meta Lead Ads";
    } else if (block.startsWith("Google Ads")) {
      inferredTitle = "Google Ads";
    } else if (block.startsWith("Toplu Aktarım:")) {
      inferredTitle = "Toplu Excel/CSV Aktarımı";
    }

    return {
      id: `note-${idx}`,
      dateTime: createdFallbackDate,
      author: lead.advisorName || "Sistem / İlk Kayıt",
      sourceOrTitle: inferredTitle,
      content: block,
    };
  });

  // Reverse so newest notes appear at the top ("son notlar üstte yer alsın")
  return cards.reverse();
}

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
  const [activeTab, setActiveTab] = useState<"communication" | "profile">(
    "communication",
  );
  const [editState, editAction] = useFormState(
    updateLead.bind(null, lead.id),
    { success: false, error: "" },
  );
  const [localNotes, setLocalNotes] = useState<string>(lead.notes ?? "");
  const [newNote, setNewNote] = useState<string>("");
  const [noteTitle, setNoteTitle] = useState<string>("Görüşme Notu");
  const [noteSavedToast, setNoteSavedToast] = useState(false);
  const [callSaved, setCallSaved] = useState(false);
  const [callOutcome, setCallOutcome] = useState("REACHED");
  const [callNotes, setCallNotes] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string>(lead.program);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLocalNotes(lead.notes ?? "");
  }, [lead.notes]);

  useEffect(() => {
    if (editState.success) {
      if (editState.updatedNotes !== undefined) {
        setLocalNotes(editState.updatedNotes ?? "");
      }
      setNewNote("");
    }
  }, [editState]);

  const parsedNoteCards = parseLeadNoteCards(localNotes, lead);

  function handleQuickNoteAdd() {
    if (!newNote.trim()) return;
    setNoteSavedToast(false);
    startTransition(async () => {
      const res = await appendLeadNoteCard(lead.id, noteTitle, newNote);
      if (res.success) {
        if (res.updatedNotes !== undefined) {
          setLocalNotes(res.updatedNotes ?? "");
        }
        setNewNote("");
        setNoteSavedToast(true);
        setTimeout(() => setNoteSavedToast(false), 2500);
      }
    });
  }

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

  const cleanWaPhone = lead.phone.replace(/\D/g, "").replace(/^0/, "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* ── Modal Header & Quick Communication Cockpit ────────────── */}
        <div className="border-b border-slate-800 bg-[#0f172a] px-5 py-4 text-white">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1e3a8a] text-sky-300 text-lg font-black border border-sky-400/30">
                {lead.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{lead.fullName}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <LeadStatusBadge status={lead.status} />
                  <ProgramBadge program={lead.program as Program} showIcon />
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                    Arama: {lead.callCount ?? 0} kez
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-sky-300">
                    Kaynak: {LEAD_SOURCE_LABELS[lead.source] || lead.source}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Communication Buttons (Always visible on top) */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`tel:${lead.phone}`}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                <PhoneCall className="h-3.5 w-3.5 text-amber-400" />
                Telefon Aç ({lead.phone})
              </a>
              <a
                href={`https://wa.me/90${cleanWaPhone}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp&apos;tan Ulaş
              </a>
              <button
                type="button"
                onClick={() => setShowEmailModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[#1e3a8a] px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 border border-sky-400/30 transition-colors"
              >
                <Mail className="h-3.5 w-3.5 text-sky-300" />
                Mail Gönder
              </button>
              {lead.status !== "REGISTERED" && (
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Kesin Kayıt
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

          {/* Summary Info Strip */}
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-slate-800/90 pt-2.5 text-[11px] text-slate-300">
            <span>
              <strong className="text-slate-400">E-Posta:</strong> {lead.email}
            </span>
            <span>
              <strong className="text-slate-400">Şehir:</strong>{" "}
              {lead.city || "Belirtilmedi"}
            </span>
            <span>
              <strong className="text-slate-400">Danışman:</strong>{" "}
              {lead.advisorName || "Atanmamış"}
            </span>
            {lead.sponsor && (
              <span>
                <strong className="text-slate-400">Sponsor:</strong>{" "}
                {lead.sponsor}
              </span>
            )}
            <span>
              <strong className="text-slate-400">Takip Tarihi:</strong>{" "}
              {lead.followUpAt
                ? new Date(lead.followUpAt).toLocaleDateString("tr-TR")
                : "Planlanmadı"}
            </span>
          </div>
        </div>

        {/* ── Tab Navigation Bar ────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("communication")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${
                activeTab === "communication"
                  ? "border-[#0f172a] bg-white text-[#0f172a]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <PhoneCall className="h-3.5 w-3.5 text-[#1e3a8a]" />
              İletişim, Çağrı &amp; Notlar ({parsedNoteCards.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${
                activeTab === "profile"
                  ? "border-[#0f172a] bg-white text-[#0f172a]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <User className="h-3.5 w-3.5 text-slate-600" />
              Aday Profil &amp; Kayıt Bilgileri
            </button>
          </div>

          {editState.success && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Bilgiler Güncellendi
            </span>
          )}
        </div>

        {/* ── Body ──────────────────────────────────────────────────── */}
        {activeTab === "communication" ? (
          <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* LEFT 7 COLS: Note Cards & Quick Note Entry (Primary Workspace) */}
            <div className="lg:col-span-7 p-5 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0f172a]">
                    Görüşme Detayı &amp; Notlar
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tüm arama kayıtları, e-postalar ve danışman notları (son eklenen en üstte)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {noteSavedToast && (
                    <span className="text-xs font-bold text-emerald-600">
                      ✓ Not eklendi
                    </span>
                  )}
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                    {parsedNoteCards.length} Kayıt
                  </span>
                </div>
              </div>

              {/* Minimal New Note Input Bar */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600">
                      Not Başlığı / Kaynak:
                    </span>
                    <select
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:border-[#0f172a] focus:outline-none"
                    >
                      <option value="Görüşme Notu">Görüşme Notu</option>
                      <option value="Aday Profil & Bütçe">
                        Aday Profil &amp; Bütçe
                      </option>
                      <option value="WhatsApp Görüşmesi">
                        WhatsApp Görüşmesi
                      </option>
                      <option value="Vize & Evrak Notu">
                        Vize &amp; Evrak Notu
                      </option>
                      <option value="Özel Not">Özel Not</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <textarea
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Adayın İngilizce seviyesi, üniversitesi, bütçesi veya görüşme detayını yazın…"
                    className="flex-1 rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-[#0f172a] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleQuickNoteAdd}
                    disabled={isPending || !newNote.trim()}
                    className="flex shrink-0 items-center gap-1 rounded-lg bg-[#0f172a] px-3.5 py-2.5 text-xs font-bold text-white hover:bg-[#1e3a8a] disabled:opacity-40 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5 text-sky-400" />
                    Not Ekle
                  </button>
                </div>
              </div>

              {/* Scrollable Minimal Note Cards (Newest First) */}
              <div className="max-h-[360px] overflow-y-auto space-y-2.5 pr-1">
                {parsedNoteCards.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-center text-slate-400">
                    <FileText className="h-6 w-6 mb-1.5 text-slate-300" />
                    <p className="text-xs font-medium">
                      Henüz kayıtlı görüşme detayı veya not bulunmuyor.
                    </p>
                  </div>
                ) : (
                  parsedNoteCards.map((card) => (
                    <div
                      key={card.id}
                      className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5 mb-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${getBadgeStyleForSource(
                              card.sourceOrTitle,
                            )}`}
                          >
                            {card.sourceOrTitle}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                            <User className="h-3 w-3 text-slate-400" />
                            {card.author}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 tabular-nums">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {card.dateTime}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                        {card.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT 5 COLS: Call Outcome Logger & Quick Follow-Up Postpone */}
            <div className="lg:col-span-5 bg-slate-50/70 p-5 space-y-4 overflow-y-auto">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
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
                        if (res.updatedNotes !== undefined) {
                          setLocalNotes(res.updatedNotes ?? "");
                        }
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

              {/* Quick Lead Status Switcher */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Hızlı Aday Durumu Değiştir
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("profile")}
                    className="text-[11px] font-bold text-[#1e3a8a] hover:underline"
                  >
                    Program / Danışman Değiştir →
                  </button>
                </div>
                <select
                  defaultValue={lead.status}
                  onChange={(e) => {
                    const nextStatus = e.target.value as LeadStatus;
                    startTransition(() => {
                      updateLeadStatus(lead.id, nextStatus);
                    });
                  }}
                  disabled={isPending}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: Profile, Program & Advisor Assignment Form */
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-3xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#0f172a]">
                    Aday Profil, Program &amp; Danışman Bilgileri
                  </h3>
                  <p className="text-xs text-slate-500">
                    Temel iletişim bilgilerini, programı veya sorumlu danışmanı buradan güncelleyebilirsiniz.
                  </p>
                </div>
              </div>

              {!editState.success && editState.error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span>{editState.error}</span>
                </div>
              )}

              {selectedProgram !== lead.program && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <strong>Departman / Program Değişikliği:</strong> Adayın programını{" "}
                  <strong>{PROGRAM_LABELS[selectedProgram as Program]}</strong> olarak
                  değiştiriyorsunuz. Adayın sizin listenizden çıkıp tamamen ilgili
                  departmana devredilmesi için aşağıdan{" "}
                  <strong>Atanan Danışman</strong> alanını da ilgili departman
                  danışmanıyla değiştirebilirsiniz.
                </div>
              )}

              <form action={editAction} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      value={selectedProgram}
                      onChange={(e) => setSelectedProgram(e.target.value)}
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
                </div>

                <div className="flex justify-end pt-3">
                  <SaveButton label="Lead Bilgilerini Güncelle" />
                </div>
              </form>
            </div>
          </div>
        )}

        {showEmailModal && (
          <EmailComposeModal
            recipientName={lead.fullName}
            recipientEmail={lead.email}
            programLabel={PROGRAM_LABELS[lead.program as Program]}
            leadId={lead.id}
            onClose={() => setShowEmailModal(false)}
          />
        )}
      </div>
    </div>
  );
}
