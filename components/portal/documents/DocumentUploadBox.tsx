// components/portal/documents/DocumentUploadBox.tsx
"use client";

import { useState, useTransition } from "react";
import { Upload, CheckCircle2, AlertCircle, FileText, Loader2, X } from "lucide-react";
import { registerUploadedDocument } from "@/actions/portal/documents";
import type { DocumentType } from "@prisma/client";
import { PORTAL_DOCUMENT_TYPE_LABELS } from "@/types/portal";

interface Props {
  studentId: string;
  onSuccess?: () => void;
}

const DOCUMENT_OPTIONS: DocumentType[] = [
  "PASSPORT",
  "TRANSCRIPT",
  "NATIONAL_ID",
  "DIPLOMA",
  "LANGUAGE_SCORE_REPORT",
  "BANK_STATEMENT",
  "PHOTO",
  "VISA_APPLICATION_FORM",
  "OTHER",
];

export function DocumentUploadBox({ studentId, onSuccess }: Props) {
  const [selectedType, setSelectedType] = useState<DocumentType>("PASSPORT");
  const [file, setFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Lütfen yüklenecek bir dosya seçiniz.");
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("studentId", studentId);
      formData.append("type", selectedType);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.success) {
        throw new Error(uploadData.error || "Dosya sunucuya yüklenemedi.");
      }

      const fileUrl = uploadData.fileUrl;

      // Register via server action (documents + pending_approvals in PostgreSQL)
      const res = await registerUploadedDocument(
        studentId,
        selectedType,
        file.name,
        fileUrl,
        file.size,
        file.type,
        expiryDate || undefined,
        notes || undefined
      );

      if (!res.success) {
        throw new Error(res.error);
      }

      setSuccessMsg("Belgeniz başarıyla yüklendi ve danışman onayına gönderildi!");
      setFile(null);
      setNotes("");
      setExpiryDate("");
      onSuccess?.();
    } catch (err: any) {
      setErrorMsg(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900">Yeni Belge Yükle</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          PDF, PNG veya JPEG formatında (en fazla 10 MB) evrak yükleyebilirsiniz.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Belge Türü *
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DocumentType)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
            >
              {DOCUMENT_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {PORTAL_DOCUMENT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Son Geçerlilik Tarihi (Varsa)
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Drag and Drop / File Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Belge Dosyası *
          </label>
          <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 hover:border-blue-400 hover:bg-blue-50/20 transition-all">
            {file ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800 truncate max-w-xs">{file.name}</p>
                  <p className="text-[10px] text-gray-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-xs font-semibold text-gray-700">
                  Dosya seçmek için tıklayın veya buraya sürükleyin
                </p>
                <p className="text-[10px] text-gray-400 mt-1">PDF, JPG, PNG (Maks 10MB)</p>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Danışmana Not (Opsiyonel)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Örn: Pasaportum yenilendi, 2. sayfayı ekledim..."
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isUploading || !file}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Yükleniyor…</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Belgeyi Gönder</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
