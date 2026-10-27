"use client";

import { useState, useTransition } from "react";
import {
  Building2,
  Globe,
  Plus,
  Search,
  Trash2,
  X,
  Mail,
  ExternalLink,
  Percent,
  Users,
} from "lucide-react";
import {
  createPartnerSchool,
  deletePartnerSchool,
  type PartnerSchoolInput,
} from "@/actions/crm/schools";
import type { Currency, Program } from "@/types/crm";
import { PROGRAM_LABELS } from "@/types/crm";

export interface PartnerSchoolRecord {
  id: string;
  name: string;
  country: string;
  city: string | null;
  programType: Program;
  programsOffered: string[];
  quota: number | null;
  commissionRate: string | number | null;
  commissionFixed: string | number | null;
  currency: Currency;
  contactEmail: string | null;
  website: string | null;
  notes: string | null;
}

interface Props {
  initialSchools?: PartnerSchoolRecord[];
  defaultProgram?: Program;
}

export function PartnerSchoolPool({
  initialSchools = [],
  defaultProgram = "ACADEMY",
}: Props) {
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("ALL");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [programsStr, setProgramsStr] = useState(
    "Lisans, Yüksek Lisans, Pre-Master, Yoğun İngilizce",
  );
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState<PartnerSchoolInput>({
    name: "",
    country: "İngiltere",
    city: "Londra",
    programType: defaultProgram,
    quota: 25,
    commissionRate: 15,
    commissionFixed: null,
    currency: "EUR",
    contactEmail: "",
    website: "",
    notes: "",
  });

  const countries = Array.from(
    new Set(initialSchools.map((s) => s.country).filter(Boolean)),
  );

  const filtered = initialSchools.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q) ||
      (s.city && s.city.toLowerCase().includes(q));
    const matchesCountry =
      countryFilter === "ALL" || s.country === countryFilter;
    return matchesSearch && matchesCountry;
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createPartnerSchool({
        ...form,
        programsOffered: programsStr
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
      });
      if (res.success) {
        setIsAddOpen(false);
        setForm({ ...form, name: "", city: "", notes: "" });
      } else {
        alert(res.error);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Partner okulu silmek istediğinize emin misiniz?")) return;
    startTransition(async () => {
      await deletePartnerSchool(id);
    });
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Okul / Üniversite adı, ülke veya şehir ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-xs sm:text-sm text-slate-800 focus:border-[#0f172a] focus:outline-none"
          />
        </div>

        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
        >
          <option value="ALL">Tüm Ülkeler</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#0f172a] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#1e3a8a]"
        >
          <Plus className="h-4 w-4 text-sky-400" />
          Yeni Partner Okul Ekle
        </button>
      </div>

      {/* Schools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((school) => (
          <div
            key={school.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-[#0f172a]">
                    {PROGRAM_LABELS[school.programType]}
                  </span>
                  <h3 className="mt-1.5 text-base font-bold text-slate-900">
                    {school.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Globe className="h-3.5 w-3.5 text-blue-600" />
                    {school.city ? `${school.city}, ` : ""}
                    {school.country}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(school.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  title="Okulu Sil"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {school.programsOffered.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {school.programsOffered.map((p, idx) => (
                    <span
                      key={idx}
                      className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-800"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="rounded-xl bg-emerald-50/70 p-2.5 border border-emerald-100">
                  <span className="block text-[10px] font-bold uppercase text-emerald-700">
                    Komisyon Oranı
                  </span>
                  <span className="font-black text-emerald-900 text-sm flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5" />
                    {school.commissionRate
                      ? `%${String(school.commissionRate)}`
                      : school.commissionFixed
                      ? `${String(school.commissionFixed)} ${school.currency}`
                      : "Standart"}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="block text-[10px] font-bold uppercase text-slate-500">
                    Yıllık Kontenjan
                  </span>
                  <span className="font-black text-slate-900 text-sm flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-blue-600" />
                    {school.quota ? `${school.quota} Öğrenci` : "Sınırsız"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="truncate max-w-[180px]">
                {school.contactEmail || "E-posta belirtilmedi"}
              </span>
              {school.website && (
                <a
                  href={school.website}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[#1e3a8a] hover:underline flex items-center gap-1"
                >
                  Web <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Partner School Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between bg-[#0f172a] px-6 py-4 text-white">
              <h3 className="text-sm font-bold">
                Partner Okul Havuzuna Yeni Kurum Ekle
              </h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="mb-1 block font-bold text-slate-700">
                    Okul / Üniversite Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Örn: Kaplan International Languages / TU Munich"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Ülke *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.country}
                    onChange={(e) =>
                      setForm({ ...form, country: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Şehir
                  </label>
                  <input
                    type="text"
                    value={form.city || ""}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Kategori
                  </label>
                  <select
                    value={form.programType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        programType: e.target.value as Program,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <option value="ACADEMY">Akademi / Üniversite</option>
                    <option value="LANGUAGE_SCHOOL">Dil Okulu</option>
                    <option value="SUMMER_CAMP">Yaz Okulu</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Komisyon Oranı (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.commissionRate ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, commissionRate: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Sabit Komisyon Tutar
                  </label>
                  <input
                    type="number"
                    value={form.commissionFixed ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, commissionFixed: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Kontenjan (Quota)
                  </label>
                  <input
                    type="number"
                    value={form.quota ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, quota: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block font-bold text-slate-700">
                    Sunulan Programlar (Virgülle ayırın)
                  </label>
                  <input
                    type="text"
                    value={programsStr}
                    onChange={(e) => setProgramsStr(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    İletişim E-Postası
                  </label>
                  <input
                    type="email"
                    value={form.contactEmail || ""}
                    onChange={(e) =>
                      setForm({ ...form, contactEmail: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Web Sitesi
                  </label>
                  <input
                    type="text"
                    value={form.website || ""}
                    onChange={(e) =>
                      setForm({ ...form, website: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
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
                  className="rounded-xl bg-[#0f172a] px-5 py-2 font-bold text-white"
                >
                  {isPending ? "Kaydediliyor…" : "Partner Okulu Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
