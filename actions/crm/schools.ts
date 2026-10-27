// actions/crm/schools.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/session";
import type { Currency, Program } from "@prisma/client";

export type SchoolActionResult =
  | { success: true; id?: string }
  | { success: false; error: string };

// ── 1. Partner School Pool CRUD (Section 6 [P1]) ─────────────────────────────

export interface PartnerSchoolInput {
  name: string;
  country: string;
  city?: string;
  programType?: Program;
  programsOffered?: string[];
  quota?: number | string | null;
  commissionRate?: number | string | null;
  commissionFixed?: number | string | null;
  currency?: Currency;
  contactEmail?: string;
  website?: string;
  notes?: string;
}

export async function createPartnerSchool(
  input: PartnerSchoolInput,
): Promise<SchoolActionResult> {
  await requireStaff();

  if (!input.name || !input.country) {
    return { success: false, error: "Okul adı ve ülke zorunludur." };
  }

  const school = await prisma.partnerSchool.create({
    data: {
      name: input.name.trim(),
      country: input.country.trim(),
      city: input.city?.trim() || null,
      programType: input.programType || "ACADEMY",
      programsOffered: input.programsOffered || [],
      quota: input.quota ? Number(input.quota) : null,
      commissionRate: input.commissionRate ? Number(input.commissionRate) : null,
      commissionFixed: input.commissionFixed ? Number(input.commissionFixed) : null,
      currency: input.currency || "EUR",
      contactEmail: input.contactEmail || null,
      website: input.website || null,
      notes: input.notes || null,
      isActive: true,
    },
  });

  revalidatePath("/academy/catalog");
  revalidatePath("/language/catalog");
  revalidatePath("/schools");
  return { success: true, id: school.id };
}

export async function updatePartnerSchool(
  schoolId: string,
  input: Partial<PartnerSchoolInput> & { isActive?: boolean },
): Promise<SchoolActionResult> {
  await requireStaff();

  await prisma.partnerSchool.update({
    where: { id: schoolId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.city !== undefined ? { city: input.city || null } : {}),
      ...(input.programType !== undefined ? { programType: input.programType } : {}),
      ...(input.programsOffered !== undefined ? { programsOffered: input.programsOffered } : {}),
      ...(input.quota !== undefined ? { quota: input.quota ? Number(input.quota) : null } : {}),
      ...(input.commissionRate !== undefined
        ? { commissionRate: input.commissionRate ? Number(input.commissionRate) : null }
        : {}),
      ...(input.commissionFixed !== undefined
        ? { commissionFixed: input.commissionFixed ? Number(input.commissionFixed) : null }
        : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.contactEmail !== undefined ? { contactEmail: input.contactEmail || null } : {}),
      ...(input.website !== undefined ? { website: input.website || null } : {}),
      ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });

  revalidatePath("/academy/catalog");
  revalidatePath("/language/catalog");
  revalidatePath("/schools");
  return { success: true, id: schoolId };
}

export async function deletePartnerSchool(schoolId: string): Promise<SchoolActionResult> {
  await requireStaff();
  await prisma.partnerSchool.delete({ where: { id: schoolId } });
  revalidatePath("/academy/catalog");
  revalidatePath("/language/catalog");
  revalidatePath("/schools");
  return { success: true };
}

// ── 2. Academic Applications CRUD (Section 6 [P1]) ───────────────────────────

export interface AcademicApplicationInput {
  studentId: string;
  partnerSchoolId?: string | null;
  institutionName: string;
  country: string;
  courseName: string;
  degree: string;
  intake: string;
  priority?: number;
  status?: string;
  applicationDeadline?: string | null;
  visaDeadline?: string | null;
  notes?: string | null;
}

export async function createAcademicApplication(
  input: AcademicApplicationInput,
): Promise<SchoolActionResult> {
  await requireStaff();

  if (!input.studentId || !input.institutionName || !input.courseName) {
    return { success: false, error: "Öğrenci, Kurum/Üniversite ve Bölüm adı zorunludur." };
  }

  const count = await prisma.academicApplication.count();
  const appCode = `APP-2026-${String(count + 101).padStart(3, "0")}`;

  const app = await prisma.academicApplication.create({
    data: {
      appCode,
      studentId: input.studentId,
      partnerSchoolId: input.partnerSchoolId || null,
      institutionName: input.institutionName,
      country: input.country || "Almanya",
      courseName: input.courseName,
      degree: input.degree || "M.Sc.",
      intake: input.intake || "Fall 2026",
      priority: Number(input.priority) || 1,
      status: input.status || "PREPARING",
      applicationDeadline: input.applicationDeadline ? new Date(input.applicationDeadline) : null,
      visaDeadline: input.visaDeadline ? new Date(input.visaDeadline) : null,
      notes: input.notes || null,
    },
  });

  revalidatePath(`/students/${input.studentId}`);
  revalidatePath("/academy/students");
  return { success: true, id: app.id };
}

export async function updateAcademicApplication(
  appId: string,
  input: Partial<AcademicApplicationInput>,
): Promise<SchoolActionResult> {
  await requireStaff();

  const existing = await prisma.academicApplication.findUnique({ where: { id: appId } });
  if (!existing) return { success: false, error: "Başvuru bulunamadı." };

  await prisma.academicApplication.update({
    where: { id: appId },
    data: {
      ...(input.institutionName !== undefined ? { institutionName: input.institutionName } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.courseName !== undefined ? { courseName: input.courseName } : {}),
      ...(input.degree !== undefined ? { degree: input.degree } : {}),
      ...(input.intake !== undefined ? { intake: input.intake } : {}),
      ...(input.priority !== undefined ? { priority: Number(input.priority) } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.applicationDeadline !== undefined
        ? {
            applicationDeadline: input.applicationDeadline
              ? new Date(input.applicationDeadline)
              : null,
          }
        : {}),
      ...(input.visaDeadline !== undefined
        ? { visaDeadline: input.visaDeadline ? new Date(input.visaDeadline) : null }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });

  revalidatePath(`/students/${existing.studentId}`);
  return { success: true, id: appId };
}

export async function deleteAcademicApplication(appId: string): Promise<SchoolActionResult> {
  await requireStaff();
  const existing = await prisma.academicApplication.findUnique({ where: { id: appId } });
  await prisma.academicApplication.delete({ where: { id: appId } });
  if (existing) revalidatePath(`/students/${existing.studentId}`);
  return { success: true };
}

// ── 3. Language School 5-Stage Tracker (Section 6 & Section 8) ───────────────

export interface LanguageStageUpdateInput {
  studentId: string;
  agreementsDone?: boolean;
  agreementsDate?: string | null;
  agreementsDocUrl?: string | null;
  agreementsSignedDone?: boolean;
  agreementsSignedDate?: string | null;
  agreementsSignedDocUrl?: string | null;
  grossInvoiceDone?: boolean;
  grossInvoiceDate?: string | null;
  grossInvoiceAmount?: number | string | null;
  grossInvoiceDocUrl?: string | null;
  netInvoiceDone?: boolean;
  netInvoiceDate?: string | null;
  netInvoiceAmount?: number | string | null;
  netInvoiceDocUrl?: string | null;
  letterOfAcceptanceDone?: boolean;
  letterOfAcceptanceDate?: string | null;
  letterOfAcceptanceDocUrl?: string | null;
}

export async function updateLanguageStages(
  input: LanguageStageUpdateInput,
): Promise<SchoolActionResult> {
  const advisor = await requireStaff();

  const detail = await prisma.languageDetail.upsert({
    where: { studentId: input.studentId },
    create: {
      studentId: input.studentId,
      agreementsDone: !!input.agreementsDone,
      agreementsDate: input.agreementsDate ? new Date(input.agreementsDate) : null,
      agreementsDocUrl: input.agreementsDocUrl || null,
      agreementsSignedDone: !!input.agreementsSignedDone,
      agreementsSignedDate: input.agreementsSignedDate ? new Date(input.agreementsSignedDate) : null,
      agreementsSignedDocUrl: input.agreementsSignedDocUrl || null,
      grossInvoiceDone: !!input.grossInvoiceDone,
      grossInvoiceDate: input.grossInvoiceDate ? new Date(input.grossInvoiceDate) : null,
      grossInvoiceAmount: input.grossInvoiceAmount ? Number(input.grossInvoiceAmount) : null,
      grossInvoiceDocUrl: input.grossInvoiceDocUrl || null,
      netInvoiceDone: !!input.netInvoiceDone,
      netInvoiceDate: input.netInvoiceDate ? new Date(input.netInvoiceDate) : null,
      netInvoiceAmount: input.netInvoiceAmount ? Number(input.netInvoiceAmount) : null,
      netInvoiceDocUrl: input.netInvoiceDocUrl || null,
      letterOfAcceptanceDone: !!input.letterOfAcceptanceDone,
      letterOfAcceptanceDate: input.letterOfAcceptanceDate
        ? new Date(input.letterOfAcceptanceDate)
        : null,
      letterOfAcceptanceDocUrl: input.letterOfAcceptanceDocUrl || null,
    },
    update: {
      ...(input.agreementsDone !== undefined ? { agreementsDone: input.agreementsDone } : {}),
      ...(input.agreementsDate !== undefined
        ? { agreementsDate: input.agreementsDate ? new Date(input.agreementsDate) : null }
        : {}),
      ...(input.agreementsDocUrl !== undefined ? { agreementsDocUrl: input.agreementsDocUrl } : {}),
      ...(input.agreementsSignedDone !== undefined
        ? { agreementsSignedDone: input.agreementsSignedDone }
        : {}),
      ...(input.agreementsSignedDate !== undefined
        ? {
            agreementsSignedDate: input.agreementsSignedDate
              ? new Date(input.agreementsSignedDate)
              : null,
          }
        : {}),
      ...(input.agreementsSignedDocUrl !== undefined
        ? { agreementsSignedDocUrl: input.agreementsSignedDocUrl }
        : {}),
      ...(input.grossInvoiceDone !== undefined ? { grossInvoiceDone: input.grossInvoiceDone } : {}),
      ...(input.grossInvoiceDate !== undefined
        ? { grossInvoiceDate: input.grossInvoiceDate ? new Date(input.grossInvoiceDate) : null }
        : {}),
      ...(input.grossInvoiceAmount !== undefined
        ? {
            grossInvoiceAmount: input.grossInvoiceAmount
              ? Number(input.grossInvoiceAmount)
              : null,
          }
        : {}),
      ...(input.grossInvoiceDocUrl !== undefined
        ? { grossInvoiceDocUrl: input.grossInvoiceDocUrl }
        : {}),
      ...(input.netInvoiceDone !== undefined ? { netInvoiceDone: input.netInvoiceDone } : {}),
      ...(input.netInvoiceDate !== undefined
        ? { netInvoiceDate: input.netInvoiceDate ? new Date(input.netInvoiceDate) : null }
        : {}),
      ...(input.netInvoiceAmount !== undefined
        ? { netInvoiceAmount: input.netInvoiceAmount ? Number(input.netInvoiceAmount) : null }
        : {}),
      ...(input.netInvoiceDocUrl !== undefined ? { netInvoiceDocUrl: input.netInvoiceDocUrl } : {}),
      ...(input.letterOfAcceptanceDone !== undefined
        ? { letterOfAcceptanceDone: input.letterOfAcceptanceDone }
        : {}),
      ...(input.letterOfAcceptanceDate !== undefined
        ? {
            letterOfAcceptanceDate: input.letterOfAcceptanceDate
              ? new Date(input.letterOfAcceptanceDate)
              : null,
          }
        : {}),
      ...(input.letterOfAcceptanceDocUrl !== undefined
        ? { letterOfAcceptanceDocUrl: input.letterOfAcceptanceDocUrl }
        : {}),
    },
  });

  // Sync Gross / Net invoice difference as School Commission in Accounting if both exist
  if (detail.grossInvoiceAmount && detail.netInvoiceAmount) {
    const gross = Number(detail.grossInvoiceAmount);
    const net = Number(detail.netInvoiceAmount);
    const commission = Math.max(0, gross - net);
    if (commission > 0) {
      await prisma.accountingEntry.create({
        data: {
          type: "COMMISSION",
          category: "SCHOOL_COMMISSION",
          studentId: input.studentId,
          partnerSchoolId: detail.partnerSchoolId || null,
          advisorId: advisor.id,
          description: `Dil Okulu Gross/Net Fatura Komisyonu (${detail.schoolName || "Dil Okulu"})`,
          amount: commission,
          grossAmount: gross,
          netAmount: net,
          weeksSold: detail.weeksDuration || null,
          currency: "EUR",
          isPaid: true,
        },
      });
    }
  }

  revalidatePath(`/students/${input.studentId}`);
  revalidatePath("/accounting");
  return { success: true, id: detail.id };
}
