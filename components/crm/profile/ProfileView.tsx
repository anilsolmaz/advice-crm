// components/crm/profile/ProfileView.tsx
"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  UserCircle,
  Mail,
  Phone,
  Shield,
  Building,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  Calendar,
  Users,
  FileCheck,
} from "lucide-react";
import { updateProfileDetails, changePassword, type ProfileActionState } from "@/actions/crm/profile";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { formatDate } from "@/lib/utils/date";

function SaveButton({ label = "Değişiklikleri Kaydet" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      <Save className="h-4 w-4" />
      {pending ? "Kaydediliyor…" : label}
    </button>
  );
}

interface UserData {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  createdAt: Date | string;
  department: string | null;
  studentsCount: number;
  leadsCount: number;
}

export function ProfileView({ user }: { user: UserData }) {
  const [profileState, profileAction] = useFormState<ProfileActionState, FormData>(
    updateProfileDetails,
    { success: false, error: "" }
  );

  const [passwordState, passwordAction] = useFormState<ProfileActionState, FormData>(
    changePassword,
    { success: false, error: "" }
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ── Profile Header Card ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white text-2xl font-bold shadow-md shadow-blue-200">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-gray-900">{user.fullName}</h1>
                <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-100">
                  {(ROLE_LABELS as any)[user.role] || user.role}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  {user.email}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Building className="h-3.5 w-3.5 text-gray-400" />
                  {user.department || "Genel Operasyon"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50/75 px-4 py-2.5 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Kayıtlı Öğrenci</span>
              <p className="text-lg font-bold text-gray-900">{user.studentsCount}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/75 px-4 py-2.5 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Takip Edilen Lead</span>
              <p className="text-lg font-bold text-gray-900">{user.leadsCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* ── Form 1: Kişisel Bilgiler ──────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Kişisel Bilgiler</h2>
              <p className="text-xs text-gray-400">İletişim ve profil ayrıntılarınız</p>
            </div>
          </div>

          {profileState.success && profileState.message && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{profileState.message}</span>
            </div>
          )}

          {!profileState.success && profileState.error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{profileState.error}</span>
            </div>
          )}

          <form action={profileAction} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Ad Soyad</label>
              <input
                type="text"
                name="fullName"
                defaultValue={user.fullName}
                required
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Telefon Numarası</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="tel"
                  name="phone"
                  defaultValue={user.phone || ""}
                  placeholder="0532 000 0000"
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-xs text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Giriş E-Posta Adresi</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  disabled
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-xs text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-[11px] text-gray-400">
                E-posta adresi sistem yöneticisi tarafından belirlenir.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Departman / Rol</label>
              <input
                type="text"
                value={`${user.department || "Operasyon"} (${(ROLE_LABELS as any)[user.role] || user.role})`}
                readOnly
                disabled
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-500 cursor-not-allowed"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <SaveButton label="Profil Bilgilerini Güncelle" />
            </div>
          </form>
        </div>

        {/* ── Form 2: Güvenlik & Şifre Değiştirme ────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Güvenlik & Şifre Değiştir</h2>
              <p className="text-xs text-gray-400">Hesap erişim şifrenizi güncelleyin</p>
            </div>
          </div>

          {passwordState.success && passwordState.message && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{passwordState.message}</span>
            </div>
          )}

          {!passwordState.success && passwordState.error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{passwordState.error}</span>
            </div>
          )}

          <form action={passwordAction} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Mevcut Şifreniz</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="password"
                  name="currentPassword"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-xs text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Yeni Şifre</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="password"
                  name="newPassword"
                  required
                  minLength={6}
                  placeholder="En az 6 karakter"
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-xs text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Yeni Şifre (Tekrar)</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={6}
                  placeholder="Yeni şifreyi tekrar yazın"
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-xs text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <SaveButton label="Şifreyi Güncelle" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
