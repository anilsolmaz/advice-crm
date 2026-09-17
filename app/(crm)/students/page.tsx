// app/(crm)/students/page.tsx
// Master Registered Students Directory across all programs
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Users, GraduationCap, Plane, Languages, Sun, Stamp } from "lucide-react";
import { StudentTable } from "@/components/crm/students/StudentTable";
import type { StudentTableRowData } from "@/components/crm/students/StudentTable";

export const dynamic = "force-dynamic";

export default async function StudentsMasterPage() {
  const user = await requireStaff();

  const allowed = user.advisorProfile?.allowedPrograms ?? [];
  const canViewAll = user.advisorProfile?.canViewAllLeads ?? true;

  const whereClause =
    user.role === "ADMIN"
      ? {}
      : canViewAll
      ? { program: { in: allowed } }
      : { advisorId: user.id, program: { in: allowed } };

  // Fetch all registered students
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

  // Calculate statistics
  const totalCount = students.length;
  const watCount = students.filter((s) => s.program === "WORK_AND_TRAVEL").length;
  const academyCount = students.filter((s) => s.program === "ACADEMY").length;
  const languageCount = students.filter((s) => s.program === "LANGUAGE_SCHOOL").length;
  const otherCount = students.filter((s) => s.program === "SUMMER_CAMP" || s.program === "VISA_CONSULTING").length;

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

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Kayıtlı Öğrenciler
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Advice Yurtdışı Eğitim bünyesindeki tüm kayıtlı öğrencilerin merkezi portföyü.
          </p>
        </div>
      </div>

      {/* ── Metric Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Toplam Öğrenci</span>
            <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{totalCount}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Work & Travel</span>
            <span className="rounded-lg bg-sky-50 p-2 text-sky-600">
              <Plane className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{watCount}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Akademi</span>
            <span className="rounded-lg bg-purple-50 p-2 text-purple-600">
              <GraduationCap className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{academyCount}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dil Okulları</span>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Languages className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{languageCount}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Yaz Okulu & Vize</span>
            <span className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Sun className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{otherCount}</p>
        </div>
      </div>

      {/* ── Table Section ───────────────────────────────────────────────── */}
      <StudentTable students={tableData} />
    </div>
  );
}
