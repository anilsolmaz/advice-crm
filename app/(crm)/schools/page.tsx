// app/(crm)/schools/page.tsx
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  PartnerSchoolPool,
  type PartnerSchoolRecord,
} from "@/components/crm/catalog/PartnerSchoolPool";

export const dynamic = "force-dynamic";

export default async function PartnerSchoolsPage() {
  await requireStaff();

  const rawSchools = await prisma.partnerSchool.findMany({
    orderBy: [{ programType: "asc" }, { name: "asc" }],
  });

  const schools: PartnerSchoolRecord[] = rawSchools.map((s) => ({
    id: s.id,
    name: s.name,
    country: s.country,
    city: s.city,
    programType: s.programType,
    programsOffered: s.programsOffered,
    quota: s.quota,
    commissionRate: s.commissionRate ? String(s.commissionRate) : null,
    commissionFixed: s.commissionFixed ? String(s.commissionFixed) : null,
    currency: s.currency,
    contactEmail: s.contactEmail,
    website: s.website,
    notes: s.notes,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a]">
          Partner Okul &amp; Üniversite Havuzu
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Akademi, Dil Okulu ve Yaz Okulu anlaşmalı kurumları, komisyon oranları ve yıllık kontenjanlar.
        </p>
      </div>

      <PartnerSchoolPool initialSchools={schools} />
    </div>
  );
}
