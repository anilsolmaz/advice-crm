// app/(crm)/leads/page.tsx
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import LeadsPageClient from "./LeadsPageClient";
import type { CRMLeadRow } from "@/types/crm";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const user = await requireStaff();

  const allowed = user.advisorProfile?.allowedPrograms ?? [];
  const canViewAll = user.advisorProfile?.canViewAllLeads ?? true;

  const whereClause =
    user.role === "ADMIN"
      ? {}
      : canViewAll
      ? { program: { in: allowed } }
      : { advisorId: user.id, program: { in: allowed } };

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

  return <LeadsPageClient initialLeads={leads} />;
}
