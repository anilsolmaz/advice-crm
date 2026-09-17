"use client";

import Link from "next/link";
import {
  Users,
  FileCheck,
  Clock,
  Sparkles,
  BookOpen,
  Mail,
  Bell,
  ArrowRight,
  Plane,
  GraduationCap,
  Languages,
  Sun,
  Stamp,
  UserPlus,
  Building2,
} from "lucide-react";
import { ProgramBadge } from "@/components/crm/common/ProgramBadge";
import {
  PROGRAM_LABELS,
  LEAD_STATUS_LABELS,
  type Program,
} from "@/types/crm";
import { cn } from "@/lib/utils/cn";

const PROGRAM_SLUG_MAP: Record<Program, string> = {
  WORK_AND_TRAVEL: "wat",
  ACADEMY: "academy",
  LANGUAGE_SCHOOL: "language",
  SUMMER_CAMP: "summer-camp",
  VISA_CONSULTING: "visa",
};

const PROGRAM_CONFIG: Record<
  Program,
  {
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    catalogLabel: string;
    desc: string;
  }
> = {
  WORK_AND_TRAVEL: {
    icon: Plane,
    color: "text-blue-600",
    bg: "bg-blue-50/70",
    border: "border-blue-100",
    catalogLabel: "ABD İş & Pozisyon Kataloğu",
    desc: "Amerika J-1 Kültürel Değişim ve Yaz Çalışma Programı",
  },
  ACADEMY: {
    icon: GraduationCap,
    color: "text-purple-600",
    bg: "bg-purple-50/70",
    border: "border-purple-100",
    catalogLabel: "Üniversite & Bölüm Kataloğu",
    desc: "Yurtdışı Lisans, Yüksek Lisans ve Hazırlık Eğitimi",
  },
  LANGUAGE_SCHOOL: {
    icon: Languages,
    color: "text-emerald-600",
    bg: "bg-emerald-50/70",
    border: "border-emerald-100",
    catalogLabel: "Dil Okulu & Fiyat Kataloğu",
    desc: "Global Zincir Okullarda Genel & Yoğun Dil Eğitimi",
  },
  SUMMER_CAMP: {
    icon: Sun,
    color: "text-amber-600",
    bg: "bg-amber-50/70",
    border: "border-amber-100",
    catalogLabel: "Yaz Kampları & Grup Turları",
    desc: "7-18 Yaş Junior Kamplar ve Tematik Yaz Okulları",
  },
  VISA_CONSULTING: {
    icon: Stamp,
    color: "text-rose-600",
    bg: "bg-rose-50/70",
    border: "border-rose-100",
    catalogLabel: "Vize & Konsolosluk Rehberi",
    desc: "Turistik, Ticari ve Öğrenci Vizesi Başvuru Danışmanlığı",
  },
};

interface Props {
  user: any;
  allowedPrograms: Program[];
  myStudentsCount: number;
  myLeadsCount: number;
  myPendingApprovalsCount: number;
  programStudentMap: Record<string, number>;
  programLeadMap: Record<string, number>;
  myRecentLeads: any[];
  myRecentStudents: any[];
}

export function AdvisorDashboardView({
  user,
  allowedPrograms,
  myStudentsCount,
  myLeadsCount,
  myPendingApprovalsCount,
  programStudentMap,
  programLeadMap,
  myRecentLeads,
  myRecentStudents,
}: Props) {
  return (
    <div className="space-y-8">
      {/* 1. Danışman Hero Banner */}
      <div className="rounded-3xl border border-gray-200/80 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-500/20 px-3 py-0.5 text-xs font-semibold text-blue-200 border border-blue-400/30">
                {user.advisorProfile?.department || "Operasyon & Eğitim Danışmanlığı"}
              </span>
              <span className="text-xs text-blue-200/60">· Danışman Çalışma Masası</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              İyi Çalışmalar, {user.fullName} 👋
            </h1>
            <p className="mt-1 text-sm text-blue-100/80 max-w-xl">
              Sorumlu olduğunuz programların aday havuzunu yönetin, öğrenci dosyalarını inceleyin ve bekleyen onayları tamamlayın.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/leads/new"
              className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-blue-400 transition-all transform hover:-translate-y-0.5"
            >
              <UserPlus className="h-4 w-4" />
              + Yeni Aday Kaydet
            </Link>
            <Link
              href="/approvals"
              className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              <Bell className="h-4 w-4 text-amber-300" />
              Onay Kuyruğu ({myPendingApprovalsCount})
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Kişisel Operasyon KPI Sayaçları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Öğrenci Dosyalarım</span>
            <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <FileCheck className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-gray-900 font-mono">{myStudentsCount}</p>
          <p className="mt-1 text-xs text-gray-500">Sorumlu olduğunuz aktif kayıt</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Aday Havuzum (Leads)</span>
            <span className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <Users className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-gray-900 font-mono">{myLeadsCount}</p>
          <p className="mt-1 text-xs text-gray-500">Görüşme ve takip aşamasında</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Bekleyen Onaylarım</span>
            <span className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
              <Clock className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-gray-900 font-mono">{myPendingApprovalsCount}</p>
          <Link href="/approvals" className="mt-1 text-xs text-amber-600 font-semibold hover:underline flex items-center gap-1">
            Onay merkezine git <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Yetkili Modüllerim</span>
            <span className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
              <Sparkles className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-gray-900 font-mono">{allowedPrograms.length}</p>
          <p className="mt-1 text-xs text-gray-500">Aktif erişim sağlanan program</p>
        </div>
      </div>

      {/* 3. PROGRAM BAZLI OPERASYON HUB'I (Kare Kartlar) */}
      <section className="space-y-6">
        <div className="border-b border-gray-200/80 pb-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Sorumlu Olduğunuz Programlar & Operasyon Menüsü
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Yetkili olduğunuz her program için aday havuzuna, öğrenci kayıtlarına, kataloğa ve toplu pazarlama araçlarına tek tıkla ulaşın.
          </p>
        </div>

        {allowedPrograms.map((program) => {
          const cfg = PROGRAM_CONFIG[program];
          const Icon = cfg.icon;
          const slug = PROGRAM_SLUG_MAP[program];
          const pStudents = programStudentMap[program] || 0;
          const pLeads = programLeadMap[program] || 0;

          return (
            <div
              key={program}
              className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-7 shadow-sm hover:border-gray-300 transition-all space-y-5"
            >
              {/* Program Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", cfg.bg, cfg.border, "border")}>
                    <Icon className={cn("h-6 w-6", cfg.color)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-extrabold text-gray-900">
                        {PROGRAM_LABELS[program]}
                      </h3>
                      <ProgramBadge program={program} showIcon={false} size="sm" />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{cfg.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="rounded-xl bg-blue-50 px-3 py-1.5 font-bold text-blue-700">
                    {pLeads} Aday (Lead)
                  </span>
                  <span className="rounded-xl bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700">
                    {pStudents} Kayıtlı Öğrenci
                  </span>
                </div>
              </div>

              {/* 4 Kare Sub-Kategori Kartı (Grid) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Kart 1: Leadler */}
                <Link
                  href={`/${slug}/leads`}
                  className="group relative flex flex-col justify-between rounded-2xl border border-gray-100 bg-gray-50/60 p-5 hover:bg-blue-50/50 hover:border-blue-200 transition-all hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 group-hover:scale-110 transition-transform">
                        <Users className="h-5 w-5" />
                      </span>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {pLeads} Kayıt
                      </span>
                    </div>
                    <h4 className="mt-4 text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                      Aday Dataları (Leadler)
                    </h4>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                      Gelen formlar, ön görüşmeler ve aday değerlendirme havuzu.
                    </p>
                  </div>
                  <div className="mt-5 flex items-center gap-1 text-xs font-bold text-blue-600">
                    Adayları Yönet <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* Kart 2: Kayıtlı Öğrenciler */}
                <Link
                  href={`/${slug}/students`}
                  className="group relative flex flex-col justify-between rounded-2xl border border-gray-100 bg-gray-50/60 p-5 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 group-hover:scale-110 transition-transform">
                        <FileCheck className="h-5 w-5" />
                      </span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {pStudents} Öğrenci
                      </span>
                    </div>
                    <h4 className="mt-4 text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                      Kayıtlı Öğrenciler
                    </h4>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                      Kesin kayıtlı dosyalar, evraklar ve canlı operasyon takibi.
                    </p>
                  </div>
                  <div className="mt-5 flex items-center gap-1 text-xs font-bold text-emerald-600">
                    Dosyaları İncele <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* Kart 3: Katalog */}
                <Link
                  href={`/${slug}/catalog`}
                  className="group relative flex flex-col justify-between rounded-2xl border border-gray-100 bg-gray-50/60 p-5 hover:bg-purple-50/50 hover:border-purple-200 transition-all hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 group-hover:scale-110 transition-transform">
                        <BookOpen className="h-5 w-5" />
                      </span>
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                        Katalog
                      </span>
                    </div>
                    <h4 className="mt-4 text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                      {cfg.catalogLabel}
                    </h4>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                      Anlaşmalı resmi sponsorlar, okul ve iş pozisyonları listesi.
                    </p>
                  </div>
                  <div className="mt-5 flex items-center gap-1 text-xs font-bold text-purple-600">
                    Kataloğa Git <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* Kart 4: Toplu Pazarlama */}
                <Link
                  href={`/${slug}/marketing`}
                  className="group relative flex flex-col justify-between rounded-2xl border border-gray-100 bg-gray-50/60 p-5 hover:bg-amber-50/50 hover:border-amber-200 transition-all hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 group-hover:scale-110 transition-transform">
                        <Mail className="h-5 w-5" />
                      </span>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        Toplu İletişim
                      </span>
                    </div>
                    <h4 className="mt-4 text-sm font-bold text-gray-900 group-hover:text-amber-700 transition-colors">
                      Toplu Pazarlama & SMS
                    </h4>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                      Segmentli hedef kitleye SMS ve E-posta duyurusu gönderin.
                    </p>
                  </div>
                  <div className="mt-5 flex items-center gap-1 text-xs font-bold text-amber-600">
                    Kampanya Başlat <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>
            </div>
          );
        })}
      </section>

      {/* 4. Canlı Akışlar: Son Adaylar & Öğrenci Takibi */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sol: Son Adaylar */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Takip Ettiğiniz Son Adaylar (Leads)
            </h3>
            <Link href="/leads" className="text-xs font-semibold text-blue-600 hover:underline">
              Tümünü Gör ➔
            </Link>
          </div>

          {myRecentLeads.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Henüz aday bulunmuyor.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {myRecentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700 text-xs">
                      {lead.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{lead.fullName}</p>
                      <p className="text-[11px] text-gray-400">{lead.phone} · {lead.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProgramBadge program={lead.program} size="sm" showIcon={false} />
                    <span className="text-[11px] font-semibold text-gray-500">
                      {LEAD_STATUS_LABELS[lead.status as keyof typeof LEAD_STATUS_LABELS] || lead.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sağ: Kayıtlı Öğrencilerim */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-emerald-600" />
              Sorumlu Olduğunuz Öğrenciler
            </h3>
            <Link href="/students" className="text-xs font-semibold text-blue-600 hover:underline">
              Tümünü Gör ➔
            </Link>
          </div>

          {myRecentStudents.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Henüz kayıtlı öğrenciniz bulunmuyor.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {myRecentStudents.map((st) => (
                <div key={st.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 font-bold text-emerald-700 text-xs">
                      {st.user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{st.user.fullName}</p>
                      <p className="text-[11px] text-gray-400">
                        {st.watDetail?.jobTitle ? `İş: ${st.watDetail.jobTitle}` : st.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProgramBadge program={st.program} size="sm" showIcon={false} />
                    <Link
                      href={`/students/${st.id}`}
                      className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      Detay
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
