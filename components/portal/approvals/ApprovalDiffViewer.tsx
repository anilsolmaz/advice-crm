// components/portal/approvals/ApprovalDiffViewer.tsx
import { CheckCircle2, Clock, AlertCircle, Calendar, ArrowRight, ShieldCheck } from "lucide-react";
import type { PendingApproval } from "@prisma/client";
import { formatDate } from "@/lib/utils/date";

interface Props {
  approvals: PendingApproval[];
}

import { APPROVAL_FIELD_LABELS, formatApprovalValue } from "@/lib/utils/approval";

export function ApprovalDiffViewer({ approvals }: Props) {
  if (approvals.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
        <ShieldCheck className="mx-auto h-12 w-12 text-gray-200 mb-3" />
        <h3 className="text-base font-bold text-gray-800">Bekleyen Talep Bulunmuyor</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Profilinizde veya evraklarınızda yaptığınız tüm güncellemeler ve danışman değerlendirmeleri burada listelenir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {approvals.map((approval) => {
        const isPending = approval.status === "PENDING";
        const isApproved = approval.status === "APPROVED";
        const isRevision = approval.status === "REVISION_REQUESTED";

        const oldData = (approval.oldData as Record<string, unknown>) || {};
        const newData = (approval.newData as Record<string, unknown>) || {};

        // Find keys that changed
        const changedKeys = Object.keys(newData).filter((key) => {
          return JSON.stringify(oldData[key]) !== JSON.stringify(newData[key]);
        });

        return (
          <div
            key={approval.id}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4"
          >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">
                    {approval.entityType === "STUDENT_PROFILE"
                      ? "Profil Bilgisi Güncelleme Talebi"
                      : approval.entityType === "DOCUMENT"
                      ? "Yeni Belge Yükleme Talebi"
                      : `${approval.entityType} Talebi`}
                  </h3>
                  <span className="text-[11px] text-gray-400 font-mono">
                    #{approval.id.slice(0, 8)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Talep Tarihi: {formatDate(approval.createdAt)}</span>
                </div>
              </div>

              {/* Status pill */}
              <div>
                {isApproved && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Onaylandı & Sisteme İşlendi
                  </span>
                )}
                {isPending && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    <Clock className="h-4 w-4" />
                    Danışman Değerlendirmesinde
                  </span>
                )}
                {isRevision && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    Revize / Düzeltme İstendi
                  </span>
                )}
              </div>
            </div>

            {/* Advisor rejection/feedback note */}
            {isRevision && approval.rejectionReason && (
              <div className="rounded-xl border border-red-200 bg-red-50/70 p-3.5 text-xs text-red-900">
                <p className="font-bold flex items-center gap-1.5 text-red-800 mb-1">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  Danışmanınızın Açıklaması:
                </p>
                <p className="leading-relaxed pl-5.5">{approval.rejectionReason}</p>
              </div>
            )}

            {/* Diff Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-gray-500">
                    <th className="py-2.5 px-4 text-left font-semibold w-1/4">Alan Adı</th>
                    <th className="py-2.5 px-4 text-left font-semibold w-3/8">Eski Değer</th>
                    <th className="py-2.5 px-4 text-left font-semibold w-3/8">Yeni Talep</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {changedKeys.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-gray-400">
                        Değişiklik verisi bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    changedKeys.map((key) => {
                      const oldVal = oldData[key];
                      const newVal = newData[key];

                      return (
                        <tr key={key} className="hover:bg-gray-50/50">
                          <td className="py-3 px-4 font-semibold text-gray-800">
                            {APPROVAL_FIELD_LABELS[key] ?? key}
                          </td>
                          <td className="py-3 px-4 text-red-600 line-through bg-red-50/30 font-medium">
                            {oldVal !== null && oldVal !== undefined && String(oldVal).trim() !== ""
                              ? formatApprovalValue(key, oldVal)
                              : "—"}
                          </td>
                          <td className="py-3 px-4 text-emerald-700 font-semibold bg-emerald-50/30">
                            {newVal !== null && newVal !== undefined && String(newVal).trim() !== ""
                              ? formatApprovalValue(key, newVal)
                              : "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
