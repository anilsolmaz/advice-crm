// app/(crm)/accounting/page.tsx
import { requireAccounting } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import AccountingClient, { type AccountingEntryRow } from "./AccountingClient";

export const dynamic = "force-dynamic";

export default async function AccountingPage() {
  await requireAccounting();

  const [rawEntries, students, schools, advisors] = await Promise.all([
    prisma.accountingEntry.findMany({
      include: {
        student: { include: { user: true } },
        partnerSchool: true,
        advisor: true,
      },
      orderBy: { transactionDate: "desc" },
    }),
    prisma.student.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.partnerSchool.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "ADVISOR"] } },
      select: { id: true, fullName: true },
    }),
  ]);

  const entries: AccountingEntryRow[] = rawEntries.map((e) => ({
    id: e.id,
    type: e.type,
    category: e.category,
    studentId: e.studentId,
    studentName: e.student?.user.fullName || null,
    partnerSchoolId: e.partnerSchoolId,
    partnerSchoolName: e.partnerSchool?.name || null,
    partnerSchoolCountry: e.partnerSchool?.country || null,
    advisorId: e.advisorId,
    advisorName: e.advisor?.fullName || null,
    description: e.description,
    amount: Number(e.amount),
    currency: e.currency,
    paymentMethod: e.paymentMethod,
    weeksSold: e.weeksSold,
    grossAmount: e.grossAmount ? Number(e.grossAmount) : null,
    netAmount: e.netAmount ? Number(e.netAmount) : null,
    transactionDate: e.transactionDate.toISOString(),
    isPaid: e.isPaid,
    notes: e.notes,
  }));

  return (
    <AccountingClient
      entries={entries}
      students={students.map((s) => ({
        id: s.id,
        fullName: s.user.fullName,
      }))}
      schools={schools.map((sc) => ({
        id: sc.id,
        name: sc.name,
        country: sc.country,
      }))}
      advisors={advisors}
    />
  );
}
