// app/(crm)/[program]/catalog/page.tsx
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getProgramFromSlug, PROGRAM_TITLES } from "@/lib/utils/programs";
import { PROGRAM_LABELS } from "@/types/crm";
import {
  WatJobCatalog,
  type WatJobRecord,
} from "@/components/crm/catalog/WatJobCatalog";
import {
  PartnerSchoolPool,
  type PartnerSchoolRecord,
} from "@/components/crm/catalog/PartnerSchoolPool";
import {
  SummerBookingWizard,
  type SummerAllocationRecord,
  type SummerBookingRecord,
} from "@/components/crm/catalog/SummerBookingWizard";
import { ProgramBadge } from "@/components/crm/common/ProgramBadge";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    program: string;
  };
}

export default async function ProgramCatalogPage({ params }: Props) {
  await requireStaff();
  const programEnum = getProgramFromSlug(params.program);

  if (!programEnum) {
    notFound();
  }

  const title = PROGRAM_TITLES[params.program] || PROGRAM_LABELS[programEnum];
  const isWat = params.program === "wat";
  const isAcademyOrLanguage =
    params.program === "academy" || params.program === "language";
  const isSummer = params.program === "summer-camp";

  // Fetch dynamic database records for the active program
  const [rawJobs, watStudentsRaw, rawSchools, rawAllocations, rawBookings, summerStudentsRaw] =
    await Promise.all([
      isWat
        ? prisma.watJob.findMany({
            orderBy: { createdAt: "desc" },
            include: {
              assignments: {
                include: {
                  student: { include: { user: true } },
                },
                orderBy: { createdAt: "desc" },
              },
            },
          })
        : Promise.resolve([]),
      isWat
        ? prisma.student.findMany({
            where: { program: "WORK_AND_TRAVEL" },
            include: { user: true },
          })
        : Promise.resolve([]),
      isAcademyOrLanguage
        ? prisma.partnerSchool.findMany({
            where: { programType: programEnum },
            orderBy: { name: "asc" },
          })
        : Promise.resolve([]),
      isSummer
        ? prisma.summerAllocation.findMany({
            orderBy: { startDate: "asc" },
          })
        : Promise.resolve([]),
      isSummer
        ? prisma.summerBooking.findMany({
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
      isSummer
        ? prisma.student.findMany({
            where: { program: "SUMMER_CAMP" },
            include: { user: true },
          })
        : Promise.resolve([]),
    ]);

  const watJobs: WatJobRecord[] = rawJobs.map((j) => ({
    id: j.id,
    sponsor: j.sponsor,
    program: j.program,
    jobCategory: j.jobCategory,
    jobTitle: j.jobTitle,
    placementType: j.placementType,
    location: j.location,
    state: j.state,
    arrivalAirport: j.arrivalAirport,
    hourlyWage: String(j.hourlyWage),
    avgWorkingHours: j.avgWorkingHours,
    accommodationCost: j.accommodationCost ? String(j.accommodationCost) : null,
    accommodationDeposit: j.accommodationDeposit
      ? String(j.accommodationDeposit)
      : null,
    food: j.food,
    transportation: j.transportation,
    workApparel: j.workApparel,
    position: j.position,
    genderPreference: j.genderPreference,
    jobStartDate: j.jobStartDate.toISOString(),
    jobEndDate: j.jobEndDate.toISOString(),
    earlyLeaveInfo: j.earlyLeaveInfo,
    numPlacements: j.numPlacements,
    filledPlacements: j.filledPlacements,
    bonus: j.bonus,
    additionalInfo: j.additionalInfo,
    assignments: j.assignments.map((a) => ({
      id: a.id,
      studentId: a.studentId,
      studentName: a.student.user.fullName,
      shareToken: a.shareToken,
      status: a.status,
      studentNote: a.studentNote,
      respondedAt: a.respondedAt ? a.respondedAt.toISOString() : null,
      createdAt: a.createdAt.toISOString(),
    })),
  }));

  const watStudents = watStudentsRaw.map((s) => ({
    id: s.id,
    fullName: s.user.fullName,
    email: s.user.email,
  }));

  const partnerSchools: PartnerSchoolRecord[] = rawSchools.map((s) => ({
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

  const allocations: SummerAllocationRecord[] = rawAllocations.map((a) => ({
    id: a.id,
    country: a.country,
    centerName: a.centerName,
    nights: a.nights,
    startDate: a.startDate.toISOString(),
    totalQuota: a.totalQuota,
    usedQuota: a.usedQuota,
    pricePerStudent: a.pricePerStudent ? String(a.pricePerStudent) : null,
    currency: a.currency,
  }));

  const bookings: SummerBookingRecord[] = rawBookings.map((b) => ({
    id: b.id,
    bookingCode: b.bookingCode,
    groupName: b.groupName,
    country: b.country,
    centerName: b.centerName,
    nights: b.nights,
    startDate: b.startDate.toISOString(),
    participantCount: b.participantCount,
    totalAmount: b.totalAmount ? String(b.totalAmount) : null,
    currency: b.currency,
    status: b.status,
  }));

  const summerStudents = summerStudentsRaw.map((s) => ({
    id: s.id,
    fullName: s.user.fullName,
    email: s.user.email,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ProgramBadge program={programEnum} showIcon size="md" />
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0f172a]">
            {title} — İş, Okul &amp; Kontenjan Havuzu
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isWat
              ? "22 kriterli Work and Travel iş havuzu, yeni iş ekleme ve öğrenciye özel onay linki oluşturma merkezi."
              : isSummer
              ? "Yaz okulu 6 adımlı grup rezervasyon (Booking & Allocation) sihirbazı."
              : "Partner üniversite ve dil okulu havuzu, kontenjanlar ve komisyon oranları."}
          </p>
        </div>
      </div>

      {isWat && <WatJobCatalog initialJobs={watJobs} watStudents={watStudents} />}

      {isAcademyOrLanguage && (
        <PartnerSchoolPool
          initialSchools={partnerSchools}
          defaultProgram={programEnum}
        />
      )}

      {isSummer && (
        <SummerBookingWizard
          allocations={allocations}
          bookings={bookings}
          students={summerStudents}
        />
      )}
    </div>
  );
}
