// app/(auth)/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import {
  Plane,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  ArrowRight,
  Scissors,
  QrCode,
} from "lucide-react";
import { loginAction } from "@/lib/auth/actions";
import type { ActionResult } from "@/lib/auth/actions";
import { DemoLoginWidget } from "@/components/auth/DemoLoginWidget";

const DESTINATIONS = [
  {
    city: "NEW YORK",
    code: "JFK",
    country: "ABD",
    program: "Work & Travel USA",
    flight: "ADV-JFK26",
    gate: "04B",
    seat: "01A",
    boardingTime: "10:45",
    highlight: "Work & Travel · J-1 Programı",
  },
  {
    city: "LONDON",
    code: "LHR",
    country: "İNGİLTERE",
    program: "Akademi & Master (UK)",
    flight: "ADV-LON26",
    gate: "12A",
    seat: "02B",
    boardingTime: "14:20",
    highlight: "Lisans & Yüksek Lisans Programı",
  },
  {
    city: "DUBLIN",
    code: "DUB",
    country: "İRLANDA",
    program: "Dil Okulu & Çalışma",
    flight: "ADV-DUB26",
    gate: "03F",
    seat: "03A",
    boardingTime: "09:30",
    highlight: "Work & Study İrlanda",
  },
  {
    city: "LOS ANGELES",
    code: "LAX",
    country: "ABD",
    program: "Work & Travel USA",
    flight: "ADV-LAX26",
    gate: "08C",
    seat: "01F",
    boardingTime: "11:15",
    highlight: "California Yaz Dönemi",
  },
  {
    city: "MIAMI",
    code: "MIA",
    country: "ABD",
    program: "Work & Travel USA",
    flight: "ADV-MIA26",
    gate: "07A",
    seat: "01C",
    boardingTime: "16:40",
    highlight: "Florida Yaz Dönemi",
  },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl py-2.5 px-4 font-bold text-xs sm:text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-blue-700 hover:from-[#1e3a8a] hover:to-blue-600 text-white shadow-[0_6px_20px_rgba(30,58,138,0.3)] border border-sky-300/20"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-white" />
          <span>Giriş Yapılıyor…</span>
        </>
      ) : (
        <>
          <Plane className="h-4 w-4 text-sky-300" />
          <span>Uçuşa Geç (Giriş Yap)</span>
          <ArrowRight className="h-4 w-4 text-sky-200 ml-0.5" />
        </>
      )}
    </button>
  );
}

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
            className={`${i % 2 === 0 ? "bg-[#0f172a]" : "bg-transparent"} shrink-0`}
            style={{ width: `${width * 2}px` }}
          />
        ))}
      </div>
      <div className="flex justify-between font-mono text-[8px] text-slate-400 tracking-wider">
        <span>ETKT 232 948102938 1</span>
        <span>PNR: ADV-2026</span>
        <span className="hidden sm:inline">IATA // ADVICE</span>
        <span>BOARDING PASS</span>
      </div>
    </div>
  );
}

const initialState: ActionResult = { success: false, error: "" };

export default function StudentLoginPage() {
  const [state, formAction] = useFormState(loginAction, initialState);
  const [destIndex, setDestIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const t = setInterval(() => {
      setDestIndex((prev) => (prev + 1) % DESTINATIONS.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const dest = DESTINATIONS[destIndex];
  const hasError = !state.success && !!state.error;

  return (
    <div className="relative min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden selection:bg-[#0f172a] selection:text-white font-sans">
      {/* Atmospheric Backdrop */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
        <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-50"
          style={{
            background:
              "radial-gradient(circle at 40% 40%, rgba(30, 58, 138, 0.18) 0%, rgba(186, 230, 253, 0.15) 45%, rgba(248, 250, 252, 0) 70%)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:28px_28px] opacity-35" />
      </div>

      {/* ── THE BOARDING PASS ────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-4xl">
        <div className="rounded-2xl p-1 sm:p-1.5 bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#0f172a] shadow-[0_20px_50px_-15px_rgba(15,23,42,0.28)]">
          <div className="relative flex flex-col md:flex-row overflow-hidden rounded-xl bg-white border border-slate-200">
            {/* MAIN PASS (SOL BÖLÜM) */}
            <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 space-y-4 bg-white">
              {/* Top Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/advice-logo.svg"
                    alt="Advice Yurtdışı Eğitim"
                    className="h-8 sm:h-9 w-auto object-contain"
                  />
                  <div className="border-l border-slate-200 pl-3">
                    <div className="text-[9px] font-mono tracking-wider text-[#1e3a8a] font-bold uppercase flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#1e3a8a]" />
                      <span>BOARDING PASS</span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold tracking-tight text-[#0f172a]">
                      Öğrenci Portalı
                    </span>
                  </div>
                </div>

                {/* Gate & Seat Summary */}
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                  <span>
                    KAPI: <strong className="text-[#1e3a8a]">{dest.gate}</strong>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>
                    KOLTUK: <strong className="text-slate-900">{dest.seat}</strong>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-700 font-bold">{dest.boardingTime}</span>
                </div>
              </div>

              {/* Destination Route Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200/90 px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 text-xs sm:text-sm">
                    <span>IST</span>
                    <Plane className="h-3.5 w-3.5 text-[#1e3a8a] rotate-90" />
                    <span className="text-[#1e3a8a]">{dest.code}</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs font-semibold text-slate-700">{dest.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    {dest.program}
                  </span>
                  <span className="hidden sm:inline text-xs text-slate-400">·</span>
                  <span className="hidden sm:inline text-xs text-slate-500">
                    {dest.highlight}
                  </span>
                </div>
              </div>

              {/* Login Form */}
              <form action={formAction} className="space-y-3.5">
                {hasError && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                    <span>{state.error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* E-Posta Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
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
                        placeholder="ornek@eposta.com"
                        className="w-full rounded-lg bg-slate-50/70 hover:bg-white focus:bg-white py-2 pl-9 pr-3 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 border border-slate-300 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                      />
                    </div>
                  </div>

                  {/* Şifre Input */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700">
                        Şifre
                      </label>
                      <Link
                        href="/sifre-sifirla"
                        className="text-[11px] font-medium text-[#1e3a8a] hover:text-blue-900 hover:underline"
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
                        className="w-full rounded-lg bg-slate-50/70 hover:bg-white focus:bg-white py-2 pl-9 pr-3 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 border border-slate-300 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <SubmitButton />
              </form>

              {/* Bottom Barcode Band */}
              <LinearBarcodeStrip />
            </div>

            {/* PERFORATION DIVIDER */}
            <div className="relative flex md:flex-col items-center justify-between">
              <div className="hidden md:block w-0 h-full border-r-2 border-dashed border-slate-300" />
              <div className="block md:hidden w-full h-0 border-b-2 border-dashed border-slate-300" />
              <div className="absolute -top-3 md:-top-3.5 left-1/2 md:left-auto md:-right-3 -translate-x-1/2 md:translate-x-0 w-6 h-6 rounded-full bg-[#f8fafc] border border-slate-300 z-20 shadow-inner" />
              <div className="absolute -bottom-3 md:-bottom-3.5 left-1/2 md:left-auto md:-right-3 -translate-x-1/2 md:translate-x-0 w-6 h-6 rounded-full bg-[#f8fafc] border border-slate-300 z-20 shadow-inner" />
              <div className="hidden md:flex absolute top-1/2 -right-2.5 -translate-y-1/2 flex-col items-center gap-0.5 text-[7px] font-mono text-slate-400 z-10 select-none pointer-events-none">
                <Scissors className="h-3 w-3 text-slate-400 rotate-90" />
              </div>
            </div>

            {/* TEAR-OFF PASSENGER STUB (GERÇEK YOLCU KUPONU) */}
            <div className="relative md:w-60 flex flex-col justify-between p-4 bg-slate-50/90 border-t md:border-t-0 border-slate-200 space-y-3">
              <div className="flex items-start justify-between border-b border-slate-200 pb-2">
                <div>
                  <div className="text-[8px] font-mono font-extrabold text-[#1e3a8a] uppercase tracking-wider">
                    PASSENGER COUPON
                  </div>
                  <div className="text-xs font-mono font-black text-slate-900 uppercase">
                    YOLCU KUPONU
                  </div>
                  <div className="text-[9px] font-mono text-slate-400">
                    ADVICE · PNR: ADV26
                  </div>
                </div>

                <div className="pointer-events-none select-none border border-emerald-700 text-emerald-700 font-mono text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded -rotate-6 bg-emerald-50/80">
                  BOARDING
                </div>
              </div>

              {/* Flight Parameters */}
              <div className="rounded-xl bg-white border border-slate-200 p-2.5 shadow-2xs">
                <div className="grid grid-cols-2 gap-2 text-center font-mono">
                  <div className="rounded bg-slate-50 p-1.5 border border-slate-200/90">
                    <div className="text-[8px] text-slate-400 uppercase">KAPI</div>
                    <div className="text-xs font-black text-[#1e3a8a]">{dest.gate}</div>
                  </div>
                  <div className="rounded bg-slate-50 p-1.5 border border-slate-200/90">
                    <div className="text-[8px] text-slate-400 uppercase">KOLTUK</div>
                    <div className="text-xs font-black text-slate-900">{dest.seat}</div>
                  </div>
                  <div className="rounded bg-slate-50 p-1.5 border border-slate-200/90">
                    <div className="text-[8px] text-slate-400 uppercase">ROTA</div>
                    <div className="text-xs font-black text-[#1e3a8a]">IST➔{dest.code}</div>
                  </div>
                  <div className="rounded bg-slate-50 p-1.5 border border-slate-200/90">
                    <div className="text-[8px] text-slate-400 uppercase">SEFER</div>
                    <div className="text-[10px] font-bold text-slate-700">{dest.flight}</div>
                  </div>
                </div>
              </div>

              {/* Authentic Digital Boarding Pass Verification */}
              <div className="rounded-xl bg-white border border-slate-200 p-3 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <QrCode className="h-6 w-6 text-sky-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-800 truncate">
                    Dijital Biniş Kartı
                  </p>
                  <p className="text-[9px] text-slate-500 leading-snug">
                    Evrak, ödeme ve vize adımlarınızı panelden takip edebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discrete Dev-Only Demo Login Floating Pill (Remove before production) */}
      <DemoLoginWidget
        onSelectAccount={(demoEmail, demoPass) => {
          setEmail(demoEmail);
          setPassword(demoPass);
        }}
      />
    </div>
  );
}
