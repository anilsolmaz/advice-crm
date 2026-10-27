// actions/portal/ds160.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";

export interface Ds160FormPayload {
  confirmationNo?: string;
  consulateLocation?: string;
  travelPurpose?: string;
  intendedArrivalDate?: string;
  intendedLengthOfStay?: string;
  usAddressStreet?: string;
  usAddressCity?: string;
  usAddressState?: string;
  usContactName?: string;
  usContactPhone?: string;
  sevisId?: string;
  programNumber?: string;
  previouslyVisitedUs?: string;
  previousVisaIssued?: string;
  previousVisaRefused?: string;
  socialMediaHandles?: string;
  additionalNotes?: string;
  status?: "DRAFT" | "SUBMITTED" | "APPROVED";
}

export async function saveStudentDs160Form(
  studentId: string,
  payload: Ds160FormPayload,
): Promise<{ success: boolean; error?: string }> {
  const user = await requireAuth();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true },
  });

  if (!student) {
    return { success: false, error: "Öğrenci bulunamadı." };
  }

  // Only the student themselves or staff can update
  if (user.role === "STUDENT" && student.userId !== user.id) {
    return { success: false, error: "Yetkisiz işlem." };
  }

  const nextStatus = payload.status || "SUBMITTED";

  await prisma.watDetail.upsert({
    where: { studentId },
    create: {
      studentId,
      ds160Status: nextStatus,
      ds160ConfirmationNo: payload.confirmationNo || null,
      ds160Data: payload as any,
      ...(payload.sevisId ? { sevisId: payload.sevisId } : {}),
    },
    update: {
      ds160Status: nextStatus,
      ...(payload.confirmationNo !== undefined
        ? { ds160ConfirmationNo: payload.confirmationNo || null }
        : {}),
      ds160Data: payload as any,
      ...(payload.sevisId ? { sevisId: payload.sevisId } : {}),
    },
  });

  if (user.role === "STUDENT" && student.advisorId && nextStatus === "SUBMITTED") {
    await prisma.notification.create({
      data: {
        userId: student.advisorId,
        type: "DEADLINE",
        title: `📋 ${student.user.fullName} DS-160 Formunu Gönderdi`,
        message: `DS-160 onay no: ${payload.confirmationNo || "Belirtilmedi"}. İncelemek için tıklayın.`,
        linkUrl: `/students/${studentId}`,
      },
    });
  }

  revalidatePath("/anasayfa");
  revalidatePath("/programim");
  revalidatePath(`/students/${studentId}`);
  return { success: true };
}
