// app/(crm)/[program]/catalog/page.tsx
// Program Catalog & Pricing Overview
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { getProgramFromSlug, PROGRAM_TITLES } from "@/lib/utils/programs";
import { PROGRAM_LABELS } from "@/types/crm";
import { WatJobCatalog } from "@/components/crm/catalog/WatJobCatalog";
import { ProgramBadge } from "@/components/crm/common/ProgramBadge";
import { BookOpen, Check, Download, ExternalLink, Globe2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    program: string;
  };
}

export default async function ProgramCatalogPage({ params }: Props) {
  await requireStaff();
  const programEnum = getProgramFromSlug(params.program);

  if (!programEnum) {
    notFound();
  }

  const title = PROGRAM_TITLES[params.program] || PROGRAM_LABELS[programEnum];
  const isWat = params.program === "wat";

  const CATALOG_DATA: Record<string, {
    description: string;
    seasons: string;
    sponsorsOrPartners: string[];
    priceRange: string;
    features: string[];
  }> = {
    wat: {
      description: "Amerika Birleşik Devletleri Dışişleri Bakanlığı denetiminde resmi Work and Travel Kültürel Değişim Programı.",
      seasons: "Yaz Dönemi (15 Mayıs - 1 Ekim)",
      sponsorsOrPartners: ["CIEE (Council on International Educational Exchange)", "InterExchange", "Greenheart International", "Premier Aquatics", "Wilderness Resort"],
      priceRange: "$3,250 - $3,650 USD",
      features: [
        "Resmi DS-2019 Belgesi ve SEVIS Kaydı",
        "İşveren Mülakatı ve İş Sözleşmesi Garantisi",
        "Amerika Geneli Kapsamlı Aetna Sağlık Sigortası",
        "J-1 Vize Danışmanlığı ve Konsolosluk Randevu Dosyası",
        "7/24 ABD Acil Destek ve Oryantasyon Semineri",
      ],
    },
    academy: {
      description: "Yurtdışında Lisans, Yüksek Lisans, Doktora ve Pre-Master / Foundation Hazırlık Programları Danışmanlığı.",
      seasons: "Güz (Eylül/Ekim) ve Bahar (Ocak/Şubat) Dönemleri",
      sponsorsOrPartners: ["Technical University of Munich (TUM)", "RWTH Aachen", "University of Manchester", "King's College London", "University of Amsterdam"],
      priceRange: "Danışmanlık Paketi: €1,500 - €2,800 EUR",
      features: [
        "Profil Değerlendirme & Uygun Üniversite/Bölüm Seçimi (Shortlist)",
        "Niyet Mektubu (SOP) ve CV Profesyonel Redaksiyonu",
        "IELTS / TOEFL Dil Sınavı Yol Haritası ve Stratejisi",
        "Resmi Başvuru Portalları (Uni-Assist vb.) Takibi",
        "Öğrenci Vizesi ve Bloke Hesap (Expatrio vb.) Rehberliği",
      ],
    },
    language: {
      description: "İngiltere, İrlanda, Malta, ABD, Kanada ve Avustralya'da Genel & Yoğun İngilizce Dil Eğitimi.",
      seasons: "Yıl Boyu Her Pazartesi Başlangıç",
      sponsorsOrPartners: ["EC English", "Kaplan International", "Oxford International", "CES English", "ILAC Canada"],
      priceRange: "Haftalık: £180 - £350 GBP / $220 - $400 USD",
      features: [
        "Seviye Belirleme Testi ve Kurs Seçimi",
        "Aile Yanı veya Öğrenci Yurdu Konaklama Garantisi",
        "Okul Kayıt ve Kabul Mektubu (CAS / I-20)",
        "Havalimanı Karşılama ve Transfer Organizasyonu",
      ],
    },
    "summer-camp": {
      description: "7 - 17 Yaş Grubu Çocuklar ve Gençler İçin İngilizce Dil & Aktivite Yaz Kampları.",
      seasons: "Haziran, Temmuz, Ağustos (2-4 Hafta)",
      sponsorsOrPartners: ["Alpadia Language Schools", "Ardmore Language Travel", "Bucksmore Education", "St. Giles"],
      priceRange: "2 Hafta Tam Pansiyon: £1,900 - £2,800 GBP",
      features: [
        "Grup Lideri Eşliğinde Türkiye'den Gidiş-Dönüş Uçuşlar",
        "Kampüs İçi Tam Pansiyon Konaklama ve Güvenlik",
        "Haftalık Kültürel Geziler (Londra, Oxford, Cambridge vb.)",
        "Sosyal, Sportif ve Sanatsal Atölye Çalışmaları",
      ],
    },
    visa: {
      description: "Turistik, Ticari ve Aile Ziyareti Vize Başvuru Danışmanlığı (ABD, Schengen, İngiltere, Kanada).",
      seasons: "Yılın 365 Günü",
      sponsorsOrPartners: ["ABD Büyükelçiliği (DS-160)", "TLScontact", "VFS Global", "iDATA", "BLS International"],
      priceRange: "Danışmanlık: ₺7,500 - ₺15,000 + Harç Bedelleri",
      features: [
        "Vize Başvuru Formlarının (DS-160 vb.) Hatasız Doldurulması",
        "Banka ve Gelir Evraklarının Konsolosluk Standartlarına Uygun Hazırlanması",
        "En Erken Konsolosluk Randevu Slotunun Yakalanması",
        "Mülakat Öncesi Birebir Danışman Provasi",
      ],
    },
  };

  const currentData = CATALOG_DATA[params.program] || CATALOG_DATA.wat;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ProgramBadge program={programEnum} showIcon size="md" />
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            {title} — Program Kataloğu & Bilgi Paketi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {currentData.description}
          </p>
        </div>

        <button
          disabled
          className="flex items-center gap-2 rounded-xl bg-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-500 cursor-not-allowed shadow-sm"
          title="PDF çıktısı yakında aktif olacak"
        >
          <Download className="h-4 w-4" />
          Katalog PDF İndir
        </button>
      </div>

      {/* If WAT, render interactive ABD İş Kataloğu */}
      {isWat && (
        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-2">
            <h2 className="text-lg font-bold text-gray-900">ABD İş ve Pozisyon Kataloğu (2026 Sezonu)</h2>
            <p className="text-xs text-gray-500">Anlaşmalı resmi sponsor iş yerleri, saatlik ücretler ve güncel kontenjan listesi.</p>
          </div>
          <WatJobCatalog />
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sol: Paket İçeriği */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            Paket Kapsamı & Hizmet Standartları
          </h2>
          <div className="rounded-xl bg-blue-50/50 p-4 border border-blue-100 text-xs">
            <span className="text-blue-900 font-semibold block">Referans Fiyat Skalası:</span>
            <span className="text-blue-700 font-bold text-lg">{currentData.priceRange}</span>
            <span className="text-blue-500 block mt-1">Dönem: {currentData.seasons}</span>
          </div>

          <ul className="space-y-2.5 text-xs text-gray-700">
            {currentData.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="h-3 w-3" />
                </span>
                <span className="mt-0.5 leading-relaxed font-medium">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sağ: Partnerler ve Kurumlar */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-purple-600" />
            Resmi Sponsorlar & Anlaşmalı Partnerler
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Advice Yurtdışı Eğitim güvencesiyle akredite edilmiş resmi sponsor kurumlar, üniversiteler ve zincir dil okulları.
          </p>

          <div className="space-y-2">
            {currentData.sponsorsOrPartners.map((partner, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 text-xs hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-800">{partner}</span>
                <span className="text-blue-600 font-medium text-[11px] flex items-center gap-1">
                  Akredite Partner <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
