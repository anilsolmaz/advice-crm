// app/(crm)/[program]/students/page.tsx
// Program-specific registered students directory
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getProgramFromSlug, PROGRAM_TITLES } from "@/lib/utils/programs";
import { PROGRAM_LABELS } from "@/types/crm";
import { Users, CheckCircle2, Clock, FileText, AlertCircle } from "lucide-react";
import { StudentTable } from "@/components/crm/students/StudentTable";
import type { StudentTableRowData } from "@/components/crm/students/StudentTable";
import { ProgramBadge } from "@/components/crm/common/ProgramBadge";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    program: string;
  };
}

export default async function ProgramStudentsPage({ params }: Props) {
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

  const students = await prisma.student.findMany({
    where: whereClause,
    include: {
      user: true,
      advisor: {
        select: {
          id: true,
          fullName: true,
        },
      },
      profile: true,
      watDetail: true,
      academyDetail: true,
      languageDetail: true,
      summerCampDetail: true,
      visaDetail: true,
      documents: true,
      advisorNotes: {
        include: {
          author: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      payments: {
        include: {
          installments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalCount = students.length;
  const activeCount = students.filter((s) => s.isActive).length;
  const withProfileCount = students.filter((s) => s.profile?.nationalId).length;

  const tableData: StudentTableRowData[] = students.map((s) => {
    const payment = s.payments[0];
    let paymentSummary;
    if (payment) {
      const total = Number(payment.totalAmount);
      const paid = payment.installments
        .filter((inst) => inst.isPaid)
        .reduce((sum, inst) => sum + Number(inst.amount), 0);
      paymentSummary = {
        total,
        paid,
        currency: payment.currency,
        isFullyPaid: payment.status === "PAID" || paid >= total,
      };
    }

    return {
      id: s.id,
      userId: s.userId,
      fullName: s.user.fullName,
      email: s.user.email,
      phone: s.user.phone,
      program: s.program,
      isActive: s.isActive,
      advisorName: s.advisor?.fullName ?? null,
      universityName: s.profile?.universityName ?? null,
      paymentSummary,
      createdAt: s.createdAt,
      fullDetail: {
        student: {
          id: s.id,
          userId: s.userId,
          leadId: s.leadId,
          advisorId: s.advisorId,
          program: s.program,
          isActive: s.isActive,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          user: s.user,
          profile: s.profile as any,
        },
        watDetail: s.watDetail as any,
        academyDetail: s.academyDetail as any,
        documents: s.documents as any,
        payments: s.payments as any,
        notes: s.advisorNotes.map((n) => ({
          id: n.id,
          studentId: n.studentId,
          authorId: n.authorId,
          authorName: n.author.fullName,
          note: n.note,
          isPinned: n.isPinned,
          createdAt: n.createdAt,
        })),
      },
    };
  });

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
            {title} — Kayıtlı Öğrenciler
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Bu programa kesin kayıt yaptırmış öğrencilerin operasyonel takip ve evrak listesi.
          </p>
        </div>
      </div>

      {/* ── Metric Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kayıtlı Öğrenci</span>
            <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{totalCount}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Aktif Süreç</span>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{activeCount}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Profili Tamamlanan</span>
            <span className="rounded-lg bg-purple-50 p-2 text-purple-600">
              <FileText className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{withProfileCount}</p>
        </div>
      </div>

      {/* ── Table Section ───────────────────────────────────────────────── */}
      <StudentTable students={tableData} programFilter={programEnum} />
    </div>
  );
}
