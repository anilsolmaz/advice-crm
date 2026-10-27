"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UsersRound,
  Download,
  Search,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import type { Program } from "@/types/crm";
import { PROGRAM_LABELS } from "@/types/crm";

export interface GroupStudentRow {
  id: string;
  fullName: string;
  program: Program;
  groupName: string;
  guardianName: string;
  sponsor: string;
  dateOfBirth: string | null;
  passportNumber: string | null;
  ukviLink: string | null;
  appointmentDate: string | null;
  notes: string | null;
  city: string;
  visaStatus: string;
  totalDocs: number;
  approvedDocs: number;
  guardianPhone: string;
}

export default function GroupsClient({ rows }: { rows: GroupStudentRow[] }) {
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [onlyWarnings, setOnlyWarnings] = useState(false);

  const groups = Array.from(new Set(rows.map((r) => r.groupName)));

  function hasWarning(r: GroupStudentRow) {
    if (!r.passportNumber) return true;
    if (r.totalDocs === 0) return true;
    if (r.appointmentDate) {
      const diffDays =
        (new Date(r.appointmentDate).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24);
      if (diffDays >= 0 && diffDays <= 7) return true;
    }
    return false;
  }

  const filtered = rows.filter((r) => {
    if (groupFilter !== "ALL" && r.groupName !== groupFilter) return false;
    if (onlyWarnings && !hasWarning(r)) return false;
    const q = search.toLowerCase();
    if (
      q &&
      !r.fullName.toLowerCase().includes(q) &&
      !r.city.toLowerCase().includes(q) &&
      !(r.passportNumber && r.passportNumber.toLowerCase().includes(q))
    ) {
      return false;
    }
    return true;
  });

  function exportCsv() {
    const headers = [
      "Grup",
      "Öğrenci İsmi",
      "Velisi",
      "Sponsor",
      "Doğum Tarihi",
      "Pasaport No",
      "UKVI Link",
      "Randevu Tarihi",
      "Açıklama",
      "Şehir",
      "Vize / Evrak Durumu",
      "Veli Telefon",
    ];
    const lines = filtered.map((r) =>
      [
        r.groupName,
        r.fullName,
        r.guardianName,
        r.sponsor,
        r.dateOfBirth ? formatDate(r.dateOfBirth) : "",
        r.passportNumber || "EKSİK",
        r.ukviLink || "",
        r.appointmentDate ? formatDate(r.appointmentDate) : "",
        (r.notes || "").replace(/,/g, " "),
        r.city,
        `${r.visaStatus} (${r.approvedDocs}/${r.totalDocs} Evrak)`,
        r.guardianPhone,
      ].join(","),
    );
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...lines].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "advice-grup-vize-listesi.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] flex items-center gap-2">
            <UsersRound className="h-6 w-6 text-[#1e3a8a]" />
            Grup Görünümü &amp; UKVI / Vize Takip Tablosu
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Yaz okulu grupları, UKVI vize başvuru linkleri, pasaport numaraları, randevu tarihleri ve veli iletişim bilgileri.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          className="flex items-center gap-2 rounded-xl bg-[#0f172a] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#1e3a8a]"
        >
          <Download className="h-4 w-4 text-sky-400" />
          Excel / CSV Dışa Aktar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Öğrenci adı, pasaport no veya şehir ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-xs sm:text-sm"
          />
        </div>

        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800"
        >
          <option value="ALL">Tüm Gruplar ({rows.length})</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setOnlyWarnings((v) => !v)}
          className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors ${
            onlyWarnings
              ? "border-red-600 bg-red-600 text-white"
              : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Eksik Pasaport / Yaklaşan Randevu Uyarıları
        </button>
      </div>

      {/* 11-Column Group Table (§5) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-[#0f172a] text-white">
                {[
                  "Öğrenci İsmi & Grup",
                  "Velisi",
                  "Sponsor",
                  "Doğum Tarihi",
                  "Pasaport No",
                  "UKVI Link",
                  "Randevu Tarihi",
                  "Açıklama",
                  "Şehir",
                  "Vize / Evrak Durumu",
                  "Veli Telefon",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-3.5 py-3 text-left text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => {
                const warn = hasWarning(r);
                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      warn ? "bg-amber-50/40" : ""
                    }`}
                  >
                    <td className="px-3.5 py-3">
                      <Link
                        href={`/students/${r.id}`}
                        className="font-bold text-slate-900 hover:text-[#1e3a8a] hover:underline block"
                      >
                        {r.fullName}
                      </Link>
                      <span className="text-[10px] font-semibold text-blue-700">
                        {r.groupName} · {PROGRAM_LABELS[r.program]}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 font-medium text-slate-700">
                      {r.guardianName}
                    </td>
                    <td className="px-3.5 py-3 font-semibold text-slate-800">
                      {r.sponsor}
                    </td>
                    <td className="px-3.5 py-3 text-slate-600 whitespace-nowrap">
                      {r.dateOfBirth ? formatDate(r.dateOfBirth) : "—"}
                    </td>
                    <td className="px-3.5 py-3 font-mono">
                      {r.passportNumber ? (
                        <span className="font-bold text-slate-900">
                          {r.passportNumber}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                          <AlertTriangle className="h-3 w-3" /> EKSİK
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-3">
                      {r.ukviLink ? (
                        <a
                          href={r.ukviLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 font-bold text-blue-700 hover:bg-blue-100"
                        >
                          UKVI Form <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400">Girilmedi</span>
                      )}
                    </td>
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      {r.appointmentDate ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2 py-1 font-bold text-purple-800">
                          <Calendar className="h-3 w-3" />
                          {formatDate(r.appointmentDate)}
                        </span>
                      ) : (
                        <span className="text-slate-400">Bekleniyor</span>
                      )}
                    </td>
                    <td className="px-3.5 py-3 text-slate-600 max-w-[180px] truncate">
                      {r.notes || "—"}
                    </td>
                    <td className="px-3.5 py-3 font-medium text-slate-700">
                      {r.city}
                    </td>
                    <td className="px-3.5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          r.visaStatus === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {r.visaStatus} ({r.approvedDocs}/{r.totalDocs} Evrak)
                      </span>
                    </td>
                    <td className="px-3.5 py-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                      {r.guardianPhone}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
