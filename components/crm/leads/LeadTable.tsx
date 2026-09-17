// components/crm/leads/LeadTable.tsx
"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, ArrowUpDown, Search, Filter } from "lucide-react";
import type { CRMLeadRow, LeadStatus, Program } from "@/types/crm";
import {
  LEAD_STATUS_LABELS,
  PROGRAM_LABELS,
  LEAD_SOURCE_LABELS,
} from "@/types/crm";
import { LeadStatusBadge } from "./LeadStatusBadge";
import { LeadDetailModal } from "./LeadDetailModal";
import { ProgramBadge } from "@/components/crm/common/ProgramBadge";
import { updateLeadStatus, convertLeadToStudent } from "@/actions/crm/leads";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

const LEAD_STATUSES: LeadStatus[] = [
  "INTERESTED",
  "CONSIDERING_NEXT_YEAR",
  "UNINTERESTED",
  "NOT_CONSIDERING",
  "REGISTERED",
];

interface Props {
  leads: CRMLeadRow[];
  program?: Program;
  onOpenLead?: (leadId: string) => void;
}

export function LeadTable({ leads, program, onOpenLead }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");
  const [activeModalLead, setActiveModalLead] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpen(lead: any) {
    setActiveModalLead(lead);
    onOpenLead?.(lead.id);
  }

  const filtered = leads.filter((lead) => {
    const matchesSearch =
      lead.fullName.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search);
    const matchesStatus =
      statusFilter === "ALL" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function handleStatusChange(leadId: string, status: LeadStatus) {
    startTransition(() => {
      updateLeadStatus(leadId, status);
    });
  }

  function handleConvert(leadId: string) {
    if (
      !confirm(
        "Bu lead'i kayıtlı öğrenciye dönüştürmek istediğinize emin misiniz? Davetiye e-postası gönderilecektir.",
      )
    )
      return;
    startTransition(() => {
      convertLeadToStudent(leadId);
    });
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="İsim, e-posta veya telefon ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-gray-400" />
          <button
            onClick={() => setStatusFilter("ALL")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              statusFilter === "ALL"
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700",
            )}
          >
            Tümü
          </button>
          {LEAD_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === s
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700",
              )}
            >
              {LEAD_STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-gray-400">
          {filtered.length} kayıt
        </span>
      </div>

      {/* ── Table ─────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {[
                "Ad Soyad",
                "İletişim",
                "Kaynak",
                "Program",
                "Durum",
                "Tarih",
                "",
              ].map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-sm text-gray-400"
                >
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
            {filtered.map((lead) => (
              <tr
                key={lead.id}
                className={cn(
                  "group transition-colors hover:bg-gray-50",
                  isPending && "opacity-60",
                )}
              >
                {/* Name */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleOpen(lead)}
                    className="font-medium text-gray-900 hover:text-blue-600 hover:underline text-left"
                  >
                    {lead.fullName}
                  </button>
                </td>

                {/* Contact */}
                <td className="px-4 py-3 text-gray-500">
                  <div>{lead.email}</div>
                  <div className="text-xs">{lead.phone}</div>
                </td>

                {/* Source */}
                <td className="px-4 py-3 text-gray-500">
                  {LEAD_SOURCE_LABELS[lead.source]}
                </td>

                {/* Program */}
                <td className="px-4 py-3">
                  <ProgramBadge program={lead.program} showIcon />
                </td>

                {/* Status — inline select */}
                <td className="px-4 py-3">
                  <select
                    value={lead.status}
                    onChange={(e) =>
                      handleStatusChange(lead.id, e.target.value as LeadStatus)
                    }
                    disabled={lead.status === "REGISTERED" || isPending}
                    className="rounded-lg border border-gray-200 bg-transparent py-1 pl-2 pr-6 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-300 disabled:opacity-50"
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {LEAD_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {formatDate(lead.createdAt)}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {lead.status !== "REGISTERED" && (
                      <button
                        onClick={() => handleConvert(lead.id)}
                        disabled={isPending}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        Kesin Kayıt
                      </button>
                    )}
                    <button
                      onClick={() => handleOpen(lead)}
                      className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lead Detail Modal */}
      {activeModalLead && (
        <LeadDetailModal
          lead={activeModalLead}
          onClose={() => setActiveModalLead(null)}
        />
      )}
    </div>
  );
}
