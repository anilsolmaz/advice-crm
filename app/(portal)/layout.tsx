// app/(portal)/layout.tsx
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PortalNavbar } from "@/components/portal/navigation/PortalNavbar";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStudent();

  // Find student ID to fetch pending count for notification badge
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      pendingApprovals: {
        where: { status: "PENDING" },
        select: { id: true },
      },
    },
  });

  const pendingApprovalsCount = student?.pendingApprovals?.length ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PortalNavbar user={user} pendingApprovalsCount={pendingApprovalsCount} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} Advice Yurtdışı Eğitim. Tüm hakları saklıdır.</p>
        <p className="mt-1 text-gray-400">Danışmanlık & Destek Hattı: destek@advice.com.tr</p>
      </footer>
    </div>
  );
}
