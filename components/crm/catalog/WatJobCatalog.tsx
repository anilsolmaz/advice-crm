"use client";

import { useState } from "react";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Users,
  Calendar,
  Clock,
  Home,
  Award,
  Search,
  Filter,
  X,
  ExternalLink,
  CheckCircle2,
  Building,
} from "lucide-react";

export interface WatJobItem {
  id: string;
  employerName: string;
  sponsor: "CIEE" | "AWA" | "UWT" | "InterExchange";
  jobTitle: string;
  hourlyRate: string;
  location: string;
  state: string;
  availableSlots: number;
  totalSlots: number;
  startDate: string;
  endDate: string;
  weeklyHours: string;
  englishLevel: "B1" | "B2" | "C1";
  housingInfo: string;
  housingCost: string;
  description: string;
}

const JOBS_DATA: WatJobItem[] = [
  {
    id: "job-1",
    employerName: "Wilderness Resort & Waterpark",
    sponsor: "CIEE",
    jobTitle: "Lifeguard & Pool Attendant",
    hourlyRate: "$16.50 / saat",
    location: "Wisconsin Dells",
    state: "WI",
    availableSlots: 8,
    totalSlots: 20,
    startDate: "15 Haziran 2026",
    endDate: "15 Eylül 2026",
    weeklyHours: "35 - 45 saat/hafta (Fazla Mesai 1.5x)",
    englishLevel: "B2",
    housingInfo: "İşveren tarafından sağlanan yurt tipi konaklama (2-3 kişilik odalar, Wi-Fi, mutfak)",
    housingCost: "$120 / hafta",
    description: "Amerika'nın en büyük kapalı su parkı kompleksinde cankurtaranlık pozisyonu. CIEE resmi sponsorluğunda Amerikan Kızılhaç cankurtaran sertifika eğitimi ücretsiz verilmektedir.",
  },
  {
    id: "job-2",
    employerName: "Premier Aquatics Inc.",
    sponsor: "CIEE",
    jobTitle: "Community Pool Lifeguard",
    hourlyRate: "$17.00 / saat",
    location: "Northern Virginia (Fairfax / Arlington)",
    state: "VA",
    availableSlots: 12,
    totalSlots: 25,
    startDate: "1 Haziran 2026",
    endDate: "07 Eylül 2026",
    weeklyHours: "40 - 50 saat/hafta",
    englishLevel: "B2",
    housingInfo: "Tam tefrişatlı apartman daireleri, havuza servis imkanı",
    housingCost: "$135 / hafta",
    description: "Washington D.C. metropol alanında yerleşim imkanı. Yüksek çalışma saati ve haftalık düzenli gelir.",
  },
  {
    id: "job-3",
    employerName: "Kalahari Resorts & Conventions",
    sponsor: "AWA",
    jobTitle: "Food & Beverage Attendant",
    hourlyRate: "$15.50 / saat + Bahşiş",
    location: "Sandusky",
    state: "OH",
    availableSlots: 5,
    totalSlots: 15,
    startDate: "10 Haziran 2026",
    endDate: "10 Eylül 2026",
    weeklyHours: "38 - 42 saat/hafta",
    englishLevel: "B1",
    housingInfo: "Kampüs içi personel lojmanı, yemek indirimi",
    housingCost: "$110 / hafta",
    description: "Afrika temalı resort otelde restoran ve servis ekibi. Bahşişlerle birlikte saatlik $22 seviyesine ulaşan gelir imkanı.",
  },
  {
    id: "job-4",
    employerName: "Morey's Piers & Beachfront Waterparks",
    sponsor: "UWT",
    jobTitle: "Ride Operator / Ride Attendant",
    hourlyRate: "$16.00 / saat",
    location: "Wildwood",
    state: "NJ",
    availableSlots: 10,
    totalSlots: 30,
    startDate: "20 Haziran 2026",
    endDate: "20 Eylül 2026",
    weeklyHours: "35 - 45 saat/hafta",
    englishLevel: "B1",
    housingInfo: "Okyanus kıyısına yürüme mesafesinde kiralık öğrenci evleri",
    housingCost: "$130 / hafta",
    description: "New Jersey sahilinde lunapark eğlence trenleri ve su kaydırakları işletme personeli. New York City ve Philadelphia'ya tren mesafesinde.",
  },
  {
    id: "job-5",
    employerName: "Grand Teton Lodge Company",
    sponsor: "InterExchange",
    jobTitle: "Hospitality & Guest Services",
    hourlyRate: "$17.50 / saat",
    location: "Moran (Yellowstone Region)",
    state: "WY",
    availableSlots: 4,
    totalSlots: 10,
    startDate: "05 Haziran 2026",
    endDate: "25 Eylül 2026",
    weeklyHours: "40 saat/hafta",
    englishLevel: "C1",
    housingInfo: "Milli park içi ahşap kabinler + 3 öğün yemek dahil",
    housingCost: "$100 / hafta (Yemekler Dahil)",
    description: "Dünyaca ünlü Grand Teton Milli Parkı içinde doğayla iç içe resepsiyon ve misafir karşılama pozisyonu. Yemeklerin konaklamaya dahil olması sebebiyle en yüksek net tasarruf sağlayan pozisyon.",
  },
];

export function WatJobCatalog() {
  const [search, setSearch] = useState("");
  const [sponsorFilter, setSponsorFilter] = useState<string>("ALL");
  const [stateFilter, setStateFilter] = useState<string>("ALL");
  const [selectedJob, setSelectedJob] = useState<WatJobItem | null>(null);

  const filtered = JOBS_DATA.filter((j) => {
    const matchesSearch =
      j.employerName.toLowerCase().includes(search.toLowerCase()) ||
      j.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      j.location.toLowerCase().includes(search.toLowerCase());

    const matchesSponsor = sponsorFilter === "ALL" || j.sponsor === sponsorFilter;
    const matchesState = stateFilter === "ALL" || j.state === stateFilter;

    return matchesSearch && matchesSponsor && matchesState;
  });

  return (
    <div className="space-y-6">
      {/* ── Toolbar & Filters ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="İşveren, pozisyon veya şehir ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 py-2 pl-10 pr-4 text-xs text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Sponsor Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold">Sponsor:</span>
          <select
            value={sponsorFilter}
            onChange={(e) => setSponsorFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700"
          >
            <option value="ALL">Tüm Sponsorlar</option>
            <option value="CIEE">CIEE</option>
            <option value="AWA">AWA</option>
            <option value="UWT">UWT</option>
            <option value="InterExchange">InterExchange</option>
          </select>
        </div>

        {/* State Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold">Eyalet:</span>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700"
          >
            <option value="ALL">Tüm Eyaletler</option>
            <option value="VA">Virginia (VA)</option>
            <option value="WI">Wisconsin (WI)</option>
            <option value="OH">Ohio (OH)</option>
            <option value="NJ">New Jersey (NJ)</option>
            <option value="WY">Wyoming (WY)</option>
          </select>
        </div>
      </div>

      {/* ── Job Cards Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((job) => (
          <div
            key={job.id}
            onClick={() => setSelectedJob(job)}
            className="cursor-pointer rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between group"
          >
            <div className="space-y-3">
              {/* Header: Sponsor tag & Wage badge */}
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                  {job.sponsor} Sponsorlu
                </span>
                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  {job.hourlyRate}
                </span>
              </div>

              {/* Title & Employer */}
              <div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {job.jobTitle}
                </h3>
                <p className="text-xs font-semibold text-gray-700 mt-1 flex items-center gap-1">
                  <Building className="h-3.5 w-3.5 text-gray-400" />
                  {job.employerName}
                </p>
              </div>

              {/* Location & Slots */}
              <div className="pt-2 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-rose-500" />
                    {job.location}, {job.state}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-blue-600">
                    <Users className="h-3.5 w-3.5" />
                    {job.availableSlots} / {job.totalSlots} Kontenjan
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>İngilizce: <strong className="text-gray-700">{job.englishLevel}</strong></span>
                  <span>{job.startDate.split(" ")[0]} - {job.endDate}</span>
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:underline">
              <span>İş ve Konaklama Detayları</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Interactive Detail Modal ────────────────────────────────────── */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex h-full max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-100 p-6 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                    {selectedJob.sponsor} Resmi Sponsor
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    ID: {selectedJob.id.toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mt-1">
                  {selectedJob.jobTitle}
                </h2>
                <p className="text-xs font-semibold text-gray-700 mt-0.5">
                  {selectedJob.employerName} · {selectedJob.location}, {selectedJob.state}
                </p>
              </div>

              <button
                onClick={() => setSelectedJob(null)}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-gray-700">
              {/* Highlight Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                  <span className="text-emerald-600 block text-[10px] uppercase font-bold">Saatlik Ücret</span>
                  <span className="text-base font-extrabold text-emerald-800">{selectedJob.hourlyRate}</span>
                </div>

                <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                  <span className="text-blue-600 block text-[10px] uppercase font-bold">Çalışma Saati</span>
                  <span className="text-xs font-bold text-blue-800">{selectedJob.weeklyHours}</span>
                </div>

                <div className="rounded-xl bg-purple-50 border border-purple-100 p-3">
                  <span className="text-purple-600 block text-[10px] uppercase font-bold">İngilizce Şartı</span>
                  <span className="text-base font-extrabold text-purple-800">{selectedJob.englishLevel} Seviyesi</span>
                </div>

                <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                  <span className="text-amber-600 block text-[10px] uppercase font-bold">Kalan Kontenjan</span>
                  <span className="text-base font-extrabold text-amber-800">{selectedJob.availableSlots} / {selectedJob.totalSlots}</span>
                </div>
              </div>

              {/* Dates */}
              <div className="rounded-2xl border border-gray-100 p-4 space-y-2">
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Sözleşme & Çalışma Tarihleri
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 block">İşe Başlama (Start Date):</span>
                    <span className="font-bold text-gray-800 text-sm">{selectedJob.startDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">İş Bitişi (End Date):</span>
                    <span className="font-bold text-gray-800 text-sm">{selectedJob.endDate}</span>
                  </div>
                </div>
              </div>

              {/* Housing */}
              <div className="rounded-2xl border border-gray-100 p-4 space-y-2">
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Home className="h-4 w-4 text-emerald-600" />
                  Konaklama ve Yaşam Şartları
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {selectedJob.housingInfo}
                </p>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Haftalık Konaklama Ücreti:</span>
                  <span className="font-bold text-gray-900 text-sm">{selectedJob.housingCost}</span>
                </div>
              </div>

              {/* Job Description */}
              <div className="rounded-2xl border border-gray-100 p-4 space-y-2">
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-purple-600" />
                  İş Tanımı ve Görev Sorumlulukları
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {selectedJob.description}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 p-4 flex items-center justify-between bg-slate-50">
              <span className="text-[11px] text-gray-500">
                Sponsor Onaylı İş Teklifi Formu (Job Offer Agreement)
              </span>
              <button
                onClick={() => {
                  alert(`"${selectedJob.employerName} - ${selectedJob.jobTitle}" pozisyonu öğrenci iş mülakat listesine eklendi.`);
                  setSelectedJob(null);
                }}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                Bu İşe Öğrenci Ata / Mülakata Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
