// components/crm/navigation/Sidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Users,
  FileCheck,
  Bell,
  BookOpen,
  Plane,
  GraduationCap,
  Languages,
  Sun,
  Stamp,
  Mail,
  Wallet,
  UsersRound,
  Building2,
} from "lucide-react";
import type { Role, Program } from "@/types/crm";
import { cn } from "@/lib/utils/cn";

type ProgramConfig = {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  basePath: string;
};

const PROGRAM_KEY_TO_ENUM: Record<string, Program> = {
  wat: "WORK_AND_TRAVEL",
  academy: "ACADEMY",
  language: "LANGUAGE_SCHOOL",
  summer: "SUMMER_CAMP",
  visa: "VISA_CONSULTING",
};

const PROGRAMS: ProgramConfig[] = [
  {
    key: "wat",
    label: "Work and Travel",
    icon: Plane,
    color: "text-sky-400",
    basePath: "/wat",
  },
  {
    key: "academy",
    label: "Akademi",
    icon: GraduationCap,
    color: "text-purple-400",
    basePath: "/academy",
  },
  {
    key: "language",
    label: "Dil Okulları",
    icon: Languages,
    color: "text-emerald-400",
    basePath: "/language",
  },
  {
    key: "summer",
    label: "Yaz Okulları",
    icon: Sun,
    color: "text-amber-400",
    basePath: "/summer-camp",
  },
  {
    key: "visa",
    label: "Vize Başvuruları",
    icon: Stamp,
    color: "text-rose-400",
    basePath: "/visa",
  },
];

const PROGRAM_SUB_ITEMS = [
  { label: "Leadler (Datalar)", icon: Users, slug: "leads" },
  { label: "Kayıtlı Öğrenciler", icon: FileCheck, slug: "students" },
  { label: "İş / Okul Havuzu", icon: BookOpen, slug: "catalog" },
  { label: "Toplu Pazarlama", icon: Mail, slug: "marketing" },
  { label: "Toplu Bildirim", icon: Bell, slug: "notifications" },
];

interface SidebarProps {
  userRole: Role;
  allowedPrograms?: Program[];
  canManageAccounting?: boolean;
}

export default function Sidebar({
  userRole,
  allowedPrograms,
  canManageAccounting = false,
}: SidebarProps) {
  const pathname = usePathname();

  const isAccountingRole = userRole === "ACCOUNTING";
  const showAccounting =
    userRole === "ADMIN" || userRole === "ACCOUNTING" || canManageAccounting;

  const visiblePrograms =
    userRole === "ADMIN"
      ? PROGRAMS
      : isAccountingRole
      ? []
      : PROGRAMS.filter((prog) => {
          const pEnum = PROGRAM_KEY_TO_ENUM[prog.key];
          return allowedPrograms ? allowedPrograms.includes(pEnum) : true;
        });

  const defaultKey = visiblePrograms[0]?.key || "wat";
  const [openPrograms, setOpenPrograms] = useState<Set<string>>(
    new Set([defaultKey]),
  );

  function toggleProgram(key: string) {
    setOpenPrograms((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-slate-800 bg-[#0f172a] text-slate-200">
      {/* Brand Header */}
      <Link
        href={isAccountingRole ? "/accounting" : "/dashboard"}
        className="flex items-center gap-3 border-b border-slate-800 bg-white px-5 py-3.5 hover:bg-slate-50 transition-colors"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/backpax-logo.svg"
          alt="BackPax CRM"
          className="h-9 w-auto max-w-[175px] object-contain"
        />
      </Link>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {!isAccountingRole && (
          <>
            {/* Dashboard */}
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === "/dashboard"
                  ? "bg-[#1e3a8a] text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
              )}
            >
              <LayoutDashboard className="h-4 w-4 text-sky-400" />
              Genel Bakış
            </Link>

            {/* Global Leads */}
            <Link
              href="/leads"
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === "/leads"
                  ? "bg-[#1e3a8a] text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
              )}
            >
              <Users className="h-4 w-4 text-sky-400" />
              Tüm Adaylar (Leadler)
            </Link>

            {/* Global Students */}
            <Link
              href="/students"
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === "/students"
                  ? "bg-[#1e3a8a] text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
              )}
            >
              <FileCheck className="h-4 w-4 text-sky-400" />
              Kayıtlı Öğrenciler
            </Link>

            {/* Group & Visa Tracking (§5) */}
            <Link
              href="/groups"
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/groups")
                  ? "bg-[#1e3a8a] text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
              )}
            >
              <UsersRound className="h-4 w-4 text-amber-400" />
              Grup &amp; Vize Takibi
            </Link>

            {/* Partner School Pool (§6) */}
            <Link
              href="/schools"
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/schools")
                  ? "bg-[#1e3a8a] text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
              )}
            >
              <Building2 className="h-4 w-4 text-emerald-400" />
              Partner Okul Havuzu
            </Link>
          </>
        )}

        {/* Accounting Module (§8) */}
        {showAccounting && (
          <Link
            href="/accounting"
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/accounting")
                ? "bg-[#1e3a8a] text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
            )}
          >
            <div className="flex items-center gap-2.5">
              <Wallet className="h-4 w-4 text-emerald-400" />
              Muhasebe &amp; Raporlar
            </div>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              Finans
            </span>
          </Link>
        )}

        {!isAccountingRole && (
          <>
            {/* Approval Queue */}
            <Link
              href="/approvals"
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/approvals")
                  ? "bg-[#1e3a8a] text-white font-semibold"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
              )}
            >
              <div className="flex items-center gap-2.5">
                <Bell className="h-4 w-4 text-amber-400" />
                Onay Merkezi
              </div>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                Kuyruk
              </span>
            </Link>

            {/* Divider */}
            <div className="my-2 border-t border-slate-800" />
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Programlar
            </p>

            {/* Program accordion items */}
            {visiblePrograms.map((prog) => {
              const isOpen = openPrograms.has(prog.key);
              const Icon = prog.icon;
              const isActiveGroup = pathname.startsWith(prog.basePath);

              return (
                <div key={prog.key}>
                  <button
                    onClick={() => toggleProgram(prog.key)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActiveGroup
                        ? "bg-slate-800 text-white"
                        : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
                    )}
                  >
                    <Icon className={cn("h-4 w-4", prog.color)} />
                    <span className="flex-1 text-left">{prog.label}</span>
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-700 pl-3">
                      {PROGRAM_SUB_ITEMS.map((sub) => {
                        const href = `${prog.basePath}/${sub.slug}`;
                        const SubIcon = sub.icon;
                        const isActive =
                          pathname === href || pathname.startsWith(href + "/");
                        return (
                          <Link
                            key={sub.slug}
                            href={href}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                              isActive
                                ? "bg-[#1e3a8a] text-white"
                                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200",
                            )}
                          >
                            <SubIcon className="h-3.5 w-3.5" />
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </nav>

      {/* Version footer */}
      <div className="border-t border-slate-800 px-5 py-3">
        <p className="text-[10px] font-semibold tracking-wider text-slate-400">
          v2.0 · BACKPAX CRM
        </p>
      </div>
    </aside>
  );
}
