"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  User,
  ArrowRight,
  Send,
  FileText,
  ShieldCheck,
  CheckCheck,
} from "lucide-react";
import { commitApprovedChange, rejectStudentChange } from "@/actions/crm/approvals";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

export interface ApprovalItem {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  program: string;
  entityType: string;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown>;
  status: "PENDING" | "APPROVED" | "REVISION_REQUESTED";
  rejectionReason: string | null;
  reviewerName: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

import { APPROVAL_FIELD_LABELS, formatApprovalValue } from "@/lib/utils/approval";

export function ApprovalsCenterClient({ initialApprovals }: { initialApprovals: ApprovalItem[] }) {
  const [approvals, setApprovals] = useState<ApprovalItem[]>(initialApprovals);
  const [activeStatus, setActiveStatus] = useState<"PENDING" | "APPROVED" | "REVISION_REQUESTED">("PENDING");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialApprovals.find((a) => a.status === "PENDING")?.id || initialApprovals[0]?.id || null
  );
  const [revisionReason, setRevisionReason] = useState("");
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const filtered = approvals.filter((a) => a.status === activeStatus);
  const current = approvals.find((a) => a.id === selectedId) || filtered[0] || null;

  function handleApprove(id: string) {
    setFeedback(null);
    startTransition(async () => {
      const res = await commitApprovedChange(id);
      if (res.success) {
        setApprovals((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "APPROVED", reviewedAt: new Date() } : a))
        );
        setFeedback({ type: "success", msg: "Değişiklik başarıyla onaylandı ve canlı sisteme aktarıldı." });
      } else {
        setFeedback({ type: "error", msg: res.error });
      }
    });
  }

  function handleReject(id: string) {
    if (!revisionReason.trim()) {
      setFeedback({ type: "error", msg: "Lütfen revize nedenini yazınız." });
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const res = await rejectStudentChange(id, revisionReason);
      if (res.success) {
        setApprovals((prev) =>
          prev.map((a) =>
            a.id === id
              ? { ...a, status: "REVISION_REQUESTED", rejectionReason: revisionReason, reviewedAt: new Date() }
              : a
          )
        );
        setIsRejectOpen(false);
        setRevisionReason("");
        setFeedback({ type: "success", msg: "Revize talebi öğrenciye iletildi." });
      } else {
        setFeedback({ type: "error", msg: res.error });
      }
    });
  }

  const allKeys = current
    ? Array.from(
        new Set([
          ...Object.keys(current.oldData || {}),
          ...Object.keys(current.newData || {}),
        ])
      )
    : [];

  return (
    <div className="space-y-6">
      {/* ── Status Pills & Stats ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm">
          <button
            onClick={() => {
              setActiveStatus("PENDING");
              const first = approvals.find((a) => a.status === "PENDING");
              if (first) setSelectedId(first.id);
            }}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors",
              activeStatus === "PENDING"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            Bekleyen Talepler ({approvals.filter((a) => a.status === "PENDING").length})
          </button>

          <button
            onClick={() => {
              setActiveStatus("APPROVED");
              const first = approvals.find((a) => a.status === "APPROVED");
              if (first) setSelectedId(first.id);
            }}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors",
              activeStatus === "APPROVED"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Onaylananlar ({approvals.filter((a) => a.status === "APPROVED").length})
          </button>

          <button
            onClick={() => {
              setActiveStatus("REVISION_REQUESTED");
              const first = approvals.find((a) => a.status === "REVISION_REQUESTED");
              if (first) setSelectedId(first.id);
            }}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors",
              activeStatus === "REVISION_REQUESTED"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <XCircle className="h-3.5 w-3.5" />
            Revize İstenenler ({approvals.filter((a) => a.status === "REVISION_REQUESTED").length})
          </button>
        </div>

        {feedback && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium",
              feedback.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-rose-200 bg-rose-50 text-rose-800"
            )}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            )}
            <span>{feedback.msg}</span>
          </div>
        )}
      </div>

      {/* ── Main Review Layout ───────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400 mb-3" />
          <h3 className="text-base font-bold text-gray-900">Bu sekmede bekleyen talep yok</h3>
          <p className="text-xs text-gray-500 mt-1">
            Öğrenciler portaldan yeni profil veya evrak değişikliği talep ettiğinde burada listelenecektir.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Sol Kolon: Talep Listesi */}
          <div className="lg:col-span-4 space-y-2">
            {filtered.map((item) => {
              const isSelected = item.id === (current?.id || selectedId);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedId(item.id);
                    setIsRejectOpen(false);
                    setFeedback(null);
                  }}
                  className={cn(
                    "w-full text-left rounded-2xl border p-4 transition-all duration-200",
                    isSelected
                      ? "border-blue-600 bg-blue-50/50 shadow-sm"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold text-xs">
                        {item.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{item.studentName}</p>
                        <p className="text-[11px] text-gray-400">{item.studentEmail}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="rounded-lg bg-white px-2 py-0.5 font-semibold text-gray-700 border border-gray-100">
                      {item.entityType === "STUDENT_PROFILE"
                        ? "Profil Değişikliği"
                        : item.entityType === "WAT_DETAIL"
                        ? "WAT Operasyon Bilgisi"
                        : "Evrak Yükleme"}
                    </span>
                    <span className="font-semibold text-blue-600 flex items-center gap-0.5">
                      İncele <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sağ Kolon: Diff Görüntüleyici ve Karar Paneli */}
          {current && (
            <div className="lg:col-span-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-700">
                      Onay Bekleyen Talep
                    </span>
                    <span className="text-xs text-gray-400">
                      Oluşturulma: {formatDateTime(current.createdAt)}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mt-1">
                    {current.studentName} —{" "}
                    {current.entityType === "STUDENT_PROFILE"
                      ? "Profil Bilgileri Güncellemesi"
                      : "Operasyon Formu Değişikliği"}
                  </h2>
                </div>

                {/* Actions */}
                {current.status === "PENDING" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsRejectOpen((prev) => !prev)}
                      disabled={isPending}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                    >
                      Revize İste
                    </button>
                    <button
                      onClick={() => handleApprove(current.id)}
                      disabled={isPending}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {isPending ? "İşleniyor…" : "Onayla ve Canlıya Al"}
                    </button>
                  </div>
                )}
              </div>

              {/* Revision input drawer */}
              {isRejectOpen && (
                <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 space-y-3">
                  <p className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                    Öğrenciye İletilecek Revize Gerekçesi:
                  </p>
                  <textarea
                    rows={2}
                    value={revisionReason}
                    onChange={(e) => setRevisionReason(e.target.value)}
                    placeholder="Örn: Yüklenen pasaport görüntüsünde son geçerlilik tarihi okunmuyor, lütfen tekrar yükleyin."
                    className="w-full rounded-xl border border-rose-200 bg-white p-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsRejectOpen(false)}
                      className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Vazgeç
                    </button>
                    <button
                      onClick={() => handleReject(current.id)}
                      disabled={isPending}
                      className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                    >
                      Talebi Geri Gönder
                    </button>
                  </div>
                </div>
              )}

              {/* Side-by-Side Diff Table */}
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-500 w-1/3">Alan Adı</th>
                      <th className="px-4 py-3 font-semibold text-rose-600 w-1/3">Mevcut Canlı Değer</th>
                      <th className="px-4 py-3 font-semibold text-emerald-600 w-1/3">Öğrencinin Yeni Girişi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allKeys.map((key) => {
                      const oldVal = current.oldData?.[key];
                      const newVal = current.newData?.[key];
                      const isChanged = String(oldVal ?? "") !== String(newVal ?? "");

                      return (
                        <tr key={key} className={cn("hover:bg-gray-50/50", isChanged && "bg-amber-50/20")}>
                          <td className="px-4 py-3 font-medium text-gray-700">
                            {APPROVAL_FIELD_LABELS[key] || key}
                          </td>
                          <td className="px-4 py-3 text-rose-600 line-through decoration-rose-400 font-medium">
                            {oldVal !== undefined && oldVal !== null && String(oldVal).trim() !== ""
                              ? formatApprovalValue(key, oldVal)
                              : <span className="text-gray-300 italic">Boş</span>}
                          </td>
                          <td className="px-4 py-3 font-semibold text-emerald-700 bg-emerald-50/40">
                            {newVal !== undefined && newVal !== null && String(newVal).trim() !== ""
                              ? formatApprovalValue(key, newVal)
                              : <span className="text-gray-400 italic">Silindi</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
