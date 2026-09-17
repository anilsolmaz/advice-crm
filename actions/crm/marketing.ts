// actions/crm/marketing.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/session";
import { sendNotification, type NotificationChannel } from "@/lib/notifications/notificationEngine";
import type { LeadStatus, Program } from "@prisma/client";

export interface TargetFilter {
  audience: "LEADS" | "STUDENTS";
  program?: Program;
  leadStatus?: LeadStatus | "ALL";
  studentStep?: number | "ALL";
}

export interface CampaignResult {
  success: boolean;
  totalRecipients: number;
  sentCount: number;
  error?: string;
}

/**
 * Calculates matching recipients for sample preview and audience count
 */
export async function getAudiencePreview(filter: TargetFilter) {
  await requireStaff();

  if (filter.audience === "LEADS") {
    const whereClause: any = {};
    if (filter.program) whereClause.program = filter.program;
    if (filter.leadStatus && filter.leadStatus !== "ALL") {
      whereClause.status = filter.leadStatus;
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        program: true,
      },
      take: 200,
    });

    return {
      count: leads.length,
      sample: leads.slice(0, 3).map((l) => ({
        name: l.fullName,
        email: l.email,
        phone: l.phone,
        program: l.program,
        advisor: "Danışman",
        balance: "—",
      })),
    };
  } else {
    // STUDENTS
    const whereClause: any = { isActive: true };
    if (filter.program) whereClause.program = filter.program;

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: true,
        watDetail: true,
        payments: {
          include: {
            installments: true,
          },
        },
      },
      take: 200,
    });

    return {
      count: students.length,
      sample: students.slice(0, 3).map((s) => {
        let remainingBalance = 0;
        let currency = "USD";
        s.payments.forEach((p) => {
          currency = p.currency;
          const total = parseFloat(p.totalAmount.toString());
          const paid = p.installments
            .filter((i) => i.isPaid)
            .reduce((sum, cur) => sum + parseFloat(cur.amount.toString()), 0);
          remainingBalance += Math.max(0, total - paid);
        });

        return {
          name: s.user.fullName,
          email: s.user.email,
          phone: s.user.phone || "",
          program: s.program,
          advisor: "Advice Danışmanlık",
          balance: `${remainingBalance} ${currency}`,
        };
      }),
    };
  }
}

/**
 * Executes a bulk marketing communication campaign
 */
export async function sendBulkCampaign(
  filter: TargetFilter,
  channel: NotificationChannel,
  subject: string,
  contentTemplate: string
): Promise<CampaignResult> {
  const staff = await requireStaff();

  if (!contentTemplate || contentTemplate.trim().length === 0) {
    return { success: false, totalRecipients: 0, sentCount: 0, error: "İçerik şablonu boş olamaz." };
  }

  const { sample } = await getAudiencePreview(filter);
  const audience = await getAudiencePreview(filter);

  let sentCount = 0;

  // Retrieve actual list to dispatch
  if (filter.audience === "LEADS") {
    const whereClause: any = {};
    if (filter.program) whereClause.program = filter.program;
    if (filter.leadStatus && filter.leadStatus !== "ALL") {
      whereClause.status = filter.leadStatus;
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: { advisor: true },
    });

    for (const lead of leads) {
      // Dynamic Tag Interpolation
      const interpolated = contentTemplate
        .replace(/{Öğrenci_Adı}/g, lead.fullName)
        .replace(/{Danışman_Adı}/g, lead.advisor?.fullName || staff.fullName)
        .replace(/{Program_Adı}/g, lead.program)
        .replace(/{Kalan_Bakiye}/g, "0.00 TL");

      await sendNotification({
        to: { name: lead.fullName, email: lead.email, phone: lead.phone },
        subject,
        content: interpolated,
        channel,
      });

      sentCount++;
    }

    return { success: true, totalRecipients: leads.length, sentCount };
  } else {
    // STUDENTS
    const whereClause: any = { isActive: true };
    if (filter.program) whereClause.program = filter.program;

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: true,
        payments: {
          include: { installments: true },
        },
      },
    });

    for (const st of students) {
      let remainingBalance = 0;
      let currency = "USD";
      st.payments.forEach((p) => {
        currency = p.currency;
        const total = parseFloat(p.totalAmount.toString());
        const paid = p.installments
          .filter((i) => i.isPaid)
          .reduce((sum, cur) => sum + parseFloat(cur.amount.toString()), 0);
        remainingBalance += Math.max(0, total - paid);
      });

      const interpolated = contentTemplate
        .replace(/{Öğrenci_Adı}/g, st.user.fullName)
        .replace(/{Danışman_Adı}/g, staff.fullName)
        .replace(/{Program_Adı}/g, st.program)
        .replace(/{Kalan_Bakiye}/g, `${remainingBalance.toFixed(2)} ${currency}`);

      await sendNotification({
        to: { name: st.user.fullName, email: st.user.email, phone: st.user.phone || undefined },
        subject,
        content: interpolated,
        channel,
      });

      sentCount++;
    }

    return { success: true, totalRecipients: students.length, sentCount };
  }
}
