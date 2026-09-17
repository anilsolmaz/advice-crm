// actions/portal/approvals.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth/session";
import { diffJson } from "@/lib/utils/diff";
import type { ApprovalEntityType } from "@prisma/client";

export type PortalApprovalActionState =
  | { success: true; approvalId: string }
  | { success: false; error: string };

/**
 * Stages a change into the `pending_approvals` table.
 * Students CANNOT overwrite live data directly; their changes must be approved by an advisor.
 */
export async function submitProfileChangeForApproval(
  studentId: string,
  entityType: ApprovalEntityType,
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown>,
): Promise<PortalApprovalActionState> {
  const user = await requireStudent();

  // Verify that the student record belongs to the authenticated user
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, userId: true },
  });

  if (!student || student.userId !== user.id) {
    return { success: false, error: "Yetkisiz işlem: Bu profile erişim yetkiniz yok." };
  }

  // Calculate changed fields
  const { changedFields } = diffJson(oldData, newData);

  if (changedFields.length === 0) {
    return { success: false, error: "Herhangi bir değişiklik tespit edilmedi." };
  }

  // Check if there is already a pending approval for this entity to prevent duplicate noise
  const existingPending = await prisma.pendingApproval.findFirst({
    where: {
      studentId: student.id,
      entityType,
      status: "PENDING",
    },
  });

  if (existingPending) {
    // Update existing pending approval with merged new data
    const mergedNew = {
      ...(existingPending.newData as Record<string, unknown>),
      ...newData,
    };
    const updated = await prisma.pendingApproval.update({
      where: { id: existingPending.id },
      data: {
        newData: mergedNew as any,
        createdAt: new Date(), // bump timestamp
      },
    });

    revalidatePath("/profilim");
    revalidatePath("/bildirimler");
    revalidatePath("/anasayfa");
    return { success: true, approvalId: updated.id };
  }

  // Create new pending approval record
  const created = await prisma.pendingApproval.create({
    data: {
      studentId: student.id,
      entityType,
      oldData: (oldData as any) ?? undefined,
      newData: newData as any,
      status: "PENDING",
    },
  });

  revalidatePath("/profilim");
  revalidatePath("/bildirimler");
  revalidatePath("/anasayfa");
  return { success: true, approvalId: created.id };
}
