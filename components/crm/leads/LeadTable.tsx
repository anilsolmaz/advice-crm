// components/crm/leads/LeadTable.tsx
"use client";

import { useState, useTransition } from "react";
import {
  MoreHorizontal,
  Search,
  PhoneCall,
  CalendarClock,
  MessageCircle,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  ListFilter,
} from "lucide-react";
import type { CRMLeadRow, LeadStatus, Program } from "@/types/crm";
import {
  LEAD_STATUS_LABELS,
  PROGRAM_LABELS,
  LEAD_SOURCE_LABELS,
} from "@/types/crm";
import { LeadDetailModal } from "./LeadDetailModal";
import { ProgramBadge } from "@/components/crm/common/ProgramBadge";
import {
  updateLeadStatus,
  convertLeadToStudent,
  postponeLeadFollowUp,
} from "@/actions/crm/leads";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

const LEAD_STATUSES: LeadStatus[] = [
  "INTERESTED",
  "CONSIDERING_NEXT_YEAR",
  "UNINTERESTED",
  "NOT_CONSIDERING",
  "REGISTERED",
];

type CallTab = "ALL" | "TODAY" | "OVERDUE" | "NEVER_CALLED" | "CALLED";

interface Props {
  leads: CRMLeadRow[];
  program?: Program;
  advisors?: { id: string; fullName: string }[];
  onOpenLead?: (leadId: string) => void;
}

export function LeadTable({
  leads,
  program,
  advisors = [],
  onOpenLead,
}: Props) {
  const [callTab, setCallTab] = useState<CallTab>("ALL");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");
  const [advisorFilter, setAdvisorFilter] = useState<string>("ALL");
  const [sponsorFilter, setSponsorFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [cityFilter, setCityFilter] = useState<string>("ALL");
  const [visaFilter, setVisaFilter] = useState<string>("ALL");
  const [activeModalLead, setActiveModalLead] = useState<CRMLeadRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  function isOverdue(lead: CRMLeadRow) {
    if (!lead.followUpAt || lead.status === "REGISTERED") return false;
    return new Date(lead.followUpAt) < startOfToday;
  }

  function isToday(lead: CRMLeadRow) {
    if (!lead.followUpAt) return false;
    const d = new Date(lead.followUpAt);
    return d >= startOfToday && d <= endOfToday;
  }

  const sponsors = Array.from(
    new Set(leads.map((l) => l.sponsor).filter(Boolean)),
  ) as string[];
  const cities = Array.from(
    new Set(leads.map((l) => l.city).filter(Boolean)),
  ) as string[];
  const visaStatuses = Array.from(
    new Set(leads.map((l) => l.visaStatus).filter(Boolean)),
  ) as string[];

  const filtered = leads.filter((lead) => {
    // 1. Call Tab filter
    if (callTab === "TODAY" && !isToday(lead)) return false;
    if (callTab === "OVERDUE" && !isOverdue(lead)) return false;
    if (callTab === "NEVER_CALLED" && (lead.callCount ?? 0) > 0) return false;
    if (callTab === "CALLED" && (lead.callCount ?? 0) === 0) return false;

    // 2. Search
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      lead.fullName.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      lead.phone.includes(search) ||
      (lead.city && lead.city.toLowerCase().includes(q));
    if (!matchesSearch) return false;

    // 3. Dropdown filters
    if (statusFilter !== "ALL" && lead.status !== statusFilter) return false;
    if (advisorFilter !== "ALL" && lead.advisorId !== advisorFilter) return false;
    if (sponsorFilter !== "ALL" && lead.sponsor !== sponsorFilter) return false;
    if (sourceFilter !== "ALL" && lead.source !== sourceFilter) return false;
    if (cityFilter !== "ALL" && lead.city !== cityFilter) return false;
    if (visaFilter !== "ALL" && lead.visaStatus !== visaFilter) return false;

    return true;
  });

  function handleOpen(lead: CRMLeadRow) {
    setActiveModalLead(lead);
    onOpenLead?.(lead.id);
  }

  function handleStatusChange(leadId: string, status: LeadStatus) {
    startTransition(() => {
      updateLeadStatus(leadId, status);
    });
  }

  function handlePostpone(leadId: string, days: number) {
    startTransition(() => {
      postponeLeadFollowUp(leadId, days);
    });
  }

  function handleConvert(leadId: string) {
    if (
      !confirm(
        "Bu adayı kayıtlı öğrenciye dönüştürmek istediğinize emin misiniz?",
      )
    )
      return;
    startTransition(() => {
      convertLeadToStudent(leadId);
    });
  }

  function getWhatsAppUrl(phone: string, fullName: string) {
    const digits = phone.replace(/\D/g, "");
    const intl = digits.startsWith("0")
      ? "90" + digits.slice(1)
      : digits.startsWith("90")
      ? digits
      : "90" + digits;
    const msg = encodeURIComponent(
      `Merhaba ${fullName}, Advice Yurtdışı Eğitim'den ulaşıyorum. Başvurunuz hakkında görüşmek için müsait misiniz?`,
    );
    return `https://wa.me/${intl}?text=${msg}`;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* ── 4 CALL TRACKING TABS (§2) ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-50/80 px-4 py-3">
        <button
          type="button"
          onClick={() => setCallTab("ALL")}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all",
            callTab === "ALL"
              ? "bg-[#0f172a] text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100",
          )}
        >
          <span>Tüm Adaylar</span>
          <span className="rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] text-slate-800">
            {leads.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCallTab("TODAY")}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all",
            callTab === "TODAY"
              ? "bg-blue-700 text-white shadow-sm"
              : "bg-white text-blue-700 border border-blue-200 hover:bg-blue-50",
          )}
        >
          <PhoneCall className="h-3.5 w-3.5" />
          <span>Bugün Aranacaklar</span>
          <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-900">
            {leads.filter(isToday).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCallTab("OVERDUE")}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all",
            callTab === "OVERDUE"
              ? "bg-red-600 text-white shadow-sm"
              : "bg-white text-red-700 border border-red-200 hover:bg-red-50",
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Takibi Geçmiş (Overdue)</span>
          <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] text-red-800 font-black">
            {leads.filter(isOverdue).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCallTab("NEVER_CALLED")}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all",
            callTab === "NEVER_CALLED"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-white text-amber-800 border border-amber-200 hover:bg-amber-50",
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Hiç Aranmamış / Yeni Data</span>
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-900">
            {leads.filter((l) => (l.callCount ?? 0) === 0).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCallTab("CALLED")}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all",
            callTab === "CALLED"
              ? "bg-emerald-700 text-white shadow-sm"
              : "bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50",
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Arandı / Tamamlandı</span>
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-900">
            {leads.filter((l) => (l.callCount ?? 0) > 0).length}
          </span>
        </button>
      </div>

      {/* ── RICH FILTER BAR (§2) ──────────────────────────────────────────── */}
      <div className="space-y-3 border-b border-slate-100 p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="İsim, e-posta, telefon veya şehir ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs sm:text-sm focus:border-[#0f172a] focus:outline-none"
            />
          </div>

          {/* Danışman Filter */}
          {advisors.length > 0 && (
            <select
              value={advisorFilter}
              onChange={(e) => setAdvisorFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            >
              <option value="ALL">Tüm Danışmanlar</option>
              {advisors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName}
                </option>
              ))}
            </select>
          )}

          {/* Sponsor Filter */}
          <select
            value={sponsorFilter}
            onChange={(e) => setSponsorFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">Tüm Sponsorlar</option>
            {sponsors.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>

          {/* Kaynak Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">Tüm Kaynaklar</option>
            {Object.entries(LEAD_SOURCE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          {/* Şehir Filter */}
          {cities.length > 0 && (
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            >
              <option value="ALL">Tüm Şehirler</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Vize Durumu Filter */}
          {visaStatuses.length > 0 && (
            <select
              value={visaFilter}
              onChange={(e) => setVisaFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            >
              <option value="ALL">Vize Durumu (Tümü)</option>
              {visaStatuses.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          )}

          <span className="ml-auto text-xs font-bold text-slate-500">
            {filtered.length} kayıt
          </span>
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <ListFilter className="h-3.5 w-3.5 text-slate-400" />
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              statusFilter === "ALL"
                ? "border-[#0f172a] bg-[#0f172a] text-white"
                : "border-slate-200 text-slate-500 hover:border-slate-300",
            )}
          >
            Tümü
          </button>
          {LEAD_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === s
                  ? "border-[#0f172a] bg-[#0f172a] text-white"
                  : "border-slate-200 text-slate-500 hover:border-slate-300",
              )}
            >
              {LEAD_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* ── TABLE ─────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {[
                "Ad Soyad & Şehir",
                "İletişim & WhatsApp",
                "Program & Sponsor",
                "Takip (Follow-Up) & Çağrı",
                "Durum",
                "Danışman",
                "Hızlı Aksiyon",
              ].map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-sm text-slate-400"
                >
                  Seçili kriterlere uygun aday bulunamadı.
                </td>
              </tr>
            )}
            {filtered.map((lead) => {
              const overdue = isOverdue(lead);
              const today = isToday(lead);
              return (
                <tr
                  key={lead.id}
                  className={cn(
                    "group transition-colors hover:bg-slate-50/90",
                    overdue && "bg-red-50/40",
                    isPending && "opacity-60",
                  )}
                >
                  {/* Name & City */}
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleOpen(lead)}
                      className="font-bold text-slate-900 hover:text-[#1e3a8a] hover:underline text-left block"
                    >
                      {lead.fullName}
                    </button>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span>{lead.city || "Şehir Belirtilmedi"}</span>
                      <span>·</span>
                      <span>{LEAD_SOURCE_LABELS[lead.source]}</span>
                    </div>
                  </td>

                  {/* Contact & WhatsApp */}
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-slate-700">
                      {lead.phone}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                      {lead.email}
                    </div>
                    <a
                      href={getWhatsAppUrl(lead.phone, lead.fullName)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    >
                      <MessageCircle className="h-3 w-3" />
                      WhatsApp Yaz
                    </a>
                  </td>

                  {/* Program & Sponsor */}
                  <td className="px-4 py-3">
                    <ProgramBadge program={lead.program} showIcon />
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                      {lead.sponsor && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700">
                          {lead.sponsor}
                        </span>
                      )}
                      {lead.visaStatus && (
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-blue-700">
                          Vize: {lead.visaStatus}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Follow-Up & Call Tracking */}
                  <td className="px-4 py-3">
                    {lead.followUpAt ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold",
                            overdue
                              ? "bg-red-600 text-white animate-pulse"
                              : today
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-700",
                          )}
                        >
                          <CalendarClock className="h-3 w-3" />
                          {formatDate(lead.followUpAt)}
                          {overdue && " (GECİKTİ)"}
                          {today && " (BUGÜN)"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Takip tarihi yok
                      </span>
                    )}

                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                      <span>
                        Arama:{" "}
                        <strong className="text-slate-700">
                          {lead.callCount ?? 0} kez
                        </strong>
                      </span>
                      {lead.lastCallOutcome && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold">
                          Son: {lead.lastCallOutcome}
                        </span>
                      )}
                    </div>

                    {/* 1-Click Postpone Follow-Up Buttons */}
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">Ertele:</span>
                      {[1, 3, 7].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => handlePostpone(lead.id, d)}
                          disabled={isPending}
                          className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-600 hover:bg-slate-100"
                          title={`Takip tarihini ${d} gün ertele`}
                        >
                          +{d}G
                        </button>
                      ))}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <select
                      value={lead.status}
                      onChange={(e) =>
                        handleStatusChange(lead.id, e.target.value as LeadStatus)
                      }
                      disabled={lead.status === "REGISTERED" || isPending}
                      className="rounded-lg border border-slate-200 bg-white py-1 pl-2 pr-6 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-300 disabled:opacity-50"
                    >
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {LEAD_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Advisor */}
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {lead.advisorName || "Atanmamış"}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpen(lead)}
                        className="rounded-lg bg-[#0f172a] px-2.5 py-1.5 text-xs font-bold text-white hover:bg-[#1e3a8a] transition-colors"
                      >
                        Düzenle / Çağrı Gir
                      </button>
                      {lead.status !== "REGISTERED" && (
                        <button
                          type="button"
                          onClick={() => handleConvert(lead.id)}
                          disabled={isPending}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          Kesin Kayıt
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpen(lead)}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Lead Detail & Full Edit Modal */}
      {activeModalLead && (
        <LeadDetailModal
          lead={activeModalLead}
          advisors={advisors}
          onClose={() => setActiveModalLead(null)}
        />
      )}
    </div>
  );
}
