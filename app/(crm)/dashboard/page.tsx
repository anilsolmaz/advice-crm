// app/(crm)/dashboard/page.tsx
// Executive Dashboard & Business Intelligence for Company Owner / Management
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Plane,
  GraduationCap,
  Languages,
  Sun,
  Stamp,
  Calendar,
  ChevronRight,
  Filter,
  BarChart3,
  Building2,
  PieChart,
} from "lucide-react";
import { ProgramBadge } from "@/components/crm/common/ProgramBadge";
import {
  PROGRAM_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  CURRENCY_SYMBOLS,
  type Program,
  type Currency,
} from "@/types/crm";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

import { AdvisorDashboardView } from "@/components/crm/dashboard/AdvisorDashboardView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireStaff();
  const isAdmin = user.role === "ADMIN";
  const now = new Date();

  // Allowed programs for advisor
  const allowedPrograms: Program[] = isAdmin
    ? ["WORK_AND_TRAVEL", "ACADEMY", "LANGUAGE_SCHOOL", "SUMMER_CAMP", "VISA_CONSULTING"]
    : user.advisorProfile?.allowedPrograms && user.advisorProfile.allowedPrograms.length > 0
    ? user.advisorProfile.allowedPrograms
    : ["WORK_AND_TRAVEL"];

  // ── Parallel Data Fetching ─────────────────────────────────────────────────
  const [
    totalLeads,
    registeredStudents,
    pendingApprovals,
    overdueInstallmentsRaw,
    paidInstallmentsRaw,
    upcomingInstallmentsRaw,
    studentsByProgramRaw,
    leadsByProgramRaw,
    leadsBySourceRaw,
    recentStudents,
    recentLeads,
    staffAdvisors,
    upcomingWatVisas,
    myStudentsCount,
    myLeadsCount,
    myPendingApprovalsCount,
    myRecentLeads,
    myRecentStudents,
  ] = await Promise.all([
    // 1. Core Counts
    prisma.lead.count(),
    prisma.student.count({ where: { isActive: true } }),
    prisma.pendingApproval.count({ where: { status: "PENDING" } }),

    // 2. Financial Collections & Receivables
    prisma.installment.findMany({
      where: { isPaid: false, dueDate: { lt: now } },
      select: { amount: true, currency: true },
    }),
    prisma.installment.findMany({
      where: { isPaid: true },
      select: { amount: true, currency: true },
    }),
    prisma.installment.findMany({
      where: { isPaid: false, dueDate: { gte: now } },
      select: { amount: true, currency: true },
    }),

    // 3. Program Distributions
    prisma.student.groupBy({
      by: ["program"],
      _count: { id: true },
      where: { isActive: true },
    }),
    prisma.lead.groupBy({
      by: ["program"],
      _count: { id: true },
    }),

    // 4. Lead Sources
    prisma.lead.groupBy({
      by: ["source"],
      _count: { id: true },
    }),

    // 5. Recent 5 Students
    prisma.student.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, email: true } },
        advisor: { select: { fullName: true } },
      },
    }),

    // 6. Recent 5 Leads
    prisma.lead.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        advisor: { select: { fullName: true } },
      },
    }),

    // 7. Staff Performance
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "ADVISOR"] }, isActive: true },
      select: {
        id: true,
        fullName: true,
        role: true,
        advisorProfile: { select: { department: true } },
        _count: {
          select: {
            studentsAsAdvisor: true,
            leadsAsAdvisor: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),

    // 8. Operational Radar (Upcoming Visa Interviews in WAT)
    prisma.watDetail.findMany({
      where: {
        visaInterviewDate: { gte: now },
      },
      take: 3,
      orderBy: { visaInterviewDate: "asc" },
      include: {
        student: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
    }),

    // 9. Advisor Personal Metrics
    prisma.student.count({
      where: {
        isActive: true,
        ...(isAdmin ? {} : { advisorId: user.id }),
      },
    }),
    prisma.lead.count({
      where: {
        ...(isAdmin ? {} : { OR: [{ advisorId: user.id }, { program: { in: allowedPrograms } }] }),
      },
    }),
    prisma.pendingApproval.count({
      where: {
        status: "PENDING",
        ...(isAdmin ? {} : { student: { advisorId: user.id } }),
      },
    }),
    prisma.lead.findMany({
      where: {
        ...(isAdmin ? {} : { OR: [{ advisorId: user.id }, { program: { in: allowedPrograms } }] }),
      },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        advisor: { select: { fullName: true } },
      },
    }),
    prisma.student.findMany({
      where: {
        ...(isAdmin ? {} : { advisorId: user.id }),
      },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        watDetail: { select: { visaApproved: true, sponsorDsNumber: true, jobTitle: true } },
      },
    }),
  ]);

  // Program Distribution Mapping
  const programStudentMap = Object.fromEntries(
    studentsByProgramRaw.map((s) => [s.program, s._count.id])
  );
  const programLeadMap = Object.fromEntries(
    leadsByProgramRaw.map((l) => [l.program, l._count.id])
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // IF ADVISOR: RENDER SPECIALIZED ADVISOR OPERATING WORKSPACE
  // ═══════════════════════════════════════════════════════════════════════════
  if (!isAdmin) {
    return (
      <AdvisorDashboardView
        user={user}
        allowedPrograms={allowedPrograms}
        myStudentsCount={myStudentsCount}
        myLeadsCount={myLeadsCount}
        myPendingApprovalsCount={myPendingApprovalsCount}
        programStudentMap={programStudentMap}
        programLeadMap={programLeadMap}
        myRecentLeads={myRecentLeads}
        myRecentStudents={myRecentStudents}
      />
    );
  }

  // ── Financial Currency Aggregations ─────────────────────────────────────────
  function aggregateByCurrency(items: { amount: any; currency: string }[]) {
    const map: Record<string, number> = {};
    for (const item of items) {
      const val = Number(item.amount);
      map[item.currency] = (map[item.currency] || 0) + val;
    }
    return map;
  }

  const paidTotals = aggregateByCurrency(paidInstallmentsRaw);
  const overdueTotals = aggregateByCurrency(overdueInstallmentsRaw);
  const upcomingTotals = aggregateByCurrency(upcomingInstallmentsRaw);

  function formatCurrencyMap(map: Record<string, number>) {
    const keys = Object.keys(map);
    if (keys.length === 0) return "0.00";
    return keys
      .map((curr) => {
        const symbol = CURRENCY_SYMBOLS[curr as Currency] || curr;
        return `${symbol}${map[curr].toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      })
      .join(" + ");
  }

  // Conversion rate calculation
  const totalInbound = totalLeads + registeredStudents;
  const conversionRate = totalInbound > 0 ? ((registeredStudents / totalInbound) * 100).toFixed(1) : "0";

  const ALL_PROGRAMS: Program[] = [
    "WORK_AND_TRAVEL",
    "ACADEMY",
    "LANGUAGE_SCHOOL",
    "SUMMER_CAMP",
    "VISA_CONSULTING",
  ];

  return (
    <div className="space-y-7">
      {/* ── Header: Executive Welcome ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "rounded-full px-3 py-1 text-xs font-bold border",
              isAdmin
                ? "bg-slate-900 text-amber-400 border-slate-800"
                : "bg-blue-50 text-blue-700 border-blue-200/60"
            )}>
              {isAdmin ? "Firma Sahibi & Yönetici Kokpiti" : `${user.fullName} · Danışman Paneli`}
            </span>
            <span className="text-xs text-gray-400">
              {isAdmin ? "· Canlı Şirket Performans Telemetrisi" : "· Kişisel Portföy & Operasyon Özeti"}
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-gray-900">
            {isAdmin ? "Genel Bakış & Şirket Karnesi" : "Danışman Çalışma Masası"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isAdmin
              ? "Satış hunisi, nakit akışı, program dağılımı ve danışman operasyon yükünün tek ekrandan özeti."
              : "Sorumlu olduğunuz programlar, aday havuzunuz, öğrenci takipleri ve yaklaşan vize randevuları."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/leads/new"
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            + Yeni Aday Ekle
          </Link>
          <Link
            href="/leads"
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
          >
            Aday Listesi
          </Link>
        </div>
      </div>

      {/* ── 1. Ciro & Nakit Akışı Finans Kartları (Financial Health) ──────── */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
          <DollarSign className="h-4 w-4 text-emerald-600" />
          Finansal Sağlık & Tahsilat Hacmi
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Toplam Tahsil Edilen */}
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 via-white to-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800">Tahsil Edilen Tutar</span>
              <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-gray-900 font-mono tracking-tight">
              {formatCurrencyMap(paidTotals)}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {paidInstallmentsRaw.length} adet tamamlanmış tahsilat
            </div>
          </div>

          {/* Bekleyen Alacaklar (Gelecek Taksitler) */}
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 via-white to-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-800">Bekleyen Gelecek Alacaklar</span>
              <span className="rounded-xl bg-blue-100 p-2 text-blue-700">
                <Clock className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-gray-900 font-mono tracking-tight">
              {formatCurrencyMap(upcomingTotals)}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-700 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              {upcomingInstallmentsRaw.length} adet planlı vadeli taksit
            </div>
          </div>

          {/* Gecikmiş / Riskli Tahsilatlar */}
          <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/70 via-white to-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700">Gecikmiş / Kritik Alacak</span>
              <span className="rounded-xl bg-rose-100 p-2 text-rose-700">
                <AlertCircle className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-rose-700 font-mono tracking-tight">
              {overdueInstallmentsRaw.length > 0 ? formatCurrencyMap(overdueTotals) : "0.00"}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              {overdueInstallmentsRaw.length} taksit vadesi geçmiş!
            </div>
          </div>

          {/* Satış Dönüşüm Oranı */}
          <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/60 via-white to-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-800">Lead → Kesin Kayıt Dönüşüm</span>
              <span className="rounded-xl bg-purple-100 p-2 text-purple-700">
                <TrendingUp className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-purple-900 font-mono tracking-tight">
              %{conversionRate}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-purple-700 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              {registeredStudents} kayıt / {totalInbound} toplam başvuru
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Program Bazlı Satış & Portföy Dağılımı ─────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <PieChart className="h-4 w-4 text-blue-600" />
            Program Bazlı Portföy Dağılımı (Öğrenci & Aday Hacmi)
          </h2>
          <span className="text-xs text-gray-400 font-medium">5 Aktif Program</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {ALL_PROGRAMS.map((prog) => {
            const studentCount = programStudentMap[prog] || 0;
            const leadCount = programLeadMap[prog] || 0;
            const slugMap: Record<Program, string> = {
              WORK_AND_TRAVEL: "wat",
              ACADEMY: "academy",
              LANGUAGE_SCHOOL: "language",
              SUMMER_CAMP: "summer-camp",
              VISA_CONSULTING: "visa",
            };
            const slug = slugMap[prog];

            return (
              <Link
                key={prog}
                href={`/${slug}/students`}
                className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-blue-200 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <ProgramBadge program={prog} showIcon size="sm" />
                    <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-extrabold text-gray-900">{studentCount}</span>
                      <span className="text-xs font-semibold text-gray-500">Öğrenci</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-50">
                      <span>Aktif Lead:</span>
                      <span className="font-semibold text-gray-700">{leadCount} Aday</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 text-[11px] font-medium text-blue-600 flex items-center gap-1 group-hover:underline">
                  Detayları Gör <ChevronRight className="h-3 w-3" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 3. Orta Izgara: Danışman Performansı & Kaynak Dönüşümü ───────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Danışman Performans Tablosu */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Danışman İş Yükü & Portföy Dağılımı</h3>
                <p className="text-xs text-gray-400">Hangi danışman kaç aktif dosya ve aday yönetiyor</p>
              </div>
            </div>
            <Link href="/settings" className="text-xs font-semibold text-blue-600 hover:underline">
              Personel Yönetimi →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400">
                  <th className="py-2.5 font-semibold uppercase">Danışman / Personel</th>
                  <th className="py-2.5 font-semibold uppercase">Yetki</th>
                  <th className="py-2.5 font-semibold uppercase">Departman</th>
                  <th className="py-2.5 font-semibold uppercase text-center">Öğrenci Dosyası</th>
                  <th className="py-2.5 font-semibold uppercase text-center">İlgilendiği Lead</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {staffAdvisors.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50/50">
                    <td className="py-3 font-semibold text-gray-900 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[11px]">
                        {staff.fullName.charAt(0)}
                      </div>
                      {staff.fullName}
                    </td>
                    <td className="py-3">
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                        {staff.role}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{staff.advisorProfile?.department || "Genel"}</td>
                    <td className="py-3 text-center">
                      <span className="inline-flex items-center justify-center rounded-lg bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                        {staff._count.studentsAsAdvisor}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="inline-flex items-center justify-center rounded-lg bg-blue-50 px-2 py-0.5 font-bold text-blue-700">
                        {staff._count.leadsAsAdvisor}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lead Kaynak Dağılımı (Lead Sources) */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              Aday Kaynak Dağılımı
            </h3>
            <p className="text-xs text-gray-400">Adaylar firmanıza nereden ulaşıyor?</p>
          </div>

          <div className="space-y-3">
            {leadsBySourceRaw.map((s) => {
              const count = s._count.id;
              const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
              return (
                <div key={s.source} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">
                      {LEAD_SOURCE_LABELS[s.source] || s.source}
                    </span>
                    <span className="font-mono text-gray-500">
                      {count} Aday (%{pct})
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full transition-all"
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
            <span>Toplam Dijital / Manuel Lead:</span>
            <span className="font-bold text-gray-900">{totalLeads} Kayıt</span>
          </div>
        </div>
      </div>

      {/* ── 4. Canlı Operasyonel Akış & Son Kayıtlar ─────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Son Kesin Kayıtlı Öğrenciler */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">En Son Kayıt Yaptıran Öğrenciler</h3>
              <p className="text-xs text-gray-400">Sözleşmesi onaylanan ve dosyası açılan öğrenciler</p>
            </div>
            <Link href="/students" className="text-xs font-semibold text-blue-600 hover:underline">
              Tümünü Gör ({registeredStudents}) →
            </Link>
          </div>

          <div className="divide-y divide-gray-50">
            {recentStudents.map((st) => (
              <div key={st.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <Link
                    href={`/students/${st.id}`}
                    className="text-xs font-bold text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {st.user.fullName}
                  </Link>
                  <p className="text-[11px] text-gray-400">
                    Danışman: {st.advisor?.fullName || "Atanmamış"} · {formatDate(st.createdAt)}
                  </p>
                </div>
                <ProgramBadge program={st.program} showIcon size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Son Eklenen Adaylar (Leads) */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Son Başvuran Aday Dataları</h3>
              <p className="text-xs text-gray-400">Reklamlardan ve ofisten sisteme yeni düşen adaylar</p>
            </div>
            <Link href="/leads" className="text-xs font-semibold text-blue-600 hover:underline">
              Tüm Adaylar ({totalLeads}) →
            </Link>
          </div>

          <div className="divide-y divide-gray-50">
            {recentLeads.map((ld) => (
              <div key={ld.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-900">{ld.fullName}</p>
                  <p className="text-[11px] text-gray-400">
                    {ld.phone} · Kaynak: {LEAD_SOURCE_LABELS[ld.source]}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ProgramBadge program={ld.program} showIcon size="sm" />
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                    {LEAD_STATUS_LABELS[ld.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
