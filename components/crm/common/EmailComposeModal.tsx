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
  onSuccess?: (subject: string) => void;
}

export interface EmailTemplate {
  id: string;
  label: string;
  subject: string;
  getBody: (name: string, prog: string) => string;
}

export const LEAD_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "lead_intro",
    label: "İlk Tanıtım & Program Detayları",
    subject: "Advice Yurtdışı Eğitim — Program Başvurunuz ve Detaylar",
    getBody: (name: string, prog: string) =>
      `Merhaba ${name},\n\nAdvice Yurtdışı Eğitim'e göstermiş olduğunuz ilgi için teşekkür ederiz. İlgilendiğiniz ${prog} programı kapsamındaki güncel kontenjanlar, başvuru şartları ve süreç adımları hakkında size detaylı bilgi sunmak isteriz.\n\nSizin için en uygun dönemi belirlemek ve sorularınızı yanıtlamak üzere bu e-postaya yanıt verebilir veya doğrudan danışman hattımızdan bize ulaşabilirsiniz.\n\nİyi günler dileriz,\nAdvice Yurtdışı Eğitim Danışmanlık Ekibi`,
  },
  {
    id: "lead_followup",
    label: "Görüşme Sonrası Bilgilendirme & Broşür",
    subject: "Görüşmemiz Doğrultusunda — Advice Program Bilgilendirmesi",
    getBody: (name: string, prog: string) =>
      `Merhaba ${name},\n\nBugün gerçekleştirdiğimiz görüşmeye istinaden, ${prog} programına dair incelediğimiz detayları ve resmi başvuru koşullarını bilginize sunarız.\n\nKarar aşamanızda aklınıza takılan her türlü konuda danışmanınız olarak yardımcı olmaktan mutluluk duyarım. Görüşmemiz doğrultusunda dosyanızı takipte tutuyoruz.\n\nSevgiler,\nAdvice Yurtdışı Eğitim Danışmanınız`,
  },
  {
    id: "lead_office_invite",
    label: "Ofis Ziyareti & Yüz Yüze Danışmanlık Daveti",
    subject: "Advice Ofisimize Davetlisiniz — Birebir Bilgilendirme Randevusu",
    getBody: (name: string, prog: string) =>
      `Merhaba ${name},\n\n${prog} programındaki hedeflerinizi daha detaylı planlamak, geçmiş dönem deneyimlerini aktarmak ve kafanızdaki tüm soru işaretlerini gidermek adına sizi ofisimizde kahve eşliğinde yüz yüze görüşmeye davet ediyoruz.\n\nMüsait olduğunuz gün ve saati iletirseniz randevunuzu memnuniyetle organize edebiliriz.\n\nSaygılarımızla,\nAdvice Yurtdışı Eğitim Ekibi`,
  },
  {
    id: "lead_early_bird",
    label: "Erken Kayıt & Kontenjan Fırsatı",
    subject: "Önemli Fırsat: Dönem Kontenjanları ve Erken Kayıt Avantajı",
    getBody: (name: string, prog: string) =>
      `Merhaba ${name},\n\nİlgilendiğiniz ${prog} programında yeni dönem kontenjanları hızla dolmaktadır. Erken kayıt dönemine özel fiyatlandırma ve yerleşim avantajlarından yararlanabilmeniz için başvurunuzu geciktirmemenizi öneririz.\n\nKayıt adımları için doğrudan danışmanınızla iletişime geçebilirsiniz.\n\nİyi çalışmalar,\nAdvice Yurtdışı Eğitim Başvuru Koordinatörlüğü`,
  },
];

export const STUDENT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "student_portal_docs",
    label: "Öğrenci Portalı & Eksik Evrak Hatırlatması",
    subject: "Önemli: Dosyanızdaki Eksik Evraklar Hakkında — Advice Yurtdışı Eğitim",
    getBody: (name: string, prog: string) =>
      `Merhaba ${name},\n\n${prog} programı başvuru dosyanızın zamanında tamamlanabilmesi için öğrenci portalınızdaki eksik evraklarınızı en kısa sürede sisteme yüklemenizi rica ederiz.\n\nÖğrenci Portalı: http://localhost:3000/login\n\nSevgiler,\nAdvice Yurtdışı Eğitim Operasyon Ekibi`,
  },
  {
    id: "student_job_offer",
    label: "İş & Sponsor Teklifi Onayı",
    subject: "İş Teklifiniz Hazır — Advice Yurtdışı Eğitim",
    getBody: (name: string, prog: string) =>
      `Merhaba ${name},\n\n${prog} programınız kapsamında tanımlanan resmi iş / yerleşim teklifiniz öğrenci portalınıza yüklenmiştir. Lütfen portalınıza giriş yaparak şartları inceleyip onayınızı iletiniz.\n\nSevgiler,\nAdvice Yurtdışı Eğitim Departmanı`,
  },
  {
    id: "student_payment",
    label: "Ödeme / Taksit Vadesi Hatırlatması",
    subject: "Program Taksit Ödeme Hatırlatması — Advice Yurtdışı Eğitim",
    getBody: (name: string, prog: string) =>
      `Merhaba ${name},\n\n${prog} programınıza ait yaklaşan taksit ödemenizi vadesinde gerçekleştirip dekontunuzu portalınız üzerinden iletmenizi rica ederiz.\n\nİyi günler dileriz,\nAdvice Yurtdışı Eğitim Finans & Muhasebe Birimi`,
  },
  {
    id: "student_visa",
    label: "Vize Randevu & DS-160 Bilgilendirmesi",
    subject: "Vize Randevunuz ve DS-160 Formu Hakkında — Advice Yurtdışı Eğitim",
    getBody: (name: string, prog: string) =>
      `Merhaba ${name},\n\n${prog} vize dosyanızın hazırlanabilmesi için DS-160 bilgilerinizi eksiksiz tamamlamanız ve randevu öncesi oryantasyon dosyanızı incelemeniz gerekmektedir.\n\nSevgiler,\nAdvice Yurtdışı Eğitim Vize Departmanı`,
  },
  {
    id: "student_orientation",
    label: "Oryantasyon & Çıkış Öncesi Bilgilendirme",
    subject: "Uçuş Öncesi Oryantasyon Bilgilendirmesi — Advice Yurtdışı Eğitim",
    getBody: (name: string, prog: string) =>
      `Merhaba ${name},\n\n${prog} yolculuğunuz öncesinde gerekli tüm yasal belgeleriniz, acil durum hatları ve varış detayları hakkında düzenleyeceğimiz oryantasyon oturumuna katılımınız önemlidir.\n\nİyi yolculuklar dileriz,\nAdvice Yurtdışı Eğitim Destek Ekibi`,
  },
];

export function EmailComposeModal({
  recipientName,
  recipientEmail,
  programLabel = "Yurtdışı Eğitim",
  leadId,
  studentId,
  onClose,
  onSuccess,
}: EmailComposeModalProps) {
  const isLead = Boolean(leadId) || !studentId;
  const templates = isLead ? LEAD_EMAIL_TEMPLATES : STUDENT_EMAIL_TEMPLATES;

  const defaultTpl = templates[0];
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
    const found = templates.find((t) => t.id === tplId);
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
            ? "E-posta başarıyla kuyruğa alındı ve kişi geçmişine kaydedildi."
            : "E-posta başarıyla gönderildi ve kişi geçmişine kaydedildi!",
        });
        if (onSuccess) {
          onSuccess(subject);
        }
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
              <h3 className="text-sm font-bold">
                {isLead ? "Adaya Bilgilendirme E-Postası Gönder" : "Öğrenciye E-Posta Gönder"}
              </h3>
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
              {isLead ? "Aday İletişim Şablonları" : "Kayıtlı Öğrenci Şablonları"}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((tpl) => (
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
