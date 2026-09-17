// components/crm/approvals/PendingApprovalsDrawer.tsx
"use client";

import { useState, useTransition } from "react";
import { X, Check, AlertCircle, FileText, UserCheck, Clock, MessageSquare, ChevronRight } from "lucide-react";
import { commitApprovedChange, rejectStudentChange } from "@/actions/crm/approvals";
import { formatDate } from "@/lib/utils/date";

export interface StagedApprovalItem {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  program: string;
  entityType: string;
  entityId: string | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown>;
  createdAt: Date;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  approvals: StagedApprovalItem[];
}

import { APPROVAL_FIELD_LABELS, formatApprovalValue } from "@/lib/utils/approval";

export function PendingApprovalsDrawer({ isOpen, onClose, approvals }: Props) {
  const [selectedApproval, setSelectedApproval] = useState<StagedApprovalItem | null>(
    approvals[0] || null
  );
  const [revisionNote, setRevisionNote] = useState("");
  const [isRevisionInputOpen, setIsRevisionInputOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  if (!isOpen) return null;

  function handleApprove(id: string) {
    setStatusMsg(null);
    startTransition(async () => {
      const res = await commitApprovedChange(id);
      if (res.success) {
        setStatusMsg({ text: "Değişiklik başarıyla onaylandı ve canlı verilere aktarıldı.", type: "success" });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMsg({ text: res.error, type: "error" });
      }
    });
  }

  function handleReject(id: string) {
    if (!revisionNote.trim()) {
      setStatusMsg({ text: "Lütfen öğrenciye iletilecek revize nedenini yazınız.", type: "error" });
      return;
    }

    setStatusMsg(null);
    startTransition(async () => {
      const res = await rejectStudentChange(id, revisionNote);
      if (res.success) {
        setStatusMsg({ text: "Revize talebi öğrenciye iletildi.", type: "success" });
        setIsRevisionInputOpen(false);
        setRevisionNote("");
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMsg({ text: res.error, type: "error" });
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Bekleyen Onay Kuyruğu</h2>
              <p className="text-xs text-gray-500">
                {approvals.length} adet öğrenci değişiklik talebi onay bekliyor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {statusMsg && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold ${
              statusMsg.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* Content split */}
        {approvals.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <UserCheck className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-sm font-bold text-gray-700">Tüm Talepler Değerlendirildi</h3>
            <p className="text-xs text-gray-400 mt-1">Şu anda onay bekleyen değişiklik talebi yok.</p>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Left approval list */}
            <div className="w-1/3 border-r border-gray-100 overflow-y-auto divide-y divide-gray-50">
              {approvals.map((item) => {
                const isSelected = selectedApproval?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedApproval(item);
                      setIsRevisionInputOpen(false);
                    }}
                    className={`w-full text-left p-4 transition-colors ${
                      isSelected ? "bg-blue-50/80 border-r-2 border-blue-600" : "hover:bg-gray-50"
                    }`}
                  >
                    <p className="text-xs font-bold text-gray-900 truncate">{item.studentName}</p>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      {item.entityType === "STUDENT_PROFILE"
                        ? "Profil Değişikliği"
                        : item.entityType === "DOCUMENT"
                        ? "Yeni Belge"
                        : item.entityType}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">{formatDate(item.createdAt)}</p>
                  </button>
                );
              })}
            </div>

            {/* Right Diff Viewer & Actions */}
            {selectedApproval && (
              <div className="flex-1 flex flex-col justify-between overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        {selectedApproval.studentName} — Talep Detayı
                      </h3>
                      <p className="text-xs text-gray-500">{selectedApproval.studentEmail}</p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      Onay Bekliyor
                    </span>
                  </div>

                  {/* Diff Table */}
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-500">
                          <th className="py-2.5 px-3 text-left font-semibold">Alan Adı</th>
                          <th className="py-2.5 px-3 text-left font-semibold">Mevcut Değer</th>
                          <th className="py-2.5 px-3 text-left font-semibold">Talep Edilen (Yeni)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {Object.keys(selectedApproval.newData).map((key) => {
                          const oldVal = selectedApproval.oldData ? selectedApproval.oldData[key] : null;
                          const newVal = selectedApproval.newData[key];
                          const hasChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);

                          if (!hasChanged) return null;

                          return (
                            <tr key={key} className="hover:bg-gray-50/50">
                              <td className="py-2.5 px-3 font-semibold text-gray-700">
                                {APPROVAL_FIELD_LABELS[key] || key}
                              </td>
                              <td className="py-2.5 px-3 text-red-600 line-through bg-red-50/20 font-medium">
                                {formatApprovalValue(key, oldVal)}
                              </td>
                              <td className="py-2.5 px-3 text-emerald-700 font-bold bg-emerald-50/20">
                                {formatApprovalValue(key, newVal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Revision note form */}
                  {isRevisionInputOpen && (
                    <div className="rounded-xl border border-red-200 bg-red-50/40 p-4 space-y-2">
                      <label className="block text-xs font-bold text-red-900">
                        Öğrenciye İletilecek Revize / Düzeltme Gerekçesi:
                      </label>
                      <textarea
                        rows={3}
                        value={revisionNote}
                        onChange={(e) => setRevisionNote(e.target.value)}
                        placeholder="Örn: Pasaport geçerlilik süresi 6 aydan kısa, lütfen yenileyiniz..."
                        className="w-full rounded-lg border border-red-200 p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-400 bg-white"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsRevisionInputOpen(false)}
                          className="rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
                        >
                          İptal
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleReject(selectedApproval.id)}
                          className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {isPending ? "İletiliyor…" : "Revizyonu Gönder"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom action controls */}
                {!isRevisionInputOpen && (
                  <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setIsRevisionInputOpen(true)}
                      className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Revize İste
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleApprove(selectedApproval.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      {isPending ? "Onaylanıyor…" : "Onayla (Canlıya Aktar)"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
