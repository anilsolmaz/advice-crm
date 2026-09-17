// lib/notifications/notificationEngine.ts
/**
 * Unified Transactional Notification Engine
 * Provides production-ready adapters for SMS (Netgsm) and Email (Resend / SMTP)
 * Automatically falls back to mock simulation when credentials are not yet configured.
 */

export type NotificationChannel = "SMS" | "EMAIL" | "BOTH";

export interface SendMessagePayload {
  to: {
    name: string;
    email?: string;
    phone?: string;
  };
  subject?: string;
  content: string;
  channel: NotificationChannel;
}

export interface SendResult {
  success: boolean;
  channel: NotificationChannel;
  messageId?: string;
  error?: string;
}

// ── SMS Client Adapter (Netgsm HTTP API / Local Mock) ─────────────────────────

async function sendSmsAdapter(
  phone: string,
  text: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
  // Format phone: strip spaces and non-digits
  let cleanPhone = phone.replace(/[^0-9]/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = cleanPhone.substring(1);
  }
  if (!cleanPhone.startsWith("90") && cleanPhone.length === 10) {
    cleanPhone = "90" + cleanPhone;
  }

  const usercode = process.env.NETGSM_USERCODE;
  const password = process.env.NETGSM_PASSWORD;
  const header = process.env.NETGSM_HEADER || "ADVICE";

  // If credentials exist, dispatch via real Netgsm API
  if (usercode && password) {
    try {
      const url = `https://api.netgsm.com.tr/sms/send/get/?usercode=${encodeURIComponent(
        usercode,
      )}&password=${encodeURIComponent(password)}&gsmno=${cleanPhone}&message=${encodeURIComponent(
        text,
      )}&msgheader=${encodeURIComponent(header)}`;

      const res = await fetch(url, { method: "GET" });
      const rawText = await res.text();
      const code = rawText.trim().split(" ")[0];

      // Netgsm returns "00 <jobID>" or "01 <jobID>" or "02 <jobID>" on success
      if (code === "00" || code === "01" || code === "02") {
        return { success: true, id: rawText.trim() };
      } else {
        console.error(`[NETGSM API ERROR]: Yanıt Kodu: ${rawText}`);
        return { success: false, error: `Netgsm Hata Kodu: ${rawText}` };
      }
    } catch (err: any) {
      console.error("[NETGSM NETWORK ERROR]:", err);
      return { success: false, error: err.message };
    }
  }

  // Simulation mode (production credentials not yet entered)
  console.log(
    `[SMS SİMÜLASYONU via Netgsm] -> Alıcı: ${cleanPhone} | Başlık: [${header}] | Mesaj: "${text}"`,
  );
  return { success: true, id: `mock_sms_${Date.now()}` };
}

// ── Email Client Adapter (Resend API / Local Mock) ────────────────────────────

async function sendEmailAdapter(
  email: string,
  subject: string,
  htmlOrText: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromAddress =
    process.env.EMAIL_FROM || "Advice Yurtdışı Eğitim <bilgi@adviceyed.com>";

  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [email],
          subject,
          html: `<div style="font-family:sans-serif;line-height:1.6;color:#1e293b;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;rounded:12px;">
            <div style="margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #3b82f6;">
              <h2 style="color:#1d4ed8;margin:0;">Advice Yurtdışı Eğitim</h2>
            </div>
            <div style="font-size:15px;white-space:pre-wrap;">${htmlOrText}</div>
            <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
              Bu e-posta Advice CRM Bilgilendirme Sistemi tarafından otomatik olarak gönderilmiştir.
            </div>
          </div>`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("[RESEND EMAIL ERROR]:", data);
        return { success: false, error: data.message || "Resend e-posta gönderim hatası" };
      }

      return { success: true, id: data.id };
    } catch (err: any) {
      console.error("[EMAIL NETWORK ERROR]:", err);
      return { success: false, error: err.message };
    }
  }

  // Simulation mode (production credentials not yet entered)
  console.log(
    `[E-POSTA SİMÜLASYONU via Resend/SMTP] -> Gönderen: ${fromAddress} | Alıcı: ${email} | Konu: "${subject}" | Gövde: "${htmlOrText.slice(0, 80)}..."`,
  );
  return { success: true, id: `mock_email_${Date.now()}` };
}

/**
 * Unified Dispatcher
 */
export async function sendNotification(
  payload: SendMessagePayload,
): Promise<SendResult[]> {
  const results: SendResult[] = [];

  // 1. Dispatch SMS
  if (
    (payload.channel === "SMS" || payload.channel === "BOTH") &&
    payload.to.phone
  ) {
    const smsRes = await sendSmsAdapter(payload.to.phone, payload.content);
    results.push({
      success: smsRes.success,
      channel: "SMS",
      messageId: smsRes.id,
      error: smsRes.error,
    });
  }

  // 2. Dispatch Email
  if (
    (payload.channel === "EMAIL" || payload.channel === "BOTH") &&
    payload.to.email
  ) {
    const emailRes = await sendEmailAdapter(
      payload.to.email,
      payload.subject || "Advice Yurtdışı Eğitim Bilgilendirme",
      payload.content,
    );
    results.push({
      success: emailRes.success,
      channel: "EMAIL",
      messageId: emailRes.id,
      error: emailRes.error,
    });
  }

  return results;
}

// ── Automated Business Triggers (Strictly Turkish Content) ───────────────────

/**
 * a) Trigger on Stepper Status Advance
 */
export async function triggerStepperStatusNotification(params: {
  studentName: string;
  email: string;
  phone?: string;
  stepNumber: number;
  stepLabel: string;
}) {
  const message = `Sayın ${params.studentName}, programınızda yeni bir aşamaya geçildi: "${params.stepLabel}". Detayları ve sonraki adımları öğrenci portalınızdan inceleyebilirsiniz: https://crm.adviceyed.com/anasayfa`;
  const subject = `İlerleme Bildirimi: ${params.stepLabel} - Advice Yurtdışı Eğitim`;

  return sendNotification({
    to: { name: params.studentName, email: params.email, phone: params.phone },
    subject,
    content: message,
    channel: "BOTH",
  });
}

/**
 * b) Trigger on Advisor Review Decision (Approved or Revision Requested)
 */
export async function triggerReviewDecisionNotification(params: {
  studentName: string;
  email: string;
  phone?: string;
  isApproved: boolean;
  rejectionReason?: string;
  entityName: string;
}) {
  let subject = "";
  let message = "";

  if (params.isApproved) {
    subject = "Talebiniz Onaylandı - Advice Yurtdışı Eğitim";
    message = `Sayın ${params.studentName}, iletmiş olduğunuz "${params.entityName}" güncellemesi danışmanınız tarafından onaylanmış ve sistem kayıtlarınıza işlenmiştir.`;
  } else {
    subject = "Düzeltme / Revize Talebi - Advice Yurtdışı Eğitim";
    message = `Sayın ${params.studentName}, iletmiş olduğunuz "${params.entityName}" için danışmanınız revizyon talep etti. Danışman Açıklaması: "${
      params.rejectionReason || "Eksik/hatalı bilgi"
    }". Lütfen portalınızdaki Bildirimler sayfasından kontrol edip tekrar iletiniz.`;
  }

  return sendNotification({
    to: { name: params.studentName, email: params.email, phone: params.phone },
    subject,
    content: message,
    channel: "BOTH",
  });
}

/**
 * c) Trigger on Upcoming Installment Due Date
 */
export async function triggerPaymentReminderNotification(params: {
  studentName: string;
  email: string;
  phone?: string;
  amount: string;
  currency: string;
  dueDate: string;
}) {
  const subject = "Taksit Ödeme Hatırlatması - Advice Yurtdışı Eğitim";
  const message = `Sayın ${params.studentName}, ${params.amount} ${params.currency} tutarındaki program taksitinizin son ödeme tarihi ${params.dueDate} olarak görünmektedir. Ödemenizi vadesinde gerçekleştirip dekontunuzu portalınızdan veya danışmanınıza iletmenizi rica ederiz.`;

  return sendNotification({
    to: { name: params.studentName, email: params.email, phone: params.phone },
    subject,
    content: message,
    channel: "BOTH",
  });
}

/**
 * d) Trigger on Test Notification (for Settings integration testing)
 */
export async function triggerTestNotification(params: {
  channel: NotificationChannel;
  target: string;
}) {
  const subject = "Test Bildirimi - Advice Yurtdışı Eğitim CRM";
  const content = `Bu bir test bildirimidir. Advice CRM entegrasyonu başarıyla aktif edilmiştir. Tarih: ${new Date().toLocaleString(
    "tr-TR",
  )}`;

  return sendNotification({
    to: {
      name: "Sistem Yöneticisi",
      email: params.channel !== "SMS" ? params.target : undefined,
      phone: params.channel !== "EMAIL" ? params.target : undefined,
    },
    subject,
    content,
    channel: params.channel,
  });
}
