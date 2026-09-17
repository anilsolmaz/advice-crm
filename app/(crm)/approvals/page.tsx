// app/(crm)/approvals/page.tsx
// Global Approval Center — Staff CRM
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ApprovalsCenterClient } from "./ApprovalsCenterClient";
import type { ApprovalItem } from "./ApprovalsCenterClient";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const user = await requireStaff();

  const isAdvisor = user.role === "ADVISOR";
  const whereClause = isAdvisor
    ? {
        student: {
          advisorId: user.id,
        },
      }
    : {};

  const rawApprovals = await prisma.pendingApproval.findMany({
    where: whereClause,
    include: {
      student: {
        include: {
          user: true,
        },
      },
      reviewedBy: {
        select: {
          fullName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const approvals: ApprovalItem[] = rawApprovals.map((a) => ({
    id: a.id,
    studentId: a.studentId,
    studentName: a.student.user.fullName,
    studentEmail: a.student.user.email,
    program: a.student.program,
    entityType: a.entityType,
    oldData: (a.oldData as Record<string, unknown>) ?? null,
    newData: (a.newData as Record<string, unknown>) ?? {},
    status: a.status as "PENDING" | "APPROVED" | "REVISION_REQUESTED",
    rejectionReason: a.rejectionReason,
    reviewerName: a.reviewedBy?.fullName ?? null,
    reviewedAt: a.reviewedAt,
    createdAt: a.createdAt,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Onay Kuyruğu (Global Approval Center)
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Öğrencilerin self-servis portaldan ilettiği profil, kimlik ve operasyonel form değişikliklerinin danışman denetim merkezi.
        </p>
      </div>

      <ApprovalsCenterClient initialApprovals={approvals} />
    </div>
  );
}
