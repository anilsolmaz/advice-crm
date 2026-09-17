"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, GraduationCap, ChevronRight, Eye, Phone, Mail, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import type { Program } from "@prisma/client";
import { PROGRAM_LABELS } from "@/types/crm";
import { ProgramBadge } from "@/components/crm/common/ProgramBadge";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { StudentModal } from "./modal/StudentModal";
import type { StudentModalProps } from "./modal/StudentModal";

export interface StudentTableRowData {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  program: Program;
  isActive: boolean;
  advisorName: string | null;
  universityName: string | null;
  paymentSummary?: {
    total: number;
    paid: number;
    currency: string;
    isFullyPaid: boolean;
  };
  createdAt: Date;
  // Full detail relations for modal view
  fullDetail?: any;
}

interface Props {
  students: StudentTableRowData[];
  programFilter?: Program;
}

export function StudentTable({ students, programFilter }: Props) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [advisorFilter, setAdvisorFilter] = useState<string>("ALL");
  const [sponsorFilter, setSponsorFilter] = useState<string>("ALL");
  const [placementFilter, setPlacementFilter] = useState<string>("ALL");
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<StudentModalProps | null>(null);

  const uniqueAdvisors = Array.from(new Set(students.map((s) => s.advisorName).filter(Boolean))) as string[];
  const uniqueSponsors = Array.from(
    new Set(students.map((s) => s.fullDetail?.watDetail?.sponsorName).filter(Boolean))
  ) as string[];

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone && s.phone.includes(search)) ||
      (s.universityName && s.universityName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      activeFilter === "ALL" ||
      (activeFilter === "ACTIVE" && s.isActive) ||
      (activeFilter === "INACTIVE" && !s.isActive);

    const matchesAdvisor = advisorFilter === "ALL" || s.advisorName === advisorFilter;
    const studentSponsor = s.fullDetail?.watDetail?.sponsorName;
    const matchesSponsor = sponsorFilter === "ALL" || studentSponsor === sponsorFilter;

    const hasJob = !!s.fullDetail?.watDetail?.employerName;
    const matchesPlacement =
      placementFilter === "ALL" ||
      (placementFilter === "PLACED" && hasJob) ||
      (placementFilter === "PENDING" && !hasJob);

    const matchesProg = !programFilter || s.program === programFilter;

    return matchesSearch && matchesStatus && matchesAdvisor && matchesSponsor && matchesPlacement && matchesProg;
  });

  return (
    <div className="space-y-4">
      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        {/* Search */}
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="İsim, e-posta, telefon veya üniversite ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 py-2 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-gray-200 bg-gray-50/50 p-1">
            <button
              onClick={() => setActiveFilter("ALL")}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                activeFilter === "ALL"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              Tümü ({students.length})
            </button>
            <button
              onClick={() => setActiveFilter("ACTIVE")}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                activeFilter === "ACTIVE"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              Aktifler
            </button>
            <button
              onClick={() => setActiveFilter("INACTIVE")}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                activeFilter === "INACTIVE"
                  ? "bg-white text-rose-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              Pasifler
            </button>
          </div>

          {/* Danışman Filtresi */}
          {uniqueAdvisors.length > 0 && (
            <select
              value={advisorFilter}
              onChange={(e) => setAdvisorFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700"
            >
              <option value="ALL">Tüm Danışmanlar</option>
              {uniqueAdvisors.map((adv) => (
                <option key={adv} value={adv}>
                  {adv}
                </option>
              ))}
            </select>
          )}

          {/* Sponsor Filtresi */}
          {uniqueSponsors.length > 0 && (
            <select
              value={sponsorFilter}
              onChange={(e) => setSponsorFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700"
            >
              <option value="ALL">Tüm Sponsorlar</option>
              {uniqueSponsors.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          )}

          {/* İş Yerleşimi Filtresi */}
          <select
            value={placementFilter}
            onChange={(e) => setPlacementFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700"
          >
            <option value="ALL">İş Durumu: Tümü</option>
            <option value="PLACED">İşe Yerleşti</option>
            <option value="PENDING">İş Bekliyor</option>
          </select>

          <span className="text-xs font-mono text-gray-400 pl-2">
            {filtered.length} Kayıt
          </span>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/75">
              <tr>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Öğrenci Bilgisi</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Program</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Üniversite / Hedef</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Danışman</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Ödeme Durumu</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Kayıt Tarihi</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                    Kayıtlı öğrenci bulunamadı.
                  </td>
                </tr>
              ) : (
                filtered.map((student) => {
                  return (
                    <tr key={student.id} className="group hover:bg-gray-50/80 transition-colors">
                      {/* Name & Contact */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm shadow-sm">
                            {student.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              href={`/students/${student.id}`}
                              className="font-semibold text-gray-900 hover:text-blue-600 hover:underline flex items-center gap-1.5"
                            >
                              {student.fullName}
                            </Link>
                            <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {student.email}
                              </span>
                              {student.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {student.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Program */}
                      <td className="px-5 py-4">
                        <ProgramBadge program={student.program} showIcon />
                      </td>

                      {/* University / Target */}
                      <td className="px-5 py-4 text-xs text-gray-600">
                        {student.universityName ? (
                          <div className="flex items-center gap-1.5 font-medium text-gray-800">
                            <GraduationCap className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            <span className="truncate max-w-[200px]">{student.universityName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Belirtilmedi</span>
                        )}
                      </td>

                      {/* Advisor */}
                      <td className="px-5 py-4 text-xs font-medium text-gray-700">
                        {student.advisorName || <span className="text-gray-400 italic">Atanmadı</span>}
                      </td>

                      {/* Payment */}
                      <td className="px-5 py-4">
                        {student.paymentSummary ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs font-semibold text-gray-900">
                              {student.paymentSummary.isFullyPaid ? (
                                <span className="flex items-center gap-1 text-emerald-600">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Tamamlandı
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-amber-600">
                                  <Clock className="h-3.5 w-3.5" />
                                  {student.paymentSummary.paid} / {student.paymentSummary.total} {student.paymentSummary.currency}
                                </span>
                              )}
                            </div>
                            {/* Progress bar */}
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (student.paymentSummary.paid / (student.paymentSummary.total || 1)) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Plan Oluşturulmadı</span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="px-5 py-4 text-xs text-gray-500">
                        {formatDate(student.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {student.fullDetail && (
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForModal(student.fullDetail)}
                              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors flex items-center gap-1"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Hızlı Bakış
                            </button>
                          )}
                          <Link
                            href={`/students/${student.id}`}
                            className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition-colors flex items-center gap-1"
                          >
                            Detay
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Look Modal */}
      {selectedStudentForModal && (
        <StudentModal
          {...selectedStudentForModal}
          onClose={() => setSelectedStudentForModal(null)}
        />
      )}
    </div>
  );
}
