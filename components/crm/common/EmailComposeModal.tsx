// components/crm/common/EmailComposeModal.tsx
"use client";

import { useState, useTransition } from "react";
import { X, Mail, Send, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { sendDirectEmailAction } from "@/actions/crm/integrations";

interface EmailComposeModalProps {
  recipientName: string;
  recipientEmail: string;
  programLabel?: string;
  leadId?: string;
  studentId?: string;
  onClose: () => void;
}

const EMAIL_TEMPLATES = [
  {
    id: "first_contact",
    label: "İlk Temas & Program Bilgilendirmesi",
    subject: "Advice Yurtdışı Eğitim — Başvurunuz Hakkında Bilgilendirme",
    getBody: (name: string, prog: string) =>
      `Merhaba ${name},\n\nAdvice Yurtdışı Eğitim'e göstermiş olduğunuz ilgi için teşekkür ederiz. ${prog} programı kapsamındaki güncel kontenjanlar, fiyatlandırma ve başvuru adımları hakkında detaylı bilgi vermek üzere sizinle iletişime geçmek istedik.\n\nMüsait olduğunuz bir zaman dilimini bu e-postaya yanıt olarak iletebilir veya doğrudan danışman hattımızdan bize ulaşabilirsiniz.\n\nSevgiler,\nAdvice Yurtdışı Eğitim Danışmanlık Ekibi`,
  },
  {
    id: "missing_docs",
    label: "Eksik Evrak Hatırlatması",
    subject: "Önemli: Dosyanızdaki Eksik Evraklar Hakkında — Advice Yurtdışı Eğitim",
    getBody: (name: string, prog: string) =>
      `Merhaba ${name},\n\n${prog} başvuru sürecinizin gecikmemesi adına öğrenci portalınızdaki eksik belgelerinizi (Pasaport, Öğrenci Belgesi, Transkript, İngilizce CV) en kısa sürede sisteme yüklemenizi rica ederiz.\n\nÖğrenci Portalı Giriş: http://localhost:3000/login\n\nSevgiler,\nAdvice Yurtdışı Eğitim Operasyon Ekibi`,
  },
  {
    id: "sponsor_job_offer",
    label: "Sponsor & İş Teklifi Onayı",
    subject: "Work & Travel İş Teklifiniz Hazır — Advice Yurtdışı Eğitim",
    getBody: (name: string) =>
      `Merhaba ${name},\n\nSizin için uygun görülen Work & Travel iş teklifi öğrenci portalınıza tanımlanmıştır. Lütfen portalınıza giriş yaparak iş detaylarını, saatlik ücreti ve konaklama şartlarını inceleyip onayınızı iletiniz.\n\nSevgiler,\nAdvice Yurtdışı Eğitim WAT Departmanı`,
  },
  {
    id: "payment_reminder",
    label: "Ödeme / Taksit Vadesi Hatırlatması",
    subject: "Program Taksit Ödeme Hatırlatması — Advice Yurtdışı Eğitim",
    getBody: (name: string, prog: string) =>
      `Merhaba ${name},\n\n${prog} programınıza ait yaklaşan taksit ödemenizi vadesinde gerçekleştirip dekontunuzu öğrenci portalınızdan veya danışmanınıza iletmenizi rica ederiz.\n\nİyi günler dileriz,\nAdvice Yurtdışı Eğitim Finans & Muhasebe Birimi`,
  },
  {
    id: "visa_appointment",
    label: "Vize Randevu & DS-160 Bilgilendirmesi",
    subject: "Vize Randevunuz ve DS-160 Formu Hakkında — Advice Yurtdışı Eğitim",
    getBody: (name: string) =>
      `Merhaba ${name},\n\nVize dosyanızın hazırlanabilmesi için öğrenci portalınızdaki DS-160 / Vize bilgi alanlarını eksiksiz doldurmanız ve randevu tarihinizden önce oryantasyon dosyanızı kontrol etmeniz gerekmektedir.\n\nSevgiler,\nAdvice Yurtdışı Eğitim Vize Departmanı`,
  },
];

export function EmailComposeModal({
  recipientName,
  recipientEmail,
  programLabel = "Yurtdışı Eğitim",
  leadId,
  studentId,
  onClose,
}: EmailComposeModalProps) {
  const defaultTpl = EMAIL_TEMPLATES[0];
  const [selectedTpl, setSelectedTpl] = useState(defaultTpl.id);
  const [subject, setSubject] = useState(defaultTpl.subject);
  const [body, setBody] = useState(
    defaultTpl.getBody(recipientName, programLabel),
  );
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSelectTemplate(tplId: string) {
    setSelectedTpl(tplId);
    const found = EMAIL_TEMPLATES.find((t) => t.id === tplId);
    if (found) {
      setSubject(found.subject);
      setBody(found.getBody(recipientName, programLabel));
    }
  }

  function handleSend() {
    setResult(null);
    startTransition(async () => {
      const res = await sendDirectEmailAction({
        toEmail: recipientEmail,
        toName: recipientName,
        subject,
        body,
        leadId,
        studentId,
      });

      if (res.success) {
        setResult({
          success: true,
          message: res.simulated
            ? "E-posta başarıyla kuyruğa alındı ve kişi geçmişine kaydedildi (SMTP/API anahtarı girildiğinde gerçek mail olarak iletilir)."
            : "E-posta başarıyla gönderildi ve kişi geçmişine kaydedildi!",
        });
      } else {
        setResult({
          success: false,
          message: res.error || "E-posta gönderilemedi.",
        });
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#0f172a] px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <Mail className="h-5 w-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold">Sistem Üzerinden E-Posta Gönder</h3>
              <p className="text-[11px] text-slate-300">
                Alıcı: {recipientName} ({recipientEmail})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Quick Template Picker */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 font-bold text-slate-700">
              <Sparkles className="h-3.5 w-3.5 text-[#1e3a8a]" />
              Hazır E-Posta Şablonu Seçin
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EMAIL_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold border transition-colors ${
                    selectedTpl === tpl.id
                      ? "bg-[#0f172a] text-white border-[#0f172a]"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bold text-slate-700">
              E-Posta Konusu (Subject)
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#0f172a] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold text-slate-700">
              Mesaj İçeriği
            </label>
            <textarea
              rows={7}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 leading-relaxed focus:border-[#0f172a] focus:outline-none"
            />
          </div>

          {result && (
            <div
              className={`flex items-center gap-2 rounded-xl p-3 text-xs font-semibold ${
                result.success
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              )}
              <span>{result.message}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
            >
              Kapat
            </button>
            <button
              type="button"
              disabled={isPending || !subject || !body}
              onClick={handleSend}
              className="flex items-center gap-1.5 rounded-xl bg-[#0f172a] px-5 py-2 font-bold text-white hover:bg-[#1e3a8a] disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5 text-sky-400" />
              {isPending ? "Gönderiliyor…" : "E-Postayı Gönder"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
