// actions/crm/jobs.ts
"use server";

import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/session";

export type JobActionResult =
  | { success: true; id?: string; shareToken?: string; shareUrl?: string }
  | { success: false; error: string };

// ── 1. Create WAT Job (All 22 Fields from Section 4) ──────────────────────────

export interface WatJobInput {
  sponsor: string;
  program?: string;
  jobCategory: string;
  jobTitle: string;
  placementType?: string;
  location: string;
  state?: string;
  arrivalAirport?: string;
  hourlyWage: number | string;
  avgWorkingHours?: number | string;
  accommodationCost?: number | string | null;
  accommodationDeposit?: number | string | null;
  food?: string;
  transportation?: string;
  workApparel?: string;
  position?: string;
  genderPreference?: string;
  jobStartDate: string;
  jobEndDate: string;
  earlyLeaveInfo?: string;
  numPlacements?: number | string;
  bonus?: string;
  additionalInfo?: string;
}

export async function createWatJob(input: WatJobInput): Promise<JobActionResult> {
  await requireStaff();

  if (!input.sponsor || !input.jobCategory || !input.jobTitle || !input.location) {
    return {
      success: false,
      error: "Sponsor, İş Kategorisi, İş Başlığı ve Lokasyon alanları zorunludur.",
    };
  }

  const job = await prisma.watJob.create({
    data: {
      sponsor: input.sponsor,
      program: input.program || "Work and Travel",
      jobCategory: input.jobCategory,
      jobTitle: input.jobTitle,
      placementType: input.placementType || "Full Placement",
      location: input.location,
      state: input.state || null,
      arrivalAirport: input.arrivalAirport || null,
      hourlyWage: Number(input.hourlyWage) || 15,
      avgWorkingHours: Number(input.avgWorkingHours) || 35,
      accommodationCost:
        input.accommodationCost !== undefined && input.accommodationCost !== "" && input.accommodationCost !== null
          ? Number(input.accommodationCost)
          : null,
      accommodationDeposit:
        input.accommodationDeposit !== undefined && input.accommodationDeposit !== "" && input.accommodationDeposit !== null
          ? Number(input.accommodationDeposit)
          : null,
      food: input.food || null,
      transportation: input.transportation || null,
      workApparel: input.workApparel || null,
      position: input.position || input.jobTitle,
      genderPreference: input.genderPreference || "Males and Females",
      jobStartDate: new Date(input.jobStartDate || "2026-06-15"),
      jobEndDate: new Date(input.jobEndDate || "2026-09-15"),
      earlyLeaveInfo: input.earlyLeaveInfo || null,
      numPlacements: Number(input.numPlacements) || 1,
      bonus: input.bonus || null,
      additionalInfo: input.additionalInfo || null,
      isActive: true,
    },
  });

  revalidatePath("/wat/catalog");
  return { success: true, id: job.id };
}

// ── 2. Update WAT Job ─────────────────────────────────────────────────────────

export async function updateWatJob(
  jobId: string,
  input: Partial<WatJobInput> & { isActive?: boolean },
): Promise<JobActionResult> {
  await requireStaff();

  await prisma.watJob.update({
    where: { id: jobId },
    data: {
      ...(input.sponsor !== undefined ? { sponsor: input.sponsor } : {}),
      ...(input.program !== undefined ? { program: input.program } : {}),
      ...(input.jobCategory !== undefined ? { jobCategory: input.jobCategory } : {}),
      ...(input.jobTitle !== undefined ? { jobTitle: input.jobTitle } : {}),
      ...(input.placementType !== undefined ? { placementType: input.placementType } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.state !== undefined ? { state: input.state || null } : {}),
      ...(input.arrivalAirport !== undefined ? { arrivalAirport: input.arrivalAirport || null } : {}),
      ...(input.hourlyWage !== undefined ? { hourlyWage: Number(input.hourlyWage) } : {}),
      ...(input.avgWorkingHours !== undefined ? { avgWorkingHours: Number(input.avgWorkingHours) } : {}),
      ...(input.accommodationCost !== undefined
        ? {
            accommodationCost:
              input.accommodationCost !== "" && input.accommodationCost !== null
                ? Number(input.accommodationCost)
                : null,
          }
        : {}),
      ...(input.accommodationDeposit !== undefined
        ? {
            accommodationDeposit:
              input.accommodationDeposit !== "" && input.accommodationDeposit !== null
                ? Number(input.accommodationDeposit)
                : null,
          }
        : {}),
      ...(input.food !== undefined ? { food: input.food || null } : {}),
      ...(input.transportation !== undefined ? { transportation: input.transportation || null } : {}),
      ...(input.workApparel !== undefined ? { workApparel: input.workApparel || null } : {}),
      ...(input.position !== undefined ? { position: input.position || null } : {}),
      ...(input.genderPreference !== undefined ? { genderPreference: input.genderPreference } : {}),
      ...(input.jobStartDate ? { jobStartDate: new Date(input.jobStartDate) } : {}),
      ...(input.jobEndDate ? { jobEndDate: new Date(input.jobEndDate) } : {}),
      ...(input.earlyLeaveInfo !== undefined ? { earlyLeaveInfo: input.earlyLeaveInfo || null } : {}),
      ...(input.numPlacements !== undefined ? { numPlacements: Number(input.numPlacements) } : {}),
      ...(input.bonus !== undefined ? { bonus: input.bonus || null } : {}),
      ...(input.additionalInfo !== undefined ? { additionalInfo: input.additionalInfo || null } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });

  revalidatePath("/wat/catalog");
  return { success: true, id: jobId };
}

// ── 3. Delete WAT Job ─────────────────────────────────────────────────────────

export async function deleteWatJob(jobId: string): Promise<JobActionResult> {
  await requireStaff();

  await prisma.watJob.delete({ where: { id: jobId } });
  revalidatePath("/wat/catalog");
  return { success: true };
}

// ── 4. Create Student-Specific Job Link (Section 4 [P1]) ─────────────────────

export async function createStudentJobLink(
  jobId: string,
  studentId: string,
): Promise<JobActionResult> {
  const advisor = await requireStaff();

  const [job, student] = await Promise.all([
    prisma.watJob.findUnique({ where: { id: jobId } }),
    prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    }),
  ]);

  if (!job) return { success: false, error: "İş ilanı bulunamadı." };
  if (!student) return { success: false, error: "Öğrenci bulunamadı." };

  const shareToken = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  await prisma.$transaction([
    prisma.watJobAssignment.create({
      data: {
        jobId,
        studentId,
        assignedById: advisor.id,
        shareToken,
        status: "SENT",
        expiresAt,
      },
    }),
    prisma.notification.create({
      data: {
        userId: student.userId,
        type: "JOB_RESPONSE",
        title: "Yeni WAT İş Teklifi Atandı!",
        message: `${job.sponsor} · ${job.jobTitle} (${job.location}) iş teklifini inceleyip onaylayabilirsiniz.`,
        linkUrl: `/job-offer/${shareToken}`,
      },
    }),
    prisma.activityLog.create({
      data: {
        studentId,
        actorId: advisor.id,
        actorName: advisor.fullName,
        actorRole: advisor.role,
        actionType: "JOB_OFFER_SENT",
        title: `İş Teklifi Atandı: ${job.jobTitle} (${job.location})`,
        description: `Sponsor: ${job.sponsor} · Saatlik Ücret: $${Number(job.hourlyWage)}/saat · Pozisyon: ${job.position || job.jobCategory}`,
        metadata: { jobId: job.id, shareToken },
      },
    }),
  ]);

  revalidatePath("/wat/catalog");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/anasayfa");
  revalidatePath("/programim");
  return {
    success: true,
    shareToken,
    shareUrl: `/job-offer/${shareToken}`,
  };
}

// ── 5. Student Responds to Job Link (Accept / Decline) ───────────────────────

export async function respondToJobOffer(
  shareToken: string,
  decision: "ACCEPTED" | "DECLINED",
  studentNote?: string,
): Promise<JobActionResult> {
  const assignment = await prisma.watJobAssignment.findUnique({
    where: { shareToken },
    include: {
      job: true,
      student: { include: { user: true } },
    },
  });

  if (!assignment) {
    return { success: false, error: "Geçersiz veya süresi dolmuş iş bağlantısı." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.watJobAssignment.update({
      where: { id: assignment.id },
      data: {
        status: decision,
        studentNote: studentNote || null,
        respondedAt: new Date(),
      },
    });

    if (decision === "ACCEPTED") {
      await tx.watJob.update({
        where: { id: assignment.jobId },
        data: { filledPlacements: { increment: 1 } },
      });

      await tx.watDetail.upsert({
        where: { studentId: assignment.studentId },
        create: {
          studentId: assignment.studentId,
          sponsorName: assignment.job.sponsor,
          jobTitle: assignment.job.position || assignment.job.jobTitle,
          employerName: assignment.job.jobTitle,
          employerState: assignment.job.state || assignment.job.location,
          jobStartDate: assignment.job.jobStartDate,
          jobEndDate: assignment.job.jobEndDate,
          currentStage: "JOB_PLACEMENT",
        },
        update: {
          sponsorName: assignment.job.sponsor,
          jobTitle: assignment.job.position || assignment.job.jobTitle,
          employerName: assignment.job.jobTitle,
          employerState: assignment.job.state || assignment.job.location,
          jobStartDate: assignment.job.jobStartDate,
          jobEndDate: assignment.job.jobEndDate,
          currentStage: "JOB_PLACEMENT",
        },
      });
    } else if (decision === "DECLINED") {
      // Check if student has any other ACCEPTED job assignment
      const otherAccepted = await tx.watJobAssignment.findFirst({
        where: {
          studentId: assignment.studentId,
          id: { not: assignment.id },
          status: "ACCEPTED",
        },
      });
      if (!otherAccepted) {
        await tx.watDetail.updateMany({
          where: { studentId: assignment.studentId },
          data: {
            employerName: null,
            jobTitle: null,
            employerState: null,
            currentStage: "JOB_SELECTION",
          },
        });
      }
    }

    await tx.activityLog.create({
      data: {
        studentId: assignment.studentId,
        actorId: assignment.student.userId,
        actorName: assignment.student.user.fullName,
        actorRole: "STUDENT",
        actionType: decision === "ACCEPTED" ? "JOB_OFFER_ACCEPTED" : "JOB_OFFER_DECLINED",
        title:
          decision === "ACCEPTED"
            ? `İş Teklifi Kabul Edildi: ${assignment.job.jobTitle}`
            : `İş Teklifi Reddedildi: ${assignment.job.jobTitle}`,
        description: studentNote
          ? `Öğrenci Notu: "${studentNote}" (${assignment.job.location} · $${Number(assignment.job.hourlyWage)}/saat)`
          : `${assignment.job.sponsor} · ${assignment.job.location} ($${Number(assignment.job.hourlyWage)}/saat)`,
        metadata: { jobId: assignment.jobId, assignmentId: assignment.id, decision, studentNote },
      },
    });

    await tx.notification.create({
      data: {
        userId: assignment.assignedById,
        type: "JOB_RESPONSE",
        title:
          decision === "ACCEPTED"
            ? `✅ ${assignment.student.user.fullName} İş Teklifini Onayladı!`
            : `❌ ${assignment.student.user.fullName} İş Teklifini Reddetti`,
        message: `${assignment.job.jobTitle} (${assignment.job.location}) teklifi öğrenci tarafından ${
          decision === "ACCEPTED" ? "kabul edildi" : `reddedildi${studentNote ? ` (Not: ${studentNote})` : ""}`
        }. Yeni iş teklifi atamak için öğrenci profiline gidin.`,
        linkUrl: `/students/${assignment.studentId}`,
      },
    });
  });

  revalidatePath(`/job-offer/${shareToken}`);
  revalidatePath("/wat/catalog");
  revalidatePath(`/students/${assignment.studentId}`);
  revalidatePath("/anasayfa");
  revalidatePath("/programim");
  return { success: true };
}
