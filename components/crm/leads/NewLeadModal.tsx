// components/crm/leads/NewLeadModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  X,
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
      tabIndex={7}
      className="flex items-center gap-1.5 rounded-lg bg-[#0f172a] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#1e3a8a] disabled:opacity-50 transition-colors"
    >
      <UserPlus className="h-3.5 w-3.5 text-sky-400" />
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

interface Props {
  preselectedProgram?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NewLeadModal({
  preselectedProgram = "WORK_AND_TRAVEL",
  onClose,
  onSuccess,
}: Props) {
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
      if (onSuccess) onSuccess();
      onClose();
    }
  }, [state.success, onClose, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <form action={formAction} className="flex flex-col h-full overflow-hidden">
          {/* ── Modal Header (Title + İptal & Adayı Kaydet Butonları Sağ Üstte) ── */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0f172a]">Yeni Aday (Lead) Girişi</h2>
                <p className="text-[11px] text-slate-500">
                  {activeTab === "MANUAL" ? "Tekil aday kayıt formu" : "Toplu Excel / CSV aktarımı"}
                </p>
              </div>
            </div>

            {/* Sağ Üst Aksiyonlar: İptal ve Kaydet */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                İptal
              </button>
              {activeTab === "MANUAL" && <SubmitButton />}
              <button
                type="button"
                onClick={onClose}
                className="ml-1 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Tab Bar (Tekil Kayıt vs Toplu Excel) ─────────────────────────── */}
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 bg-slate-50/50 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("MANUAL")}
              className={cn(
                "flex items-center gap-1.5 border-b-2 py-2 text-xs font-bold transition-colors",
                activeTab === "MANUAL"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Tekil Kayıt
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("BULK")}
              className={cn(
                "flex items-center gap-1.5 border-b-2 py-2 text-xs font-bold transition-colors",
                activeTab === "BULK"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Toplu Excel / CSV Yükleme
            </button>
          </div>

          {/* ── Modal Body (Compact & Full HD Uygun) ─────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* TAB 1: BULK IMPORT */}
            {activeTab === "BULK" && <BulkLeadImport />}

            {/* TAB 2: MANUAL FORM */}
            {activeTab === "MANUAL" && (
              <div className="space-y-4">
                {!state.success && state.error && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                    <span>{state.error}</span>
                  </div>
                )}

                {state.success && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>Aday başarıyla kaydedildi!</span>
                  </div>
                )}

                {/* Sub-Tabs: Temel Bilgiler vs Ek Profil Bilgileri */}
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setFormSubTab("BASIC")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-bold transition-all",
                      formSubTab === "BASIC"
                        ? "bg-white text-blue-700 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <User className="h-3.5 w-3.5" />
                    Temel Bilgiler (Zorunlu Alanlar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormSubTab("EXTRA")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-bold transition-all",
                      formSubTab === "EXTRA"
                        ? "bg-white text-blue-700 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Ek Profil Bilgileri (Opsiyonel)
                  </button>
                </div>

                {/* ═════════════════════════════════════════════════════════════ */}
                {/* SUB-TAB 1: TEMEL BİLGİLER                                   */}
                {/* ═════════════════════════════════════════════════════════════ */}
                <div className={cn("space-y-3.5", formSubTab === "BASIC" ? "block" : "hidden")}>
                  {/* 1. Ad Soyad */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Ad Soyad <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="fullName"
                        required
                        tabIndex={1}
                        placeholder="Örn: Zeynep Kaya"
                        className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* 2. Telefon Numarası */}
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">
                        Telefon Numarası {!noPhone && <span className="text-red-500">*</span>}
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer text-[11px] font-normal text-slate-500 hover:text-slate-700 select-none">
                        <input
                          type="checkbox"
                          checked={noPhone}
                          tabIndex={10}
                          onChange={(e) => {
                            setNoPhone(e.target.checked);
                            if (e.target.checked) setPhone("");
                          }}
                          className="h-3 w-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        Telefon bilgisi yok
                      </label>
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={noPhone ? "" : phone}
                        tabIndex={2}
                        onChange={(e) => setPhone(formatTurkishPhone(e.target.value))}
                        disabled={noPhone}
                        required={!noPhone}
                        placeholder={noPhone ? "Telefon bilgisi belirtilmedi" : "(5XX) XXX XX XX"}
                        className={cn(
                          "w-full rounded-lg border py-1.5 pl-9 pr-3 text-xs transition-colors",
                          noPhone
                            ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed placeholder-slate-400"
                            : "border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        )}
                      />
                      <input type="hidden" name="noPhone" value={noPhone ? "true" : "false"} />
                    </div>
                  </div>

                  {/* 3. E-Posta */}
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">
                        E-Posta {!noEmail && <span className="text-red-500">*</span>}
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer text-[11px] font-normal text-slate-500 hover:text-slate-700 select-none">
                        <input
                          type="checkbox"
                          checked={noEmail}
                          tabIndex={11}
                          onChange={(e) => {
                            setNoEmail(e.target.checked);
                            if (e.target.checked) setEmail("");
                          }}
                          className="h-3 w-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        E-posta bilgisi yok
                      </label>
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        value={noEmail ? "" : email}
                        tabIndex={3}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={noEmail}
                        required={!noEmail}
                        placeholder={noEmail ? "E-posta bilgisi belirtilmedi" : "zeynep@example.com"}
                        className={cn(
                          "w-full rounded-lg border py-1.5 pl-9 pr-3 text-xs transition-colors",
                          noEmail
                            ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed placeholder-slate-400"
                            : "border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        )}
                      />
                      <input type="hidden" name="noEmail" value={noEmail ? "true" : "false"} />
                    </div>
                  </div>

                  {/* 4. Program & Kaynak */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        İlgilendiği Program <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                          name="program"
                          required
                          tabIndex={4}
                          defaultValue={preselectedProgram}
                          className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
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
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Aday Kaynağı
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                          name="source"
                          tabIndex={5}
                          defaultValue="OFFICE_VISIT"
                          className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
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

                  {/* 5. Danışman Notu */}
                  <div className="pt-1 border-t border-slate-100">
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Danışman Notu
                    </label>
                    <textarea
                      name="notes"
                      rows={2}
                      tabIndex={6}
                      placeholder="Adayın İngilizce seviyesi, üniversitesi, hedeflediği dönem veya seyahat planları..."
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* ═════════════════════════════════════════════════════════════ */}
                {/* SUB-TAB 2: EK PROFİL BİLGİLERİ (OPSİYONEL - ASTERİKSİZ)         */}
                {/* ═════════════════════════════════════════════════════════════ */}
                <div className={cn("space-y-3", formSubTab === "EXTRA" ? "block" : "hidden")}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Şehir */}
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Şehir
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          name="city"
                          placeholder="Örn: İstanbul, Ankara, İzmir..."
                          className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none bg-white"
                        />
                      </div>
                    </div>

                    {/* Cinsiyet */}
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Cinsiyet
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                          name="gender"
                          defaultValue=""
                          className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none bg-white"
                        >
                          <option value="">Seçiniz (Opsiyonel)</option>
                          <option value="FEMALE">Kadın</option>
                          <option value="MALE">Erkek</option>
                        </select>
                      </div>
                    </div>

                    {/* Sponsor */}
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Sponsor / Kurum
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          name="sponsor"
                          placeholder="Örn: CIEE, Intrax, InterExchange..."
                          className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none bg-white"
                        />
                      </div>
                    </div>

                    {/* Vize Durumu */}
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Vize Durumu
                      </label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                          name="visaStatus"
                          defaultValue=""
                          className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none bg-white"
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
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Planlanan İlk Takip / Arama Tarihi
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="datetime-local"
                          name="followUpAt"
                          className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
