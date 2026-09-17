// app/(crm)/[program]/leads/page.tsx
// Program-specific leads directory
import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus, Users, UserCheck, Clock, CheckCircle2 } from "lucide-react";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getProgramFromSlug, PROGRAM_TITLES } from "@/lib/utils/programs";
import { PROGRAM_LABELS } from "@/types/crm";
import { ProgramBadge } from "@/components/crm/common/ProgramBadge";
import { LeadTable } from "@/components/crm/leads/LeadTable";
import type { CRMLeadRow } from "@/types/crm";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    program: string;
  };
}

export default async function ProgramLeadsPage({ params }: Props) {
  const user = await requireStaff();
  const programEnum = getProgramFromSlug(params.program);

  if (!programEnum) {
    notFound();
  }

  const isAdvisor = user.role === "ADVISOR";
  const whereClause = {
    program: programEnum,
    ...(isAdvisor ? { advisorId: user.id } : {}),
  };

  const rawLeads = await prisma.lead.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      program: true,
      source: true,
      advisorId: true,
      createdAt: true,
    },
  });

  const leads: CRMLeadRow[] = rawLeads.map((l) => ({
    ...l,
    createdAt: l.createdAt,
  }));

  const totalCount = leads.length;
  const interestedCount = leads.filter((l) => l.status === "INTERESTED").length;
  const consideringCount = leads.filter((l) => l.status === "CONSIDERING_NEXT_YEAR").length;
  const registeredCount = leads.filter((l) => l.status === "REGISTERED").length;

  const title = PROGRAM_TITLES[params.program] || PROGRAM_LABELS[programEnum];

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ProgramBadge program={programEnum} showIcon size="md" />
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            {title} — Aday Dataları (Leads)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Reklamlar, formlar ve doğrudan başvurulardan gelen potansiyel öğrenci adayları.
          </p>
        </div>

        <Link
          href={`/leads/new?program=${programEnum}`}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni Aday Ekle
        </Link>
      </div>

      {/* ── Metric Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Toplam Aday</span>
            <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{totalCount}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">İlgileniyor</span>
            <span className="rounded-lg bg-sky-50 p-2 text-sky-600">
              <UserCheck className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{interestedCount}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gelecek Sezon</span>
            <span className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{consideringCount}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kesin Kayıt</span>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{registeredCount}</p>
        </div>
      </div>

      {/* ── Table Section ───────────────────────────────────────────────── */}
      <LeadTable leads={leads} program={programEnum} />
    </div>
  );
}
