# ADVICE YURTDIŞI EĞİTİM CRM — CANLIYA GEÇİŞ (PRODUCTION) BİLGİ & ENTEGRASYON LİSTESİ

> **Amaç**: Bu liste, Advice Yurtdışı Eğitim yetkililerinden / teknik sorumlularından temin edilecek bilgileri ve canlı sunucuya geçişte girilecek anahtarları içermektedir. Bilgiler geldikçe `.env` dosyasına ve CRM Ayarlar paneline işlenecektir.

---

## 1. E-POSTA ALTYAPISI (BİLGİLENDİRME & TOPLU MAİL)

- [ ] **Gönderen E-Posta Adresi (`EMAIL_FROM`)**:
  * *Örnek*: `Advice Yurtdışı Eğitim <bilgi@adviceyed.com>` veya `operasyon@adviceyed.com`
  * *Müşteriden Alınan*: `_______________________`
- [ ] **E-Posta Dağıtım Yöntemi (SMTP veya API)**:
  * **Yöntem A — Kurumsal E-Posta SMTP (Yandex / Google Workspace / CPanel)**:
    - `SMTP_HOST`: (Örn: `smtp.yandex.com` veya `smtp.gmail.com`)
    - `SMTP_PORT`: (465 veya 587)
    - `SMTP_USER`: (Örn: `bilgi@adviceyed.com`)
    - `SMTP_PASS`: (Uygulama şifresi)
    - `SMTP_SECURE`: (`true` veya `false`)
  * **Yöntem B — İşlemsel E-Posta API (Resend / SendGrid)**:
    - `RESEND_API_KEY`: `re_...`
- [ ] **Domain DNS Kayıtları (Spam Koruması)**:
  - [ ] **SPF Kaydı**: `v=spf1 include:... ~all`
  - [ ] **DKIM Kaydı**: E-posta servisinden alınan TXT kaydı
  - [ ] **DMARC Kaydı**: `v=DMARC1; p=none; sp=none;`

---

## 2. SMS ALTYAPISI (NETGSM / İLETİMERKEZİ)

- [ ] **SMS Gönderici Başlığı (`NETGSM_HEADER`)**:
  * *Örnek*: `ADVICE` veya `ADVICEYED` (BTK onaylı 11 karakter alfanümerik)
  * *Müşteriden Alınan*: `_______________________`
- [ ] **Netgsm Kullanıcı Kodu (`NETGSM_USERCODE`)**:
  * *Müşteriden Alınan*: `_______________________`
- [ ] **Netgsm API Şifresi (`NETGSM_PASSWORD`)**:
  * *Müşteriden Alınan*: `_______________________`

---

## 3. DİJİTAL LEAD ENTEGRASYONLARI (REKLAM FORMLARI)

- [ ] **Meta (Instagram & Facebook Lead Ads)**:
  * Canlı Webhook URL: `https://crm.adviceyed.com/api/webhooks/meta-leads`
  * Webhook Doğrulama Token'ı (`META_WEBHOOK_VERIFY_TOKEN`): `advice_meta_webhook_secret_2026`
  * Meta App ID & App Secret: `_______________________`
  * Page Access Token: `_______________________`
- [ ] **Google Ads Lead Form Entegrasyonu**:
  * Canlı Webhook URL: `https://crm.adviceyed.com/api/webhooks/google-leads?key=advice_google_webhook_key_2026`
  * Webhook Anahtarı (`GOOGLE_LEADS_WEBHOOK_KEY`): `advice_google_webhook_key_2026`

---

## 4. CANLI SUNUCU & GÜVENLİK (HOSTING & DEPOLAMA)

- [ ] **Canlı Domain / Subdomain**:
  * *Örnek*: `crm.adviceyed.com` veya `panel.adviceyed.com`
- [ ] **SSL Sertifikası (HTTPS)**:
  * Let's Encrypt veya Cloudflare SSL aktif edilmeli.
- [ ] **Evrak Depolama İzinleri**:
  * Sunucudaki `public/uploads/` dizinine yazma/okuma izinleri verilmeli.
- [ ] **Canlı Veritabanı (PostgreSQL)**:
  * PostgreSQL port 5432, veritabanı adı `advice_crm`, otomatik günlük yedekleme (cron job / pg_dump).
