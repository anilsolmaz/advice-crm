// app/(crm)/layout.tsx
// CRM shell layout — wraps all staff/advisor/accounting pages.
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/crm/navigation/Sidebar";
import Header, { type HeaderNotificationItem } from "@/components/crm/navigation/Header";
import type { StagedApprovalItem } from "@/components/crm/approvals/PendingApprovalsDrawer";

export default async function CRMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStaff();

  const [pendingApprovalsRaw, notificationsRaw] = await Promise.all([
    prisma.pendingApproval.findMany({
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
    }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

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

  const notifications: HeaderNotificationItem[] = notificationsRaw.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    href: n.linkUrl,
    isRead: n.isRead,
    createdAt: n.createdAt,
  }));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        userRole={user.role}
        allowedPrograms={user.advisorProfile?.allowedPrograms}
        canManageAccounting={user.advisorProfile?.canManageAccounting}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          user={user}
          pendingApprovals={pendingApprovals}
          notifications={notifications}
        />
        <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
