"use client";

import { useState, useTransition } from "react";
import {
  Briefcase,
  MapPin,
  Users,
  Calendar,
  Home,
  Search,
  X,
  Plus,
  Link2,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Copy,
  Plane,
  Utensils,
  Bus,
  Shirt,
  Sparkles,
} from "lucide-react";
import {
  createWatJob,
  deleteWatJob,
  createStudentJobLink,
  type WatJobInput,
} from "@/actions/crm/jobs";
import { formatDate } from "@/lib/utils/date";

export interface WatJobAssignmentSerialized {
  id: string;
  studentId: string;
  studentName: string;
  shareToken: string;
  status: string;
  studentNote: string | null;
  respondedAt: string | Date | null;
  createdAt: string | Date;
}

export interface WatJobRecord {
  id: string;
  sponsor: string;
  program: string;
  jobCategory: string;
  jobTitle: string;
  placementType: string;
  location: string;
  state: string | null;
  arrivalAirport: string | null;
  hourlyWage: string | number;
  avgWorkingHours: number;
  accommodationCost: string | number | null;
  accommodationDeposit: string | number | null;
  food: string | null;
  transportation: string | null;
  workApparel: string | null;
  position: string | null;
  genderPreference: string;
  jobStartDate: string | Date;
  jobEndDate: string | Date;
  earlyLeaveInfo: string | null;
  numPlacements: number;
  filledPlacements: number;
  bonus: string | null;
  additionalInfo: string | null;
  assignments?: WatJobAssignmentSerialized[];
}

interface Props {
  initialJobs?: WatJobRecord[];
  watStudents?: { id: string; fullName: string; email: string }[];
}

const SPONSORS = ["AWA", "UWT", "IEE", "Life Adventures", "CIEE", "Diğer"];
const JOB_CATEGORIES = [
  "Lifeguard",
  "Hospitality",
  "Amusement Park",
  "Food & Beverage",
  "Retail",
  "Resort",
  "Other",
];
const PLACEMENT_TYPES = ["Full Placement", "Self Placement", "Direct Placement"];
const GENDER_PREFS = ["Males and Females", "Females Only", "Males Only"];

export function WatJobCatalog({ initialJobs = [], watStudents = [] }: Props) {
  const [search, setSearch] = useState("");
  const [sponsorFilter, setSponsorFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [selectedJob, setSelectedJob] = useState<WatJobRecord | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    watStudents[0]?.id || "",
  );
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [newJob, setNewJob] = useState<WatJobInput>({
    sponsor: "AWA",
    program: "Work and Travel",
    jobCategory: "Hospitality",
    jobTitle: "",
    placementType: "Full Placement",
    location: "",
    state: "",
    arrivalAirport: "JFK - New York",
    hourlyWage: 16.5,
    avgWorkingHours: 38,
    accommodationCost: 125,
    accommodationDeposit: 200,
    food: "Vardiyada 1 Öğün Ücretsiz",
    transportation: "Yürüme Mesafesi / Bisiklet",
    workApparel: "İşveren Tişört Verir, Siyah Pantolon",
    position: "",
    genderPreference: "Males and Females",
    jobStartDate: "2026-06-15",
    jobEndDate: "2026-09-15",
    earlyLeaveInfo: "1 Eylül sonrası okul belgesiyle uygun",
    numPlacements: 6,
    bonus: "$250 Sezon Sonu Tamamlama Bonusu",
    additionalInfo: "",
  });

  const filtered = initialJobs.filter((j) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      j.jobTitle.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q) ||
      (j.position && j.position.toLowerCase().includes(q));
    const matchesSponsor =
      sponsorFilter === "ALL" || j.sponsor === sponsorFilter;
    const matchesCategory =
      categoryFilter === "ALL" || j.jobCategory === categoryFilter;
    return matchesSearch && matchesSponsor && matchesCategory;
  });

  function handleCreateJob(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    startTransition(async () => {
      const res = await createWatJob(newJob);
      if (!res.success) {
        setFormError(res.error);
      } else {
        setIsAddOpen(false);
      }
    });
  }

  function handleDeleteJob(jobId: string) {
    if (!confirm("Bu işi iş havuzundan silmek istediğinize emin misiniz?"))
      return;
    startTransition(async () => {
      await deleteWatJob(jobId);
      setSelectedJob(null);
    });
  }

  function handleAssignLink(jobId: string) {
    if (!selectedStudentId) {
      alert("Lütfen önce listeden bir öğrenci seçin.");
      return;
    }
    startTransition(async () => {
      const res = await createStudentJobLink(jobId, selectedStudentId);
      if (res.success && res.shareUrl) {
        const fullUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}${res.shareUrl}`
            : res.shareUrl;
        setGeneratedLink(fullUrl);
      } else if (!res.success) {
        alert(res.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Top Action & Filter Bar ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="İşveren, pozisyon veya eyalet ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-xs sm:text-sm text-slate-800 focus:border-[#0f172a] focus:outline-none"
          />
        </div>

        <select
          value={sponsorFilter}
          onChange={(e) => setSponsorFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
        >
          <option value="ALL">Tüm Sponsorlar</option>
          {SPONSORS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
        >
          <option value="ALL">Tüm Kategoriler</option>
          {JOB_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#0f172a] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#1e3a8a] transition-colors"
        >
          <Plus className="h-4 w-4 text-sky-400" />
          Yeni İş Ekle (22 Kriter)
        </button>
      </div>

      {/* ── Job Cards Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((job) => {
          const remaining = Math.max(0, job.numPlacements - job.filledPlacements);
          return (
            <div
              key={job.id}
              onClick={() => {
                setSelectedJob(job);
                setGeneratedLink(null);
              }}
              className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-[#1e3a8a] transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-lg bg-[#0f172a] px-2.5 py-1 text-[11px] font-bold text-white">
                    {job.sponsor} · {job.jobCategory}
                  </span>
                  <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-black text-emerald-700">
                    ${String(job.hourlyWage)} / saat
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#1e3a8a] transition-colors">
                    {job.jobTitle}
                  </h3>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    Pozisyon: {job.position || job.jobTitle} ({job.placementType})
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-rose-500" />
                      {job.location} {job.state ? `(${job.state})` : ""}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-[#1e3a8a]">
                      <Users className="h-3.5 w-3.5" />
                      {remaining} / {job.numPlacements} Kontenjan
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Ort. Saat: {job.avgWorkingHours}s/hf</span>
                    <span>
                      Konaklama:{" "}
                      {job.accommodationCost
                        ? `$${String(job.accommodationCost)}/hf`
                        : "Belirtilmedi"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Cinsiyet: {job.genderPreference}</span>
                    <span>
                      {formatDate(job.jobStartDate)} - {formatDate(job.jobEndDate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#1e3a8a]">
                <span>22 Kriter Detayı &amp; Öğrenci Linki Oluştur</span>
                <Link2 className="h-4 w-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── ADD NEW WAT JOB MODAL (ALL 22 FIELDS FROM §4) ─────────────────── */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex h-full max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#0f172a] px-6 py-4 text-white">
              <div>
                <h2 className="text-base font-bold">
                  Work and Travel İş Havuzuna Yeni İş Ekle (22 Standart Alan)
                </h2>
                <p className="text-xs text-slate-300">
                  Eklenen işler anında katalogda listelenir ve öğrencilere özel onay linki olarak gönderilebilir.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateJob}
              className="flex-1 overflow-y-auto p-6 space-y-4 text-xs"
            >
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 font-semibold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    1. Sponsor *
                  </label>
                  <select
                    value={newJob.sponsor}
                    onChange={(e) =>
                      setNewJob({ ...newJob, sponsor: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    {SPONSORS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    2. Program
                  </label>
                  <input
                    type="text"
                    value={newJob.program}
                    onChange={(e) =>
                      setNewJob({ ...newJob, program: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    3. Job Category *
                  </label>
                  <select
                    value={newJob.jobCategory}
                    onChange={(e) =>
                      setNewJob({ ...newJob, jobCategory: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    {JOB_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block font-bold text-slate-700">
                    4. Job / Employer Name (İşveren &amp; Başlık) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Cedar Point Amusement Park - Ride Operator"
                    value={newJob.jobTitle}
                    onChange={(e) =>
                      setNewJob({ ...newJob, jobTitle: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    5. Type of Placement
                  </label>
                  <select
                    value={newJob.placementType}
                    onChange={(e) =>
                      setNewJob({ ...newJob, placementType: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    {PLACEMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    6. Location (Şehir / Bölge) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Sandusky, Ohio"
                    value={newJob.location}
                    onChange={(e) =>
                      setNewJob({ ...newJob, location: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Eyalet Kodu (State)
                  </label>
                  <input
                    type="text"
                    placeholder="OH, WI, VA, NJ, FL..."
                    value={newJob.state}
                    onChange={(e) =>
                      setNewJob({ ...newJob, state: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    7. Arrival Airport (Varış Havalimanı)
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: CLE - Cleveland / JFK"
                    value={newJob.arrivalAirport}
                    onChange={(e) =>
                      setNewJob({ ...newJob, arrivalAirport: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    8. Hourly Wage ($ / Saat) *
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    required
                    value={newJob.hourlyWage}
                    onChange={(e) =>
                      setNewJob({ ...newJob, hourlyWage: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    9. Avg. Working Hours (Haftalık Saat)
                  </label>
                  <input
                    type="number"
                    value={newJob.avgWorkingHours}
                    onChange={(e) =>
                      setNewJob({ ...newJob, avgWorkingHours: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    10. Accommodation Cost ($ / Hafta)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={newJob.accommodationCost ?? ""}
                    onChange={(e) =>
                      setNewJob({
                        ...newJob,
                        accommodationCost: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    11. Accommodation Deposit ($)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={newJob.accommodationDeposit ?? ""}
                    onChange={(e) =>
                      setNewJob({
                        ...newJob,
                        accommodationDeposit: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    12. Food (Yemek İmkanı)
                  </label>
                  <input
                    type="text"
                    value={newJob.food}
                    onChange={(e) =>
                      setNewJob({ ...newJob, food: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    13. Transportation (Ulaşım)
                  </label>
                  <input
                    type="text"
                    value={newJob.transportation}
                    onChange={(e) =>
                      setNewJob({ ...newJob, transportation: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    14. Work Apparel (İş Kıyafeti)
                  </label>
                  <input
                    type="text"
                    value={newJob.workApparel}
                    onChange={(e) =>
                      setNewJob({ ...newJob, workApparel: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    15. Position (Görev Tanımı)
                  </label>
                  <input
                    type="text"
                    placeholder="Lifeguard / Server / Housekeeper"
                    value={newJob.position}
                    onChange={(e) =>
                      setNewJob({ ...newJob, position: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    16. Gender Preference
                  </label>
                  <select
                    value={newJob.genderPreference}
                    onChange={(e) =>
                      setNewJob({ ...newJob, genderPreference: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    {GENDER_PREFS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    17. Job Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newJob.jobStartDate}
                    onChange={(e) =>
                      setNewJob({ ...newJob, jobStartDate: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    18. Job End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newJob.jobEndDate}
                    onChange={(e) =>
                      setNewJob({ ...newJob, jobEndDate: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    19. Early Leave (Erken Ayrılış)
                  </label>
                  <input
                    type="text"
                    value={newJob.earlyLeaveInfo}
                    onChange={(e) =>
                      setNewJob({ ...newJob, earlyLeaveInfo: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    20. Num. of Placements (Kontenjan)
                  </label>
                  <input
                    type="number"
                    value={newJob.numPlacements}
                    onChange={(e) =>
                      setNewJob({ ...newJob, numPlacements: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block font-bold text-slate-700">
                    21. Bonus
                  </label>
                  <input
                    type="text"
                    value={newJob.bonus}
                    onChange={(e) =>
                      setNewJob({ ...newJob, bonus: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="mb-1 block font-bold text-slate-700">
                    22. Additional Info (Ek Açıklamalar)
                  </label>
                  <textarea
                    rows={3}
                    value={newJob.additionalInfo}
                    onChange={(e) =>
                      setNewJob({ ...newJob, additionalInfo: e.target.value })
                    }
                    placeholder="Mülakat şartları, bölge olanakları, ikinci iş imkanı vb."
                    className="w-full rounded-xl border border-slate-200 p-3"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-[#0f172a] px-5 py-2 font-bold text-white hover:bg-[#1e3a8a]"
                >
                  {isPending ? "Kaydediliyor…" : "İşi Havuza Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── JOB DETAIL + STUDENT LINK GENERATOR MODAL (§4) ────────────────── */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex h-full max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 bg-[#0f172a] p-5 text-white">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-sky-500/20 border border-sky-400/30 px-2.5 py-0.5 text-xs font-bold text-sky-300">
                    {selectedJob.sponsor} · {selectedJob.jobCategory}
                  </span>
                  <span className="text-xs text-slate-300">
                    {selectedJob.placementType}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  {selectedJob.jobTitle}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  {selectedJob.location}{" "}
                  {selectedJob.state ? `(${selectedJob.state})` : ""} · Varış
                  Havalimanı: {selectedJob.arrivalAirport || "Belirtilmedi"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteJob(selectedJob.id)}
                  className="rounded-lg bg-red-500/20 p-2 text-red-300 hover:bg-red-600 hover:text-white transition-colors"
                  title="İşi Sil"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="rounded-lg p-2 text-slate-300 hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
              {/* 4 Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                  <span className="text-emerald-700 block text-[10px] uppercase font-bold">
                    Saatlik Ücret
                  </span>
                  <span className="text-lg font-black text-emerald-900">
                    ${String(selectedJob.hourlyWage)} / saat
                  </span>
                </div>
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
                  <span className="text-blue-700 block text-[10px] uppercase font-bold">
                    Ort. Çalışma Saati
                  </span>
                  <span className="text-lg font-black text-blue-900">
                    {selectedJob.avgWorkingHours} saat/hf
                  </span>
                </div>
                <div className="rounded-xl bg-purple-50 border border-purple-200 p-3">
                  <span className="text-purple-700 block text-[10px] uppercase font-bold">
                    Haftalık Konaklama
                  </span>
                  <span className="text-lg font-black text-purple-900">
                    {selectedJob.accommodationCost
                      ? `$${String(selectedJob.accommodationCost)}`
                      : "Yok"}
                  </span>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <span className="text-amber-700 block text-[10px] uppercase font-bold">
                    Kontenjan &amp; Cinsiyet
                  </span>
                  <span className="text-sm font-black text-amber-900 block">
                    {selectedJob.numPlacements - selectedJob.filledPlacements} /{" "}
                    {selectedJob.numPlacements} Kişi
                  </span>
                  <span className="text-[10px] text-amber-800">
                    {selectedJob.genderPreference}
                  </span>
                </div>
              </div>

              {/* Full 22-Field Breakdown Table */}
              <div className="rounded-2xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/50">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Pozisyon (Position)
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedJob.position || selectedJob.jobTitle}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    İşe Başlama &amp; Bitiş
                  </span>
                  <span className="font-bold text-slate-900">
                    {formatDate(selectedJob.jobStartDate)} –{" "}
                    {formatDate(selectedJob.jobEndDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Erken Ayrılış (Early Leave)
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedJob.earlyLeaveInfo || "Belirtilmedi"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Depozito (Deposit)
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedJob.accommodationDeposit
                      ? `$${String(selectedJob.accommodationDeposit)}`
                      : "Yok"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Yemek (Food)
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedJob.food || "Belirtilmedi"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Ulaşım (Transportation)
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedJob.transportation || "Belirtilmedi"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    İş Kıyafeti (Work Apparel)
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedJob.workApparel || "Belirtilmedi"}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Sezon Sonu Bonusu (Bonus)
                  </span>
                  <span className="font-bold text-emerald-700">
                    {selectedJob.bonus || "Yok"}
                  </span>
                </div>
                {selectedJob.additionalInfo && (
                  <div className="sm:col-span-3 pt-2 border-t border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Ek Bilgiler (Additional Info)
                    </span>
                    <p className="text-slate-700 mt-0.5 leading-relaxed">
                      {selectedJob.additionalInfo}
                    </p>
                  </div>
                )}
              </div>

              {/* ── STUDENT-SPECIFIC JOB LINK GENERATOR (§4 [P1]) ─────────── */}
              <div className="rounded-2xl border-2 border-[#1e3a8a]/20 bg-blue-50/40 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-[#0f172a] flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-[#1e3a8a]" />
                      Öğrenciye Özel İş Linki Oluştur (Kabul / Red Takibi)
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Seçtiğiniz öğrenciye özel benzersiz bir link üretilir. Öğrenci bu linkten tüm 22 iş kriterini görür ve Onayla / Reddet butonuna basar.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="flex-1 min-w-[220px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900"
                  >
                    <option value="">— Öğrenci Seçin —</option>
                    {watStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.fullName} ({st.email})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={isPending || !selectedStudentId}
                    onClick={() => handleAssignLink(selectedJob.id)}
                    className="flex items-center gap-2 rounded-xl bg-[#0f172a] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1e3a8a] disabled:opacity-50"
                  >
                    <Link2 className="h-4 w-4 text-sky-400" />
                    {isPending
                      ? "Link Üretiliyor…"
                      : "Öğrenciye Özel İş Linki Üret & Gönder"}
                  </button>
                </div>

                {generatedLink && (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-mono text-emerald-900 break-all">
                      {generatedLink}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedLink);
                        }}
                        className="flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Kopyala
                      </button>
                      <a
                        href={generatedLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-white border border-emerald-300 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                      >
                        Önizle →
                      </a>
                    </div>
                  </div>
                )}

                {/* Existing Assigned Links for this Job */}
                {selectedJob.assignments && selectedJob.assignments.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Bu İş İçin Gönderilen Öğrenci Linkleri &amp; Yanıt Durumu
                    </h5>
                    <div className="space-y-1.5">
                      {selectedJob.assignments.map((asg) => (
                        <div
                          key={asg.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white border border-slate-200 px-3.5 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">
                              {asg.studentName}
                            </span>
                            {asg.status === "ACCEPTED" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                <CheckCircle2 className="h-3 w-3" /> ONAYLADI
                              </span>
                            ) : asg.status === "DECLINED" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                                <XCircle className="h-3 w-3" /> REDDETTİ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                <Clock className="h-3 w-3" /> YANIT BEKLENİYOR
                              </span>
                            )}
                          </div>
                          <a
                            href={`/job-offer/${asg.shareToken}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-[#1e3a8a] hover:underline"
                          >
                            /job-offer/{asg.shareToken} →
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
