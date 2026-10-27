// actions/portal/documents.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth/session";
import type { DocumentType } from "@prisma/client";

export type PortalDocumentActionState =
  | { success: true; documentId: string }
  | { success: false; error: string };

/**
 * Registers an uploaded document in the database after the client uploads via /api/upload.
 * Creates/updates an entry in `documents` with status PENDING, records an entry in `pending_approvals`,
 * and notifies the assigned advisor.
 */
export async function registerUploadedDocument(
  studentId: string,
  type: DocumentType,
  fileName: string,
  fileUrl: string,
  fileSizeBytes?: number,
  mimeType?: string,
  expiryDate?: string,
  notes?: string,
): Promise<PortalDocumentActionState> {
  const user = await requireStudent();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, userId: true, advisorId: true },
  });

  if (!student || student.userId !== user.id) {
    return {
      success: false,
      error: "Yetkisiz işlem: Bu profile erişim yetkiniz yok.",
    };
  }

  const parsedExpiry = expiryDate ? new Date(expiryDate) : null;

  const doc = await prisma.$transaction(async (tx) => {
    // Check if student already has a document of this type; if so, update it to PENDING
    const existing = await tx.document.findFirst({
      where: { studentId: student.id, type },
      orderBy: { createdAt: "desc" },
    });

    const newDoc = existing
      ? await tx.document.update({
          where: { id: existing.id },
          data: {
            fileName,
            fileUrl,
            fileSizeBytes: fileSizeBytes ?? null,
            mimeType: mimeType ?? null,
            verificationStatus: "PENDING",
            rejectionReason: null,
            uploadedByStudent: true,
            expiryDate: parsedExpiry,
            notes: notes ?? null,
          },
        })
      : await tx.document.create({
          data: {
            studentId: student.id,
            type,
            fileName,
            fileUrl,
            fileSizeBytes: fileSizeBytes ?? null,
            mimeType: mimeType ?? null,
            verificationStatus: "PENDING",
            uploadedByStudent: true,
            expiryDate: parsedExpiry,
            notes: notes ?? null,
          },
        });

    await tx.pendingApproval.create({
      data: {
        studentId: student.id,
        entityType: "DOCUMENT",
        entityId: newDoc.id,
        oldData: undefined,
        newData: {
          documentId: newDoc.id,
          type,
          fileName,
          fileUrl,
          fileSizeBytes,
        },
        status: "PENDING",
      },
    });

    if (student.advisorId) {
      await tx.notification.create({
        data: {
          userId: student.advisorId,
          type: "DOCUMENT",
          title: `📄 ${user.fullName} Evrak Yükledi`,
          message: `${type} (${fileName}) belgesi onayınızı bekliyor.`,
          linkUrl: `/students/${student.id}`,
        },
      });
    }

    return newDoc;
  });

  revalidatePath("/belgelerim");
  revalidatePath("/bildirimler");
  revalidatePath("/anasayfa");
  revalidatePath("/programim");
  revalidatePath(`/students/${student.id}`);
  revalidatePath("/approvals");

  return { success: true, documentId: doc.id };
}

/**
 * Allows a student to submit a bank transfer receipt (Dekont) or report an in-office cash payment (Elden Ödeme)
 * for a specific installment.
 */
export async function submitStudentInstallmentProof(params: {
  installmentId: string;
  paymentMethod: "BANK_TRANSFER" | "CASH_ELDEN";
  receiptUrl?: string;
  fileName?: string;
  notes?: string;
}) {
  const user = await requireStudent();

  const installment = await prisma.installment.findUnique({
    where: { id: params.installmentId },
    include: {
      payment: {
        include: { student: true },
      },
    },
  });

  if (!installment || installment.payment.student.userId !== user.id) {
    return { success: false, error: "Taksit kaydı bulunamadı." };
  }

  const student = installment.payment.student;
  const methodLabel =
    params.paymentMethod === "CASH_ELDEN"
      ? "Elden / Ofiste Ödeme Bildirimi"
      : "Havale / EFT Dekontu";

  await prisma.$transaction(async (tx) => {
    await tx.installment.update({
      where: { id: installment.id },
      data: {
        paymentMethod: params.paymentMethod,
        receiptUrl: params.receiptUrl || installment.receiptUrl || "ELDEN_BILDIRIM",
        notes: params.notes
          ? `[Öğrenci Bildirimi - ${methodLabel}]: ${params.notes}`
          : `[Öğrenci Bildirimi]: ${methodLabel} iletildi, onay bekleniyor.`,
      },
    });

    if (params.receiptUrl && params.fileName) {
      await tx.document.create({
        data: {
          studentId: student.id,
          type: "PAYMENT_RECEIPT",
          fileName: params.fileName,
          fileUrl: params.receiptUrl,
          verificationStatus: "PENDING",
          uploadedByStudent: true,
          notes: `${installment.sequence}. Taksit (${installment.amount} ${installment.currency}) - ${methodLabel}`,
        },
      });
    }

    if (student.advisorId) {
      await tx.notification.create({
        data: {
          userId: student.advisorId,
          type: "PAYMENT_OVERDUE",
          title: `💳 ${user.fullName} Ödeme Bildirimi / Dekont İletti`,
          message: `${installment.sequence}. Taksit (${installment.amount} ${installment.currency}) için ${methodLabel} gönderildi.`,
          linkUrl: `/students/${student.id}`,
        },
      });
    }
  });

  revalidatePath("/odemelerim");
  revalidatePath("/anasayfa");
  revalidatePath("/programim");
  revalidatePath(`/students/${student.id}`);
  revalidatePath("/accounting");

  return { success: true };
}
