// components/crm/marketing/BulkMarketingPanel.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { Mail, MessageSquare, Users, Send, CheckCircle2, AlertCircle, Eye, Tag } from "lucide-react";
import { sendBulkCampaign, getAudiencePreview, type TargetFilter } from "@/actions/crm/marketing";
import type { Program, LeadStatus } from "@prisma/client";
import { LEAD_STATUS_LABELS, PROGRAM_LABELS } from "@/types/crm";

interface Props {
  initialProgram?: Program;
}

const TEMPLATE_VARIABLES = [
  { tag: "{Öğrenci_Adı}", label: "Öğrenci / Aday Adı" },
  { tag: "{Danışman_Adı}", label: "Danışman Adı" },
  { tag: "{Program_Adı}", label: "Program Adı" },
  { tag: "{Kalan_Bakiye}", label: "Kalan Borç Tutarı" },
];

export function BulkMarketingPanel({ initialProgram }: Props) {
  const [audience, setAudience] = useState<"LEADS" | "STUDENTS">("LEADS");
  const [selectedProgram, setSelectedProgram] = useState<Program | undefined>(initialProgram);
  const [leadStatus, setLeadStatus] = useState<LeadStatus | "ALL">("ALL");
  const [channel, setChannel] = useState<"SMS" | "EMAIL" | "BOTH">("SMS");
  const [subject, setSubject] = useState("Advice Yurtdışı Eğitim - Bilgilendirme");
  const [contentTemplate, setContentTemplate] = useState(
    "Merhaba {Öğrenci_Adı}, {Program_Adı} başvurunuzla ilgili danışmanınız {Danışman_Adı} sizinle iletişime geçmek istiyor. Detaylı bilgi için bizi arayabilirsiniz."
  );

  const [audienceCount, setAudienceCount] = useState<number>(0);
  const [sampleRecipient, setSampleRecipient] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [resultMsg, setResultMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Fetch live audience estimate on filter change
  useEffect(() => {
    async function updatePreview() {
      const res = await getAudiencePreview({
        audience,
        program: selectedProgram,
        leadStatus,
      });
      setAudienceCount(res.count);
      setSampleRecipient(res.sample[0] || null);
    }
    updatePreview();
  }, [audience, selectedProgram, leadStatus]);

  function handleInsertTag(tag: string) {
    setContentTemplate((prev) => prev + " " + tag);
  }

  // Generate sample preview text
  const previewText = contentTemplate
    .replace(/{Öğrenci_Adı}/g, sampleRecipient?.name || "Ahmet Yılmaz")
    .replace(/{Danışman_Adı}/g, sampleRecipient?.advisor || "Selin Danışman")
    .replace(/{Program_Adı}/g, sampleRecipient?.program ? PROGRAM_LABELS[sampleRecipient.program as Program] : "Work & Travel")
    .replace(/{Kalan_Bakiye}/g, sampleRecipient?.balance || "1.250 USD");

  function handleSendCampaign() {
    if (!contentTemplate.trim()) {
      setResultMsg({ text: "Mesaj içeriği boş olamaz.", type: "error" });
      return;
    }

    if (!confirm(`${audienceCount} alıcıya toplu bildirim gönderilecek. Onaylıyor musunuz?`)) {
      return;
    }

    setResultMsg(null);
    startTransition(async () => {
      const res = await sendBulkCampaign(
        { audience, program: selectedProgram, leadStatus },
        channel,
        subject,
        contentTemplate
      );

      if (res.success) {
        setResultMsg({
          text: `Kampanya başarıyla gönderildi! Toplam ${res.sentCount} alıcıya ulaşıldı.`,
          type: "success",
        });
      } else {
        setResultMsg({ text: res.error || "Gönderim sırasında hata oluştu.", type: "error" });
      }
    });
  }

  return (
    <div className="space-y-6">
      {resultMsg && (
        <div
          className={`flex items-center gap-2 rounded-2xl p-4 text-xs font-semibold shadow-sm ${
            resultMsg.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {resultMsg.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{resultMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Filter & Segmentation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Filter Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Hedef Kitle Segmentasyonu
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Audience Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Hedef Kitle</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as any)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="LEADS">Potansiyel Adaylar (Leadler)</option>
                  <option value="STUDENTS">Kayıtlı Öğrenciler</option>
                </select>
              </div>

              {/* Program Vertical */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Program</label>
                <select
                  value={selectedProgram || ""}
                  onChange={(e) => setSelectedProgram((e.target.value as Program) || undefined)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Tüm Programlar</option>
                  {Object.entries(PROGRAM_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              {audience === "LEADS" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Lead Durumu</label>
                  <select
                    value={leadStatus}
                    onChange={(e) => setLeadStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">Tüm Durumlar</option>
                    {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Recipient Counter Badge */}
            <div className="flex items-center justify-between rounded-xl bg-blue-50/70 px-4 py-3 border border-blue-100">
              <span className="text-xs font-medium text-blue-900">Hedeflenen Toplam Alıcı Sayısı:</span>
              <span className="text-sm font-bold text-blue-700">{audienceCount} Kişi</span>
            </div>
          </div>

          {/* Message Content & Variables Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Mesaj & Şablon Oluşturucu</h3>

            {/* Channel Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-600">İletişim Kanalı:</span>
              <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setChannel("SMS")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                    channel === "SMS" ? "bg-white text-blue-700 shadow-xs" : "text-gray-600"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Toplu SMS
                </button>
                <button
                  type="button"
                  onClick={() => setChannel("EMAIL")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                    channel === "EMAIL" ? "bg-white text-blue-700 shadow-xs" : "text-gray-600"
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" /> Toplu E-Posta
                </button>
                <button
                  type="button"
                  onClick={() => setChannel("BOTH")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                    channel === "BOTH" ? "bg-white text-blue-700 shadow-xs" : "text-gray-600"
                  }`}
                >
                  SMS + E-Posta
                </button>
              </div>
            </div>

            {/* Email Subject if applicable */}
            {(channel === "EMAIL" || channel === "BOTH") && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">E-Posta Konusu</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* Dynamic Template Tags */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Tag className="h-3 w-3 text-blue-600" />
                Dinamik Değişkenler (Tıklayarak ekleyebilirsiniz):
              </label>
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_VARIABLES.map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => handleInsertTag(v.tag)}
                    className="inline-flex items-center gap-1 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-700 px-2.5 py-1 text-[11px] font-mono font-medium text-gray-700 transition-colors border border-gray-200"
                  >
                    <span>{v.tag}</span>
                    <span className="text-[10px] text-gray-400">({v.label})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message Template Textarea */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mesaj İçeriği</label>
              <textarea
                rows={5}
                value={contentTemplate}
                onChange={(e) => setContentTemplate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 font-sans leading-relaxed"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Karakter Sayısı: {contentTemplate.length} (Yaklaşık {Math.ceil(contentTemplate.length / 155)} SMS)
              </p>
            </div>

            {/* Send Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={isPending || audienceCount === 0}
                onClick={handleSendCampaign}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
                {isPending ? "Kampanya Gönderiliyor…" : `Kampanyayı Başlat (${audienceCount} Alıcı)`}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Sample Interpolation Preview */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-600" />
              Canlı Önizleme (Örnek Alıcı)
            </h3>

            {sampleRecipient ? (
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-xs space-y-2">
                <div className="border-b border-gray-200 pb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Örnek Alıcı Verisi:
                  </p>
                  <p className="font-semibold text-gray-800">{sampleRecipient.name}</p>
                  <p className="text-[11px] text-gray-500">{sampleRecipient.email} · {sampleRecipient.phone}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    İletilecek Mesaj Görünümü:
                  </p>
                  <div className="rounded-lg bg-white border border-gray-200 p-3 text-xs text-gray-800 leading-relaxed font-sans shadow-xs">
                    {previewText}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">Filtreye uygun alıcı bulunamadı.</p>
            )}

            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-[11px] text-amber-800 leading-tight">
              <strong>Not:</strong> Gönderilen SMS ve E-postalar operatör kotalarına ve KVKK iletişim onaylarına uygun olarak işlenmektedir.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
