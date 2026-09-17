// components/crm/navigation/Sidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Globe,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Users,
  FileCheck,
  Bell,
  BookOpen,
  Settings,
  Plane,
  GraduationCap,
  Languages,
  Sun,
  Stamp,
  Mail,
} from "lucide-react";
import type { Role, Program } from "@/types/crm";
import { cn } from "@/lib/utils/cn";

// ── Program nav config ────────────────────────────────────────────────────────

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
    color: "text-blue-600",
    basePath: "/wat",
  },
  {
    key: "academy",
    label: "Akademi",
    icon: GraduationCap,
    color: "text-purple-600",
    basePath: "/academy",
  },
  {
    key: "language",
    label: "Dil Okulları",
    icon: Languages,
    color: "text-emerald-600",
    basePath: "/language",
  },
  {
    key: "summer",
    label: "Yaz Okulları",
    icon: Sun,
    color: "text-amber-600",
    basePath: "/summer-camp",
  },
  {
    key: "visa",
    label: "Vize Başvuruları",
    icon: Stamp,
    color: "text-rose-600",
    basePath: "/visa",
  },
];

const PROGRAM_SUB_ITEMS = [
  { label: "Leadler (Datalar)", icon: Users, slug: "leads" },
  { label: "Kayıtlı Öğrenciler", icon: FileCheck, slug: "students" },
  { label: "Katalog / Program", icon: BookOpen, slug: "catalog" },
  { label: "Toplu Pazarlama", icon: Mail, slug: "marketing" },
  { label: "Toplu Bildirim", icon: Bell, slug: "notifications" },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  userRole: Role;
  allowedPrograms?: Program[];
}

export default function Sidebar({ userRole, allowedPrograms }: SidebarProps) {
  const pathname = usePathname();

  const visiblePrograms = userRole === "ADMIN"
    ? PROGRAMS
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
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 hover:bg-gray-50/50 transition-colors">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/advice-logo.svg"
          alt="Advice Yurtdışı Eğitim"
          className="h-9 w-auto max-w-[160px] object-contain"
        />
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/dashboard"
              ? "bg-blue-50 text-blue-700"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Genel Bakış
        </Link>

        {/* Global Leads */}
        <Link
          href="/leads"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/leads"
              ? "bg-blue-50 text-blue-700"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
          )}
        >
          <Users className="h-4 w-4" />
          Tüm Adaylar (Leadler)
        </Link>

        {/* Global Students */}
        <Link
          href="/students"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/students"
              ? "bg-blue-50 text-blue-700"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
          )}
        >
          <FileCheck className="h-4 w-4" />
          Tüm Kayıtlı Öğrenciler
        </Link>

        {/* Approval Queue */}
        <Link
          href="/approvals"
          className={cn(
            "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/approvals")
              ? "bg-amber-50 text-amber-800 font-semibold"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
          )}
        >
          <div className="flex items-center gap-2.5">
            <Bell className="h-4 w-4 text-amber-600" />
            Onay Merkezi
          </div>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            Kuyruk
          </span>
        </Link>

        {/* Divider */}
        <div className="my-2 border-t border-gray-100" />
        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
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
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <Icon className={cn("h-4 w-4", prog.color)} />
                <span className="flex-1 text-left">{prog.label}</span>
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                )}
              </button>

              {isOpen && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-100 pl-3">
                  {PROGRAM_SUB_ITEMS.map((sub) => {
                    const href = `${prog.basePath}/${sub.slug}`;
                    const SubIcon = sub.icon;
                    const isActive = pathname === href || pathname.startsWith(href + "/");
                    return (
                      <Link
                        key={sub.slug}
                        href={href}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                          isActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
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
      </nav>

      {/* Version footer */}
      <div className="border-t border-gray-100 px-5 py-3">
        <p className="text-[10px] text-gray-400">v1.0.0 · Advice CRM</p>
      </div>
    </aside>
  );
}
