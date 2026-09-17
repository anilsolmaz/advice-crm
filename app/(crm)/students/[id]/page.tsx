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

  const isAdvisor = user.role === "ADVISOR";
  const student = await prisma.student.findUnique({
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
  });

  if (!student) {
    notFound();
  }

  // Advisor isolation check: if advisor, they can only view students assigned to them
  if (isAdvisor && student.advisorId && student.advisorId !== user.id) {
    notFound();
  }

  return <StudentDetailView student={student} />;
}
