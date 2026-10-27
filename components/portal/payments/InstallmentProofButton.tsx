// components/portal/payments/InstallmentProofButton.tsx
"use client";

import { useState } from "react";
import {
  UploadCloud,
  CheckCircle2,
  Clock,
  X,
  Loader2,
  ExternalLink,
  AlertCircle,
  Wallet,
  Building2,
} from "lucide-react";
import { submitStudentInstallmentProof } from "@/actions/portal/documents";

interface InstallmentProofButtonProps {
  studentId: string;
  installmentId: string;
  sequence: number;
  amount: string;
  currency: string;
  isPaid: boolean;
  receiptUrl?: string | null;
  paymentMethod?: string | null;
}

export function InstallmentProofButton({
  studentId,
  installmentId,
  sequence,
  amount,
  currency,
  isPaid,
  receiptUrl,
  paymentMethod,
}: InstallmentProofButtonProps) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"BANK_TRANSFER" | "CASH_ELDEN">(
    paymentMethod === "CASH_ELDEN" ? "CASH_ELDEN" : "BANK_TRANSFER",
  );
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  if (isPaid) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-emerald-700">
          {paymentMethod === "CASH_ELDEN" ? "Elden Tahsilat" : "Banka Transferi"}
        </span>
        {receiptUrl && receiptUrl !== "ELDEN_BILDIRIM" && (
          <a
            href={receiptUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
          >
            <span>Dekont</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    );
  }

  const hasSubmittedProof = Boolean(receiptUrl);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (method === "BANK_TRANSFER" && !file && !receiptUrl) {
      setFeedback({
        type: "error",
        msg: "Havale/EFT bildirimi için lütfen dekont dosyasını seçin.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      let uploadedUrl = receiptUrl || undefined;
      let uploadedName = undefined;

      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("studentId", studentId);
        fd.append("docType", "PAYMENT_RECEIPT");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Dekont yüklenemedi.");
        }
        uploadedUrl = json.fileUrl;
        uploadedName = file.name;
      }

      const actRes = await submitStudentInstallmentProof({
        installmentId,
        paymentMethod: method,
        receiptUrl: uploadedUrl,
        fileName: uploadedName,
        notes,
      });

      if (!actRes.success) {
        throw new Error(actRes.error);
      }

      setFeedback({
        type: "success",
        msg: "Ödeme bildiriminiz ve dekontunuz danışman/muhasebe onayına iletildi!",
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        msg: err.message || "İşlem sırasında hata oluştu.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {hasSubmittedProof ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100"
          >
            <Clock className="h-3 w-3 text-amber-600" />
            <span>Dekont İletildi (Güncelle)</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f172a] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#1e3a8a] transition-colors"
          >
            <UploadCloud className="h-3.5 w-3.5 text-sky-400" />
            <span>Dekont Yükle / Ödeme Bildir</span>
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden text-left">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div>
                <h3 className="text-sm font-bold text-[#0f172a]">
                  {sequence}. Taksit Ödeme Bildirimi ({amount} {currency})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Havale/EFT dekontu yükleyin veya elden ödeme bildirimi yapın
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="mb-1.5 block font-bold text-slate-700">
                  Ödeme Yöntemi Seçin
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMethod("BANK_TRANSFER")}
                    className={`flex items-center gap-2 rounded-xl border p-3 font-bold transition-all ${
                      method === "BANK_TRANSFER"
                        ? "border-[#0f172a] bg-[#0f172a] text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span>Havale / EFT (Dekontlu)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("CASH_ELDEN")}
                    className={`flex items-center gap-2 rounded-xl border p-3 font-bold transition-all ${
                      method === "CASH_ELDEN"
                        ? "border-[#0f172a] bg-[#0f172a] text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Wallet className="h-4 w-4 shrink-0" />
                    <span>Ofiste Elden Ödeme</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block font-bold text-slate-700">
                  {method === "BANK_TRANSFER"
                    ? "Banka Dekontu Yükle (PDF, JPG, PNG) *"
                    : "Makbuz / Belge Fotoğrafı (Opsiyonel)"}
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2.5 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-[#0f172a] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Açıklama / Gönderen Adı / Tarih Notu
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    method === "CASH_ELDEN"
                      ? "Örn: İstanbul ofiste muhasebeye elden teslim edildi"
                      : "Örn: Garanti BBVA hesabına Mehmet Yılmaz adına gönderildi"
                  }
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
                  <span>{feedback.msg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-[#0f172a] px-4 py-2 font-bold text-white hover:bg-[#1e3a8a] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>İletiliyor…</span>
                    </>
                  ) : (
                    <span>Ödeme Bildirimini Gönder</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
