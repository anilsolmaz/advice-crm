// app/(auth)/kurumsal-giris/page.tsx
"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import {
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { loginAction } from "@/lib/auth/actions";
import type { ActionResult } from "@/lib/auth/actions";
import { DemoLoginWidget } from "@/components/auth/DemoLoginWidget";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl py-2.5 px-4 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none bg-[#0f172a] hover:bg-slate-800 text-white shadow-md"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-white" />
          <span>Giriş Yapılıyor…</span>
        </>
      ) : (
        <>
          <span>Giriş Yap</span>
          <ArrowRight className="h-4 w-4 text-slate-300" />
        </>
      )}
    </button>
  );
}

const initialState: ActionResult = { success: false, error: "" };

export default function CorporateLoginPage() {
  const [state, formAction] = useFormState(loginAction, initialState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const hasError = !state.success && !!state.error;

  return (
    <div className="relative min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-4 font-sans">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
        <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle at 40% 40%, rgba(56, 189, 248, 0.2) 0%, rgba(30, 58, 138, 0.2) 45%, rgba(15, 23, 42, 0) 70%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
        <div className="flex flex-col items-center text-center space-y-3 border-b border-slate-100 pb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/advice-logo.svg"
            alt="Advice Yurtdışı Eğitim"
            className="h-10 w-auto object-contain"
          />
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-0.5 text-[11px] font-semibold text-slate-700">
              <ShieldCheck className="h-3.5 w-3.5 text-[#1e3a8a]" />
              <span>Kurumsal Yönetim &amp; Danışman Paneli</span>
            </div>
          </div>
        </div>

        <form action={formAction} className="space-y-4">
          {hasError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{state.error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Kurumsal E-Posta
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="isim@adviceyed.com"
                className="w-full rounded-lg bg-slate-50 hover:bg-white focus:bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 border border-slate-300 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Şifre
              </label>
              <Link
                href="/sifre-sifirla"
                className="text-xs font-medium text-[#1e3a8a] hover:underline"
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
                className="w-full rounded-lg bg-slate-50 hover:bg-white focus:bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 border border-slate-300 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
              />
            </div>
          </div>

          <SubmitButton />
        </form>
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
