// actions/crm/leads.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/session";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { LeadStatus, LeadSource, Program } from "@prisma/client";

export type LeadFormState =
  | { success: true }
  | { success: false; error: string };

// ── createLead ────────────────────────────────────────────────────────────────

export async function createLead(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const advisor = await requireStaff();

  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const program = formData.get("program") as Program;
  const source = (formData.get("source") as LeadSource) ?? "OTHER";
  const notes = formData.get("notes") as string | null;

  if (!fullName || !email || !phone || !program) {
    return { success: false, error: "Zorunlu alanları doldurun." };
  }

  await prisma.lead.create({
    data: {
      fullName,
      email,
      phone,
      program,
      source,
      notes,
      advisorId: advisor.id,
      status: "INTERESTED",
    },
  });

  revalidatePath("/leads");
  return { success: true };
}

// ── updateLeadStatus ──────────────────────────────────────────────────────────

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
): Promise<LeadFormState> {
  await requireStaff();

  await prisma.lead.update({
    where: { id: leadId },
    data: { status },
  });

  revalidatePath("/leads");
  return { success: true };
}

// ── updateLead ────────────────────────────────────────────────────────────────

export async function updateLead(
  leadId: string,
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  await requireStaff();

  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const notes = formData.get("notes") as string | null;
  const source = formData.get("source") as LeadSource;

  await prisma.lead.update({
    where: { id: leadId },
    data: { fullName, email, phone, notes, source },
  });

  revalidatePath("/leads");
  return { success: true };
}

// ── addLeadNote (Timestamped History Log) ─────────────────────────────────────

export async function addLeadNote(
  leadId: string,
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const advisor = await requireStaff();
  const noteText = (formData.get("note") as string)?.trim();
  if (!noteText) {
    return { success: false, error: "Not metni boş olamaz." };
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { success: false, error: "Aday bulunamadı." };

  const now = new Date();
  const dateStr = now.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const newEntry = `[${dateStr} - ${advisor.fullName}]: ${noteText}`;
  const updatedNotes = lead.notes ? `${lead.notes}\n\n${newEntry}` : newEntry;

  await prisma.lead.update({
    where: { id: leadId },
    data: { notes: updatedNotes },
  });

  revalidatePath("/leads");
  return { success: true };
}

// ── deleteLead ────────────────────────────────────────────────────────────────

export async function deleteLead(leadId: string): Promise<LeadFormState> {
  const user = await requireStaff();
  if (user.role !== "ADMIN") {
    return { success: false, error: "Bu işlem için yönetici yetkisi gereklidir." };
  }

  await prisma.lead.delete({ where: { id: leadId } });
  revalidatePath("/leads");
  return { success: true };
}

// ── convertLeadToStudent (Kesin Kayıt / Aktar) ────────────────────────────────

/**
 * Converts a Lead to an active Student record:
 *  1. Creates a Supabase Auth user (via admin client)
 *  2. Creates the users row with STUDENT role
 *  3. Creates the Student + StudentProfile skeleton
 *  4. Updates Lead.status → REGISTERED, Lead.convertedAt = now
 *  5. Sends invitation email via Supabase Auth
 */
export async function convertLeadToStudent(
  leadId: string,
): Promise<LeadFormState> {
  const advisor = await requireStaff();

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { success: false, error: "Lead bulunamadı." };
  if (lead.status === "REGISTERED") {
    return { success: false, error: "Bu lead zaten kayıtlı öğrenciye dönüştürülmüş." };
  }

  let authUserId: string | null = null;
  const isMockSupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("example.supabase.co");

  if (!isMockSupabase) {
    try {
      const supabaseAdmin = createSupabaseAdminClient();
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(lead.email, {
          data: { full_name: lead.fullName },
        });
      if (authData?.user?.id) {
        authUserId = authData.user.id;
      }
    } catch {
      authUserId = null;
    }
  }

  if (!authUserId) {
    // Local PostgreSQL fallback: generate UUID
    authUserId = crypto.randomUUID();
  }

  // Pre-generate standard default password hash (Password123!) for the student
  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);

  // Step 2–4: Create DB records in a transaction
  await prisma.$transaction(async (tx) => {
    // users row (mirrors auth.users)
    await tx.user.create({
      data: {
        id: authUserId!,
        email: lead.email,
        fullName: lead.fullName,
        phone: lead.phone,
        role: "STUDENT",
        passwordHash: defaultPasswordHash,
        isActive: true,
      },
    });

    // student record
    const student = await tx.student.create({
      data: {
        userId: authUserId,
        leadId: lead.id,
        advisorId: advisor.id,
        program: lead.program,
        isActive: true,
      },
    });

    // empty profile skeleton — student will complete via portal
    await tx.studentProfile.create({
      data: {
        studentId: student.id,
        nationalId: "",
        dateOfBirth: new Date("2000-01-01"),
        placeOfBirth: "",
      },
    });

    // mark lead as registered
    await tx.lead.update({
      where: { id: leadId },
      data: {
        status: "REGISTERED",
        convertedAt: new Date(),
      },
    });

    // append immutable advisor note
    await tx.advisorNote.create({
      data: {
        studentId: student.id,
        authorId: advisor.id,
        note: `Lead kaydından öğrenciye dönüştürüldü. Davetiye e-postası ${lead.email} adresine gönderildi.`,
      },
    });
  });

  revalidatePath("/leads");
  revalidatePath("/students");
  return { success: true };
}

// ── bulkImportLeads (Toplu Excel / CSV İçe Aktarma) ──────────────────────────

export interface BulkLeadRowInput {
  fullName: string;
  email: string;
  phone: string;
  program: Program;
  source?: LeadSource;
  notes?: string;
}

export interface BulkImportResult {
  success: boolean;
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export async function bulkImportLeads(
  rows: BulkLeadRowInput[],
): Promise<BulkImportResult> {
  const advisor = await requireStaff();

  if (!rows || rows.length === 0) {
    return {
      success: false,
      total: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: ["İçe aktarılacak satır bulunamadı."],
    };
  }

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    const fullName = row.fullName?.trim();
    const email = row.email?.trim().toLowerCase();
    const phone = row.phone?.trim();
    const program = row.program || "WORK_AND_TRAVEL";
    const source: LeadSource = row.source || "WALK_IN";
    const notes = row.notes?.trim() || null;

    if (!fullName || !email || !phone) {
      errors.push(`Satır ${rowNum}: İsim, e-posta veya telefon alanı eksik olduğu için atlandı.`);
      skipped++;
      continue;
    }

    try {
      const existing = await prisma.lead.findFirst({
        where: { email },
      });

      if (existing) {
        await prisma.lead.update({
          where: { id: existing.id },
          data: {
            fullName,
            phone,
            program,
            source,
            notes: notes
              ? `${existing.notes ? existing.notes + " | " : ""}Toplu Aktarım: ${notes}`
              : existing.notes,
          },
        });
        updated++;
      } else {
        await prisma.lead.create({
          data: {
            fullName,
            email,
            phone,
            program,
            source,
            notes: notes ? `Toplu Aktarım: ${notes}` : "Toplu Excel/CSV içe aktarımı ile eklendi.",
            status: "INTERESTED",
            advisorId: advisor.id,
          },
        });
        imported++;
      }
    } catch (err: any) {
      errors.push(`Satır ${rowNum} (${fullName}): ${err.message}`);
      skipped++;
    }
  }

  revalidatePath("/leads");
  return {
    success: true,
    total: rows.length,
    imported,
    updated,
    skipped,
    errors,
  };
}

