// components/crm/settings/StaffPermissionsModal.tsx
"use client";

import { useState, useTransition } from "react";
import {
  X,
  Shield,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Plane,
  GraduationCap,
  Languages,
  Sun,
  Stamp,
  Lock,
  FileCheck,
  Bell,
  Download,
  Users,
  ShieldCheck,
} from "lucide-react";
import { updateStaffPermissions } from "@/actions/crm/users";
import { ProgramBadge } from "@/components/crm/common/ProgramBadge";
import type { Program, Role } from "@/types/crm";

interface Props {
  user: any;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PROGRAM_OPTIONS: { key: Program; label: string; icon: React.ElementType }[] = [
  { key: "WORK_AND_TRAVEL", label: "Work & Travel", icon: Plane },
  { key: "ACADEMY", label: "Akademi (Lisans / Yüksek Lisans)", icon: GraduationCap },
  { key: "LANGUAGE_SCHOOL", label: "Dil Okulları", icon: Languages },
  { key: "SUMMER_CAMP", label: "Yaz Okulları & Gençlik Kampları", icon: Sun },
  { key: "VISA_CONSULTING", label: "Vize Başvuruları & Danışmanlık", icon: Stamp },
];

export function StaffPermissionsModal({ user, currentUserId, isOpen, onClose }: Props) {
  const profile = user.advisorProfile;
  const isSelf = user.id === currentUserId;

  const [role, setRole] = useState<Role>(user.role);
  const [department, setDepartment] = useState(profile?.department || "");
  const [allowedPrograms, setAllowedPrograms] = useState<Program[]>(
    profile?.allowedPrograms || [
      "WORK_AND_TRAVEL",
      "ACADEMY",
      "LANGUAGE_SCHOOL",
      "SUMMER_CAMP",
      "VISA_CONSULTING",
    ]
  );

  const [canManageApprovals, setCanManageApprovals] = useState<boolean>(
    profile?.canManageApprovals ?? true
  );
  const [canManageMarketing, setCanManageMarketing] = useState<boolean>(
    profile?.canManageMarketing ?? true
  );
  const [canExportData, setCanExportData] = useState<boolean>(
    profile?.canExportData ?? false
  );
  const [canViewAllLeads, setCanViewAllLeads] = useState<boolean>(
    profile?.canViewAllLeads ?? true
  );

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  function toggleProgram(p: Program) {
    if (allowedPrograms.includes(p)) {
      if (allowedPrograms.length === 1 && role === "ADVISOR") {
        setError("Danışman için en az bir program seçili kalmalıdır.");
        return;
      }
      setAllowedPrograms(allowedPrograms.filter((x) => x !== p));
    } else {
      setAllowedPrograms([...allowedPrograms, p]);
    }
  }

  function handleSave() {
    setError(null);
    setSuccess(false);

    if (isSelf && role !== "ADMIN") {
      setError("Güvenlik gereği kendi yönetici (ADMIN) rolünüzü düşüremezsiniz.");
      return;
    }

    if (role === "ADVISOR" && allowedPrograms.length === 0) {
      setError("Danışman için en az bir program modülü seçmelisiniz.");
      return;
    }

    startTransition(async () => {
      const res = await updateStaffPermissions(user.id, {
        role,
        department: department.trim() || null,
        allowedPrograms,
        canManageApprovals,
        canManageMarketing,
        canExportData,
        canViewAllLeads,
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setError(res.error || "Güncelleme sırasında bir hata oluştu.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 shadow-sm">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Personel Yetki & Modül Yönetimi</h3>
              <p className="text-xs text-gray-400">
                {user.fullName} ({user.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>Yetki ve modül erişimleri başarıyla güncellendi!</span>
            </div>
          )}

          {/* 1. Rol & Departman */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">
                Sistem Yetki Rolü
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                disabled={isSelf}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-medium text-gray-800 focus:border-blue-500 focus:outline-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="ADVISOR">Danışman (Advisor) — Modül Kısıtlı</option>
                <option value="ADMIN">Sistem Yöneticisi (ADMIN) — Tam Yetki</option>
              </select>
              {isSelf && (
                <p className="mt-1 text-[11px] text-amber-600 font-medium">
                  Kendi hesabınızın yönetici rolünü düşüremezsiniz.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">
                Departman / Birim
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Örn: Amerika & Work and Travel Departmanı"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Admin Bilgilendirme Notu */}
          {role === "ADMIN" && (
            <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4 text-xs text-gray-200 space-y-1 shadow-sm">
              <p className="font-bold flex items-center gap-1.5 text-amber-300">
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                Yönetici Hesabı Ayrıcalığı (Süper Yetki)
              </p>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Yöneticiler, acentedeki tüm programlara (Work & Travel, Akademi, Dil vb.), onay kuyruklarına, sistem ayarlarına ve tüm şube datalarına sınırsız erişim hakkına sahiptir.
              </p>
            </div>
          )}

          {/* 2. Program Modülü Seçimi (Checkboxes) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                Erişebileceği Program Modülleri
              </label>
              <span className="text-[11px] text-gray-400">
                {allowedPrograms.length} / 5 Program Seçili
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Danışman sisteme giriş yaptığında yalnızca işaretli programları sol menüde ve tablolarda görebilir.
            </p>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {PROGRAM_OPTIONS.map((opt) => {
                const isSelected = allowedPrograms.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => toggleProgram(opt.key)}
                    className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/40 shadow-xs ring-1 ring-blue-400/50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ProgramBadge program={opt.key} showIcon size="sm" />
                    </div>
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs font-bold transition-colors ${
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-300 bg-white text-transparent"
                      }`}
                    >
                      ✓
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Operasyonel Yetki Anahtarları */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
              Operasyonel İzinler & Güvenlik
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Onay Kuyruğu */}
              <label className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-3 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canManageApprovals}
                  onChange={(e) => setCanManageApprovals(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Öğrenci Değişiklik Onayı
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Öğrenci portalından gelen pasaport, vize ve profil değişikliklerini onaylayabilir.
                  </p>
                </div>
              </label>

              {/* Toplu Pazarlama */}
              <label className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-3 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canManageMarketing}
                  onChange={(e) => setCanManageMarketing(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-blue-600" />
                    Toplu SMS / E-Posta
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Adaylara veya kayıtlı öğrencilere toplu bildirim sevk edebilir.
                  </p>
                </div>
              </label>

              {/* Dışa Aktarma */}
              <label className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-3 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canExportData}
                  onChange={(e) => setCanExportData(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Download className="h-3.5 w-3.5 text-amber-600" />
                    Excel / Veri İndirme
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Aday ve öğrenci listelerini dışarıya (CSV/Excel) aktarabilir.
                  </p>
                </div>
              </label>

              {/* Tüm Leadler */}
              <label className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-3 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canViewAllLeads}
                  onChange={(e) => setCanViewAllLeads(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-purple-600" />
                    Tüm Şube Adaylarını Görme
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Kapalıysa sadece doğrudan kendisine atanmış adayları görebilir.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Kaydediliyor…" : "Yetkileri Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
