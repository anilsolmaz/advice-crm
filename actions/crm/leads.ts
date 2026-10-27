// actions/crm/leads.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/session";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { LeadStatus, LeadSource, Program } from "@prisma/client";

export type LeadFormState =
  | {
      success: true;
      duplicateWarning?: string;
      updatedNotes?: string | null;
      newFollowUpAt?: string;
    }
  | { success: false; error: string; isDuplicate?: boolean };

const SOURCE_LABELS_TR: Record<string, string> = {
  META_ADS: "Meta Lead Ads",
  GOOGLE_ADS: "Google Ads",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  WHATSAPP: "WhatsApp",
  WEBSITE: "Web Sitesi",
  REFERRAL: "Referans",
  OTHER: "Manuel Kayıt",
};

function formatTrDateTime(date: Date = new Date()): string {
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── createLead (with Duplicate Lead Check - Section 2 & 10) ───────────────────

export async function createLead(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const advisor = await requireStaff();

  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim();
  const program = formData.get("program") as Program;
  const source = ((formData.get("source") as LeadSource) || "WEBSITE") as LeadSource;
  const sponsor = (formData.get("sponsor") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim() || null;
  const gender = (formData.get("gender") as string)?.trim() || null;
  const avatarUrl = (formData.get("avatarUrl") as string)?.trim() || null;
  const visaStatus = (formData.get("visaStatus") as string)?.trim() || null;
  const followUpAtRaw = formData.get("followUpAt") as string | null;
  const notes = (formData.get("notes") as string)?.trim() || null;
  const forceCreate = formData.get("forceCreate") === "true";

  if (!fullName || !email || !phone || !program) {
    return { success: false, error: "İsim, e-posta, telefon ve program zorunludur." };
  }

  // Duplicate check by email or normalized phone
  const normalizedPhone = phone.replace(/\s+/g, "");
  const existingLead = await prisma.lead.findFirst({
    where: {
      OR: [
        { email },
        { phone: { contains: normalizedPhone.slice(-10) } },
      ],
    },
  });

  if (existingLead && !forceCreate) {
    return {
      success: false,
      isDuplicate: true,
      error: `Mükerrer Kayıt Uyarısı: "${existingLead.fullName}" (${existingLead.phone} / ${existingLead.email}) zaten sistemde kayıtlı!`,
    };
  }

  const assignedAdvisorId = (formData.get("advisorId") as string) || advisor.id;
  const sourceLabel = SOURCE_LABELS_TR[source] || source;
  const formattedNotes = notes
    ? `[${formatTrDateTime()} · ${advisor.fullName} · İlk Kayıt (${sourceLabel})]: ${notes}`
    : null;

  await prisma.lead.create({
    data: {
      fullName,
      email,
      phone,
      program,
      source,
      sponsor,
      city,
      gender,
      avatarUrl,
      visaStatus,
      followUpAt: followUpAtRaw ? new Date(followUpAtRaw) : null,
      notes: formattedNotes,
      advisorId: assignedAdvisorId,
      status: "INTERESTED",
    },
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
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
  revalidatePath("/dashboard");
  return { success: true };
}

// ── updateLead (Full Lead Edit - Section 2 [P1]) ──────────────────────────────

export async function updateLead(
  leadId: string,
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const advisor = await requireStaff();

  const existingLead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!existingLead) {
    return { success: false, error: "Aday bulunamadı." };
  }

  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim();
  const newNote = (formData.get("newNote") as string)?.trim();
  const noteTitle =
    (formData.get("noteTitle") as string)?.trim() || "Görüşme Detayı";
  const source = formData.get("source") as LeadSource | null;
  const status = formData.get("status") as LeadStatus | null;
  const program = formData.get("program") as Program | null;
  const sponsor = formData.get("sponsor") as string | null;
  const city = formData.get("city") as string | null;
  const gender = formData.get("gender") as string | null;
  const avatarUrl = formData.get("avatarUrl") as string | null;
  const visaStatus = formData.get("visaStatus") as string | null;
  const advisorId = formData.get("advisorId") as string | null;
  const followUpAtRaw = formData.get("followUpAt") as string | null;

  let updatedNotes = existingLead.notes;
  if (newNote) {
    const newEntry = `[${formatTrDateTime()} · ${advisor.fullName} · ${noteTitle}]: ${newNote}`;
    updatedNotes = existingLead.notes
      ? `${existingLead.notes}\n\n${newEntry}`
      : newEntry;
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      ...(fullName ? { fullName } : {}),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      notes: updatedNotes,
      ...(source ? { source } : {}),
      ...(status ? { status } : {}),
      ...(program ? { program } : {}),
      sponsor: sponsor !== undefined ? sponsor || null : undefined,
      city: city !== undefined ? city || null : undefined,
      gender: gender !== undefined ? gender || null : undefined,
      avatarUrl: avatarUrl !== undefined ? avatarUrl || null : undefined,
      visaStatus: visaStatus !== undefined ? visaStatus || null : undefined,
      ...(advisorId ? { advisorId } : {}),
      followUpAt:
        followUpAtRaw !== null
          ? followUpAtRaw
            ? new Date(followUpAtRaw)
            : null
          : undefined,
    },
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { success: true, updatedNotes };
}

// ── appendLeadNoteCard (Quick Note Card Entry) ───────────────────────────────

export async function appendLeadNoteCard(
  leadId: string,
  noteTitle: string,
  noteText: string,
): Promise<LeadFormState> {
  const advisor = await requireStaff();
  const trimmed = noteText.trim();
  if (!trimmed) {
    return { success: false, error: "Not metni boş olamaz." };
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { success: false, error: "Aday bulunamadı." };

  const cleanTitle = noteTitle.trim() || "Görüşme Notu";
  const newEntry = `[${formatTrDateTime()} · ${advisor.fullName} · ${cleanTitle}]: ${trimmed}`;
  const updatedNotes = lead.notes ? `${lead.notes}\n\n${newEntry}` : newEntry;

  await prisma.lead.update({
    where: { id: leadId },
    data: { notes: updatedNotes },
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { success: true, updatedNotes };
}

// ── logLeadCommunicationEvent (Sleek Single-Line Log Entry) ───────────────────

export async function logLeadCommunicationEvent(
  leadId: string,
  eventLabel: string,
): Promise<LeadFormState> {
  const advisor = await requireStaff();
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { success: false, error: "Aday bulunamadı." };

  const newEntry = `[${formatTrDateTime()} · ${advisor.fullName} · LOG]: ${eventLabel.trim()}`;
  const updatedNotes = lead.notes ? `${lead.notes}\n\n${newEntry}` : newEntry;

  await prisma.lead.update({
    where: { id: leadId },
    data: { notes: updatedNotes },
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { success: true, updatedNotes };
}


export async function logLeadCall(
  leadId: string,
  outcome: string,
  noteText: string,
  nextFollowUpAt?: string | null,
  newStatus?: LeadStatus,
): Promise<LeadFormState> {
  const advisor = await requireStaff();

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { success: false, error: "Aday bulunamadı." };

  const now = new Date();
  const dateStr = formatTrDateTime(now);

  const OUTCOME_LABELS: Record<string, string> = {
    REACHED: "Ulaşıldı / Görüşüldü",
    UNREACHABLE: "Ulaşılamadı",
    BUSY: "Meşgul / Tekrar Aranacak",
    INTERESTED: "İlgileniyor",
    UNINTERESTED: "İlgilenmiyor",
    REGISTERED: "Kayıt Oldu",
  };

  const outcomeLabel = OUTCOME_LABELS[outcome] || outcome;
  const logLine = `[${dateStr} · ${advisor.fullName} · ${outcomeLabel}]: ${noteText || "Arama kaydı girildi."}`;
  const updatedNotes = lead.notes ? `${lead.notes}\n\n${logLine}` : logLine;

  const followUpDate = nextFollowUpAt ? new Date(nextFollowUpAt) : null;

  await prisma.$transaction([
    prisma.leadCallLog.create({
      data: {
        leadId,
        advisorId: advisor.id,
        outcome,
        notes: noteText || null,
        nextFollowUpAt: followUpDate,
      },
    }),
    prisma.lead.update({
      where: { id: leadId },
      data: {
        lastContactedAt: now,
        lastCallOutcome: outcome,
        callCount: { increment: 1 },
        followUpAt: followUpDate,
        notes: updatedNotes,
        ...(newStatus ? { status: newStatus } : {}),
      },
    }),
  ]);

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { success: true, updatedNotes };
}

// ── postponeLeadFollowUp (1-Click Follow-Up Postpone Button) ──────────────────

export async function postponeLeadFollowUp(
  leadId: string,
  daysToAdd: number,
): Promise<LeadFormState> {
  await requireStaff();

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  nextDate.setHours(10, 0, 0, 0);

  await prisma.lead.update({
    where: { id: leadId },
    data: { followUpAt: nextDate },
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { success: true, newFollowUpAt: nextDate.toISOString() };
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

  const newEntry = `[${formatTrDateTime()} · ${advisor.fullName} · Hızlı Not]: ${noteText}`;
  const updatedNotes = lead.notes ? `${lead.notes}\n\n${newEntry}` : newEntry;

  await prisma.lead.update({
    where: { id: leadId },
    data: { notes: updatedNotes },
  });

  revalidatePath("/leads");
  return { success: true, updatedNotes };
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

export async function convertLeadToStudent(
  leadId: string,
): Promise<LeadFormState> {
  const advisor = await requireStaff();

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { success: false, error: "Lead bulunamadı." };
  if (lead.status === "REGISTERED") {
    return { success: false, error: "Bu lead zaten kayıtlı öğrenciye dönüştürülmüş." };
  }

  const normalizedEmail = lead.email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  let authUserId: string = existingUser?.id || "";

  if (!existingUser) {
    const isMockSupabase =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes("example.supabase.co");

    if (!isMockSupabase) {
      try {
        const supabaseAdmin = createSupabaseAdminClient();
        const { data: authData } =
          await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail, {
            data: { full_name: lead.fullName },
          });
        if (authData?.user?.id) {
          authUserId = authData.user.id;
        }
      } catch {
        authUserId = "";
      }
    }

    if (!authUserId) {
      authUserId = crypto.randomUUID();
    }
  }

  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);
  const currentYear = new Date().getFullYear();

  const programNameMap: Record<Program, string> = {
    WORK_AND_TRAVEL: "Work & Travel",
    ACADEMY: "Akademik Program",
    LANGUAGE_SCHOOL: "Dil Okulu",
    SUMMER_CAMP: "Yaz Kampı",
    VISA_CONSULTING: "Vize Danışmanlığı",
  };

  await prisma.$transaction(async (tx) => {
    if (!existingUser) {
      await tx.user.create({
        data: {
          id: authUserId,
          email: normalizedEmail,
          fullName: lead.fullName,
          phone: lead.phone,
          role: "STUDENT",
          passwordHash: defaultPasswordHash,
          isActive: true,
        },
      });
    }

    // Check if student had a previous profile we can clone personal info from
    const previousEnrollment = existingUser
      ? await tx.student.findFirst({
          where: { userId: authUserId },
          include: { profile: true },
          orderBy: { createdAt: "desc" },
        })
      : null;

    const student = await tx.student.create({
      data: {
        userId: authUserId,
        leadId: lead.id,
        advisorId: lead.advisorId || advisor.id,
        program: lead.program,
        termYear: currentYear,
        enrollmentLabel: `${programNameMap[lead.program]} ${currentYear}`,
        isActive: true,
      },
    });

    const prevProf = previousEnrollment?.profile;
    await tx.studentProfile.create({
      data: {
        studentId: student.id,
        nationalId: prevProf?.nationalId || "",
        dateOfBirth: prevProf?.dateOfBirth || new Date("2002-01-01"),
        placeOfBirth: prevProf?.placeOfBirth || lead.city || "",
        city: prevProf?.city || lead.city || null,
        passportNumber: prevProf?.passportNumber || null,
        passportExpiry: prevProf?.passportExpiry || null,
        universityName: prevProf?.universityName || null,
        fieldOfStudy: prevProf?.fieldOfStudy || null,
        emergencyContactName: prevProf?.emergencyContactName || null,
        emergencyContactPhone: prevProf?.emergencyContactPhone || null,
      },
    });

    if (lead.program === "WORK_AND_TRAVEL") {
      await tx.watDetail.create({
        data: {
          studentId: student.id,
          sponsorName: lead.sponsor || null,
          currentStage: "PRE_REGISTRATION",
          ds160Status: "NOT_STARTED",
        },
      });
    } else if (lead.program === "LANGUAGE_SCHOOL") {
      await tx.languageDetail.create({
        data: {
          studentId: student.id,
        },
      });
    } else if (lead.program === "ACADEMY") {
      await tx.academyDetail.create({
        data: {
          studentId: student.id,
        },
      });
    } else if (lead.program === "SUMMER_CAMP") {
      await tx.summerCampDetail.create({
        data: {
          studentId: student.id,
        },
      });
    } else if (lead.program === "VISA_CONSULTING") {
      await tx.visaDetail.create({
        data: {
          studentId: student.id,
          visaType: "STUDENT",
          destinationCountry: "ABD",
        },
      });
    }

    await tx.lead.update({
      where: { id: leadId },
      data: {
        status: "REGISTERED",
        convertedAt: new Date(),
        followUpAt: null,
      },
    });

    await tx.advisorNote.create({
      data: {
        studentId: student.id,
        authorId: advisor.id,
        note: existingUser
          ? `Mevcut öğrenci hesabına (${normalizedEmail}) yeni ${programNameMap[lead.program]} (${currentYear}) program kaydı eklendi.`
          : `Lead kaydından öğrenciye dönüştürüldü. Öğrenci portalı giriş bilgileri oluşturuldu (${normalizedEmail}).`,
      },
    });

    await tx.activityLog.create({
      data: {
        studentId: student.id,
        actorId: advisor.id,
        actorName: advisor.fullName,
        actorRole: advisor.role,
        actionType: "LEAD_CONVERTED",
        title: `${programNameMap[lead.program]} (${currentYear}) Kaydı Açıldı`,
        description: existingUser
          ? `Mevcut öğrenci hesabına ek program/dönem kaydı olarak bağlandı.`
          : `Aday havuzundan kesin kayda dönüştürüldü.`,
      },
    });
  });

  revalidatePath("/leads");
  revalidatePath("/students");
  revalidatePath("/anasayfa");
  revalidatePath("/programim");
  return { success: true };
}

// ── bulkImportLeads ───────────────────────────────────────────────────────────

export interface BulkLeadRowInput {
  fullName: string;
  email: string;
  phone: string;
  program: Program;
  source?: LeadSource;
  sponsor?: string;
  city?: string;
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
            sponsor: row.sponsor || existing.sponsor,
            city: row.city || existing.city,
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
            sponsor: row.sponsor || null,
            city: row.city || null,
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
