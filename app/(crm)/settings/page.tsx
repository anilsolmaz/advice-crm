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

  const [staffUsers, customRoles, integrationStatus] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "ADVISOR", "ACCOUNTING"] },
      },
      include: {
        advisorProfile: true,
        customRole: true,
        _count: {
          select: {
            studentsAsAdvisor: true,
            leadsAsAdvisor: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.customRole.findMany({
      orderBy: { createdAt: "asc" },
    }),
    getIntegrationStatus(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-[#0f172a] px-2.5 py-0.5 text-xs font-bold text-sky-300 uppercase tracking-wide">
              Advice Yönetici Paneli
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0f172a]">
            Sistem, Personel &amp; Dinamik Rol Ayarları
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Danışman, Muhasebe ve Yönetici hesapları, yeni rol tanımlama (Custom RBAC) ve servis yapılandırması.
          </p>
        </div>
      </div>

      <SettingsClient
        initialUsers={staffUsers}
        customRoles={customRoles}
        currentUserId={user.id}
        integrationStatus={integrationStatus}
      />
    </div>
  );
}
