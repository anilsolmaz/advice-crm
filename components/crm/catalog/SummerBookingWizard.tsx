"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  MapPin,
  Users,
  Plane,
  Sparkles,
  FileCheck,
  ArrowRight,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { createSummerBooking } from "@/actions/crm/bookings";
import { formatDate } from "@/lib/utils/date";
import type { Currency } from "@/types/crm";

export interface SummerAllocationRecord {
  id: string;
  country: string;
  centerName: string;
  nights: number;
  startDate: string | Date;
  totalQuota: number;
  usedQuota: number;
  pricePerStudent: string | number | null;
  currency: Currency;
}

export interface SummerBookingRecord {
  id: string;
  bookingCode: string;
  groupName: string | null;
  country: string;
  centerName: string;
  nights: number;
  startDate: string | Date;
  participantCount: number;
  totalAmount: string | number | null;
  currency: Currency;
  status: string;
}

interface Props {
  allocations?: SummerAllocationRecord[];
  bookings?: SummerBookingRecord[];
  students?: { id: string; fullName: string; email: string }[];
}

const STEPS = [
  "1. Terms & Conditions",
  "2. Select an Allocation",
  "3. Number of Participants",
  "4. Airport Transfers",
  "5. Extra Services",
  "6. Summary & Confirm",
];

export function SummerBookingWizard({
  allocations = [],
  bookings = [],
  students = [],
}: Props) {
  const [step, setStep] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedAllocationId, setSelectedAllocationId] = useState<string>(
    allocations[0]?.id || "",
  );
  const [country, setCountry] = useState(allocations[0]?.country || "İngiltere");
  const [centerName, setCenterName] = useState(
    allocations[0]?.centerName || "Oxford Brookes Campus Summer Center",
  );
  const [nights, setNights] = useState(allocations[0]?.nights || 14);
  const [startDate, setStartDate] = useState("2026-07-05");
  const [groupName, setGroupName] = useState("Oxford UK Yaz Okulu Grubu A");
  const [participantCount, setParticipantCount] = useState(15);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [arrivalAirport, setArrivalAirport] = useState("London Heathrow (LHR)");
  const [arrivalFlightNo, setArrivalFlightNo] = useState("TK-1979");
  const [departureAirport, setDepartureAirport] = useState("London Heathrow (LHR)");
  const [departureFlightNo, setDepartureFlightNo] = useState("TK-1980");
  const [transferIncluded, setTransferIncluded] = useState(true);
  const [excursions, setExcursions] = useState(
    "Londra Thames Turu, Harry Potter Studios, Cambridge Gezisi",
  );
  const [travelInsurance, setTravelInsurance] = useState(true);
  const [groupLeaderCount, setGroupLeaderCount] = useState(2);
  const [totalAmount, setTotalAmount] = useState(34500);
  const [summaryNotes, setSummaryNotes] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function selectAllocation(alloc: SummerAllocationRecord) {
    setSelectedAllocationId(alloc.id);
    setCountry(alloc.country);
    setCenterName(alloc.centerName);
    setNights(alloc.nights);
    setStartDate(new Date(alloc.startDate).toISOString().slice(0, 10));
    if (alloc.pricePerStudent) {
      setTotalAmount(Number(alloc.pricePerStudent) * participantCount);
    }
  }

  function toggleStudent(id: string) {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleSubmitBooking() {
    startTransition(async () => {
      const res = await createSummerBooking({
        termsAccepted,
        allocationId: selectedAllocationId || null,
        groupName,
        country,
        centerName,
        nights,
        startDate,
        participantCount,
        studentIds: selectedStudentIds,
        airportTransfers: {
          arrivalAirport,
          arrivalFlightNo,
          departureAirport,
          departureFlightNo,
          transferIncluded,
        },
        extraServices: {
          excursions: excursions.split(",").map((s) => s.trim()),
          travelInsurance,
          groupLeaderCount,
        },
        totalAmount,
        currency: "GBP",
        summaryNotes,
      });

      if (res.success) {
        setCreatedCode(res.bookingCode || "BK-2026-OK");
      } else {
        alert(res.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* 6-Step Progress Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-[#0f172a]">
              Yaz Okulu — 6 Adımlı Grup Rezervasyon &amp; Allocation Sihirbazı
            </h2>
            <p className="text-xs text-slate-500">
              Ülke, merkez, gece sayısı ve başlangıç tarihine göre kontenjan seçip öğrencileri gruba atayın.
            </p>
          </div>
          <span className="rounded-xl bg-[#0f172a] px-3 py-1.5 text-xs font-bold text-sky-300">
            Adım {step} / 6
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {STEPS.map((label, idx) => {
            const sNum = idx + 1;
            const active = step === sNum;
            const done = step > sNum;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setStep(sNum)}
                className={`rounded-xl p-2.5 text-left text-[11px] font-bold transition-all border ${
                  active
                    ? "bg-[#0f172a] text-white border-[#0f172a] shadow-sm"
                    : done
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-slate-50 text-slate-500 border-slate-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* STEP 1: Terms and Conditions */}
        {step === 1 && (
          <div className="space-y-4 rounded-2xl bg-slate-50 p-5 border border-slate-200 text-xs text-slate-700">
            <h3 className="text-sm font-bold text-[#0f172a]">
              1. Terms and Conditions (Grup Rezervasyon Şartları)
            </h3>
            <p className="leading-relaxed">
              Yaz okulu grup tahsisi (Allocation) onaylandıktan sonra katılımcı isim listesi ve pasaport bilgileri uçuş tarihinden en geç 30 gün önce tamamlanmalıdır. Grup lideri (Group Leader) kontenjanı her 15 öğrenci için 1 ücretsiz refakatçi olarak hesaplanır.
            </p>
            <label className="flex items-center gap-2.5 font-bold text-slate-900 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span>
                Advice Yaz Okulu Grup Tahsis (Allocation) ve İptal/İade Şartlarını okudum, onaylıyorum.
              </span>
            </label>
          </div>
        )}

        {/* STEP 2: Select an Allocation */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-[#0f172a]">
              2. Select an Allocation (Ülke, Merkez, Gece Sayısı, Başlangıç Tarihi)
            </h3>

            {allocations.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allocations.map((alloc) => (
                  <div
                    key={alloc.id}
                    onClick={() => selectAllocation(alloc)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      selectedAllocationId === alloc.id
                        ? "border-[#0f172a] bg-blue-50/40 ring-2 ring-[#0f172a]/10"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">
                        {alloc.centerName}
                      </span>
                      <span className="rounded bg-[#0f172a] px-2 py-0.5 text-[10px] font-bold text-white">
                        {alloc.country}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-slate-600">
                      <span>
                        {alloc.nights} Gece · Başlangıç:{" "}
                        {formatDate(alloc.startDate)}
                      </span>
                      <span className="font-bold text-emerald-700">
                        Kalan Kontenjan: {alloc.totalQuota - alloc.usedQuota} /{" "}
                        {alloc.totalQuota}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Ülke (Country)
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block font-bold text-slate-700">
                  Kamp / Merkez Adı (Center)
                </label>
                <input
                  type="text"
                  value={centerName}
                  onChange={(e) => setCenterName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Gece Sayısı (Nights)
                </label>
                <input
                  type="number"
                  value={nights}
                  onChange={(e) => setNights(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Başlangıç Tarihi (Start Date)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="mb-1 block font-bold text-slate-700">
                  Grup Adı (Group Tracking Etiketi)
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Number of Participants */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-[#0f172a]">
              3. Number of Participants &amp; Öğrenci Seçimi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Toplam Katılımcı Öğrenci Sayısı
                </label>
                <input
                  type="number"
                  min={1}
                  value={participantCount}
                  onChange={(e) => setParticipantCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Grup Lideri (Refakatçi Öğretmen) Sayısı
                </label>
                <input
                  type="number"
                  min={0}
                  value={groupLeaderCount}
                  onChange={(e) => setGroupLeaderCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold"
                />
              </div>
            </div>

            {students.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="font-bold text-slate-700 block">
                  Kayıtlı Öğrencilerden Bu Gruba Ekle ({selectedStudentIds.length}{" "}
                  seçildi):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {students.map((st) => (
                    <label
                      key={st.id}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 p-2.5 cursor-pointer hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(st.id)}
                        onChange={() => toggleStudent(st.id)}
                      />
                      <span className="font-bold text-slate-800">
                        {st.fullName}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        ({st.email})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Airport Transfers */}
        {step === 4 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-[#0f172a]">
              4. Airport Transfers (Havalimanı Karşılama &amp; Transfer)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Varış Havalimanı (Arrival Airport)
                </label>
                <input
                  type="text"
                  value={arrivalAirport}
                  onChange={(e) => setArrivalAirport(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Varış Uçuş Kodu (Arrival Flight No)
                </label>
                <input
                  type="text"
                  value={arrivalFlightNo}
                  onChange={(e) => setArrivalFlightNo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Dönüş Havalimanı (Departure Airport)
                </label>
                <input
                  type="text"
                  value={departureAirport}
                  onChange={(e) => setDepartureAirport(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Dönüş Uçuş Kodu (Departure Flight No)
                </label>
                <input
                  type="text"
                  value={departureFlightNo}
                  onChange={(e) => setDepartureFlightNo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 font-bold text-slate-800 pt-1">
              <input
                type="checkbox"
                checked={transferIncluded}
                onChange={(e) => setTransferIncluded(e.target.checked)}
              />
              <span>Özel Grup Otobüsü ile Havalimanı – Kampüs Transferi Dahil</span>
            </label>
          </div>
        )}

        {/* STEP 5: Extra Services */}
        {step === 5 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-[#0f172a]">
              5. Extra Services (Ekstra Geziler, Sigorta &amp; Hizmetler)
            </h3>
            <div>
              <label className="mb-1 block font-bold text-slate-700">
                Kültürel Gezi Paketi (Excursions)
              </label>
              <input
                type="text"
                value={excursions}
                onChange={(e) => setExcursions(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </div>
            <label className="flex items-center gap-2 font-bold text-slate-800">
              <input
                type="checkbox"
                checked={travelInsurance}
                onChange={(e) => setTravelInsurance(e.target.checked)}
              />
              <span>Kapsamlı Grup Seyahat &amp; Sağlık Sigortası Ekle</span>
            </label>
          </div>
        )}

        {/* STEP 6: Summary */}
        {step === 6 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-[#0f172a]">
              6. Summary (Rezervasyon Özeti &amp; Onay)
            </h3>
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Grup Adı
                </span>
                <span className="font-bold text-slate-900">{groupName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Merkez &amp; Ülke
                </span>
                <span className="font-bold text-slate-900">
                  {centerName} ({country})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Süre &amp; Başlangıç
                </span>
                <span className="font-bold text-slate-900">
                  {nights} Gece · {startDate}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Katılımcı Sayısı
                </span>
                <span className="font-bold text-slate-900">
                  {participantCount} Öğrenci + {groupLeaderCount} Lider
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Transfer Uçuşları
                </span>
                <span className="font-bold text-slate-900">
                  {arrivalFlightNo} / {departureFlightNo}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Toplam Grup Tutarı (£ GBP)
                </span>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white px-2 py-1 font-black text-emerald-800"
                />
              </div>
            </div>

            {createdCode && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 font-bold flex items-center justify-between">
                <span>
                  ✅ Grup Rezervasyonu Başarıyla Oluşturuldu! Kod: {createdCode}
                </span>
                <a
                  href="/groups"
                  className="rounded-lg bg-emerald-700 px-3 py-1.5 text-white text-xs"
                >
                  Grup &amp; Vize Takibinde Gör →
                </a>
              </div>
            )}
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            Önceki Adım
          </button>

          {step < 6 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !termsAccepted) {
                  alert("Devam etmek için lütfen şartları onaylayın.");
                  return;
                }
                setStep((s) => Math.min(6, s + 1));
              }}
              className="flex items-center gap-1.5 rounded-xl bg-[#0f172a] px-5 py-2 text-xs font-bold text-white hover:bg-[#1e3a8a]"
            >
              Sonraki Adım
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={handleSubmitBooking}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isPending
                ? "Kaydediliyor…"
                : "6. Adımı Tamamla & Grup Rezervasyonunu Onayla"}
            </button>
          )}
        </div>
      </div>

      {/* Existing Confirmed Bookings List */}
      {bookings.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-[#0f172a]">
            Aktif Yaz Okulu Grup Rezervasyonları (Bookings)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-slate-200 p-4 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono text-[10px] font-bold text-blue-700">
                    {b.bookingCode}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {b.groupName || b.centerName}
                  </h4>
                  <p className="text-slate-500">
                    {b.country} · {b.nights} Gece · Başlangıç:{" "}
                    {formatDate(b.startDate)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900 block text-sm">
                    {b.participantCount} Katılımcı
                  </span>
                  {b.totalAmount && (
                    <span className="text-emerald-700 font-bold">
                      £{String(b.totalAmount)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
