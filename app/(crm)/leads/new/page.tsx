// app/(crm)/leads/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  UserPlus,
  Mail,
  Phone,
  User,
  GraduationCap,
  Globe,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import { createLead, type LeadFormState } from "@/actions/crm/leads";
import { PROGRAM_LABELS, LEAD_SOURCE_LABELS } from "@/types/crm";
import { BulkLeadImport } from "@/components/crm/leads/BulkLeadImport";
import { cn } from "@/lib/utils/cn";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      <UserPlus className="h-4 w-4" />
      {pending ? "Kaydediliyor…" : "Adayı Kaydet"}
    </button>
  );
}

export default function NewLeadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProgram = searchParams.get("program") || "WORK_AND_TRAVEL";
  const [activeTab, setActiveTab] = useState<"MANUAL" | "BULK">("MANUAL");
  const [state, formAction] = useFormState<LeadFormState, FormData>(
    createLead,
    { success: false, error: "" }
  );

  useEffect(() => {
    if (state.success) {
      router.push("/leads");
    }
  }, [state.success, router]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link
          href="/leads"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Aday (Lead) Girişi</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Ofise doğrudan başvuran veya telefonla ulaşan adayları tekil veya toplu Excel/CSV ile sisteme aktarın.
          </p>
        </div>
      </div>

      {/* ── Tab Bar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("MANUAL")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors",
            activeTab === "MANUAL"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          )}
        >
          <UserPlus className="h-4 w-4" />
          Tekil Manuel Kayıt
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("BULK")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors",
            activeTab === "BULK"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          )}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Toplu Excel / CSV Yükleme
        </button>
      </div>

      {/* ── TAB 1: BULK IMPORT ─────────────────────────────────────────────── */}
      {activeTab === "BULK" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <BulkLeadImport />
        </div>
      )}

      {/* ── TAB 2: MANUAL SINGLE FORM ──────────────────────────────────────── */}
      {activeTab === "MANUAL" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {!state.success && state.error && (
            <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{state.error}</span>
            </div>
          )}

          {state.success && (
            <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>Aday başarıyla kaydedildi! Yönlendiriliyorsunuz…</span>
            </div>
          )}

          <form action={formAction} className="space-y-6">
            {/* Kişisel Bilgiler */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Temel İletişim Bilgileri
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    Ad Soyad <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="fullName"
                      required
                      placeholder="Örn: Zeynep Kaya"
                      className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3.5 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    E-Posta <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="zeynep@example.com"
                      className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3.5 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    Telefon Numarası <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="0532 000 00 00"
                      className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3.5 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Program & Kaynak */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Program & Kaynak Tercihi
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    İlgilendiği Program <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select
                      name="program"
                      required
                      defaultValue={preselectedProgram}
                      className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3.5 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      {Object.entries(PROGRAM_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    Aday Kaynağı
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select
                      name="source"
                      defaultValue="OFFICE_VISIT"
                      className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3.5 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      {Object.entries(LEAD_SOURCE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Notlar */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Görüşme Notları & Ön Değerlendirme
              </h3>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Danışman Notu
                </label>
                <div className="relative">
                  <textarea
                    name="notes"
                    rows={4}
                    placeholder="Adayın İngilizce seviyesi, üniversitesi, hedeflediği dönem veya seyahat planları..."
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
              <Link
                href="/leads"
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                İptal
              </Link>
              <SubmitButton />
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
