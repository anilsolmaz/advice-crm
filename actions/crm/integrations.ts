// actions/crm/integrations.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/session";
import {
  sendNotification,
  triggerTestNotification,
  type NotificationChannel,
} from "@/lib/notifications/notificationEngine";
import type { Program } from "@prisma/client";

export interface IntegrationStatus {
  email: {
    fromAddress: string;
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    hasApiKey: boolean;
    provider: string;
  };
  sms: {
    header: string;
    hasUsercode: boolean;
    provider: string;
  };
  meta: {
    pageId: string;
    hasAccessToken: boolean;
    verifyToken: string;
    webhookUrl: string;
  };
  webhooks: {
    metaUrl: string;
    hasMetaToken: boolean;
    googleUrl: string;
    hasGoogleKey: boolean;
  };
}

export async function getIntegrationStatus(): Promise<IntegrationStatus> {
  await requireStaff();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://crm.adviceyed.com";

  return {
    email: {
      fromAddress: process.env.EMAIL_FROM || "",
      smtpHost: process.env.SMTP_HOST || "",
      smtpPort: process.env.SMTP_PORT || "587",
      smtpUser: process.env.SMTP_USER || "",
      hasApiKey: Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST),
      provider: process.env.RESEND_API_KEY
        ? "Resend API (Aktif)"
        : process.env.SMTP_HOST
        ? "SMTP Sunucusu (Aktif)"
        : "Beklemede (Bilgiler Girilmedi — Simülasyon Modu)",
    },
    sms: {
      header: process.env.NETGSM_HEADER || "ADVICE",
      hasUsercode: Boolean(
        process.env.NETGSM_USERCODE && process.env.NETGSM_PASSWORD,
      ),
      provider: process.env.NETGSM_USERCODE
        ? "Netgsm API (Aktif)"
        : "Beklemede (Simülasyon Modu)",
    },
    meta: {
      pageId: process.env.META_PAGE_ID || "",
      hasAccessToken: Boolean(process.env.META_PAGE_ACCESS_TOKEN),
      verifyToken:
        process.env.META_WEBHOOK_VERIFY_TOKEN ||
        "advice_meta_webhook_secret_2026",
      webhookUrl: `${appUrl}/api/webhooks/meta-leads`,
    },
    webhooks: {
      metaUrl: `${appUrl}/api/webhooks/meta-leads`,
      hasMetaToken: Boolean(process.env.META_PAGE_ACCESS_TOKEN),
      googleUrl: `${appUrl}/api/webhooks/google-leads?key=${
        process.env.GOOGLE_LEADS_WEBHOOK_KEY || "advice_google_webhook_key_2026"
      }`,
      hasGoogleKey: Boolean(process.env.GOOGLE_LEADS_WEBHOOK_KEY),
    },
  };
}

export async function sendTestMessage(
  channel: NotificationChannel,
  target: string,
) {
  const staff = await requireStaff();
  if (staff.role !== "ADMIN") {
    return {
      success: false,
      error: "Test bildirimi göndermek için yönetici yetkisi gereklidir.",
    };
  }

  if (!target || target.trim().length === 0) {
    return {
      success: false,
      error: "Lütfen geçerli bir e-posta veya telefon numarası girin.",
    };
  }

  try {
    const results = await triggerTestNotification({
      channel,
      target: target.trim(),
    });
    const success = results.every((r) => r.success);
    return {
      success,
      results,
      error: success ? undefined : results.find((r) => r.error)?.error,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Sends a direct email from the CRM to a Lead or Student and logs it in their timeline.
 */
export async function sendDirectEmailAction(params: {
  toEmail: string;
  toName: string;
  subject: string;
  body: string;
  leadId?: string;
  studentId?: string;
}) {
  const staff = await requireStaff();

  if (!params.toEmail || !params.subject || !params.body) {
    return {
      success: false,
      error: "Alıcı e-posta, konu ve mesaj içeriği zorunludur.",
    };
  }

  try {
    const res = await sendNotification({
      to: { name: params.toName, email: params.toEmail },
      subject: params.subject,
      content: params.body,
      channel: "EMAIL",
    });

    const emailRes = res[0];
    if (!emailRes?.success) {
      return {
        success: false,
        error: emailRes?.error || "E-posta gönderilemedi.",
      };
    }

    // Record in Lead or Student timeline
    if (params.leadId) {
      await prisma.leadCallLog.create({
        data: {
          leadId: params.leadId,
          advisorId: staff.id,
          outcome: "REACHED",
          notes: `✉️ [E-POSTA GÖNDERİLDİ] Konu: "${params.subject}"`,
        },
      });
      revalidatePath("/leads");
    }

    if (params.studentId) {
      await prisma.advisorNote.create({
        data: {
          studentId: params.studentId,
          authorId: staff.id,
          note: `✉️ [E-POSTA GÖNDERİLDİ] Konu: "${params.subject}"\n${params.body}`,
        },
      });
      revalidatePath(`/students/${params.studentId}`);
    }

    return {
      success: true,
      simulated: !Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST),
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Simulates or pulls a new lead from Meta Lead Ads, assigns it via balanced advisor distribution,
 * and creates a bell notification for the advisor.
 */
export async function simulateMetaLeadPull(customData?: {
  fullName?: string;
  email?: string;
  phone?: string;
  program?: Program;
  city?: string;
}) {
  await requireStaff();

  try {
    // Find advisors for balanced round-robin assignment
    const advisors = await prisma.user.findMany({
      where: { role: { in: ["ADVISOR", "ADMIN"] }, isActive: true },
      include: {
        _count: { select: { leadsAsAdvisor: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Pick advisor with fewest leads
    const sortedAdvisors = [...advisors].sort(
      (a, b) => a._count.leadsAsAdvisor - b._count.leadsAsAdvisor,
    );
    const assignedAdvisor = sortedAdvisors[0];

    const randomNum = Math.floor(100 + Math.random() * 900);
    const fullName = customData?.fullName || `Meta Adayı #${randomNum}`;
    const email = customData?.email || `meta.aday.${randomNum}@gmail.com`;
    const phone = customData?.phone || `0532 ${randomNum} 45 67`;
    const program = customData?.program || "WORK_AND_TRAVEL";
    const city = customData?.city || "İstanbul";

    const created = await prisma.lead.create({
      data: {
        fullName,
        email,
        phone,
        program,
        city,
        source: "SOCIAL_MEDIA",
        status: "INTERESTED",
        advisorId: assignedAdvisor?.id || null,
        notes:
          "Meta (Instagram / Facebook) Lead Form üzerinden otomatik çekildi.",
      },
    });

    if (assignedAdvisor) {
      await prisma.notification.create({
        data: {
          userId: assignedAdvisor.id,
          type: "NEW_LEAD",
          title: "📲 Meta Reklamlarından Yeni Lead Geldi",
          message: `${fullName} (${phone}) Instagram/Facebook formu doldurdu ve size atandı.`,
          linkUrl: "/leads",
        },
      });
    }

    revalidatePath("/leads");
    revalidatePath("/dashboard");
    revalidatePath("/settings");

    return {
      success: true,
      leadName: created.fullName,
      assignedTo: assignedAdvisor?.fullName || "Havuz",
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
