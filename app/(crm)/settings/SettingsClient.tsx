// app/(crm)/settings/SettingsClient.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  UserPlus,
  Users,
  Mail,
  Phone,
  Shield,
  Building,
  Key,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  X,
  Send,
  Copy,
  Check,
  Server,
  Radio,
  Sliders,
  Sparkles,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import { createStaffUser, toggleUserStatus, type UserActionState } from "@/actions/crm/users";
import { sendTestMessage, type IntegrationStatus } from "@/actions/crm/integrations";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { StaffPermissionsModal } from "@/components/crm/settings/StaffPermissionsModal";
import { ProgramBadge } from "@/components/crm/common/ProgramBadge";
import type { Program } from "@/types/crm";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      <UserPlus className="h-4 w-4" />
      {pending ? "Oluşturuluyor…" : "Hesabı Tanımla"}
    </button>
  );
}

interface Props {
  initialUsers: any[];
  currentUserId: string;
  integrationStatus: IntegrationStatus;
}

export default function SettingsClient({ initialUsers, currentUserId, integrationStatus }: Props) {
  const [activeTab, setActiveTab] = useState<"USERS" | "INTEGRATIONS" | "CHECKLIST">("USERS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Test Notification State
  const [testChannel, setTestChannel] = useState<"EMAIL" | "SMS">("EMAIL");
  const [testTarget, setTestTarget] = useState("");
  const [testResult, setTestResult] = useState<{ success?: boolean; msg?: string } | null>(null);
  const [isTesting, startTestTransition] = useTransition();

  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useFormState<UserActionState, FormData>(
    createStaffUser,
    { success: false, error: "" }
  );

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        setIsModalOpen(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.success]);

  function copyToClipboard(text: string, keyName: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function handleSendTest() {
    if (!testTarget) return;
    setTestResult(null);
    startTestTransition(async () => {
      const res = await sendTestMessage(testChannel, testTarget);
      if (res.success) {
        setTestResult({ success: true, msg: `Test ${testChannel} bildirimi başarıyla sevk edildi!` });
      } else {
        setTestResult({ success: false, msg: res.error || "Gönderim başarısız." });
      }
    });
  }

  function handleToggleActive(userId: string, currentActive: boolean) {
    if (userId === currentUserId) {
      alert("Kendi hesabınızı devre dışı bırakamazsınız.");
      return;
    }
    if (!confirm(`Bu kullanıcının durumunu ${currentActive ? "PASİF" : "AKTİF"} yapmak istiyor musunuz?`)) {
      return;
    }
    startTransition(() => {
      toggleUserStatus(userId, !currentActive);
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Tab Selector ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("USERS")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors",
            activeTab === "USERS"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          )}
        >
          <Users className="h-4 w-4" />
          Personel & Yetkiler ({initialUsers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("INTEGRATIONS")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors",
            activeTab === "INTEGRATIONS"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          )}
        >
          <Sliders className="h-4 w-4" />
          Entegrasyonlar & API Yapılandırması
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("CHECKLIST")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors",
            activeTab === "CHECKLIST"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          )}
        >
          <ClipboardList className="h-4 w-4" />
          Canlıya Geçiş Kontrol Listesi
        </button>
      </div>

      {/* ── TAB 1: USERS ─────────────────────────────────────────────────── */}
      {activeTab === "USERS" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="rounded-xl bg-white border border-gray-100 p-3 shadow-sm flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Toplam Danışman & Yönetici</p>
                <p className="text-base font-bold text-gray-900">{initialUsers.length} Kullanıcı</p>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Yeni Danışman / Personel Tanımla
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/75">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Personel</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Yetki Rolü</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Departman</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Eriştiği Modüller</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Öğrenci / Lead</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Durum</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Kayıt Tarihi</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Eylemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {initialUsers.map((u) => {
                  const isSelf = u.id === currentUserId;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                            {u.fullName?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                              {u.fullName}
                              {isSelf && (
                                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">Siz</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          u.role === "ADMIN"
                            ? "bg-gray-900 text-amber-300 border border-gray-800 shadow-2xs"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                          <ShieldCheck className={`h-3 w-3 ${u.role === "ADMIN" ? "text-amber-400" : "text-slate-500"}`} />
                          {(ROLE_LABELS as any)[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-gray-600">
                        {u.advisorProfile?.department || "Genel Operasyon"}
                      </td>
                      <td className="px-5 py-4">
                        {u.role === "ADMIN" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-950 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs border border-gray-800">
                            <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                            Tüm Modüller (Admin)
                          </span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1 max-w-xs">
                            {u.advisorProfile?.allowedPrograms && u.advisorProfile.allowedPrograms.length > 0 ? (
                              u.advisorProfile.allowedPrograms.map((p: Program) => (
                                <ProgramBadge key={p} program={p} showIcon size="sm" />
                              ))
                            ) : (
                              <span className="text-xs text-gray-400">Modül seçilmemiş</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <span className="font-semibold text-gray-900">{u._count.studentsAsAdvisor}</span> Öğrenci /{" "}
                        <span className="font-semibold text-gray-900">{u._count.leadsAsAdvisor}</span> Lead
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${u.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                          {u.isActive ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">{formatDate(u.createdAt)}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingPermissionsUser(u)}
                            className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
                          >
                            <Sliders className="h-3.5 w-3.5" />
                            Yetkileri Düzenle
                          </button>

                          <button
                            onClick={() => handleToggleActive(u.id, u.isActive)}
                            disabled={isSelf || isPending}
                            className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
                              u.isActive ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {u.isActive ? "Pasife Al" : "Aktif Et"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: INTEGRATIONS & API ────────────────────────────────────── */}
      {activeTab === "INTEGRATIONS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Email Config Card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">E-Posta Bildirim Altyapısı</h3>
                    <p className="text-xs text-gray-500">Otomatik bildirimler ve toplu pazarlama mailleri</p>
                  </div>
                </div>
                <span className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-bold",
                  integrationStatus.email.hasApiKey ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                )}>
                  {integrationStatus.email.provider}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-gray-50 py-2">
                  <span className="text-gray-500">Gönderen Adres (FROM):</span>
                  <span className="font-mono font-bold text-gray-800">{integrationStatus.email.fromAddress}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 py-2">
                  <span className="text-gray-500">API / SMTP Durumu:</span>
                  <span className="font-semibold text-gray-700">
                    {integrationStatus.email.hasApiKey ? "Tanımlı (Canlı Gönderim Aktif)" : "Tanımlanmamış (Konsol Simülasyonu)"}
                  </span>
                </div>
              </div>
            </div>

            {/* SMS Config Card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Netgsm SMS Altyapısı</h3>
                    <p className="text-xs text-gray-500">Vize randevu, aşama ve acil SMS uyarıları</p>
                  </div>
                </div>
                <span className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-bold",
                  integrationStatus.sms.hasUsercode ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                )}>
                  {integrationStatus.sms.provider}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-gray-50 py-2">
                  <span className="text-gray-500">SMS Gönderici Başlığı:</span>
                  <span className="font-mono font-bold text-gray-800">{integrationStatus.sms.header}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 py-2">
                  <span className="text-gray-500">Netgsm API Hesabı:</span>
                  <span className="font-semibold text-gray-700">
                    {integrationStatus.sms.hasUsercode ? "Bağlı (Canlı SMS Aktif)" : "Tanımlanmamış (Simülasyon Modu)"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Webhooks Section */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Server className="h-4 w-4 text-purple-600" />
              Canlı Reklam Webhook Uç Noktaları (Lead Ads)
            </h3>
            <p className="text-xs text-gray-500">
              Meta Business Manager veya Google Ads paneline girilmesi gereken resmi Webhook URL ve doğrulama anahtarları:
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-2">
                <p className="text-xs font-bold text-gray-700">Meta (Instagram / Facebook) Webhook URL</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={integrationStatus.webhooks.metaUrl}
                    className="w-full font-mono text-[11px] rounded-lg border border-gray-200 bg-white p-2 text-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(integrationStatus.webhooks.metaUrl, "meta")}
                    className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-100"
                  >
                    {copiedKey === "meta" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-2">
                <p className="text-xs font-bold text-gray-700">Google Ads Lead Webhook URL</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={integrationStatus.webhooks.googleUrl}
                    className="w-full font-mono text-[11px] rounded-lg border border-gray-200 bg-white p-2 text-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(integrationStatus.webhooks.googleUrl, "google")}
                    className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-100"
                  >
                    {copiedKey === "google" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Test Sender Console */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-600" />
              Canlı Test Bildirimi Gönder
            </h3>
            <p className="text-xs text-gray-500">
              Müşteriden alınan SMTP veya Netgsm bilgileri girildiğinde anında canlı test yapabilirsiniz.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => setTestChannel("EMAIL")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                    testChannel === "EMAIL" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
                  )}
                >
                  E-Posta Testi
                </button>
                <button
                  type="button"
                  onClick={() => setTestChannel("SMS")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                    testChannel === "SMS" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
                  )}
                >
                  SMS Testi
                </button>
              </div>

              <input
                type="text"
                placeholder={testChannel === "EMAIL" ? "test@example.com" : "0532 000 00 00"}
                value={testTarget}
                onChange={(e) => setTestTarget(e.target.value)}
                className="flex-1 min-w-[240px] rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none"
              />

              <button
                type="button"
                onClick={handleSendTest}
                disabled={isTesting || !testTarget}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
                {isTesting ? "Gönderiliyor…" : "Test Gönder"}
              </button>
            </div>

            {testResult && (
              <div className={cn(
                "rounded-xl p-3 text-xs flex items-center gap-2",
                testResult.success ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
              )}>
                {testResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                <span>{testResult.msg}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: CHECKLIST ─────────────────────────────────────────────── */}
      {activeTab === "CHECKLIST" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-900">Canlıya Geçiş (Production) Kontrol Listesi</h3>
            <p className="text-xs text-gray-500 mt-1">
              Bu bilgiler Advice Yurtdışı Eğitim yetkililerinden temin edilecek ve sisteme işlenecektir.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-2">
              <h4 className="text-xs font-bold text-blue-900 uppercase">1. E-Posta Gönderim Altyapısı</h4>
              <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                <li>Gönderen E-Posta Adresi (`bilgi@adviceyed.com` veya `operasyon@adviceyed.com`)</li>
                <li>SMTP Sunucu Adresi (`smtp.yandex.com` / `smtp.gmail.com`) veya Resend API Anahtarı</li>
                <li>Domain SPF, DKIM ve DMARC DNS kayıtları (Spam engelleme)</li>
              </ul>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-2">
              <h4 className="text-xs font-bold text-emerald-900 uppercase">2. SMS Servis Sağlayıcısı (Netgsm)</h4>
              <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                <li>SMS Gönderici Başlığı (Örn: `ADVICE` veya `ADVICEYED`)</li>
                <li>Netgsm Kullanıcı Kodu (`NETGSM_USERCODE`)</li>
                <li>Netgsm API Şifresi (`NETGSM_PASSWORD`)</li>
              </ul>
            </div>

            <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4 space-y-2">
              <h4 className="text-xs font-bold text-purple-900 uppercase">3. Dijital Lead Webhookları</h4>
              <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                <li>Meta Business Manager &gt; Webhooks sayfasına canlı URL tanımlanması</li>
                <li>Google Ads Lead Form webhook entegrasyonu</li>
              </ul>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 space-y-2">
              <h4 className="text-xs font-bold text-amber-900 uppercase">4. Sunucu & Güvenlik</h4>
              <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                <li>Canlı Subdomain yönlendirmesi (`crm.adviceyed.com`)</li>
                <li>SSL Sertifikası (HTTPS aktifliği)</li>
                <li>Sözleşme & Pasaport yükleme klasörü depolama izinleri</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE USER MODAL ────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Yeni Personel Tanımla</h3>
                  <p className="text-[11px] text-gray-400">Danışman veya Yönetici hesabı oluşturun</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={formAction} className="p-6 space-y-4">
              {!state.success && (state as any).error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{(state as any).error}</span>
                </div>
              )}

              {state.success && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>Kullanıcı başarıyla oluşturuldu!</span>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Ad Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="Örn: Mehmet Danışman"
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Giriş E-Posta Adresi <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="mehmet@advicecrm.com"
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Telefon Numarası
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="0532 000 0000"
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Başlangıç Şifresi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    defaultValue="Password123!"
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Yetki Rolü <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    defaultValue="ADVISOR"
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none bg-white"
                  >
                    <option value="ADVISOR">Danışman (Advisor)</option>
                    <option value="ADMIN">Yönetici (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Departman / Program
                  </label>
                  <input
                    type="text"
                    name="department"
                    placeholder="Örn: Work and Travel"
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Erişebileceği Program Modülleri
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { val: "WORK_AND_TRAVEL", label: "Work & Travel" },
                    { val: "ACADEMY", label: "Akademi" },
                    { val: "LANGUAGE_SCHOOL", label: "Dil Okulları" },
                    { val: "SUMMER_CAMP", label: "Yaz Okulları" },
                    { val: "VISA_CONSULTING", label: "Vize Başvuruları" },
                  ].map((p) => (
                    <label key={p.val} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        name="allowedPrograms"
                        value={p.val}
                        defaultChecked
                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-gray-700 text-[11px]">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  İptal
                </button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Granular Permissions Modal ────────────────────────────────────── */}
      {editingPermissionsUser && (
        <StaffPermissionsModal
          user={editingPermissionsUser}
          currentUserId={currentUserId}
          isOpen={!!editingPermissionsUser}
          onClose={() => setEditingPermissionsUser(null)}
        />
      )}
    </div>
  );
}
