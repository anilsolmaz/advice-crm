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
    user.role === "ADMIN" || user.role === "ACCOUNTING"
      ? {}
      : canViewAll && allowed.length > 0
      ? { program: { in: allowed } }
      : canViewAll
      ? {}
      : { advisorId: user.id };

  const [rawLeads, advisors] = await Promise.all([
    prisma.lead.findMany({
      where: whereClause,
      orderBy: [{ followUpAt: "asc" }, { createdAt: "desc" }],
      include: {
        advisor: {
          select: { id: true, fullName: true },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "ADVISOR"] }, isActive: true },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  const leads: CRMLeadRow[] = rawLeads.map((l) => ({
    id: l.id,
    fullName: l.fullName,
    email: l.email,
    phone: l.phone,
    status: l.status,
    program: l.program,
    source: l.source,
    advisorId: l.advisorId,
    advisorName: l.advisor?.fullName ?? null,
    sponsor: l.sponsor,
    city: l.city,
    visaStatus: l.visaStatus,
    notes: l.notes,
    followUpAt: l.followUpAt,
    lastContactedAt: l.lastContactedAt,
    lastCallOutcome: l.lastCallOutcome,
    callCount: l.callCount,
    createdAt: l.createdAt,
  }));

  return <LeadsPageClient initialLeads={leads} advisors={advisors} />;
}
