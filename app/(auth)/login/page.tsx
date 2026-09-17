// app/(auth)/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import {
  Plane,
  Globe,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  ArrowRight,
  Scissors,
  CheckCircle2,
} from "lucide-react";
import { loginAction } from "@/lib/auth/actions";
import type { ActionResult } from "@/lib/auth/actions";

const DESTINATIONS = [
  {
    city: "NEW YORK",
    code: "JFK",
    country: "ABD",
    program: "Work & Travel USA",
    flight: "ADV-JFK26",
    gate: "04B",
    seat: "01A",
    mileage: "5,012 MILES",
    boardingTime: "10:45 AM",
    highlight: "2026 Erken Kayıt · 4 Ay Çalışma & Gezme",
  },
  {
    city: "LONDON",
    code: "LHR",
    country: "İNGİLTERE",
    program: "Akademi & Master (UK)",
    flight: "ADV-LON26",
    gate: "12A",
    seat: "02B",
    mileage: "1,553 MILES",
    boardingTime: "14:20 PM",
    highlight: "1 Yıl Master + 2 Yıl Mezuniyet Çalışma İzni",
  },
  {
    city: "DUBLIN",
    code: "DUB",
    country: "İRLANDA",
    program: "Dil Okulu & Çalışma İzni",
    flight: "ADV-DUB26",
    gate: "03F",
    seat: "03A",
    mileage: "1,830 MILES",
    boardingTime: "09:30 AM",
    highlight: "25 Hafta Eğitim + Haftalık 20s Yasal Çalışma",
  },
  {
    city: "LOS ANGELES",
    code: "LAX",
    country: "CALIFORNIA, ABD",
    program: "West Coast WAT & Staj",
    flight: "ADV-LAX26",
    gate: "08C",
    seat: "01F",
    mileage: "6,850 MILES",
    boardingTime: "11:15 AM",
    highlight: "Kaliforniya Sahilleri & Konaklamalı Resort",
  },
  {
    city: "MIAMI",
    code: "MIA",
    country: "FLORIDA, ABD",
    program: "Work & Travel",
    flight: "ADV-MIA26",
    gate: "07A",
    seat: "01C",
    mileage: "5,980 MILES",
    boardingTime: "16:40 PM",
    highlight: "Florida Lüks Otel & Havuz İşleri (Bahşişli)",
  },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="
        w-full rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600
        hover:from-blue-500 hover:to-sky-400 text-white py-2.5 px-4
        font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-300
        shadow-[0_6px_20px_rgba(14,165,233,0.35)] hover:shadow-[0_8px_25px_rgba(14,165,233,0.5)]
        border border-sky-300/40 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none
        flex items-center justify-center gap-2.5 cursor-pointer
      "
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-white" />
          <span>BİNİŞ ONAYLANIYOR…</span>
        </>
      ) : (
        <>
          <Plane className="h-4 w-4 text-white" />
          <span>UÇUŞA GEÇ / BİNİŞİ ONAYLA</span>
          <ArrowRight className="h-4 w-4 text-sky-200 ml-0.5" />
        </>
      )}
    </button>
  );
}

// Authentic Compact IATA Barcode Component
function LinearBarcodeStrip() {
  const barPattern = [
    3, 1, 2, 1, 4, 1, 2, 3, 1, 1, 4, 2, 1, 3, 1, 2, 4, 1, 1, 2, 3, 1, 4, 1, 2,
    1, 3, 2, 1, 4, 2, 1, 2, 3, 1, 1, 4, 2, 1, 3, 1, 2, 1, 4, 2, 3, 1, 1, 2, 4,
    1, 3, 2, 1, 4, 1, 2, 3, 1, 4, 2, 1, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2,
  ];

  return (
    <div className="space-y-0.5 select-none">
      <div className="flex items-stretch h-6 sm:h-7 w-full overflow-hidden bg-white px-2 py-0.5 rounded border border-slate-200">
        {barPattern.map((width, i) => (
          <div
            key={i}
            className={`${i % 2 === 0 ? "bg-slate-900" : "bg-transparent"} shrink-0`}
            style={{ width: `${width * 2}px` }}
          />
        ))}
      </div>
      <div className="flex justify-between font-mono text-[8px] text-slate-400 tracking-wider">
        <span>ETKT 232 948102938 1</span>
        <span>PNR: ADV-2026-OK</span>
        <span className="hidden sm:inline">IATA // ADV</span>
        <span>ELECTRONIC TICKET</span>
      </div>
    </div>
  );
}

const initialState: ActionResult = { success: false, error: "" };

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, initialState);
  const [destIndex, setDestIndex] = useState(0);
  const [email, setEmail] = useState("harun@adviceyed.com");
  const [password, setPassword] = useState("Password123!");

  // Rotate destination smoothly every 5s
  useEffect(() => {
    const t = setInterval(() => {
      setDestIndex((prev) => (prev + 1) % DESTINATIONS.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const dest = DESTINATIONS[destIndex];
  const hasError = !state.success && !!state.error;

  return (
    <div className="relative min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden selection:bg-blue-600 selection:text-white font-sans">
      
      {/* ── Soft Clean Sky Atmospheric Backdrops ─────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
        <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-50"
          style={{
            background:
              "radial-gradient(circle at 40% 40%, rgba(186, 230, 253, 0.45) 0%, rgba(224, 242, 254, 0.25) 45%, rgba(248, 250, 252, 0) 70%)",
            filter: "blur(60px)",
          }}
        />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-blue-100/50 blur-[90px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:28px_28px] opacity-35" />
      </div>

      {/* ── THE COMPACT WIDESCREEN BOARDING PASS (BASIK BİLET) ───────────────── */}
      <div className="relative z-10 w-full max-w-4xl">
        
        {/* Outer Card Gradient Ring */}
        <div className="rounded-2xl p-1 sm:p-1.5 bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-600 shadow-[0_20px_50px_-15px_rgba(30,58,138,0.18),0_10px_20px_-10px_rgba(0,0,0,0.06)]">
          <div className="relative flex flex-col md:flex-row overflow-hidden rounded-xl bg-white border border-slate-200">

            {/* ════════════════════════════════════════════════════════════════
                MAIN PASS (SOL - BÜYÜK ANA BİLET BÖLÜMÜ - SLEEK & BASIK)
                ════════════════════════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 space-y-3.5 bg-white">
              
              {/* Sleek Top Aviation Header: Logo + Flight Gate Telemetry */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-white p-1 shadow-2xs border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/advice-logo.svg"
                      alt="Advice Yurtdışı Eğitim"
                      className="h-5 w-auto object-contain"
                    />
                  </div>
                  <div>
                    <div className="text-[9px] font-mono tracking-wider text-blue-600 font-bold uppercase flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping" />
                      <span>BOARDING PASS · 2026</span>
                    </div>
                    <span className="text-xs sm:text-sm font-black tracking-tight text-slate-900 uppercase">
                      ADVICE YURTDIŞI EĞİTİM
                    </span>
                  </div>
                </div>

                {/* Telemetry Gate & Seat Badge */}
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                  <span>KAPI: <strong className="text-blue-600">{dest.gate}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>KOLTUK: <strong className="text-slate-900">{dest.seat}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-700 font-bold">{dest.boardingTime}</span>
                </div>
              </div>

              {/* ── DYNAMIC PROGRAM SHOWCASE & ROUTE STRIP (THE LOOP TICKER) ── */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200/90 px-3.5 py-2">
                {/* Route & Airport */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 font-mono font-bold text-slate-900 text-xs sm:text-sm">
                    <span>IST</span>
                    <Plane className="h-3.5 w-3.5 text-blue-600 rotate-90" />
                    <span className="text-blue-600">{dest.code}</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs font-medium text-slate-600">{dest.city}</span>
                </div>

                {/* Rotating Program & Highlight */}
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                    {dest.program}
                  </span>
                  <span className="hidden sm:inline text-xs text-slate-400">·</span>
                  <span className="hidden sm:inline text-xs font-normal text-slate-500">
                    {dest.highlight}
                  </span>
                </div>
              </div>

              {/* Direct Integrated Login Form (Clean & Compact) */}
              <form action={formAction} className="space-y-3">
                {hasError && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                    <span>{state.error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* E-Posta Input */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      E-Posta Adresi
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="harun@adviceyed.com"
                        className="w-full rounded-lg bg-slate-50/70 hover:bg-white focus:bg-white py-2 pl-9 pr-3 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 border border-slate-300 shadow-2xs focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-100 transition-all"
                      />
                    </div>
                  </div>

                  {/* Şifre Input */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Güvenlik Şifresi
                      </label>
                      <Link
                        href="/sifre-sifirla"
                        className="text-[10px] font-medium text-blue-600 hover:text-blue-800 underline"
                      >
                        Şifremi Unuttum
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        type="password"
                        name="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-lg bg-slate-50/70 hover:bg-white focus:bg-white py-2 pl-9 pr-3 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 border border-slate-300 shadow-2xs focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-100 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <SubmitButton />
              </form>

              {/* Bottom Authentic Barcode Band (Slim) */}
              <LinearBarcodeStrip />
            </div>

            {/* ════════════════════════════════════════════════════════════════
                PERFORATION DIVIDER WITH CUTOUT NOTCHES
                ════════════════════════════════════════════════════════════════ */}
            <div className="relative flex md:flex-col items-center justify-between">
              {/* Desktop: Vertical Dashed Perforation Line */}
              <div className="hidden md:block w-0 h-full border-r-2 border-dashed border-slate-300" />
              
              {/* Mobile: Horizontal Dashed Perforation Line */}
              <div className="block md:hidden w-full h-0 border-b-2 border-dashed border-slate-300" />

              {/* Top Notch (Desktop) / Left Notch (Mobile) */}
              <div className="absolute -top-3 md:-top-3.5 left-1/2 md:left-auto md:-right-3 -translate-x-1/2 md:translate-x-0 w-6 h-6 rounded-full bg-[#f8fafc] border border-slate-300 z-20 shadow-inner" />
              
              {/* Bottom Notch (Desktop) / Right Notch (Mobile) */}
              <div className="absolute -bottom-3 md:-bottom-3.5 left-1/2 md:left-auto md:-right-3 -translate-x-1/2 md:translate-x-0 w-6 h-6 rounded-full bg-[#f8fafc] border border-slate-300 z-20 shadow-inner" />

              {/* Little Scissors Indicator */}
              <div className="hidden md:flex absolute top-1/2 -right-2.5 -translate-y-1/2 flex-col items-center gap-0.5 text-[7px] font-mono text-slate-400 z-10 select-none pointer-events-none">
                <Scissors className="h-3 w-3 text-slate-400 rotate-90" />
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════
                TEAR-OFF PASSENGER STUB (SAĞ - GERÇEK YOLCU BİLETİ KUPONU)
                ════════════════════════════════════════════════════════════════ */}
            <div className="relative md:w-56 flex flex-col justify-between p-3.5 sm:p-4 bg-slate-50/80 border-t md:border-t-0 border-slate-200 space-y-2.5">
              
              {/* Stub Top: Header & Red Ink Rubber Stamp */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-1.5">
                <div>
                  <div className="text-[8px] font-mono font-extrabold text-blue-600 uppercase tracking-wider">
                    PASSENGER COUPON
                  </div>
                  <div className="text-xs font-mono font-black text-slate-900 uppercase">
                    YOLCU KUPONU
                  </div>
                  <div className="text-[8px] font-mono text-slate-400">
                    ETKT: 232-948102 · PNR: ADV26
                  </div>
                </div>

                {/* Compact Red Rubber Stamp */}
                <div className="pointer-events-none select-none border border-red-600 text-red-600 font-mono text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded -rotate-6 bg-red-50/70 shadow-2xs">
                  ★ CLEARED ★
                </div>
              </div>

              {/* Uçuş Parametre Tablosu (2x2 Grid) */}
              <div className="rounded-xl bg-white border border-slate-200 p-2 shadow-2xs">
                <div className="grid grid-cols-2 gap-1.5 text-center font-mono">
                  <div className="rounded bg-slate-50 p-1.5 border border-slate-200/90">
                    <div className="text-[7px] text-slate-400 uppercase">KAPI</div>
                    <div className="text-xs font-black text-blue-600">{dest.gate}</div>
                  </div>
                  <div className="rounded bg-slate-50 p-1.5 border border-slate-200/90">
                    <div className="text-[7px] text-slate-400 uppercase">KOLTUK</div>
                    <div className="text-xs font-black text-slate-900">{dest.seat}</div>
                  </div>
                  <div className="rounded bg-slate-50 p-1.5 border border-slate-200/90">
                    <div className="text-[7px] text-slate-400 uppercase">ROTA</div>
                    <div className="text-xs font-black text-blue-600">IST➔{dest.code}</div>
                  </div>
                  <div className="rounded bg-slate-50 p-1.5 border border-slate-200/90">
                    <div className="text-[7px] text-slate-400 uppercase">SEFER</div>
                    <div className="text-[10px] font-bold text-slate-700">{dest.flight}</div>
                  </div>
                </div>
              </div>

              {/* Biniş Durumu Rozeti */}
              <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 flex items-center justify-between text-[9px] font-mono shadow-2xs">
                <div className="flex items-center gap-1 font-bold text-emerald-600">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  <span>BOARDING NOW</span>
                </div>
                <span className="text-[8px] font-bold text-slate-400">ZONE 1</span>
              </div>

              {/* Discrete Demo Quick Fill Buttons */}
              <div className="border-t border-slate-200 pt-1.5">
                <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 mb-1">
                  <span>HIZLI TEST GİRİŞ:</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[9px] font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("harun@adviceyed.com");
                      setPassword("Password123!");
                    }}
                    className="rounded bg-white hover:bg-slate-100 py-1 text-slate-700 transition-colors border border-slate-200 shadow-2xs font-bold text-center"
                    title="Harun Teke (Yönetici)"
                  >
                    Harun
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("recep@adviceyed.com");
                      setPassword("Password123!");
                    }}
                    className="rounded bg-white hover:bg-slate-100 py-1 text-slate-700 transition-colors border border-slate-200 shadow-2xs text-center"
                    title="Recep Özdemir (Danışman)"
                  >
                    Recep
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("ipek@adviceyed.com");
                      setPassword("Password123!");
                    }}
                    className="rounded bg-white hover:bg-slate-100 py-1 text-slate-700 transition-colors border border-slate-200 shadow-2xs text-center"
                    title="İpek Zeynep Köken (Danışman)"
                  >
                    İpek
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("anil@adviceyed.com");
                      setPassword("Password123!");
                    }}
                    className="rounded bg-white hover:bg-slate-100 py-1 text-slate-700 transition-colors border border-slate-200 shadow-2xs text-center"
                    title="Anıl Solmaz (Öğrenci)"
                  >
                    Anıl
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


