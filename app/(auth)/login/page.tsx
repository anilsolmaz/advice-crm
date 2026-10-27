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
  Building2,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { loginAction } from "@/lib/auth/actions";
import type { ActionResult } from "@/lib/auth/actions";

const DESTINATIONS = [
  {
    city: "NEW YORK",
    code: "JFK",
    country: "ABD",
    program: "Work & Travel USA",
    flight: "BPX-JFK26",
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
    flight: "BPX-LON26",
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
    flight: "BPX-DUB26",
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
    flight: "BPX-LAX26",
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
    flight: "BPX-MIA26",
    gate: "07A",
    seat: "01C",
    mileage: "5,980 MILES",
    boardingTime: "16:40 PM",
    highlight: "Florida Lüks Otel & Havuz İşleri (Bahşişli)",
  },
];

function SubmitButton({ mode }: { mode: "student" | "staff" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`
        w-full rounded-xl py-2.5 px-4 font-black text-xs sm:text-sm uppercase tracking-wider
        transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer
        disabled:opacity-50 disabled:pointer-events-none
        ${
          mode === "student"
            ? "bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-blue-700 hover:from-[#1e3a8a] hover:to-blue-600 text-white shadow-[0_6px_20px_rgba(30,58,138,0.35)] border border-sky-300/30"
            : "bg-[#0f172a] hover:bg-slate-800 text-white shadow-lg border border-slate-700"
        }
      `}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-white" />
          <span>{mode === "student" ? "BİNİŞ ONAYLANIYOR…" : "OTURUM AÇILIYOR…"}</span>
        </>
      ) : mode === "student" ? (
        <>
          <Plane className="h-4 w-4 text-sky-300" />
          <span>UÇUŞA GEÇ / BİNİŞİ ONAYLA (ÖĞRENCİ)</span>
          <ArrowRight className="h-4 w-4 text-sky-200 ml-0.5" />
        </>
      ) : (
        <>
          <ShieldCheck className="h-4 w-4 text-sky-400" />
          <span>BACKPAX KURUMSAL PANEL GİRİŞİ</span>
          <ArrowRight className="h-4 w-4 text-slate-300 ml-0.5" />
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
        <span>PNR: BPX-2026-OK</span>
        <span className="hidden sm:inline">IATA // BACKPAX</span>
        <span>ELECTRONIC TICKET</span>
      </div>
    </div>
  );
}

const initialState: ActionResult = { success: false, error: "" };

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, initialState);
  const [loginMode, setLoginMode] = useState<"student" | "staff">("staff");
  const [destIndex, setDestIndex] = useState(0);
  const [email, setEmail] = useState("harun@adviceyed.com");
  const [password, setPassword] = useState("Password123!");

  useEffect(() => {
    const t = setInterval(() => {
      setDestIndex((prev) => (prev + 1) % DESTINATIONS.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const dest = DESTINATIONS[destIndex];
  const hasError = !state.success && !!state.error;

  function switchMode(mode: "student" | "staff") {
    setLoginMode(mode);
    if (mode === "student") {
      setEmail("anil@adviceyed.com");
      setPassword("Password123!");
    } else {
      setEmail("harun@adviceyed.com");
      setPassword("Password123!");
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden selection:bg-[#0f172a] selection:text-white font-sans">
      {/* Atmospheric Backdrop */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
        <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-50"
          style={{
            background:
              "radial-gradient(circle at 40% 40%, rgba(30, 58, 138, 0.25) 0%, rgba(186, 230, 253, 0.25) 45%, rgba(248, 250, 252, 0) 70%)",
            filter: "blur(60px)",
          }}
        />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-slate-200/70 blur-[90px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:28px_28px] opacity-35" />
      </div>

      {/* ── DUAL LOGIN MODE SWITCHER (ÖĞRENCİ vs KURUMSAL EKİP) ──────────────── */}
      <div className="relative z-10 mb-4 flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-md border border-slate-200">
        <button
          type="button"
          onClick={() => switchMode("student")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
            loginMode === "student"
              ? "bg-[#0f172a] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <GraduationCap className="h-4 w-4 text-sky-400" />
          Öğrenci Girişi (Boarding Pass)
        </button>
        <button
          type="button"
          onClick={() => switchMode("staff")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
            loginMode === "staff"
              ? "bg-[#0f172a] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Building2 className="h-4 w-4 text-sky-400" />
          Kurumsal Ekip Girişi (CRM)
        </button>
      </div>

      {/* ── THE COMPACT WIDESCREEN BOARDING PASS / CORPORATE PORTAL ──────────── */}
      <div className="relative z-10 w-full max-w-4xl">
        <div className="rounded-2xl p-1 sm:p-1.5 bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#0f172a] shadow-[0_20px_50px_-15px_rgba(15,23,42,0.28)]">
          <div className="relative flex flex-col md:flex-row overflow-hidden rounded-xl bg-white border border-slate-200">
            {/* MAIN PASS (SOL BÖLÜM) */}
            <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 space-y-3.5 bg-white">
              {/* Top Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-white p-1 shadow-2xs border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/backpax-logo.svg"
                      alt="BackPax Global Education"
                      className="h-7 w-auto object-contain"
                    />
                  </div>
                  <div>
                    <div className="text-[9px] font-mono tracking-wider text-[#1e3a8a] font-bold uppercase flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#1e3a8a] animate-ping" />
                      <span>
                        {loginMode === "student"
                          ? "STUDENT BOARDING PASS · 2026"
                          : "CORPORATE OPERATIONS & CRM · 2026"}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-black tracking-tight text-[#0f172a] uppercase">
                      BACKPAX GLOBAL EDUCATION &amp; TRAVEL
                    </span>
                  </div>
                </div>

                {/* Telemetry Gate & Seat Badge */}
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                  {loginMode === "student" ? (
                    <>
                      <span>
                        KAPI: <strong className="text-[#1e3a8a]">{dest.gate}</strong>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>
                        KOLTUK: <strong className="text-slate-900">{dest.seat}</strong>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-emerald-700 font-bold">{dest.boardingTime}</span>
                    </>
                  ) : (
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-[#0f172a]">
                      YÖNETİCİ · DANIŞMAN · MUHASEBE
                    </span>
                  )}
                </div>
              </div>

              {/* Dynamic Program / Mode Showcase */}
              {loginMode === "student" ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200/90 px-3.5 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 font-mono font-bold text-slate-900 text-xs sm:text-sm">
                      <span>IST</span>
                      <Plane className="h-3.5 w-3.5 text-[#1e3a8a] rotate-90" />
                      <span className="text-[#1e3a8a]">{dest.code}</span>
                    </div>
                    <span className="text-slate-300">|</span>
                    <span className="text-xs font-medium text-slate-600">{dest.city}</span>
                  </div>
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
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#0f172a] text-white px-4 py-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <Building2 className="h-4 w-4 text-sky-400" />
                    <span>BackPax Kurumsal Yönetim Paneli</span>
                  </div>
                  <span className="text-[11px] text-slate-300">
                    Lead Takibi · İş Havuzu · Okul Başvuruları · Grup Vize · Muhasebe
                  </span>
                </div>
              )}

              {/* Direct Integrated Login Form */}
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
                      {loginMode === "student" ? "Öğrenci E-Posta Adresi" : "Kurumsal E-Posta Adresi"}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={
                          loginMode === "student" ? "ogrenci@backpax.com" : "isim@adviceyed.com"
                        }
                        className="w-full rounded-lg bg-slate-50/70 hover:bg-white focus:bg-white py-2 pl-9 pr-3 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 border border-slate-300 shadow-2xs focus:border-[#0f172a] focus:outline-none focus:ring-3 focus:ring-slate-200 transition-all"
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
                        className="text-[10px] font-medium text-[#1e3a8a] hover:text-blue-900 underline"
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
                        className="w-full rounded-lg bg-slate-50/70 hover:bg-white focus:bg-white py-2 pl-9 pr-3 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 border border-slate-300 shadow-2xs focus:border-[#0f172a] focus:outline-none focus:ring-3 focus:ring-slate-200 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <SubmitButton mode={loginMode} />
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

            {/* TEAR-OFF PASSENGER STUB (SAĞ KUPON & HIZLI DEMO GİRİŞLERİ) */}
            <div className="relative md:w-60 flex flex-col justify-between p-3.5 sm:p-4 bg-slate-50/90 border-t md:border-t-0 border-slate-200 space-y-2.5">
              <div className="flex items-start justify-between border-b border-slate-200 pb-1.5">
                <div>
                  <div className="text-[8px] font-mono font-extrabold text-[#1e3a8a] uppercase tracking-wider">
                    {loginMode === "student" ? "PASSENGER COUPON" : "STAFF ACCESS PASS"}
                  </div>
                  <div className="text-xs font-mono font-black text-slate-900 uppercase">
                    {loginMode === "student" ? "YOLCU KUPONU" : "YETKİLİ KARTI"}
                  </div>
                  <div className="text-[8px] font-mono text-slate-400">
                    BACKPAX · PNR: BPX26
                  </div>
                </div>

                <div className="pointer-events-none select-none border border-emerald-700 text-emerald-700 font-mono text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded -rotate-6 bg-emerald-50/80 shadow-2xs">
                  ★ VERIFIED ★
                </div>
              </div>

              {/* Uçuş / Sistem Parametre Tablosu */}
              <div className="rounded-xl bg-white border border-slate-200 p-2 shadow-2xs">
                <div className="grid grid-cols-2 gap-1.5 text-center font-mono">
                  <div className="rounded bg-slate-50 p-1.5 border border-slate-200/90">
                    <div className="text-[7px] text-slate-400 uppercase">KAPI</div>
                    <div className="text-xs font-black text-[#1e3a8a]">{dest.gate}</div>
                  </div>
                  <div className="rounded bg-slate-50 p-1.5 border border-slate-200/90">
                    <div className="text-[7px] text-slate-400 uppercase">KOLTUK</div>
                    <div className="text-xs font-black text-slate-900">{dest.seat}</div>
                  </div>
                  <div className="rounded bg-slate-50 p-1.5 border border-slate-200/90">
                    <div className="text-[7px] text-slate-400 uppercase">ROTA</div>
                    <div className="text-xs font-black text-[#1e3a8a]">IST➔{dest.code}</div>
                  </div>
                  <div className="rounded bg-slate-50 p-1.5 border border-slate-200/90">
                    <div className="text-[7px] text-slate-400 uppercase">SEFER</div>
                    <div className="text-[10px] font-bold text-slate-700">{dest.flight}</div>
                  </div>
                </div>
              </div>

              {/* Demo Quick Fill Buttons */}
              <div className="border-t border-slate-200 pt-1.5">
                <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 mb-1.5">
                  <span>HIZLI DEMO GİRİŞİ SEÇİN:</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[9px] font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode("staff");
                      setEmail("harun@adviceyed.com");
                      setPassword("Password123!");
                    }}
                    className="rounded bg-[#0f172a] text-white hover:bg-slate-800 py-1.5 px-2 transition-colors font-bold text-left flex items-center justify-between"
                  >
                    <span>Harun</span>
                    <span className="text-[7px] text-sky-300">YÖNETİCİ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode("staff");
                      setEmail("muhasebe@adviceyed.com");
                      setPassword("Password123!");
                    }}
                    className="rounded bg-white hover:bg-slate-100 py-1.5 px-2 text-slate-800 transition-colors border border-slate-200 font-bold text-left flex items-center justify-between"
                  >
                    <span>Selim</span>
                    <span className="text-[7px] text-emerald-700">MUHASEBE</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode("staff");
                      setEmail("recep@adviceyed.com");
                      setPassword("Password123!");
                    }}
                    className="rounded bg-white hover:bg-slate-100 py-1.5 px-2 text-slate-700 transition-colors border border-slate-200 text-left flex items-center justify-between"
                  >
                    <span>Recep</span>
                    <span className="text-[7px] text-blue-600">DANIŞMAN</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode("staff");
                      setEmail("ipek@adviceyed.com");
                      setPassword("Password123!");
                    }}
                    className="rounded bg-white hover:bg-slate-100 py-1.5 px-2 text-slate-700 transition-colors border border-slate-200 text-left flex items-center justify-between"
                  >
                    <span>İpek</span>
                    <span className="text-[7px] text-blue-600">DANIŞMAN</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode("student");
                      setEmail("anil@adviceyed.com");
                      setPassword("Password123!");
                    }}
                    className="col-span-2 rounded bg-blue-50 hover:bg-blue-100 py-1.5 px-2 text-[#1e3a8a] transition-colors border border-blue-200 font-bold flex items-center justify-between"
                  >
                    <span>🎓 Anıl Solmaz (Öğrenci Portalı)</span>
                    <span className="text-[8px] uppercase">Boarding Pass</span>
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
