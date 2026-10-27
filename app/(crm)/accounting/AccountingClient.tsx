"use client";

import { useState, useTransition } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Percent,
  Plus,
  Trash2,
  Building2,
  X,
} from "lucide-react";
import {
  createAccountingEntry,
  deleteAccountingEntry,
  type AccountingEntryInput,
} from "@/actions/crm/accounting";
import { formatDate } from "@/lib/utils/date";
import type { Currency } from "@/types/crm";
import { CURRENCY_SYMBOLS } from "@/types/crm";

export interface AccountingEntryRow {
  id: string;
  type: string;
  category: string;
  studentId: string | null;
  studentName: string | null;
  partnerSchoolId: string | null;
  partnerSchoolName: string | null;
  partnerSchoolCountry: string | null;
  advisorId: string | null;
  advisorName: string | null;
  description: string;
  amount: number;
  currency: Currency;
  paymentMethod: string | null;
  weeksSold: number | null;
  grossAmount: number | null;
  netAmount: number | null;
  transactionDate: string;
  isPaid: boolean;
  notes: string | null;
}

interface Props {
  entries: AccountingEntryRow[];
  students: { id: string; fullName: string }[];
  schools: { id: string; name: string; country: string }[];
  advisors: { id: string; fullName: string }[];
}

export default function AccountingClient({
  entries,
  students,
  schools,
  advisors,
}: Props) {
  const [activeTab, setActiveTab] = useState<"LEDGER" | "SCHOOL_REPORT">(
    "LEDGER",
  );
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [schoolFilter, setSchoolFilter] = useState("ALL");
  const [countryFilter, setCountryFilter] = useState("ALL");
  const [advisorFilter, setAdvisorFilter] = useState("ALL");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState<AccountingEntryInput>({
    type: "INCOME",
    category: "TUITION",
    studentId: "",
    partnerSchoolId: "",
    advisorId: "",
    description: "",
    amount: 1000,
    currency: "USD",
    paymentMethod: "BANK_TRANSFER",
    weeksSold: null,
    grossAmount: null,
    netAmount: null,
    isPaid: true,
  });

  const totalIncome = entries
    .filter((e) => e.type === "INCOME")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = entries
    .filter((e) => e.type === "EXPENSE")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalCommission = entries
    .filter((e) => e.type === "COMMISSION")
    .reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalIncome + totalCommission - totalExpense;

  const filteredLedger = entries.filter((e) => {
    if (typeFilter !== "ALL" && e.type !== typeFilter) return false;
    return true;
  });

  // School-Week Sales Report Filtering (§8)
  const schoolReportRows = entries.filter((e) => {
    if (!e.partnerSchoolId && !e.weeksSold) return false;
    if (schoolFilter !== "ALL" && e.partnerSchoolId !== schoolFilter)
      return false;
    if (countryFilter !== "ALL" && e.partnerSchoolCountry !== countryFilter)
      return false;
    if (advisorFilter !== "ALL" && e.advisorId !== advisorFilter) return false;
    return true;
  });

  const totalWeeksSold = schoolReportRows.reduce(
    (s, r) => s + (r.weeksSold || 0),
    0,
  );
  const totalGrossSales = schoolReportRows.reduce(
    (s, r) => s + (r.grossAmount || r.amount || 0),
    0,
  );
  const totalNetSales = schoolReportRows.reduce(
    (s, r) => s + (r.netAmount || 0),
    0,
  );
  const totalSchoolCommissions = schoolReportRows.reduce(
    (s, r) => s + r.amount,
    0,
  );

  const countries = Array.from(
    new Set(schools.map((s) => s.country).filter(Boolean)),
  );

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createAccountingEntry(form);
      if (res.success) {
        setIsAddOpen(false);
        setForm({ ...form, description: "", amount: 1000 });
      } else {
        alert(res.error);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Bu muhasebe kaydını silmek istediğinize emin misiniz?"))
      return;
    startTransition(async () => {
      await deleteAccountingEntry(id);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] flex items-center gap-2">
            <Wallet className="h-6 w-6 text-emerald-600" />
            Muhasebe, Komisyon &amp; Okul-Hafta Satış Raporu
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Öğrenci tahsilatları (Alınan), kurum/sponsor ödemeleri (Verilen), WAT konaklama komisyonları ve Dil Okulu Gross/Net hafta raporları.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#0f172a] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#1e3a8a]"
        >
          <Plus className="h-4 w-4 text-emerald-400" />
          Yeni Gelir / Gider / Komisyon Ekle
        </button>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-800">
              Alınan (Tahsilat / Gelir)
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-950">
            ${totalIncome.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-rose-800">
              Verilen (Gider / Ödeme)
            </span>
            <TrendingDown className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-950">
            ${totalExpense.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-blue-800">
              Komisyon Gelirleri (Okul + WAT)
            </span>
            <Percent className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-blue-950">
            ${totalCommission.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-[#0f172a] p-4 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-sky-300">
              Net Kasa / Bakiye
            </span>
            <Wallet className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">
            ${netBalance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tabs: Ledger vs School-Week Sales Report */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("LEDGER")}
          className={`border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-colors ${
            activeTab === "LEDGER"
              ? "border-[#0f172a] text-[#0f172a]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Alınan / Verilen / Komisyon Hareketleri ({entries.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SCHOOL_REPORT")}
          className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-colors ${
            activeTab === "SCHOOL_REPORT"
              ? "border-[#1e3a8a] text-[#1e3a8a]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Okul-Hafta Satış Raporu (Gross / Net / Hafta)
        </button>
      </div>

      {/* TAB 1: LEDGER */}
      {activeTab === "LEDGER" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 p-4">
            {[
              { k: "ALL", label: "Tüm Hareketler" },
              { k: "INCOME", label: "Alınan (Gelir)" },
              { k: "EXPENSE", label: "Verilen (Gider)" },
              { k: "COMMISSION", label: "Komisyonlar (WAT Konaklama & Okul)" },
            ].map((t) => (
              <button
                key={t.k}
                type="button"
                onClick={() => setTypeFilter(t.k)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  typeFilter === t.k
                    ? "bg-[#0f172a] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {[
                    "Tarih",
                    "Tür & Kategori",
                    "Açıklama",
                    "Öğrenci / Okul",
                    "Danışman",
                    "Tutar",
                    "",
                  ].map((c) => (
                    <th
                      key={c}
                      className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLedger.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {formatDate(e.transactionDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                          e.type === "INCOME"
                            ? "bg-emerald-100 text-emerald-800"
                            : e.type === "EXPENSE"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {e.type === "INCOME"
                          ? "ALINAN (GELİR)"
                          : e.type === "EXPENSE"
                          ? "VERİLEN (GİDER)"
                          : "KOMİSYON"}
                      </span>
                      <span className="ml-1.5 text-[10px] text-slate-500 font-semibold">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {e.description}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {e.studentName || e.partnerSchoolName || "Genel"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {e.advisorName || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono font-black text-sm">
                      <span
                        className={
                          e.type === "EXPENSE"
                            ? "text-rose-600"
                            : "text-emerald-700"
                        }
                      >
                        {e.type === "EXPENSE" ? "-" : "+"}
                        {CURRENCY_SYMBOLS[e.currency]}
                        {e.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(e.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SCHOOL-WEEK SALES REPORT (§8) */}
      {activeTab === "SCHOOL_REPORT" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800"
            >
              <option value="ALL">Tüm Partner Okullar</option>
              {schools.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </select>

            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800"
            >
              <option value="ALL">Tüm Ülkeler</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={advisorFilter}
              onChange={(e) => setAdvisorFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800"
            >
              <option value="ALL">Tüm Danışmanlar</option>
              {advisors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName}
                </option>
              ))}
            </select>

            <div className="ml-auto flex items-center gap-4 text-xs">
              <span className="rounded-xl bg-blue-50 px-3 py-1.5 font-black text-blue-900">
                Toplam Satılan Hafta: {totalWeeksSold} Hafta
              </span>
              <span className="rounded-xl bg-emerald-50 px-3 py-1.5 font-black text-emerald-900">
                Toplam Gross: €{totalGrossSales.toLocaleString()} · Net: €
                {totalNetSales.toLocaleString()} · Komisyon: €
                {totalSchoolCommissions.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-[#0f172a] text-white">
                  {[
                    "Partner Okul",
                    "Ülke",
                    "Öğrenci",
                    "Danışman",
                    "Satılan Hafta",
                    "Gross Invoice",
                    "Net Invoice",
                    "Kazanılan Komisyon",
                  ].map((c) => (
                    <th
                      key={c}
                      className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schoolReportRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {r.partnerSchoolName || r.description}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.partnerSchoolCountry || "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {r.studentName || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.advisorName || "—"}
                    </td>
                    <td className="px-4 py-3 font-black text-blue-700">
                      {r.weeksSold ? `${r.weeksSold} Hafta` : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">
                      {r.grossAmount
                        ? `${CURRENCY_SYMBOLS[r.currency]}${r.grossAmount.toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-600">
                      {r.netAmount
                        ? `${CURRENCY_SYMBOLS[r.currency]}${r.netAmount.toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono font-black text-emerald-700">
                      {CURRENCY_SYMBOLS[r.currency]}
                      {r.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Accounting Entry Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between bg-[#0f172a] px-6 py-4 text-white">
              <h3 className="text-sm font-bold">
                Yeni Muhasebe &amp; Komisyon Kaydı Ekle
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
                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Hareket Türü
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value as
                          | "INCOME"
                          | "EXPENSE"
                          | "COMMISSION",
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <option value="INCOME">Alınan (Gelir / Tahsilat)</option>
                    <option value="EXPENSE">Verilen (Gider / Ödeme)</option>
                    <option value="COMMISSION">Komisyon Geliri</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Kategori
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <option value="TUITION">Program / Eğitim Ücreti</option>
                    <option value="SCHOOL_COMMISSION">
                      Partner Okul Komisyonu
                    </option>
                    <option value="ACCOMMODATION_COMMISSION">
                      WAT Konaklama Komisyonu
                    </option>
                    <option value="VISA_FEE">Vize / SEVIS / Harç</option>
                    <option value="SPONSOR_PAYMENT">Sponsor Ödemesi</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block font-bold text-slate-700">
                    Açıklama *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Örn: WAT 2. Taksit Tahsilatı / EC Dublin 12 Hafta Komisyonu"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Tutar *
                  </label>
                  <input
                    type="number"
                    required
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Para Birimi
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) =>
                      setForm({ ...form, currency: e.target.value as Currency })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="TRY">TRY (₺)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Öğrenci (Opsiyonel)
                  </label>
                  <select
                    value={form.studentId || ""}
                    onChange={(e) =>
                      setForm({ ...form, studentId: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <option value="">Seçilmedi</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Partner Okul (Opsiyonel)
                  </label>
                  <select
                    value={form.partnerSchoolId || ""}
                    onChange={(e) =>
                      setForm({ ...form, partnerSchoolId: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <option value="">Seçilmedi</option>
                    {schools.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.name} ({sc.country})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Satılan Hafta Sayısı (Okul Raporu İçin)
                  </label>
                  <input
                    type="number"
                    value={form.weeksSold ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, weeksSold: e.target.value })
                    }
                    placeholder="Örn: 12"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Danışman
                  </label>
                  <select
                    value={form.advisorId || ""}
                    onChange={(e) =>
                      setForm({ ...form, advisorId: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <option value="">Seçilmedi</option>
                    {advisors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName}
                      </option>
                    ))}
                  </select>
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
                  {isPending ? "Kaydediliyor…" : "Kaydı Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
