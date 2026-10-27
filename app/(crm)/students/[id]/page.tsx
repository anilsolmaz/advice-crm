// app/(crm)/students/[id]/page.tsx
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { StudentDetailView } from "./StudentDetailView";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    id: string;
  };
}

export default async function StudentDetailPage({ params }: Props) {
  await requireStaff();

  const [student, staffList, availableWatJobs] = await Promise.all([
    prisma.student.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        advisor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        profile: true,
        watDetail: true,
        academyDetail: true,
        languageDetail: true,
        summerCampDetail: true,
        visaDetail: true,
        academicApplications: {
          orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        },
        watJobAssignments: {
          include: {
            job: true,
            assignedBy: { select: { fullName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        accountingEntries: {
          orderBy: { transactionDate: "desc" },
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
        payments: {
          include: {
            installments: {
              orderBy: { sequence: "asc" },
            },
          },
        },
        advisorNotes: {
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        activityLogs: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "ADVISOR", "ACCOUNTING"] }, isActive: true },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.watJob.findMany({
      where: { isActive: true },
      select: {
        id: true,
        sponsor: true,
        jobTitle: true,
        location: true,
        hourlyWage: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!student) {
    notFound();
  }

  const siblingEnrollments = await prisma.student.findMany({
    where: { userId: student.userId },
    orderBy: [{ termYear: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      program: true,
      termYear: true,
      enrollmentLabel: true,
      isActive: true,
    },
  });

  return (
    <StudentDetailView
      student={student}
      siblingEnrollments={siblingEnrollments}
      staffList={staffList}
      availableWatJobs={availableWatJobs.map((j) => ({
        ...j,
        hourlyWage: String(j.hourlyWage),
      }))}
    />
  );
}
