// components/crm/leads/LeadDetailModal.tsx
"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  X,
  UserPlus,
  Save,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  User,
  Clock,
  Plus,
  FileText,
  PhoneCall,
  Sparkles,
  PhoneMissed,
  Ban,
  MessageSquare,
  Wallet,
  Lock,
  ChevronDown,
  Eye,
  EyeOff,
  Check,
  UserCheck,
  Building2,
  ShieldCheck,
  Calendar,
  GraduationCap,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { CRMLeadRow, CRMAdvisorNote, Program } from "@/types/crm";
import {
  LEAD_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
  PROGRAM_LABELS,
} from "@/types/crm";
import { LeadStatusBadge } from "./LeadStatusBadge";
import { ProgramBadge } from "@/components/crm/common/ProgramBadge";
import { EmailComposeModal } from "@/components/crm/common/EmailComposeModal";
import { formatTurkishPhone } from "@/lib/utils/phone";
import {
  updateLead,
  logLeadCall,
  logLeadCommunicationEvent,
  postponeLeadFollowUp,
  convertLeadToStudent,
} from "@/actions/crm/leads";

interface ParsedNoteItem {
  id: string;
  dateTime: string;
  author: string;
  sourceOrTitle: string;
  content: string;
  isLog: boolean;
}

function cleanAdvisorLabel(rawName?: string | null): string {
  if (!rawName || !rawName.trim()) return "Atanmamış";
  // Strip duplicate "(Danışman)" if present
  return rawName.replace(/\s*\(\s*Danışman\s*\)/gi, "").trim();
}

function getBadgeStyleForSource(
  sourceOrTitle: string,
  content = "",
): { style: string; icon: React.ElementType; label: string } {
  const s = sourceOrTitle.toLowerCase();
  const c = content.toLowerCase();

  if (s.includes("kayıt")) {
    return {
      style: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle2,
      label: sourceOrTitle,
    };
  }
  if (s.includes("ulaşıldı") || s.includes("görüşüldü")) {
    return {
      style: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: PhoneCall,
      label: sourceOrTitle,
    };
  }
  if (s.includes("ilgili") || s.includes("ilgileniyor")) {
    return {
      style: "bg-blue-50 text-blue-700 border-blue-200",
      icon: Sparkles,
      label: sourceOrTitle,
    };
  }
  if (s.includes("meşgul") || s.includes("sonra ara")) {
    return {
      style: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Clock,
      label: sourceOrTitle,
    };
  }
  if (s.includes("ulaşılamadı") || s.includes("cevap yok")) {
    return {
      style: "bg-rose-50 text-rose-700 border-rose-200",
      icon: PhoneMissed,
      label: sourceOrTitle,
    };
  }
  if (s.includes("ilgilenmiyor")) {
    return {
      style: "bg-slate-100 text-slate-700 border-slate-200",
      icon: Ban,
      label: sourceOrTitle,
    };
  }
  if (s.includes("whatsapp") || c.includes("whatsapp")) {
    return {
      style: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: MessageCircle,
      label: "WhatsApp üzerinden görüşme açıldı",
    };
  }
  if (
    s.includes("e-posta") ||
    s.includes("mail") ||
    c.includes("e-posta") ||
    c.includes("mail")
  ) {
    return {
      style: "bg-sky-50 text-sky-700 border-sky-200",
      icon: Mail,
      label: "E-Posta Gönderildi",
    };
  }
  if (s.includes("profil") || s.includes("bütçe")) {
    return {
      style: "bg-purple-50 text-purple-700 border-purple-200",
      icon: Wallet,
      label: sourceOrTitle,
    };
  }
  if (s.includes("vize") || s.includes("evrak")) {
    return {
      style: "bg-indigo-50 text-indigo-700 border-indigo-200",
      icon: FileText,
      label: sourceOrTitle,
    };
  }
  if (s.includes("özel")) {
    return {
      style: "bg-slate-100 text-slate-700 border-slate-200",
      icon: Lock,
      label: sourceOrTitle,
    };
  }
  return {
    style: "bg-slate-100 text-slate-700 border-slate-200",
    icon: MessageSquare,
    label: s === "log" ? "İletişim Logu" : sourceOrTitle,
  };
}

function isSingleLineLogItem(sourceOrTitle: string, content: string): boolean {
  const s = sourceOrTitle.toLowerCase().trim();
  const c = content.toLowerCase().trim();

  // ONLY true system events generated automatically
  if (s === "log" || s === "sistem logu" || s.startsWith("log ·")) return true;
  if (s.includes("whatsapp") || c.includes("whatsapp")) return true;
  if (s.includes("e-posta") || c.includes("e-posta") || c.startsWith("konu:")) return true;
  if (c.startsWith("---") && c.endsWith("---")) return true;

  return false;
}

function parseLeadNotes(
  rawNotes: string | null | undefined,
  lead: CRMLeadRow,
): ParsedNoteItem[] {
  if (!rawNotes || !rawNotes.trim()) return [];

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

  const items: ParsedNoteItem[] = blocks.map((block, idx) => {
    const bracketMatch = block.match(/^\[([^\]]+)\]:\s*([\s\S]*)$/);
    if (bracketMatch) {
      const header = bracketMatch[1].trim();
      const content = (bracketMatch[2].trim() || "—")
        .replace(/^---\s*/, "")
        .replace(/\s*---$/, "")
        .trim();

      if (header.includes("·")) {
        const parts = header.split("·").map((p) => p.trim());
        const title = parts.slice(2).join(" · ") || "Görüşme Notu";
        return {
          id: `note-${idx}`,
          dateTime: parts[0] || createdFallbackDate,
          author: cleanAdvisorLabel(parts[1] || lead.advisorName),
          sourceOrTitle: title,
          content,
          isLog: isSingleLineLogItem(title, content),
        };
      }

      if (header.includes(" - ")) {
        const parts = header.split(" - ").map((p) => p.trim());
        const title = parts[2] || "Hızlı Not";
        return {
          id: `note-${idx}`,
          dateTime: parts[0] || createdFallbackDate,
          author: cleanAdvisorLabel(parts[1] || lead.advisorName),
          sourceOrTitle: title,
          content,
          isLog: isSingleLineLogItem(title, content),
        };
      }

      return {
        id: `note-${idx}`,
        dateTime: header,
        author: cleanAdvisorLabel(lead.advisorName),
        sourceOrTitle: "Görüşme Notu",
        content,
        isLog: isSingleLineLogItem("Görüşme Notu", content),
      };
    }

    // Plain-text initial note
    let inferredTitle = `İlk Kayıt (${sourceLabel})`;
    if (block.startsWith("Meta Lead")) inferredTitle = "Meta Lead Ads";
    else if (block.startsWith("Google Ads")) inferredTitle = "Google Ads";
    else if (block.startsWith("Toplu Aktarım")) inferredTitle = "Toplu Excel Aktarımı";

    return {
      id: `note-${idx}`,
      dateTime: createdFallbackDate,
      author: cleanAdvisorLabel(lead.advisorName || "Sistem"),
      sourceOrTitle: inferredTitle,
      content: block,
      isLog: false,
    };
  });

  // Newest items on top
  return items.reverse();
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

export interface OutcomeOption {
  value: string;
  label: string;
  icon: React.ElementType;
  iconColor: string;
}

export const ALL_OUTCOMES: OutcomeOption[] = [
  {
    value: "Ulaşıldı / Görüşüldü",
    label: "Ulaşıldı / Görüşüldü",
    icon: PhoneCall,
    iconColor: "text-emerald-600",
  },
  {
    value: "Meşgul / Sonra Ara",
    label: "Meşgul / Sonra Ara",
    icon: Clock,
    iconColor: "text-amber-500",
  },
  {
    value: "Ulaşılamadı / Cevap Yok",
    label: "Ulaşılamadı / Cevap Yok",
    icon: PhoneMissed,
    iconColor: "text-rose-500",
  },
  {
    value: "WhatsApp Görüşmesi",
    label: "WhatsApp Görüşmesi",
    icon: MessageCircle,
    iconColor: "text-emerald-600",
  },
  {
    value: "İlgilenmiyor",
    label: "İlgilenmiyor",
    icon: Ban,
    iconColor: "text-slate-400",
  },
  {
    value: "Kayıt Oldu",
    label: "Kayıt Oldu (Kesin Kayıt)",
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
  },
];

const UNIFIED_CALL_OUTCOMES = ALL_OUTCOMES;

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
  const [selectedOutcome, setSelectedOutcome] = useState("Ulaşıldı / Görüşüldü");
  const [unifiedNoteText, setUnifiedNoteText] = useState("");
  const [editPhone, setEditPhone] = useState(formatTurkishPhone(lead.phone || ""));
  const [saveToast, setSaveToast] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string>(lead.program);
  const [isPending, startTransition] = useTransition();
  const [hideLogs, setHideLogs] = useState(false);

  const [isOutcomeOpen, setIsOutcomeOpen] = useState(false);
  const outcomeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        outcomeDropdownRef.current &&
        !outcomeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsOutcomeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const currentOutcomeItem =
    ALL_OUTCOMES.find((o) => o.value === selectedOutcome) || ALL_OUTCOMES[0];
  const CurrentOutcomeIcon = currentOutcomeItem?.icon || PhoneCall;

  const defaultFollowUpStr = lead.followUpAt
    ? new Date(lead.followUpAt).toISOString().slice(0, 10)
    : "";
  const [nextFollowUpDate, setNextFollowUpDate] = useState(defaultFollowUpStr);

  useEffect(() => {
    setLocalNotes(lead.notes ?? "");
  }, [lead.notes]);

  useEffect(() => {
    if (editState.success) {
      if (editState.updatedNotes !== undefined) {
        setLocalNotes(editState.updatedNotes ?? "");
      }
    }
  }, [editState]);

  const parsedItems = parseLeadNotes(localNotes, lead);
  const displayedItems = hideLogs
    ? parsedItems.filter((item) => !item.isLog)
    : parsedItems;

  function handleOutcomeChange(val: string) {
    setSelectedOutcome(val);
  }

  function handleSaveUnifiedNote(e: React.FormEvent) {
    e.preventDefault();
    if (!unifiedNoteText.trim()) return;

    setSaveToast(false);
    startTransition(async () => {
      const res = await logLeadCall(
        lead.id,
        selectedOutcome,
        unifiedNoteText.trim(),
        nextFollowUpDate || null,
      );
      if (res.success) {
        if (res.updatedNotes !== undefined) {
          setLocalNotes(res.updatedNotes ?? "");
        }
        setUnifiedNoteText("");
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 2500);
      }
    });
  }

  function handlePostpone(days: number) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + days);
    setNextFollowUpDate(nextDate.toISOString().slice(0, 10));

    startTransition(async () => {
      const res = await postponeLeadFollowUp(lead.id, days);
      if (res.success && res.newFollowUpAt) {
        setNextFollowUpDate(new Date(res.newFollowUpAt).toISOString().slice(0, 10));
      }
    });
  }

  function handleLogEvent(eventLabel: string) {
    startTransition(async () => {
      const res = await logLeadCommunicationEvent(lead.id, eventLabel);
      if (res.success && res.updatedNotes !== undefined) {
        setLocalNotes(res.updatedNotes ?? "");
      }
    });
  }

  function handleConvert() {
    if (
      !confirm(
        `"${lead.fullName}" adlı adayı kesin kayıtlı öğrenciye dönüştürmek istediğinize emin misiniz?`,
      )
    )
      return;
    startTransition(() => {
      convertLeadToStudent(lead.id);
    });
  }

  const cleanWaPhone = lead.phone ? lead.phone.replace(/\D/g, "").replace(/^0/, "") : "";
  const hasValidPhone = Boolean(lead.phone && lead.phone !== "Belirtilmedi" && cleanWaPhone.length >= 7);
  const hasValidEmail = Boolean(lead.email && !lead.email.includes("@advice.internal"));
  const advisorDisplay = cleanAdvisorLabel(lead.advisorName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="flex h-full max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ── 1. ÜST PROFİL KARTI (Larger Profile Card Header) ────────────────── */}
        <div className="border-b border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Sol Bölüm: Büyük Avatar + İsim + İletişim Bilgileri */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200/80 text-slate-400 shadow-2xs ring-2 ring-slate-100">
                <User className="h-8 w-8 stroke-[1.6]" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                    {lead.fullName}
                  </h2>
                  <ProgramBadge program={lead.program as Program} showIcon size="sm" />
                  <LeadStatusBadge status={lead.status} />
                </div>

                {/* Telefon, E-Posta ve Şehir: İsim altında tatlı ikonlarla */}
                <div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {hasValidPhone ? lead.phone : "Telefon Yok"}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {hasValidEmail ? lead.email : "E-Posta Yok"}
                  </span>
                  {lead.city && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {lead.city}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Orta/Sağ Bölüm: Danışman & Takip İstatistikleri + Aksiyonlar */}
            <div className="flex flex-wrap items-center gap-4 lg:gap-6">
              {/* Danışman & Takip Bilgileri */}
              <div className="space-y-0.5 text-right text-xs">
                <p className="font-semibold text-slate-700">
                  Danışman:{" "}
                  <strong className="font-bold text-[#1e3a8a]">
                    {advisorDisplay}
                  </strong>
                </p>
                <p className="text-[11px] text-slate-500">
                  Takip:{" "}
                  <strong className="text-slate-800">
                    {lead.followUpAt
                      ? new Date(lead.followUpAt).toLocaleDateString("tr-TR")
                      : "Planlanmadı"}
                  </strong>{" "}
                  · Toplam Arama:{" "}
                  <strong className="text-slate-800 font-bold">
                    {lead.callCount ?? 0}
                  </strong>
                </p>
              </div>

              {/* Butonlar: Kesin Kayıt + Kapat */}
              <div className="flex items-center gap-2">
                {lead.status !== "REGISTERED" && (
                  <button
                    type="button"
                    onClick={handleConvert}
                    disabled={isPending}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    <UserPlus className="h-4 w-4" />
                    Kesin Kayıt
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. ALT SEKME BARI (Tabs Below Profile Card) ───────────── */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6">
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
              <FileText className="h-3.5 w-3.5 text-[#1e3a8a]" />
              Notlar &amp; İletişim ({parsedItems.length})
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
              Profil &amp; Kayıt Bilgilerini Düzenle
            </button>
          </div>

          {editState.success && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Bilgiler Güncellendi
            </span>
          )}
        </div>

        {/* ── 3. SEKME İÇERİĞİ ──────────────────────────────────────── */}
        {activeTab === "communication" ? (
          <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* SOL KOLON (7/12 — Yarıdan Geniş): SADECE Yukarıdan Aşağıya Not & Log Akışı */}
            <div className="lg:col-span-7 flex flex-col overflow-hidden bg-slate-50/40 p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                <h3 className="text-sm font-bold text-[#0f172a]">
                  Görüşme Detayı &amp; İletişim Logları
                </h3>

                {/* Logları Gizle / Göster Easy Toggle */}
                <button
                  type="button"
                  onClick={() => setHideLogs(!hideLogs)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all border",
                    hideLogs
                      ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-2xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100",
                  )}
                >
                  {hideLogs ? (
                    <>
                      <Eye className="h-3.5 w-3.5 text-sky-300" />
                      Sadece Notlar
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                      Logları Gizle
                    </>
                  )}
                </button>

                <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600">
                  {displayedItems.length} Kayıt
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {displayedItems.length === 0 ? (
                  <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-slate-400">
                    <FileText className="h-6 w-6 mb-1.5 text-slate-300" />
                    <p className="text-xs font-medium">
                      {hideLogs
                        ? "Kayıtlı görüşme notu bulunmuyor (Loglar gizlendi)."
                        : "Henüz kayıtlı görüşme veya iletişim logu bulunmuyor."}
                    </p>
                  </div>
                ) : (
                  displayedItems.map((item) => {
                    const badgeMeta = getBadgeStyleForSource(
                      item.sourceOrTitle,
                      item.content,
                    );
                    const BadgeIcon = badgeMeta.icon;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "rounded-xl border transition-colors",
                          item.isLog
                            ? "border-slate-200/90 bg-slate-50/70 p-2.5 shadow-2xs hover:border-slate-300"
                            : "border-slate-200 bg-white p-3 shadow-2xs hover:border-slate-300",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold shrink-0",
                                badgeMeta.style,
                              )}
                            >
                              <BadgeIcon className="h-3 w-3" />
                              {badgeMeta.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 text-[10px] text-slate-500 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                              <User className="h-3 w-3 text-slate-400" />
                              {item.author}
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono text-slate-400 tabular-nums">
                              <Clock className="h-3 w-3 text-slate-400" />
                              {item.dateTime}
                            </span>
                          </div>
                        </div>

                        {/* E-Posta konusu veya detay log içeriği (WhatsApp metni duplicate edilmez) */}
                        {item.isLog &&
                          item.content &&
                          !item.content.includes("üzerinden görüşme açıldı") && (
                            <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 text-xs font-semibold text-slate-700">
                              {item.content}
                            </div>
                          )}

                        {!item.isLog && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                              {item.content}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* SAĞ KOLON (5/12): ÜSTTE BİRLEŞİK NOT/ARAMA GİRİŞİ + ALTTA HIZLI İLETİŞİM KANALLARI */}
            <div className="lg:col-span-5 overflow-y-auto bg-white p-5 space-y-4">
              {/* 1. ÜST: Birleşik Görüşme Notu & Follow-Up Kaydı */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Plus className="h-4 w-4 text-[#1e3a8a]" />
                    <h4 className="text-xs font-bold text-[#0f172a]">
                      Not, Görüşme &amp; Takip (Follow-Up) Kaydı
                    </h4>
                  </div>
                  {saveToast && (
                    <span className="text-[11px] font-bold text-emerald-600">
                      ✓ Kaydedildi
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveUnifiedNote} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* 1. Kayıt Türü / Sonuç Dropdown */}
                    <div className="relative" ref={outcomeDropdownRef}>
                      <label className="mb-1 block text-[11px] font-bold text-slate-600">
                        Kayıt Türü / Sonuç
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsOutcomeOpen(!isOutcomeOpen)}
                        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-100 transition-colors focus:border-[#0f172a] focus:outline-none"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <CurrentOutcomeIcon
                            className={cn(
                              "h-3.5 w-3.5 shrink-0",
                              currentOutcomeItem?.iconColor || "text-slate-500",
                            )}
                          />
                          <span className="truncate">
                            {currentOutcomeItem?.label || selectedOutcome}
                          </span>
                        </div>
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200",
                            isOutcomeOpen && "rotate-180",
                          )}
                        />
                      </button>

                      {isOutcomeOpen && (
                        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[240px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                          <div className="space-y-0.5">
                            {ALL_OUTCOMES.map((item) => {
                              const Icon = item.icon;
                              const isSelected = selectedOutcome === item.value;
                              return (
                                <button
                                  key={item.value}
                                  type="button"
                                  onClick={() => {
                                    handleOutcomeChange(item.value);
                                    setIsOutcomeOpen(false);
                                  }}
                                  className={cn(
                                    "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs text-left transition-colors",
                                    isSelected
                                      ? "bg-slate-100 font-bold text-slate-900"
                                      : "text-slate-700 hover:bg-slate-50 font-medium",
                                  )}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <Icon
                                      className={cn(
                                        "h-3.5 w-3.5 shrink-0",
                                        item.iconColor,
                                      )}
                                    />
                                    <span className="truncate">
                                      {item.label}
                                    </span>
                                  </div>
                                  {isSelected && (
                                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. Sonraki Takip Tarihi (Label -> Butonlar -> Date Picker) */}
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-slate-600">
                        Sonraki Takip Tarihi
                      </label>
                      {/* Butonlar */}
                      <div className="mb-1.5 flex items-center gap-1.5">
                        {[
                          { d: 1, label: "+1 Gün" },
                          { d: 3, label: "+3 Gün" },
                          { d: 7, label: "+7 Gün" },
                        ].map((btn) => (
                          <button
                            key={btn.d}
                            type="button"
                            onClick={() => handlePostpone(btn.d)}
                            disabled={isPending}
                            title={`Takip tarihini bugünden ${btn.d} gün sonraya ayarla`}
                            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-1 text-center text-[10px] font-bold text-slate-600 hover:bg-[#0f172a] hover:text-white hover:border-[#0f172a] transition-colors"
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                      {/* Date Picker */}
                      <input
                        type="date"
                        value={nextFollowUpDate}
                        onChange={(e) => setNextFollowUpDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-[#0f172a] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-slate-600">
                      Görüşme Notu / Detay
                    </label>
                    <textarea
                      rows={3}
                      value={unifiedNoteText}
                      onChange={(e) => setUnifiedNoteText(e.target.value)}
                      placeholder="Görüşme özeti, bütçe, talep veya adayın son durumunu yazın…"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-[#0f172a] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPending || !unifiedNoteText.trim()}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0f172a] py-2.5 text-xs font-bold text-white hover:bg-[#1e3a8a] disabled:opacity-40 transition-colors shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5 text-sky-400" />
                    {isPending ? "Kaydediliyor…" : "Not & Takip Bilgisini Kaydet"}
                  </button>
                </form>
              </div>

              {/* 2. ALT: Hızlı İletişim Kanalları */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Hızlı İletişim Kanalları
                </p>

                {/* WhatsApp Kartı */}
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 transition-all">
                  <span className="text-sm font-bold text-emerald-950 font-mono">
                    {hasValidPhone ? lead.phone : "Telefon bilgisi yok"}
                  </span>
                  {hasValidPhone ? (
                    <a
                      href={`https://wa.me/90${cleanWaPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() =>
                        handleLogEvent("WhatsApp üzerinden görüşme açıldı")
                      }
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-xs transition-colors shrink-0"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp&apos;ı Aç
                    </a>
                  ) : (
                    <span className="rounded-lg bg-slate-200/80 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                      Kayıtlı Numara Yok
                    </span>
                  )}
                </div>

                {/* E-Posta Kartı */}
                <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/70 px-3.5 py-2.5 transition-all">
                  <span className="text-sm font-semibold text-sky-950 truncate max-w-[220px]">
                    {hasValidEmail ? lead.email : "E-posta bilgisi yok"}
                  </span>
                  {hasValidEmail ? (
                    <button
                      type="button"
                      onClick={() => setShowEmailModal(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-[#1e3a8a] px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-800 shadow-xs transition-colors shrink-0"
                    >
                      <Mail className="h-4 w-4 text-sky-300" />
                      Mail Gönder
                    </button>
                  ) : (
                    <span className="rounded-lg bg-slate-200/80 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                      Kayıtlı E-Posta Yok
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: Profil & Kayıt Bilgilerini Düzenle */
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-3xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4.5 w-4.5 text-[#1e3a8a]" />
                  <h3 className="text-sm font-bold text-[#0f172a]">
                    Aday Profil &amp; Kayıt Bilgilerini Düzenle
                  </h3>
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
                  {/* Ad Soyad */}
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <User className="h-3.5 w-3.5 text-slate-400" />
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

                  {/* Telefon Numarası */}
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      Telefon Numarası
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={editPhone}
                      onChange={(e) => setEditPhone(formatTurkishPhone(e.target.value))}
                      placeholder="(5XX) XXX XX XX"
                      required
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#0f172a] focus:outline-none"
                    />
                  </div>

                  {/* E-Posta */}
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
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

                  {/* Şehir */}
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
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

                  {/* Program */}
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
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

                  {/* Atanan Danışman */}
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <UserCheck className="h-3.5 w-3.5 text-slate-400" />
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
                          {cleanAdvisorLabel(a.fullName)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Aday Durumu */}
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
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

                  {/* Kaynak */}
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Globe className="h-3.5 w-3.5 text-slate-400" />
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

                  {/* Sponsor */}
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
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

                  {/* Vize Durumu */}
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
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

                  {/* Sonraki Takip Tarihi */}
                  <div className="sm:col-span-2">
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Sonraki Takip Tarihi (Follow-Up)
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
                  <SaveButton label="Aday Bilgilerini Güncelle" />
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
            onSuccess={() => setShowEmailModal(false)}
          />
        )}
      </div>
    </div>
  );
}
