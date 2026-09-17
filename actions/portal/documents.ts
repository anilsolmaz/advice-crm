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
 * Registers an uploaded document in the database after the client uploads to Supabase Storage.
 * Creates an entry in `documents` with status PENDING and records an entry in `pending_approvals`.
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
    select: { id: true, userId: true },
  });

  if (!student || student.userId !== user.id) {
    return { success: false, error: "Yetkisiz işlem: Bu profile erişim yetkiniz yok." };
  }

  const parsedExpiry = expiryDate ? new Date(expiryDate) : null;

  // Use a transaction to create the document and log into pending_approvals
  const doc = await prisma.$transaction(async (tx) => {
    const newDoc = await tx.document.create({
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

    return newDoc;
  });

  revalidatePath("/belgelerim");
  revalidatePath("/bildirimler");
  revalidatePath("/anasayfa");

  return { success: true, documentId: doc.id };
}
