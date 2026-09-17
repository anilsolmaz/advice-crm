"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { passwordResetAction, type ActionResult } from "@/lib/auth/actions";

const initialState: ActionResult = { success: true };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="
        w-full relative overflow-hidden rounded-2xl bg-white px-5 py-3.5
        text-sm font-semibold text-black transition-all duration-300
        hover:bg-slate-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
        shadow-lg shadow-white/5
      "
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {pending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
            <span>İstek Gönderiliyor…</span>
          </>
        ) : (
          <>
            <span>Sıfırlama Bağlantısı Gönder</span>
          </>
        )}
      </span>
    </button>
  );
}

export default function SifreSifirlaPage() {
  const [state, formAction] = useFormState(passwordResetAction, initialState);

  const hasError = !state.success && "error" in state && Boolean(state.error);
  const isSubmitted = state.success && !hasError && Object.keys(state).length > 0;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#030712] text-white flex flex-col justify-center items-center px-4 font-sans selection:bg-white selection:text-black">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-900/30 via-slate-900/10 to-transparent" />

      <div className="relative z-10 w-full max-w-md">
        {/* Back button */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Giriş Ekranına Dön
        </Link>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-2xl shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Mail className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-white">
              Şifrenizi mi Unuttunuz?
            </h1>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Kayıtlı kurumsal e-posta adresinizi girin. Size güvenli bir şifre sıfırlama bağlantısı ileteceğiz.
            </p>
          </div>

          {hasError && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{state.error}</span>
            </div>
          )}

          {isSubmitted && !hasError && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-300">
              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-200">Bağlantı Gönderildi</p>
                <p className="mt-1 text-emerald-300/90 leading-relaxed">
                  Şifre yenileme talimatları e-posta adresinize gönderildi. Lütfen gelen kutunuzu (ve spam klasörünü) kontrol edin.
                </p>
              </div>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                E-Posta Adresi
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="ad.soyad@advice.com.tr"
                className="
                  w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5
                  text-sm text-white placeholder-slate-600 outline-none transition-all duration-300
                  focus:border-white/30 focus:bg-white/[0.06] focus:ring-1 focus:ring-white/20
                "
              />
            </div>

            <SubmitButton />
          </form>
        </div>

        <div className="mt-6 text-center text-[11px] font-mono text-slate-600">
          ADVICE YURTDIŞI EĞİTİM & DANIŞMANLIK · SECURITY GATEWAY
        </div>
      </div>
    </div>
  );
}
