// actions/crm/accounting.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff, requireAccounting } from "@/lib/auth/session";
import type { Currency } from "@prisma/client";

export type AccountingActionResult =
  | { success: true; id?: string }
  | { success: false; error: string };

// ── 1. Create Accounting Entry (Income / Expense / Commission - Section 8) ───

export interface AccountingEntryInput {
  type: "INCOME" | "EXPENSE" | "COMMISSION";
  category: string;
  studentId?: string | null;
  partnerSchoolId?: string | null;
  advisorId?: string | null;
  description: string;
  amount: number | string;
  currency?: Currency;
  paymentMethod?: string;
  weeksSold?: number | string | null;
  grossAmount?: number | string | null;
  netAmount?: number | string | null;
  transactionDate?: string;
  dueDate?: string | null;
  isPaid?: boolean;
  notes?: string | null;
}

export async function createAccountingEntry(
  input: AccountingEntryInput,
): Promise<AccountingActionResult> {
  const user = await requireAccounting();

  if (!input.description || !input.amount) {
    return { success: false, error: "Açıklama ve tutar zorunludur." };
  }

  const entry = await prisma.accountingEntry.create({
    data: {
      type: input.type || "INCOME",
      category: input.category || "TUITION",
      studentId: input.studentId || null,
      partnerSchoolId: input.partnerSchoolId || null,
      advisorId: input.advisorId || user.id,
      description: input.description,
      amount: Number(input.amount),
      currency: input.currency || "USD",
      paymentMethod: input.paymentMethod || "BANK_TRANSFER",
      weeksSold: input.weeksSold ? Number(input.weeksSold) : null,
      grossAmount: input.grossAmount ? Number(input.grossAmount) : null,
      netAmount: input.netAmount ? Number(input.netAmount) : null,
      transactionDate: input.transactionDate ? new Date(input.transactionDate) : new Date(),
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      isPaid: input.isPaid ?? true,
      notes: input.notes || null,
    },
  });

  revalidatePath("/accounting");
  if (input.studentId) revalidatePath(`/students/${input.studentId}`);
  return { success: true, id: entry.id };
}

export async function deleteAccountingEntry(
  entryId: string,
): Promise<AccountingActionResult> {
  await requireAccounting();
  await prisma.accountingEntry.delete({ where: { id: entryId } });
  revalidatePath("/accounting");
  return { success: true };
}

// ── 2. WAT Accommodation Sold → Auto-Reflect Commission to Accounting (§4 & §8)

export async function recordWatAccommodationSale(
  studentId: string,
  accommodationSold: boolean,
  commissionAmount: number | string,
  notes?: string,
): Promise<AccountingActionResult> {
  const user = await requireStaff();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true },
  });
  if (!student) return { success: false, error: "Öğrenci bulunamadı." };

  const commValue = Number(commissionAmount) || 0;

  await prisma.$transaction(async (tx) => {
    await tx.watDetail.upsert({
      where: { studentId },
      create: {
        studentId,
        accommodationSold,
        accommodationCommission: commValue,
      },
      update: {
        accommodationSold,
        accommodationCommission: commValue,
      },
    });

    if (accommodationSold && commValue > 0) {
      await tx.accountingEntry.create({
        data: {
          type: "COMMISSION",
          category: "ACCOMMODATION_COMMISSION",
          studentId,
          advisorId: student.advisorId || user.id,
          description: `WAT Konaklama Satış Komisyonu — ${student.user.fullName}`,
          amount: commValue,
          currency: "USD",
          paymentMethod: "BANK_TRANSFER",
          isPaid: true,
          notes: notes || "Öğrenci konaklama satışından otomatik yansıtıldı.",
        },
      });
    }
  });

  revalidatePath(`/students/${studentId}`);
  revalidatePath("/accounting");
  return { success: true };
}
