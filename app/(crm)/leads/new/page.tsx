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
  MapPin,
  Building2,
  Calendar,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
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

function formatTurkishPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length > 2) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 10);

  if (!digits) return "";
  if (digits.length <= 3) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  if (digits.length <= 8) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
}

export default function NewLeadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProgram = searchParams.get("program") || "WORK_AND_TRAVEL";

  const [activeTab, setActiveTab] = useState<"MANUAL" | "BULK">("MANUAL");
  const [formSubTab, setFormSubTab] = useState<"BASIC" | "EXTRA">("BASIC");

  const [phone, setPhone] = useState("");
  const [noPhone, setNoPhone] = useState(false);
  const [email, setEmail] = useState("");
  const [noEmail, setNoEmail] = useState(false);

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

          {/* Sub-Tabs: Temel Bilgiler vs Ek Profil Bilgileri */}
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-slate-100 p-1.5 border border-slate-200/70">
            <button
              type="button"
              onClick={() => setFormSubTab("BASIC")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all",
                formSubTab === "BASIC"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <User className="h-4 w-4" />
              Temel Bilgiler (Zorunlu Alanlar)
            </button>
            <button
              type="button"
              onClick={() => setFormSubTab("EXTRA")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all",
                formSubTab === "EXTRA"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Ek Profil & Takip Bilgileri (Opsiyonel)
            </button>
          </div>

          <form action={formAction} className="space-y-6">
            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* SUB-TAB 1: TEMEL BİLGİLER (ZORUNLU ALANLAR)                     */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <div className={cn("space-y-6", formSubTab === "BASIC" ? "block" : "hidden")}>
              {/* Temel İletişim Bilgileri (Alt Alta Sıralı) */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Temel İletişim Bilgileri
                </h3>

                <div className="space-y-4">
                  {/* 1. Ad Soyad */}
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

                  {/* 2. Telefon Numarası + "Telefon bilgisi yok" Checkbox */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-700">
                        Telefon Numarası {!noPhone && <span className="text-red-500">*</span>}
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-800 select-none">
                        <input
                          type="checkbox"
                          checked={noPhone}
                          onChange={(e) => {
                            setNoPhone(e.target.checked);
                            if (e.target.checked) setPhone("");
                          }}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        Telefon bilgisi yok
                      </label>
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={noPhone ? "" : phone}
                        onChange={(e) => setPhone(formatTurkishPhone(e.target.value))}
                        disabled={noPhone}
                        required={!noPhone}
                        placeholder={noPhone ? "Telefon bilgisi belirtilmedi" : "(555) 453 03 63"}
                        className={cn(
                          "w-full rounded-xl border py-2.5 pl-10 pr-3.5 text-sm transition-colors",
                          noPhone
                            ? "border-gray-200 bg-slate-100 text-slate-400 cursor-not-allowed placeholder-slate-400"
                            : "border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        )}
                      />
                      <input type="hidden" name="noPhone" value={noPhone ? "true" : "false"} />
                    </div>
                  </div>

                  {/* 3. E-Posta + "E-posta bilgisi yok" Checkbox */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-700">
                        E-Posta {!noEmail && <span className="text-red-500">*</span>}
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-800 select-none">
                        <input
                          type="checkbox"
                          checked={noEmail}
                          onChange={(e) => {
                            setNoEmail(e.target.checked);
                            if (e.target.checked) setEmail("");
                          }}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        E-posta bilgisi yok
                      </label>
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={noEmail ? "" : email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={noEmail}
                        required={!noEmail}
                        placeholder={noEmail ? "E-posta bilgisi belirtilmedi" : "zeynep@example.com"}
                        className={cn(
                          "w-full rounded-xl border py-2.5 pl-10 pr-3.5 text-sm transition-colors",
                          noEmail
                            ? "border-gray-200 bg-slate-100 text-slate-400 cursor-not-allowed placeholder-slate-400"
                            : "border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        )}
                      />
                      <input type="hidden" name="noEmail" value={noEmail ? "true" : "false"} />
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

              {/* Danışman Notu */}
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

              {/* Geçiş Butonu */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 flex items-center justify-between text-xs text-blue-900">
                <span>
                  Şehir, Cinsiyet, Sponsor ve Vize gibi opsiyonel bilgileri de eklemek ister misiniz?
                </span>
                <button
                  type="button"
                  onClick={() => setFormSubTab("EXTRA")}
                  className="font-bold underline hover:text-blue-700 flex items-center gap-1"
                >
                  Ek Profil Bilgileri Sekmesine Geç <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* SUB-TAB 2: EK PROFİL BİLGİLERİ (OPSİYONEL - ASTERİKSİZ)         */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <div className={cn("space-y-6", formSubTab === "EXTRA" ? "block" : "hidden")}>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Bilgi:</span> Bu alandaki tüm bilgiler opsiyoneldir (* zorunluluğu yoktur). Tabloda filtreleme veya detaylı takip için şimdi girebilir veya daha sonra profil düzenlemeden ekleyebilirsiniz.
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Şehir */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    Şehir
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="city"
                      placeholder="Örn: İstanbul, Ankara, İzmir..."
                      className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3.5 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                {/* Cinsiyet */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    Cinsiyet
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select
                      name="gender"
                      defaultValue=""
                      className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3.5 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Seçiniz (Opsiyonel)</option>
                      <option value="FEMALE">Kadın</option>
                      <option value="MALE">Erkek</option>
                    </select>
                  </div>
                </div>

                {/* Sponsor */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    Sponsor / Kurum
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="sponsor"
                      placeholder="Örn: CIEE, Intrax, InterExchange..."
                      className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3.5 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                {/* Vize Durumu */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    Vize Durumu
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select
                      name="visaStatus"
                      defaultValue=""
                      className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3.5 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Seçiniz (Opsiyonel)</option>
                      <option value="Randevu Bekliyor">Randevu Bekliyor</option>
                      <option value="Randevu Alındı">Randevu Alındı</option>
                      <option value="Vize Onaylandı">Vize Onaylandı</option>
                      <option value="Vize Reddedildi">Vize Reddedildi</option>
                      <option value="Başvurulmadı">Başvurulmadı</option>
                    </select>
                  </div>
                </div>

                {/* İlk Takip Tarihi */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    Planlanan İlk Takip / Arama Tarihi
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="datetime-local"
                      name="followUpAt"
                      className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3.5 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Geri Dönüş Butonu */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setFormSubTab("BASIC")}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  ← Temel Bilgilere Geri Dön
                </button>
              </div>
            </div>

            {/* ── Form Actions / Buttons ────────────────────────────────────────── */}
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
