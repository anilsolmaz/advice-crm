"use client";

import { useState, useTransition } from "react";
import { FileCheck, Send, CheckCircle2 } from "lucide-react";
import { saveStudentDs160Form, type Ds160FormPayload } from "@/actions/portal/ds160";

interface Props {
  studentId: string;
  initialStatus?: string | null;
  initialConfirmationNo?: string | null;
  initialData?: Record<string, any> | null;
}

export function Ds160FormSection({
  studentId,
  initialStatus,
  initialConfirmationNo,
  initialData,
}: Props) {
  const [form, setForm] = useState<Ds160FormPayload>({
    confirmationNo: initialConfirmationNo || "AA002026BPX",
    consulateLocation: initialData?.consulateLocation || "Ankara / İstanbul",
    intendedArrivalDate: initialData?.intendedArrivalDate || "2026-06-15",
    usAddressStreet: initialData?.usAddressStreet || "",
    usAddressCity: initialData?.usAddressCity || "",
    usAddressState: initialData?.usAddressState || "",
    sevisId: initialData?.sevisId || "",
    socialMediaHandles: initialData?.socialMediaHandles || "",
    additionalNotes: initialData?.additionalNotes || "",
  });
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveStudentDs160Form(studentId, {
        ...form,
        status: "SUBMITTED",
      });
      if (res.success) {
        setSaved(true);
      } else {
        alert(res.error);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-[#1e3a8a]" />
            ABD Vizesi DS-160 Bilgi Formu (Student Worksheet)
          </h3>
          <p className="text-xs text-slate-500">
            Konsolosluk randevunuz için DS-160 form bilgilerinizi doldurup danışmanınıza iletin.
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            saved || initialStatus === "COMPLETED" || initialStatus === "SUBMITTED"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {saved || initialStatus === "COMPLETED" || initialStatus === "SUBMITTED"
            ? "✓ Danışmana İletildi"
            : "Doldurulması Bekleniyor"}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
        <div>
          <label className="mb-1 block font-bold text-slate-700">
            DS-160 Confirmation Number (AA00...)
          </label>
          <input
            type="text"
            value={form.confirmationNo || ""}
            onChange={(e) => setForm({ ...form, confirmationNo: e.target.value })}
            placeholder="Örn: AA00981234"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono"
          />
        </div>

        <div>
          <label className="mb-1 block font-bold text-slate-700">
            Tercih Edilen Konsolosluk
          </label>
          <select
            value={form.consulateLocation || "İstanbul"}
            onChange={(e) => setForm({ ...form, consulateLocation: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white"
          >
            <option value="İstanbul">İstanbul Başkonsolosluğu</option>
            <option value="Ankara">Ankara Büyükelçiliği</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block font-bold text-slate-700">
            Planlanan ABD Varış Tarihi
          </label>
          <input
            type="date"
            value={form.intendedArrivalDate || ""}
            onChange={(e) => setForm({ ...form, intendedArrivalDate: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block font-bold text-slate-700">
            ABD Konaklama Şehir / Eyalet
          </label>
          <input
            type="text"
            value={form.usAddressCity || ""}
            onChange={(e) => setForm({ ...form, usAddressCity: e.target.value })}
            placeholder="Örn: Wisconsin Dells, WI"
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block font-bold text-slate-700">
            SEVIS Numarası (N00...)
          </label>
          <input
            type="text"
            value={form.sevisId || ""}
            onChange={(e) => setForm({ ...form, sevisId: e.target.value })}
            placeholder="N0034918231"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono"
          />
        </div>

        <div>
          <label className="mb-1 block font-bold text-slate-700">
            Sosyal Medya Kullanıcı Adları (DS-160 Zorunlu)
          </label>
          <input
            type="text"
            value={form.socialMediaHandles || ""}
            onChange={(e) => setForm({ ...form, socialMediaHandles: e.target.value })}
            placeholder="@instagram, @linkedin"
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          />
        </div>

        <div className="sm:col-span-3 flex items-center justify-between pt-2">
          {saved && (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> DS-160 bilgileriniz başarıyla kaydedildi!
            </span>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="ml-auto flex items-center gap-2 rounded-xl bg-[#0f172a] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1e3a8a]"
          >
            <Send className="h-4 w-4 text-sky-400" />
            {isPending ? "Gönderiliyor…" : "DS-160 Formunu Kaydet & Danışmana Gönder"}
          </button>
        </div>
      </form>
    </div>
  );
}
