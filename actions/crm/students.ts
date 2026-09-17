// actions/crm/students.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/session";
import type { Prisma } from "@prisma/client";

export type StudentActionState =
  | { success: true }
  | { success: false; error: string };

// ── updateStudentProfile ──────────────────────────────────────────────────────

export async function updateStudentProfile(
  studentId: string,
  data: Prisma.StudentProfileUpdateInput,
): Promise<StudentActionState> {
  await requireStaff();

  await prisma.studentProfile.upsert({
    where: { studentId },
    update: data,
    create: {
      studentId,
      nationalId: (data.nationalId as string) ?? "",
      dateOfBirth: (data.dateOfBirth as Date) ?? new Date(),
      placeOfBirth: (data.placeOfBirth as string) ?? "",
    },
  });

  revalidatePath(`/students/${studentId}`);
  return { success: true };
}

// ── updateWatDetail ───────────────────────────────────────────────────────────

export async function updateWatDetail(
  studentId: string,
  data: Prisma.WatDetailUpdateInput,
): Promise<StudentActionState> {
  await requireStaff();

  const { id: _id, studentId: _sId, ...createData } = data as any;

  await prisma.watDetail.upsert({
    where: { studentId },
    update: data,
    create: { studentId, ...createData },
  });

  revalidatePath(`/students/${studentId}`);
  return { success: true };
}

// ── updateAcademyDetail ───────────────────────────────────────────────────────

export async function updateAcademyDetail(
  studentId: string,
  data: Prisma.AcademyDetailUpdateInput,
): Promise<StudentActionState> {
  await requireStaff();

  const { id: _id, studentId: _sId, ...createData } = data as any;

  await prisma.academyDetail.upsert({
    where: { studentId },
    update: data,
    create: { studentId, ...createData },
  });

  revalidatePath(`/students/${studentId}`);
  return { success: true };
}

// ── advanceWatStep ────────────────────────────────────────────────────────────
// Updates the WAT progress step by setting the appropriate date field.
// Steps: 1=Kayıt, 2=İş Seçimi, 3=DS Bekleniyor, 4=DS Geldi, 5=Vize Randevu, 6=Vize Alındı

const WAT_STEP_FIELDS: Record<number, keyof Prisma.WatDetailUpdateInput> = {
  2: "jobStartDate",
  3: "sponsorDsNumber",  // DS form sent
  4: "usArrivalDate",    // DS received (arrival date set)
  5: "visaInterviewDate",
  6: "visaApproved",
};

export async function advanceWatStep(
  studentId: string,
  stepNumber: number,
): Promise<StudentActionState> {
  await requireStaff();

  if (stepNumber === 6) {
    await prisma.watDetail.upsert({
      where: { studentId },
      update: { visaApproved: true },
      create: { studentId, visaApproved: true },
    });
  } else {
    const field = WAT_STEP_FIELDS[stepNumber];
    if (!field) return { success: false, error: "Geçersiz adım numarası." };
    await prisma.watDetail.upsert({
      where: { studentId },
      update: { [field]: new Date() },
      create: { studentId, [field]: new Date() },
    });
  }

  // Trigger automated notification for student
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true },
  });

  if (student?.user) {
    const stepLabels: Record<number, string> = {
      2: "İş Seçimi",
      3: "DS-2019 Bekleniyor",
      4: "DS-2019 Belgesi Geldi",
      5: "Vize Randevusu Alındı",
      6: "Vize Onaylandı",
    };

    const { triggerStepperStatusNotification } = await import("@/lib/notifications/notificationEngine");
    await triggerStepperStatusNotification({
      studentName: student.user.fullName,
      email: student.user.email,
      phone: student.user.phone || undefined,
      stepNumber,
      stepLabel: stepLabels[stepNumber] || `Adım ${stepNumber}`,
    });
  }

  revalidatePath(`/students/${studentId}`);
  return { success: true };
}

// ── toggleInstallmentPaid ─────────────────────────────────────────────────────

export async function toggleInstallmentPaid(
  installmentId: string,
  isPaid: boolean,
): Promise<StudentActionState> {
  await requireStaff();

  const updated = await prisma.installment.update({
    where: { id: installmentId },
    data: {
      isPaid,
      paidAt: isPaid ? new Date() : null,
    },
    include: {
      payment: {
        include: {
          student: {
            include: { user: true },
          },
        },
      },
    },
  });

  if (isPaid && updated.payment?.student?.user) {
    const studentUser = updated.payment.student.user;
    const { sendNotification } = await import("@/lib/notifications/notificationEngine");
    await sendNotification({
      to: {
        name: studentUser.fullName,
        email: studentUser.email,
        phone: studentUser.phone || undefined,
      },
      subject: "Ödemeniz Onaylandı - Advice Yurtdışı Eğitim",
      content: `Sayın ${studentUser.fullName}, ${updated.amount} ${updated.currency} tutarındaki ödemeniz danışmanınız ve muhasebe tarafından onaylanmıştır.`,
      channel: "BOTH",
    });
  }

  revalidatePath("/students");
  return { success: true };
}

// ── approveStudentChange ──────────────────────────────────────────────────────

export async function approveStudentChange(
  approvalId: string,
): Promise<StudentActionState> {
  const advisor = await requireStaff();

  const approval = await prisma.pendingApproval.findUnique({
    where: { id: approvalId },
    include: {
      student: {
        include: { user: true },
      },
    },
  });
  if (!approval) return { success: false, error: "Onay kaydı bulunamadı." };

  // Apply newData to the appropriate live table
  const newData = approval.newData as Record<string, unknown>;

  await prisma.$transaction(async (tx) => {
    switch (approval.entityType) {
      case "STUDENT_PROFILE":
        await tx.studentProfile.upsert({
          where: { studentId: approval.studentId },
          update: newData,
          create: {
            studentId: approval.studentId,
            nationalId: (newData.nationalId as string) ?? "",
            dateOfBirth: new Date((newData.dateOfBirth as string) ?? "2000-01-01"),
            placeOfBirth: (newData.placeOfBirth as string) ?? "",
            ...newData,
          },
        });
        break;
      case "WAT_DETAIL":
        await tx.watDetail.upsert({
          where: { studentId: approval.studentId },
          update: newData,
          create: { studentId: approval.studentId, ...newData },
        });
        break;
      default:
        break;
    }

    await tx.pendingApproval.update({
      where: { id: approvalId },
      data: {
        status: "APPROVED",
        reviewedById: advisor.id,
        reviewedAt: new Date(),
      },
    });
  });

  // Automated notification to student
  if (approval.student?.user) {
    const { triggerReviewDecisionNotification } = await import("@/lib/notifications/notificationEngine");
    await triggerReviewDecisionNotification({
      studentName: approval.student.user.fullName,
      email: approval.student.user.email,
      phone: approval.student.user.phone || undefined,
      isApproved: true,
      entityName: approval.entityType === "STUDENT_PROFILE" ? "Profil Bilgileri" : "Program Bilgileri",
    });
  }

  revalidatePath("/students");
  revalidatePath("/approvals");
  return { success: true };
}

// ── requestRevision ───────────────────────────────────────────────────────────

export async function requestRevision(
  approvalId: string,
  rejectionReason: string,
): Promise<StudentActionState> {
  const advisor = await requireStaff();

  const updatedApproval = await prisma.pendingApproval.update({
    where: { id: approvalId },
    data: {
      status: "REVISION_REQUESTED",
      rejectionReason,
      reviewedById: advisor.id,
      reviewedAt: new Date(),
    },
    include: {
      student: {
        include: { user: true },
      },
    },
  });

  // Automated notification to student
  if (updatedApproval.student?.user) {
    const { triggerReviewDecisionNotification } = await import("@/lib/notifications/notificationEngine");
    await triggerReviewDecisionNotification({
      studentName: updatedApproval.student.user.fullName,
      email: updatedApproval.student.user.email,
      phone: updatedApproval.student.user.phone || undefined,
      isApproved: false,
      rejectionReason,
      entityName: updatedApproval.entityType === "STUDENT_PROFILE" ? "Profil Bilgileri" : "Program Bilgileri",
    });
  }

  revalidatePath("/approvals");
  return { success: true };
}

// ── updateLanguageDetail ──────────────────────────────────────────────────────

export async function updateLanguageDetail(
  studentId: string,
  data: Prisma.LanguageDetailUpdateInput,
): Promise<StudentActionState> {
  await requireStaff();

  const { id: _id, studentId: _sId, ...createData } = data as any;

  await prisma.languageDetail.upsert({
    where: { studentId },
    update: data,
    create: { studentId, ...createData },
  });

  revalidatePath(`/students/${studentId}`);
  return { success: true };
}

// ── updateSummerCampDetail ───────────────────────────────────────────────────

export async function updateSummerCampDetail(
  studentId: string,
  data: Prisma.SummerCampDetailUpdateInput,
): Promise<StudentActionState> {
  await requireStaff();

  const { id: _id, studentId: _sId, ...createData } = data as any;

  await prisma.summerCampDetail.upsert({
    where: { studentId },
    update: data,
    create: { studentId, ...createData },
  });

  revalidatePath(`/students/${studentId}`);
  return { success: true };
}

// ── updateVisaDetail ─────────────────────────────────────────────────────────

export async function updateVisaDetail(
  studentId: string,
  data: Prisma.VisaDetailUpdateInput,
): Promise<StudentActionState> {
  await requireStaff();

  const { id: _id, studentId: _sId, ...createData } = data as any;

  await prisma.visaDetail.upsert({
    where: { studentId },
    update: data,
    create: { studentId, ...createData },
  });

  revalidatePath(`/students/${studentId}`);
  return { success: true };
}

