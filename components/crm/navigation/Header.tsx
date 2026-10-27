// components/crm/navigation/Header.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Bell,
  ChevronDown,
  LogOut,
  UserCircle,
  Settings,
  CheckCheck,
  AlertTriangle,
  AtSign,
  PhoneCall,
} from "lucide-react";
import { useState } from "react";
import { logoutAction } from "@/lib/auth/actions";
import type { AuthUser } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/roles";
import {
  PendingApprovalsDrawer,
  type StagedApprovalItem,
} from "@/components/crm/approvals/PendingApprovalsDrawer";

const PATH_LABELS: Record<string, string> = {
  dashboard: "Genel Bakış",
  leads: "Leadler & Çağrı Takibi",
  students: "Kayıtlı Öğrenciler",
  groups: "Grup & Vize Takibi",
  schools: "Partner Okul Havuzu",
  accounting: "Muhasebe & Finans",
  catalog: "İş / Okul Havuzu",
  marketing: "Toplu Bildirim & Pazarlama",
  notifications: "Bildirimler",
  approvals: "Onay Kuyruğu",
  settings: "Ayarlar & Yetkiler",
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

export interface HeaderNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  isRead: boolean;
  createdAt: Date | string;
}

interface HeaderProps {
  user: AuthUser;
  pendingApprovals?: StagedApprovalItem[];
  notifications?: HeaderNotificationItem[];
}

export default function Header({
  user,
  pendingApprovals = [],
  notifications = [],
}: HeaderProps) {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isApprovalsOpen, setIsApprovalsOpen] = useState(false);

  const unreadCount =
    notifications.filter((n) => !n.isRead).length + pendingApprovals.length;

  return (
    <>
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        {/* Breadcrumbs */}
        <nav aria-label="Sayfa konumu">
          <ol className="flex items-center gap-1.5 text-sm">
            {crumbs.map((crumb, i) => (
              <li key={crumb.href} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-slate-300">/</span>}
                {crumb.isLast ? (
                  <span className="font-bold text-[#0f172a]">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-slate-500 hover:text-[#0f172a] hover:underline"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {user.role !== "ACCOUNTING" && (
            <Link
              href="/leads/new"
              className="flex items-center gap-1.5 rounded-lg bg-[#0f172a] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1e3a8a] transition-colors"
            >
              <Plus className="h-4 w-4 text-sky-400" />
              Yeni Lead / Kayıt
            </Link>
          )}

          {/* Notification & Alerts Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-[#0f172a] transition-colors"
              title="Bildirimler, Follow-up & Deadline Uyarıları"
              aria-label="Bildirimler"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-sm animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 bg-[#0f172a] px-4 py-3 text-white">
                  <div>
                    <p className="text-xs font-bold">Advice Bildirim Merkezi</p>
                    <p className="text-[10px] text-slate-300">
                      Follow-up, Deadline, @Mention &amp; Onaylar
                    </p>
                  </div>
                  {pendingApprovals.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        setIsApprovalsOpen(true);
                      }}
                      className="rounded-lg bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-slate-950 hover:bg-amber-400"
                    >
                      {pendingApprovals.length} Onay Bekliyor
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 && pendingApprovals.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Yeni bildirim bulunmuyor.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.href || "/dashboard"}
                        onClick={() => setNotifOpen(false)}
                        className={`flex items-start gap-3 p-3.5 hover:bg-slate-50 transition-colors ${
                          !n.isRead ? "bg-blue-50/40" : ""
                        }`}
                      >
                        <div className="mt-0.5 rounded-lg bg-slate-100 p-1.5">
                          {n.type === "MENTION" ? (
                            <AtSign className="h-4 w-4 text-blue-600" />
                          ) : n.type === "OVERDUE" || n.type === "DEADLINE" ? (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          ) : n.type === "FOLLOW_UP" ? (
                            <PhoneCall className="h-4 w-4 text-amber-600" />
                          ) : (
                            <CheckCheck className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {n.title}
                          </p>
                          <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                            {n.message}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>

                <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 flex items-center justify-between">
                  <Link
                    href="/leads?tab=overdue"
                    onClick={() => setNotifOpen(false)}
                    className="text-[11px] font-bold text-red-600 hover:underline"
                  >
                    Takibi Geçmiş Leadler →
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifOpen(false);
                      setIsApprovalsOpen(true);
                    }}
                    className="text-[11px] font-bold text-[#1e3a8a] hover:underline"
                  >
                    Onay Çekmecesini Aç
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-100 transition-colors"
            >
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <UserCircle className="h-7 w-7 text-slate-400" />
              )}
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold text-slate-900 leading-none">
                  {user.fullName}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {user.customRole?.name || ROLE_LABELS[user.role]}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl border border-slate-100 bg-white py-1.5 shadow-xl z-50">
                <div className="border-b border-slate-100 px-4 py-2.5">
                  <p className="text-xs font-bold text-slate-900 leading-none">
                    {user.fullName}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">
                    {user.email}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => setProfileOpen(false)}
                  >
                    <UserCircle className="h-4 w-4 text-slate-400" />
                    Profilim &amp; Güvenlik
                  </Link>

                  {user.role === "ADMIN" && (
                    <Link
                      href="/settings"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#1e3a8a] hover:bg-blue-50 transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Settings className="h-4 w-4 text-[#1e3a8a]" />
                      Sistem, Roller &amp; Personel Ayarları
                    </Link>
                  )}
                </div>

                <div className="my-1 border-t border-slate-100" />

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

      <PendingApprovalsDrawer
        isOpen={isApprovalsOpen}
        onClose={() => setIsApprovalsOpen(false)}
        approvals={pendingApprovals}
      />
    </>
  );
}
