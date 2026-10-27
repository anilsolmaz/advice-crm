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
  const user = await requireStaff();

  const [student, staffList] = await Promise.all([
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
          include: { job: true },
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
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "ADVISOR", "ACCOUNTING"] }, isActive: true },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  if (!student) {
    notFound();
  }

  return <StudentDetailView student={student} staffList={staffList} />;
}
