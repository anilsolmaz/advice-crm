// app/(crm)/leads/LeadsPageClient.tsx
"use client";

import { Plus, PhoneCall, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";
import { LeadTable } from "@/components/crm/leads/LeadTable";
import type { CRMLeadRow } from "@/types/crm";

export default function LeadsPageClient({
  initialLeads,
  advisors = [],
}: {
  initialLeads: CRMLeadRow[];
  advisors?: { id: string; fullName: string }[];
}) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const todayCount = initialLeads.filter((l) => {
    if (!l.followUpAt) return false;
    const d = new Date(l.followUpAt);
    return d >= startOfToday && d <= endOfToday;
  }).length;

  const overdueCount = initialLeads.filter((l) => {
    if (!l.followUpAt) return false;
    const d = new Date(l.followUpAt);
    return d < startOfToday && l.status !== "REGISTERED";
  }).length;

  const neverCalledCount = initialLeads.filter(
    (l) => (l.callCount ?? 0) === 0
  ).length;

  const calledCount = initialLeads.filter((l) => (l.callCount ?? 0) > 0).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">
            Aday (Lead) &amp; Çağrı Takip Merkezi
          </h1>
          <p className="text-sm text-slate-500">
            Toplam {initialLeads.length} aday · Günlük arama planı, gecikmiş takipler ve hızlı WhatsApp/çağrı aksiyonları
          </p>
        </div>
        <a
          href="/leads/new"
          className="flex items-center gap-1.5 rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#1e3a8a] transition-colors"
        >
          <Plus className="h-4 w-4 text-sky-400" />
          Yeni Lead Ekle
        </a>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
              Bugün Aranacaklar
            </span>
            <PhoneCall className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-blue-950">{todayCount}</p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700">
              Takibi Geçmiş (Overdue)
            </span>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-red-700">{overdueCount}</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Hiç Aranmamış / Yeni
            </span>
            <Sparkles className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-950">
            {neverCalledCount}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Arandı / Görüşüldü
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-950">
            {calledCount}
          </p>
        </div>
      </div>

      <LeadTable leads={initialLeads} advisors={advisors} />
    </div>
  );
}
