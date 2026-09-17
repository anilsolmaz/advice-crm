// components/crm/navigation/Header.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Plus, Bell, ChevronDown, LogOut, UserCircle, Settings } from "lucide-react";
import { useState } from "react";
import { logoutAction } from "@/lib/auth/actions";
import type { AuthUser } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { PendingApprovalsDrawer, type StagedApprovalItem } from "@/components/crm/approvals/PendingApprovalsDrawer";

const PATH_LABELS: Record<string, string> = {
  dashboard: "Genel Bakış",
  leads: "Leadler",
  students: "Öğrenciler",
  catalog: "Katalog",
  marketing: "Toplu Bildirim & Pazarlama",
  notifications: "Bildirimler",
  approvals: "Onay Kuyruğu",
  settings: "Ayarlar",
  users: "Kullanıcılar",
  profile: "Profil",
  wat: "Work & Travel",
  academy: "Akademi",
  language: "Dil Okulları",
  "summer-camp": "Yaz Okulları",
  visa: "Vize Başvuruları",
};

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((seg, i) => ({
    label: PATH_LABELS[seg] ?? seg,
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));
}

interface HeaderProps {
  user: AuthUser;
  pendingApprovals?: StagedApprovalItem[];
}

export default function Header({ user, pendingApprovals = [] }: HeaderProps) {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isApprovalsOpen, setIsApprovalsOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        {/* ── Breadcrumbs ──────────────────────────────────────────────── */}
        <nav aria-label="Sayfa konumu">
          <ol className="flex items-center gap-1.5 text-sm">
            {crumbs.map((crumb, i) => (
              <li key={crumb.href} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-gray-300">/</span>}
                {crumb.isLast ? (
                  <span className="font-semibold text-gray-900">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-gray-500 hover:text-gray-700 hover:underline"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* ── Right actions ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Yeni Kayıt Ekle */}
          <Link
            href="/leads/new"
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Yeni Kayıt Ekle
          </Link>

          {/* Notification bell (Pending Approvals Trigger) */}
          <button
            type="button"
            onClick={() => setIsApprovalsOpen(true)}
            className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Bekleyen Onay Kuyruğu"
            aria-label="Bekleyen Onaylar"
          >
            <Bell className="h-5 w-5" />
            {pendingApprovals.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-sm animate-pulse">
                {pendingApprovals.length}
              </span>
            )}
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-100 transition-colors"
            >
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <UserCircle className="h-7 w-7 text-gray-400" />
              )}
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold text-gray-900 leading-none">
                  {user.fullName}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {ROLE_LABELS[user.role]}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl border border-gray-100 bg-white py-1.5 shadow-xl z-50">
                <div className="border-b border-gray-100 px-4 py-2.5">
                  <p className="text-xs font-bold text-gray-900 leading-none">{user.fullName}</p>
                  <p className="text-[11px] text-gray-400 mt-1 truncate">{user.email}</p>
                </div>

                <div className="py-1">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setProfileOpen(false)}
                  >
                    <UserCircle className="h-4 w-4 text-gray-400" />
                    Profilim & Güvenlik
                  </Link>

                  {user.role === "ADMIN" && (
                    <Link
                      href="/settings"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-purple-700 hover:bg-purple-50 transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Settings className="h-4 w-4 text-purple-600" />
                      Sistem & Personel Ayarları
                    </Link>
                  )}
                </div>

                <div className="my-1 border-t border-gray-100" />

                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-rose-500" />
                    Çıkış Yap
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Slide-over Approval Drawer */}
      <PendingApprovalsDrawer
        isOpen={isApprovalsOpen}
        onClose={() => setIsApprovalsOpen(false)}
        approvals={pendingApprovals}
      />
    </>
  );
}
