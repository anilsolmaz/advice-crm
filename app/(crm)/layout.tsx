// app/(crm)/layout.tsx
// CRM shell layout — wraps all staff/advisor pages.
// Renders Sidebar + Header + main content area.
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/crm/navigation/Sidebar";
import Header from "@/components/crm/navigation/Header";
import type { StagedApprovalItem } from "@/components/crm/approvals/PendingApprovalsDrawer";

export default async function CRMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStaff();

  // Query pending approvals for the staff header bell badge & drawer
  const pendingApprovalsRaw = await prisma.pendingApproval.findMany({
    where: { status: "PENDING" },
    include: {
      student: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  const pendingApprovals: StagedApprovalItem[] = pendingApprovalsRaw.map((a) => ({
    id: a.id,
    studentId: a.studentId,
    studentName: a.student?.user?.fullName || "Öğrenci",
    studentEmail: a.student?.user?.email || "",
    program: a.student?.program || "WORK_AND_TRAVEL",
    entityType: a.entityType,
    entityId: a.entityId,
    oldData: a.oldData as Record<string, unknown> | null,
    newData: a.newData as Record<string, unknown>,
    createdAt: a.createdAt,
  }));

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Fixed sidebar ──────────────────────────────────────────── */}
      <Sidebar userRole={user.role} allowedPrograms={user.advisorProfile?.allowedPrograms} />

      {/* ── Main column ───────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} pendingApprovals={pendingApprovals} />
        <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
