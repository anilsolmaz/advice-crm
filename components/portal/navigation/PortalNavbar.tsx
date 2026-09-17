// components/portal/navigation/PortalNavbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  User,
  FileText,
  CreditCard,
  Bell,
  LogOut,
  Globe,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import type { AuthUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

interface Props {
  user: AuthUser;
  pendingApprovalsCount: number;
}

export function PortalNavbar({ user, pendingApprovalsCount }: Props) {
  const pathname = usePathname();

  const navItems = [
    { label: "Anasayfa", href: "/anasayfa", icon: Home },
    { label: "Programım", href: "/programim", icon: BookOpen },
    { label: "Profilim", href: "/profilim", icon: User },
    { label: "Belgelerim", href: "/belgelerim", icon: FileText },
    { label: "Ödemelerim", href: "/odemelerim", icon: CreditCard },
    {
      label: "Bildirimler & Talepler",
      href: "/bildirimler",
      icon: Bell,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/anasayfa" className="flex items-center gap-3 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/advice-logo.svg"
            alt="Advice Yurtdışı Eğitim"
            className="h-10 w-auto object-contain"
          />
          <div className="hidden sm:block border-l border-gray-200 pl-3">
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
              Öğrenci Portalı
            </span>
            <p className="text-[11px] text-gray-500 mt-0.5">Hoş geldin, {user.fullName}</p>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-blue-700" : "text-gray-500")} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User profile & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-right">
            <div>
              <p className="text-xs font-semibold text-gray-900 leading-tight">{user.fullName}</p>
              <p className="text-[10px] text-gray-400">{user.email}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 text-xs">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
              title="Çıkış Yap"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </form>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex md:hidden overflow-x-auto border-t border-gray-100 px-2 py-1.5 bg-gray-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 min-w-[70px] flex-col items-center py-1 text-[11px] font-medium transition-colors",
                isActive ? "text-blue-700 font-semibold" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <div className="relative">
                <Icon className="h-4 w-4" />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="mt-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
