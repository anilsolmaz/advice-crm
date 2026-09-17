// actions/crm/integrations.ts
"use server";

import { requireStaff } from "@/lib/auth/session";
import { triggerTestNotification, type NotificationChannel } from "@/lib/notifications/notificationEngine";

export interface IntegrationStatus {
  email: {
    fromAddress: string;
    hasApiKey: boolean;
    provider: string;
  };
  sms: {
    header: string;
    hasUsercode: boolean;
    provider: string;
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

  return {
    email: {
      fromAddress: process.env.EMAIL_FROM || "Advice Yurtdışı Eğitim <bilgi@adviceyed.com>",
      hasApiKey: Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST),
      provider: process.env.RESEND_API_KEY ? "Resend API" : process.env.SMTP_HOST ? "SMTP Sunucusu" : "Simülasyon (Mock)",
    },
    sms: {
      header: process.env.NETGSM_HEADER || "ADVICE",
      hasUsercode: Boolean(process.env.NETGSM_USERCODE && process.env.NETGSM_PASSWORD),
      provider: process.env.NETGSM_USERCODE ? "Netgsm API" : "Simülasyon (Mock)",
    },
    webhooks: {
      metaUrl: "https://crm.adviceyed.com/api/webhooks/meta-leads",
      hasMetaToken: Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN),
      googleUrl: `https://crm.adviceyed.com/api/webhooks/google-leads?key=${process.env.GOOGLE_LEADS_WEBHOOK_KEY || "advice_google_webhook_key_2026"}`,
      hasGoogleKey: Boolean(process.env.GOOGLE_LEADS_WEBHOOK_KEY),
    },
  };
}

export async function sendTestMessage(channel: NotificationChannel, target: string) {
  const staff = await requireStaff();
  if (staff.role !== "ADMIN") {
    return { success: false, error: "Test bildirimi göndermek için yönetici yetkisi gereklidir." };
  }

  if (!target || target.trim().length === 0) {
    return { success: false, error: "Lütfen geçerli bir e-posta veya telefon numarası girin." };
  }

  try {
    const results = await triggerTestNotification({ channel, target: target.trim() });
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
