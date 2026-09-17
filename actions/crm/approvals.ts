// actions/crm/approvals.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/session";
import { triggerReviewDecisionNotification } from "@/lib/notifications/notificationEngine";

export type ApprovalCommitResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Commits a staged PendingApproval into live production tables
 */
export async function commitApprovedChange(
  approvalId: string
): Promise<ApprovalCommitResult> {
  const advisor = await requireStaff();

  const approval = await prisma.pendingApproval.findUnique({
    where: { id: approvalId },
    include: {
      student: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!approval) {
    return { success: false, error: "Onay kaydı bulunamadı." };
  }

  if (approval.status !== "PENDING") {
    return { success: false, error: "Bu talep daha önce değerlendirilmiş." };
  }

  const newData = approval.newData as Record<string, unknown>;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Commit based on entityType
      if (approval.entityType === "STUDENT_PROFILE") {
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
      } else if (approval.entityType === "WAT_DETAIL") {
        await tx.watDetail.upsert({
          where: { studentId: approval.studentId },
          update: newData,
          create: {
            studentId: approval.studentId,
            ...newData,
          },
        });
      } else if (approval.entityType === "DOCUMENT" && approval.entityId) {
        await tx.document.update({
          where: { id: approval.entityId },
          data: {
            verificationStatus: "APPROVED",
            rejectionReason: null,
          },
        });
      }

      // 2. Mark approval as APPROVED
      await tx.pendingApproval.update({
        where: { id: approvalId },
        data: {
          status: "APPROVED",
          reviewedById: advisor.id,
          reviewedAt: new Date(),
        },
      });

      // 3. Log into AdvisorNote
      await tx.advisorNote.create({
        data: {
          studentId: approval.studentId,
          authorId: advisor.id,
          note: `Öğrencinin "${approval.entityType}" güncelleme talebi onaylandı ve sisteme işlendi.`,
        },
      });
    });

    // 4. Trigger automated notification
    if (approval.student?.user) {
      await triggerReviewDecisionNotification({
        studentName: approval.student.user.fullName,
        email: approval.student.user.email,
        phone: approval.student.user.phone || undefined,
        isApproved: true,
        entityName:
          approval.entityType === "STUDENT_PROFILE"
            ? "Profil Bilgileri"
            : approval.entityType === "DOCUMENT"
            ? "Yüklenen Belge"
            : approval.entityType,
      });
    }

    revalidatePath("/approvals");
    revalidatePath("/students");
    revalidatePath(`/students/${approval.studentId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Approval commit error:", err);
    return { success: false, error: err.message || "İşlem sırasında hata oluştu." };
  }
}

/**
 * Rejects or requests revision on a student change request
 */
export async function rejectStudentChange(
  approvalId: string,
  rejectionReason: string
): Promise<ApprovalCommitResult> {
  const advisor = await requireStaff();

  if (!rejectionReason || rejectionReason.trim().length === 0) {
    return { success: false, error: "Lütfen öğrenciye iletilecek revize nedenini belirtiniz." };
  }

  const approval = await prisma.pendingApproval.findUnique({
    where: { id: approvalId },
    include: {
      student: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!approval) {
    return { success: false, error: "Onay kaydı bulunamadı." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // If it's a document, mark Document table as REVISION_REQUESTED
      if (approval.entityType === "DOCUMENT" && approval.entityId) {
        await tx.document.update({
          where: { id: approval.entityId },
          data: {
            verificationStatus: "REVISION_REQUESTED",
            rejectionReason,
          },
        });
      }

      // Mark PendingApproval as REVISION_REQUESTED
      await tx.pendingApproval.update({
        where: { id: approvalId },
        data: {
          status: "REVISION_REQUESTED",
          rejectionReason,
          reviewedById: advisor.id,
          reviewedAt: new Date(),
        },
      });

      // Log into AdvisorNote
      await tx.advisorNote.create({
        data: {
          studentId: approval.studentId,
          authorId: advisor.id,
          note: `Öğrencinin "${approval.entityType}" talebine revizyon istendi. Gerekçe: "${rejectionReason}"`,
        },
      });
    });

    // Trigger automated notification
    if (approval.student?.user) {
      await triggerReviewDecisionNotification({
        studentName: approval.student.user.fullName,
        email: approval.student.user.email,
        phone: approval.student.user.phone || undefined,
        isApproved: false,
        rejectionReason,
        entityName:
          approval.entityType === "STUDENT_PROFILE"
            ? "Profil Bilgileri"
            : approval.entityType === "DOCUMENT"
            ? "Yüklenen Belge"
            : approval.entityType,
      });
    }

    revalidatePath("/approvals");
    revalidatePath("/students");
    return { success: true };
  } catch (err: any) {
    console.error("Revision request error:", err);
    return { success: false, error: err.message || "İşlem sırasında hata oluştu." };
  }
}
