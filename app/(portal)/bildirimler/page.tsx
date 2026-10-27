// app/(portal)/bildirimler/page.tsx
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ApprovalDiffViewer } from "@/components/portal/approvals/ApprovalDiffViewer";

export const dynamic = "force-dynamic";

export default async function StudentNotificationsPage() {
  const authUser = await requireStudent();

  const enrollments = await prisma.student.findMany({
    where: { userId: authUser.id },
    orderBy: { createdAt: "desc" },
    include: {
      pendingApprovals: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const student = enrollments[0];

  if (!student) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        Öğrenci kaydınız bulunamadı.
      </div>
    );
  }

  const allPendingApprovals = enrollments.flatMap((e) => e.pendingApprovals);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Bildirimler & Onay Talepleri</h1>
        <p className="text-xs text-gray-500 mt-1">
          Profilinizde talep ettiğiniz değişikliklerin durumunu ve danışmanınızın ilettiği revize notlarını buradan takip edebilirsiniz.
        </p>
      </div>

      <ApprovalDiffViewer approvals={allPendingApprovals} />
    </div>
  );
}
