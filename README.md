# Advice Yurtdışı Eğitim - CRM & Öğrenci Portalı

Advice Yurtdışı Eğitim Danışmanlığı için geliştirilmiş, Next.js 14 App Router, TypeScript, Prisma ORM, PostgreSQL ve Tailwind CSS tabanlı tam kapsamlı kurumsal CRM ve Öğrenci Portalı platformu.

---

## 🌟 Temel Özellikler

### 👥 1. Danışman & Yönetici CRM Paneli
- **Program Odaklı Modüller:**
  - 🇺🇸 **Work and Travel (WAT):** DS-2019 takibi, iş ve konaklama eşleştirmesi, vize süreci, seyahat planlaması.
  - 🎓 **Akademi:** Lisans/Yüksek Lisans başvuruları, üniversite yerleştirmeleri, dil skoru takibi (IELTS/TOEFL).
  - 🗣️ **Dil Okulları:** Hafta bazlı kurs, konaklama ve şehir yerleştirme yönetimi.
  - ☀️ **Yaz Okulları:** Genç kampları ve grup kayıtları.
  - 🛂 **Vize Danışmanlığı:** Konsolosluk randevuları ve evrak checklist süreçleri.
- **Dinamik Rol & Yetki Sistemi:** Danışman bazlı program yetkilendirmesi, modül erişim kısıtlamaları.
- **Onay Merkezi (Approval Queue):** Öğrenci bilgi ve evrak değişiklikleri için eski/yeni veri (Diff) karşılaştırmalı onay kuyruğu.
- **Pazarlama & Lead Entegrasyonları:** Meta (Facebook/Instagram) ve Google Ads lead webhook'ları, toplu CSV/Excel import.

### 🎓 2. Öğrenci Portalı (Student Self-Service)
- **Program İlerleme Sihirbazı:** Başvurudan vizeye adım adım görsel süreç takibi.
- **Evrak Yükleme & Durum Takibi:** Pasaport, transkript, sponsor mektubu yükleme ve revize bildirimleri.
- **Ödeme & Taksit Takibi:** Kalan bakiye, vade tarihleri ve tahsilat makbuzu görüntüleme.

---

## 🚀 Canlı Dağıtım (CI/CD)

Projede GitHub Actions tabanlı tam otomatik canlı dağıtım hattı aktiftir. `main` branch'ine yapılan her `git push` işlemi:
1. Oracle Cloud sunucusuna bağlanır.
2. En güncel kodları çeker.
3. Prisma veritabanı şemasını PostgreSQL'e senkronize eder.
4. Next.js prodüksiyon derlemesini tamamlar.
5. PM2 ile kesintisiz (zero-downtime) uygulamayı canlıya alır.

---

## 🛠️ Yerel Geliştirme (Local Setup)

```bash
# Bağımlılıkları yükleyin
npm install

# Veritabanı şemasını senkronize edin
npx prisma db push

# Test verilerini yükleyin
npm run prisma:seed

# Geliştirme sunucusunu başlatın
npm run dev
```

Geliştirme ortamı: `http://localhost:3000`
