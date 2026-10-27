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
  revalidatePath("/anasayfa");
  revalidatePath("/programim");
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

const WAT_STEP_FIELDS: Record<number, keyof Prisma.WatDetailUpdateInput> = {
  2: "jobStartDate",
  3: "sponsorDsNumber",
  4: "usArrivalDate",
  5: "visaInterviewDate",
  6: "visaApproved",
};

export async function advanceWatStep(
  studentId: string,
  stepNumber: number,
): Promise<StudentActionState> {
  await requireStaff();

  const stageMap: Record<number, string> = {
    1: "PRE_REGISTRATION",
    2: "JOB_SELECTION",
    3: "JOB_PLACEMENT",
    4: "VISA_APPOINTMENT",
    5: "VISA_APPOINTMENT",
    6: "VISA_APPROVED",
    7: "ORIENTATION",
    8: "DEPARTURE",
  };

  if (stepNumber === 6) {
    await prisma.watDetail.upsert({
      where: { studentId },
      update: { visaApproved: true, currentStage: "VISA_APPROVED" },
      create: { studentId, visaApproved: true, currentStage: "VISA_APPROVED" },
    });
  } else {
    const field = WAT_STEP_FIELDS[stepNumber];
    await prisma.watDetail.upsert({
      where: { studentId },
      update: {
        ...(field ? { [field]: new Date() } : {}),
        ...(stageMap[stepNumber] ? { currentStage: stageMap[stepNumber] } : {}),
      },
      create: {
        studentId,
        ...(field ? { [field]: new Date() } : {}),
        ...(stageMap[stepNumber] ? { currentStage: stageMap[stepNumber] } : {}),
      },
    });
  }

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

    const { triggerStepperStatusNotification } = await import(
      "@/lib/notifications/notificationEngine"
    );
    await triggerStepperStatusNotification({
      studentName: student.user.fullName,
      email: student.user.email,
      phone: student.user.phone || undefined,
      stepNumber,
      stepLabel: stepLabels[stepNumber] || `Adım ${stepNumber}`,
    });
  }

  revalidatePath(`/students/${studentId}`);
  revalidatePath("/anasayfa");
  revalidatePath("/programim");
  return { success: true };
}

// ── toggleInstallmentPaid ─────────────────────────────────────────────────────

export async function toggleInstallmentPaid(
  installmentId: string,
  isPaid: boolean,
): Promise<StudentActionState> {
  await requireStaff();

  const updated = await prisma.$transaction(async (tx) => {
    const inst = await tx.installment.update({
      where: { id: installmentId },
      data: {
        isPaid,
        paidAt: isPaid ? new Date() : null,
      },
      include: {
        payment: {
          include: {
            installments: true,
            student: {
              include: { user: true },
            },
          },
        },
      },
    });

    const allInsts = inst.payment.installments.map((i) =>
      i.id === inst.id ? { ...i, isPaid } : i,
    );
    const allPaid = allInsts.every((i) => i.isPaid);
    const anyPaid = allInsts.some((i) => i.isPaid);

    await tx.payment.update({
      where: { id: inst.paymentId },
      data: {
        status: allPaid ? "PAID" : anyPaid ? "PARTIALLY_PAID" : "PENDING",
      },
    });

    if (isPaid) {
      await tx.accountingEntry.create({
        data: {
          studentId: inst.payment.studentId,
          type: "INCOME",
          category: "TUITION",
          amount: inst.amount,
          currency: inst.currency,
          paymentMethod: inst.paymentMethod || "BANK_TRANSFER",
          description: `${inst.payment.description} - ${inst.sequence}. Taksit Tahsilatı`,
        },
      });

      await tx.activityLog.create({
        data: {
          studentId: inst.payment.studentId,
          actionType: "INSTALLMENT_PAID",
          title: `${inst.sequence}. Taksit Ödemesi Onaylandı (${Number(inst.amount)} ${inst.currency})`,
          description: `${inst.payment.description} · Ödeme Yöntemi: ${inst.paymentMethod || "BANK_TRANSFER"}`,
        },
      });
    }

    return inst;
  });

  if (isPaid && updated.payment?.student?.user) {
    const studentUser = updated.payment.student.user;
    const { sendNotification } = await import(
      "@/lib/notifications/notificationEngine"
    );
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
  revalidatePath(`/students/${updated.payment.studentId}`);
  revalidatePath("/odemelerim");
  revalidatePath("/anasayfa");
  revalidatePath("/programim");
  revalidatePath("/accounting");
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
            dateOfBirth: new Date(
              (newData.dateOfBirth as string) ?? "2000-01-01",
            ),
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
      case "DOCUMENT":
        if (approval.entityId) {
          await tx.document.update({
            where: { id: approval.entityId },
            data: {
              verificationStatus: "APPROVED",
              rejectionReason: null,
            },
          });
        }
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

  if (approval.student?.user) {
    const { triggerReviewDecisionNotification } = await import(
      "@/lib/notifications/notificationEngine"
    );
    await triggerReviewDecisionNotification({
      studentName: approval.student.user.fullName,
      email: approval.student.user.email,
      phone: approval.student.user.phone || undefined,
      isApproved: true,
      entityName:
        approval.entityType === "STUDENT_PROFILE"
          ? "Profil Bilgileri"
          : approval.entityType === "DOCUMENT"
          ? "Yüklenen Evrak"
          : "Program Bilgileri",
    });
  }

  revalidatePath("/students");
  revalidatePath(`/students/${approval.studentId}`);
  revalidatePath("/approvals");
  revalidatePath("/anasayfa");
  revalidatePath("/programim");
  revalidatePath("/belgelerim");
  return { success: true };
}

// ── requestRevision ───────────────────────────────────────────────────────────

export async function requestRevision(
  approvalId: string,
  rejectionReason: string,
): Promise<StudentActionState> {
  const advisor = await requireStaff();

  const updatedApproval = await prisma.$transaction(async (tx) => {
    const app = await tx.pendingApproval.update({
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

    if (app.entityType === "DOCUMENT" && app.entityId) {
      await tx.document.update({
        where: { id: app.entityId },
        data: {
          verificationStatus: "REVISION_REQUESTED",
          rejectionReason,
        },
      });
    }

    return app;
  });

  if (updatedApproval.student?.user) {
    const { triggerReviewDecisionNotification } = await import(
      "@/lib/notifications/notificationEngine"
    );
    await triggerReviewDecisionNotification({
      studentName: updatedApproval.student.user.fullName,
      email: updatedApproval.student.user.email,
      phone: updatedApproval.student.user.phone || undefined,
      isApproved: false,
      rejectionReason,
      entityName:
        updatedApproval.entityType === "STUDENT_PROFILE"
          ? "Profil Bilgileri"
          : updatedApproval.entityType === "DOCUMENT"
          ? "Yüklenen Evrak"
          : "Program Bilgileri",
    });
  }

  revalidatePath("/approvals");
  revalidatePath(`/students/${updatedApproval.studentId}`);
  revalidatePath("/anasayfa");
  revalidatePath("/programim");
  revalidatePath("/belgelerim");
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
  revalidatePath("/anasayfa");
  revalidatePath("/programim");
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
  revalidatePath("/anasayfa");
  revalidatePath("/programim");
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
  revalidatePath("/anasayfa");
  revalidatePath("/programim");
  return { success: true };
}

// ── reviewStudentDocument (Direct Advisor Verify/Reject in Student Tab) ───────

export async function reviewStudentDocument(
  documentId: string,
  decision: "APPROVED" | "REVISION_REQUESTED",
  rejectionReason?: string,
): Promise<StudentActionState> {
  const advisor = await requireStaff();

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
  });
  if (!doc) return { success: false, error: "Belge bulunamadı." };

  await prisma.$transaction(async (tx) => {
    await tx.document.update({
      where: { id: documentId },
      data: {
        verificationStatus: decision,
        rejectionReason:
          decision === "REVISION_REQUESTED"
            ? rejectionReason || "Belge uygun değil, lütfen yeniden yükleyin."
            : null,
      },
    });

    await tx.pendingApproval.updateMany({
      where: { entityId: documentId, status: "PENDING" },
      data: {
        status: decision,
        rejectionReason:
          decision === "REVISION_REQUESTED" ? rejectionReason : null,
        reviewedById: advisor.id,
        reviewedAt: new Date(),
      },
    });

    await tx.activityLog.create({
      data: {
        studentId: doc.studentId,
        actorId: advisor.id,
        actorName: advisor.fullName,
        actorRole: advisor.role,
        actionType: decision === "APPROVED" ? "DOCUMENT_APPROVED" : "DOCUMENT_REVISION",
        title:
          decision === "APPROVED"
            ? `Belge Onaylandı: ${doc.type}`
            : `Belge İçin Revize İstendi: ${doc.type}`,
        description:
          decision === "REVISION_REQUESTED"
            ? `Sebep: ${rejectionReason || "Belge uygun değil"} (${doc.fileName})`
            : `Dosya: ${doc.fileName}`,
      },
    });
  });

  revalidatePath(`/students/${doc.studentId}`);
  revalidatePath("/approvals");
  revalidatePath("/anasayfa");
  revalidatePath("/programim");
  revalidatePath("/belgelerim");
  return { success: true };
}

// ── uploadDocumentByAdvisor (Advisor uploads DS-2019, Job Offer, LOA, etc.) ───

export async function uploadDocumentByAdvisor(params: {
  studentId: string;
  type: any;
  fileName: string;
  fileUrl: string;
  notes?: string;
}): Promise<StudentActionState> {
  const advisor = await requireStaff();

  const existing = await prisma.document.findFirst({
    where: { studentId: params.studentId, type: params.type },
  });

  if (existing) {
    await prisma.document.update({
      where: { id: existing.id },
      data: {
        fileName: params.fileName,
        fileUrl: params.fileUrl,
        verificationStatus: "APPROVED",
        rejectionReason: null,
        uploadedByStudent: false,
        notes: params.notes || null,
      },
    });
  } else {
    await prisma.document.create({
      data: {
        studentId: params.studentId,
        type: params.type,
        fileName: params.fileName,
        fileUrl: params.fileUrl,
        verificationStatus: "APPROVED",
        uploadedByStudent: false,
        notes: params.notes || null,
      },
    });
  }

  await prisma.activityLog.create({
    data: {
      studentId: params.studentId,
      actorId: advisor.id,
      actorName: advisor.fullName,
      actorRole: advisor.role,
      actionType: "DOCUMENT_UPLOADED",
      title: `Danışman Belge Yükledi: ${params.type}`,
      description: `${params.fileName}${params.notes ? ` · Not: ${params.notes}` : ""}`,
    },
  });

  revalidatePath(`/students/${params.studentId}`);
  revalidatePath("/anasayfa");
  revalidatePath("/programim");
  revalidatePath("/belgelerim");
  return { success: true };
}

// ── createStudentPaymentPlan (Advisor creates payment & installments) ─────────

export async function createStudentPaymentPlan(params: {
  studentId: string;
  description: string;
  totalAmount: number;
  currency: "USD" | "EUR" | "GBP" | "TRY";
  installmentCount: number;
  firstDueDate: string;
}): Promise<StudentActionState> {
  const advisor = await requireStaff();

  const count = Math.max(1, Math.min(12, Number(params.installmentCount) || 1));
  const total = Number(params.totalAmount) || 0;
  if (total <= 0) {
    return { success: false, error: "Geçerli bir toplam tutar giriniz." };
  }

  const perInstallment = Math.round((total / count) * 100) / 100;
  const start = params.firstDueDate
    ? new Date(params.firstDueDate)
    : new Date();

  const installmentsData = Array.from({ length: count }).map((_, idx) => {
    const due = new Date(start);
    due.setMonth(due.getMonth() + idx);
    const amount =
      idx === count - 1
        ? Math.round((total - perInstallment * (count - 1)) * 100) / 100
        : perInstallment;
    return {
      sequence: idx + 1,
      amount,
      currency: params.currency,
      dueDate: due,
      isPaid: false,
    };
  });

  await prisma.payment.create({
    data: {
      studentId: params.studentId,
      description: params.description || "Program Danışmanlık & Kayıt Bedeli",
      totalAmount: total,
      currency: params.currency,
      status: "PENDING",
      dueDate: start,
      installments: {
        create: installmentsData,
      },
    },
  });

  await prisma.activityLog.create({
    data: {
      studentId: params.studentId,
      actorId: advisor.id,
      actorName: advisor.fullName,
      actorRole: advisor.role,
      actionType: "PAYMENT_PLAN_CREATED",
      title: `Yeni Ödeme Planı Oluşturuldu: ${total} ${params.currency} (${count} Taksit)`,
      description: params.description || "Program Danışmanlık & Kayıt Bedeli",
    },
  });

  revalidatePath(`/students/${params.studentId}`);
  revalidatePath("/odemelerim");
  revalidatePath("/accounting");
  return { success: true };
}

// ── enrollExistingStudentInNewProgram (Multi-program / Multi-year enrollment) ─

export async function enrollExistingStudentInNewProgram(params: {
  sourceStudentId: string;
  program: "WORK_AND_TRAVEL" | "ACADEMY" | "LANGUAGE_SCHOOL" | "SUMMER_CAMP" | "VISA_CONSULTING";
  termYear: number;
  enrollmentLabel?: string;
}): Promise<StudentActionState & { newStudentId?: string }> {
  const advisor = await requireStaff();

  const sourceStudent = await prisma.student.findUnique({
    where: { id: params.sourceStudentId },
    include: { user: true, profile: true },
  });

  if (!sourceStudent) {
    return { success: false, error: "Öğrenci bulunamadı." };
  }

  const programNameMap: Record<string, string> = {
    WORK_AND_TRAVEL: "Work & Travel",
    ACADEMY: "Akademik Program",
    LANGUAGE_SCHOOL: "Dil Okulu",
    SUMMER_CAMP: "Yaz Kampı",
    VISA_CONSULTING: "Vize Danışmanlığı",
  };

  const label =
    params.enrollmentLabel?.trim() ||
    `${programNameMap[params.program] || params.program} ${params.termYear}`;

  const newEnrollment = await prisma.$transaction(async (tx) => {
    const created = await tx.student.create({
      data: {
        userId: sourceStudent.userId,
        advisorId: advisor.id,
        program: params.program,
        termYear: Number(params.termYear) || new Date().getFullYear(),
        enrollmentLabel: label,
        isActive: true,
      },
    });

    const p = sourceStudent.profile;
    await tx.studentProfile.create({
      data: {
        studentId: created.id,
        nationalId: p?.nationalId || "",
        dateOfBirth: p?.dateOfBirth || new Date("2002-01-01"),
        placeOfBirth: p?.placeOfBirth || "",
        nationality: p?.nationality || "TR",
        gender: p?.gender || null,
        city: p?.city || null,
        addressLine1: p?.addressLine1 || null,
        emergencyContactName: p?.emergencyContactName || null,
        emergencyContactRelationship: p?.emergencyContactRelationship || null,
        emergencyContactPhone: p?.emergencyContactPhone || null,
        passportNumber: p?.passportNumber || null,
        passportIssueDate: p?.passportIssueDate || null,
        passportExpiry: p?.passportExpiry || null,
        universityName: p?.universityName || null,
        universityGpa: p?.universityGpa || null,
        fieldOfStudy: p?.fieldOfStudy || null,
      },
    });

    if (params.program === "WORK_AND_TRAVEL") {
      await tx.watDetail.create({
        data: {
          studentId: created.id,
          currentStage: "PRE_REGISTRATION",
          ds160Status: "NOT_STARTED",
        },
      });
    } else if (params.program === "LANGUAGE_SCHOOL") {
      await tx.languageDetail.create({
        data: { studentId: created.id },
      });
    } else if (params.program === "ACADEMY") {
      await tx.academyDetail.create({
        data: { studentId: created.id },
      });
    } else if (params.program === "SUMMER_CAMP") {
      await tx.summerCampDetail.create({
        data: { studentId: created.id },
      });
    } else if (params.program === "VISA_CONSULTING") {
      await tx.visaDetail.create({
        data: {
          studentId: created.id,
          visaType: "STUDENT",
          destinationCountry: "ABD",
        },
      });
    }

    await tx.activityLog.create({
      data: {
        studentId: created.id,
        actorId: advisor.id,
        actorName: advisor.fullName,
        actorRole: advisor.role,
        actionType: "PROGRAM_ENROLLED",
        title: `Yeni Program Kaydı Açıldı: ${label}`,
        description: `${sourceStudent.user.fullName} (${sourceStudent.user.email}) için ek program/dönem dosyası oluşturuldu.`,
      },
    });

    return created;
  });

  revalidatePath("/students");
  revalidatePath(`/students/${params.sourceStudentId}`);
  revalidatePath(`/students/${newEnrollment.id}`);
  revalidatePath("/anasayfa");
  revalidatePath("/programim");
  return { success: true, newStudentId: newEnrollment.id };
}
