// app/(crm)/settings/page.tsx
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getIntegrationStatus } from "@/actions/crm/integrations";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireStaff();

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [staffUsers, integrationStatus] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "ADVISOR"] },
      },
      include: {
        advisorProfile: true,
        _count: {
          select: {
            studentsAsAdvisor: true,
            leadsAsAdvisor: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    getIntegrationStatus(),
  ]);

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700 uppercase tracking-wide">
              Yönetici Paneli
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            Sistem Ayarları & Yapılandırma
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Danışman hesapları, e-posta/SMS servisleri, webhook anahtarları ve canlı operasyon ayarları.
          </p>
        </div>
      </div>

      <SettingsClient
        initialUsers={staffUsers}
        currentUserId={user.id}
        integrationStatus={integrationStatus}
      />
    </div>
  );
}
