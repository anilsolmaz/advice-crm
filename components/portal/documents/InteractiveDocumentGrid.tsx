// components/portal/documents/InteractiveDocumentGrid.tsx
"use client";

import { useState, useRef } from "react";
import {
  Check,
  X,
  Clock,
  UploadCloud,
  FileText,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { DocumentType } from "@prisma/client";
import type { RequiredDocConfig } from "@/lib/portal/programConfig";
import { registerUploadedDocument } from "@/actions/portal/documents";

export interface ExistingDocItem {
  id: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  verificationStatus: string;
  rejectionReason?: string | null;
}

interface InteractiveDocumentGridProps {
  studentId: string;
  programLabel?: string;
  requiredDocs: RequiredDocConfig[];
  uploadedDocs: ExistingDocItem[];
}

export function InteractiveDocumentGrid({
  studentId,
  requiredDocs,
  uploadedDocs,
}: InteractiveDocumentGridProps) {
  const [selectedDocConfig, setSelectedDocConfig] =
    useState<RequiredDocConfig | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map latest uploaded document per DocumentType
  const docByType = new Map<DocumentType, ExistingDocItem>();
  for (const d of uploadedDocs) {
    if (!docByType.has(d.type)) {
      docByType.set(d.type, d);
    }
  }

  function openModalForDoc(cfg: RequiredDocConfig) {
    setSelectedDocConfig(cfg);
    setFile(null);
    setNotes("");
    setFeedback(null);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDocConfig || !file) return;

    setIsUploading(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("studentId", studentId);
      formData.append("docType", selectedDocConfig.type);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadJson = await uploadRes.json();

      if (!uploadRes.ok || !uploadJson.success) {
        throw new Error(uploadJson.error || "Dosya yüklenemedi.");
      }

      const res = await registerUploadedDocument(
        studentId,
        selectedDocConfig.type,
        file.name,
        uploadJson.fileUrl,
        file.size,
        file.type,
        undefined,
        notes || undefined,
      );

      if (!res.success) {
        throw new Error(res.error);
      }

      setFeedback({
        type: "success",
        message: `"${selectedDocConfig.label}" başarıyla yüklendi ve danışman onayına iletildi!`,
      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Yükleme sırasında hata oluştu.",
      });
    } finally {
      setIsUploading(false);
    }
  }

  const selectedExisting = selectedDocConfig
    ? docByType.get(selectedDocConfig.type)
    : undefined;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      {/* Header + Top-Right Visual Status Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-[#0f172a]">
            Zorunlu Belge Durumu
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Belge yüklemek veya güncellemek için ilgili kutunun üzerine tıklayın
          </p>
        </div>

        {/* Visual Status Legend in Top-Right Corner */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-emerald-900">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-emerald-600 text-emerald-600">
              <Check className="h-3 w-3 stroke-[2.5]" />
            </span>
            <span>Tamamlandı</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-1.5 text-amber-900">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-amber-500 text-amber-600">
              <Clock className="h-3 w-3 stroke-[2.5]" />
            </span>
            <span>Onay Bekliyor</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-1.5 text-rose-900">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-rose-500 text-rose-500">
              <X className="h-3 w-3 stroke-[2.5]" />
            </span>
            <span>Eksik</span>
          </div>
        </div>
      </div>

      {/* Document Pills Grid (Matching Screenshot Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {requiredDocs.map((item) => {
          const doc = docByType.get(item.type);
          const status = doc?.verificationStatus;
          const isApproved = status === "APPROVED";
          const isPending = status === "PENDING";
          const isRevision =
            status === "REVISION_REQUESTED" || status === "REJECTED";

          return (
            <button
              key={item.type}
              type="button"
              onClick={() => openModalForDoc(item)}
              className={`group rounded-2xl border px-4 py-3.5 flex items-center justify-between text-left transition-all cursor-pointer ${
                isApproved
                  ? "border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-950"
                  : isPending
                  ? "border-amber-300 bg-amber-50/70 hover:bg-amber-100/70 text-amber-950"
                  : "border-rose-300 bg-rose-50/70 hover:bg-rose-100/70 text-rose-950"
              }`}
            >
              <div className="min-w-0 pr-2">
                <span className="text-xs font-bold block truncate">
                  {item.label}
                </span>
                <span
                  className={`text-[10px] font-medium block mt-0.5 ${
                    isApproved
                      ? "text-emerald-700"
                      : isPending
                      ? "text-amber-700"
                      : "text-rose-600 group-hover:underline"
                  }`}
                >
                  {isApproved
                    ? "Onaylandı"
                    : isPending
                    ? "Onay Aşamasında"
                    : isRevision
                    ? "Revize İstendi · Yükle"
                    : "Yüklemek için tıkla"}
                </span>
              </div>

              {isApproved ? (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-emerald-600 text-emerald-600">
                  <Check className="h-4 w-4 stroke-[2.5]" />
                </span>
              ) : isPending ? (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-amber-500 text-amber-600">
                  <Clock className="h-4 w-4 stroke-[2.5]" />
                </span>
              ) : (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-rose-500 text-rose-500">
                  <X className="h-4 w-4 stroke-[2.5]" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Instant Document Upload / View Modal */}
      {selectedDocConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-[#1e3a8a]" />
                <div>
                  <h3 className="text-sm font-bold text-[#0f172a]">
                    {selectedDocConfig.label}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Belge Yükleme &amp; Durum Penceresi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDocConfig(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Existing Document Info if already uploaded */}
              {selectedExisting && (
                <div
                  className={`rounded-xl border p-3.5 space-y-2 ${
                    selectedExisting.verificationStatus === "APPROVED"
                      ? "border-emerald-200 bg-emerald-50/70"
                      : selectedExisting.verificationStatus === "PENDING"
                      ? "border-amber-200 bg-amber-50/70"
                      : "border-rose-200 bg-rose-50/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 truncate max-w-[220px]">
                      Mevcut: {selectedExisting.fileName}
                    </span>
                    <a
                      href={selectedExisting.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-[#1e3a8a] hover:underline"
                    >
                      <span>Görüntüle</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Durum:{" "}
                    <strong>
                      {selectedExisting.verificationStatus === "APPROVED"
                        ? "Danışman Tarafından Onaylandı"
                        : selectedExisting.verificationStatus === "PENDING"
                        ? "Danışman Onayı Bekliyor"
                        : "Revize / Yeniden Yükleme İstendi"}
                    </strong>
                  </p>
                  {selectedExisting.rejectionReason && (
                    <p className="text-[11px] font-semibold text-rose-700">
                      Not: {selectedExisting.rejectionReason}
                    </p>
                  )}
                </div>
              )}

              {/* Upload Form */}
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="mb-1.5 block font-bold text-slate-700">
                    {selectedExisting
                      ? "Yeni Dosya ile Güncelle (PDF, JPG, PNG)"
                      : "Dosya Seçin (PDF, JPG, PNG)"}
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-[#0f172a] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:border-[#1e3a8a]"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Danışmana Not (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Belgeyle ilgili eklemek istediğiniz not…"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#0f172a] focus:outline-none"
                  />
                </div>

                {feedback && (
                  <div
                    className={`flex items-center gap-2 rounded-xl p-3 text-xs font-semibold ${
                      feedback.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {feedback.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    )}
                    <span>{feedback.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedDocConfig(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Kapat
                  </button>
                  <button
                    type="submit"
                    disabled={!file || isUploading}
                    className="flex items-center gap-1.5 rounded-xl bg-[#0f172a] px-4 py-2 font-bold text-white hover:bg-[#1e3a8a] disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Yükleniyor…</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-3.5 w-3.5 text-sky-400" />
                        <span>Belgeyi Yükle</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
