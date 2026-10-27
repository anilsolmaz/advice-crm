// components/auth/DemoLoginWidget.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical, ChevronUp, ChevronDown, ExternalLink } from "lucide-react";

interface DemoLoginWidgetProps {
  onSelectAccount: (email: string, password: string) => void;
}

const DEMO_ACCOUNTS = [
  {
    label: "Anıl Solmaz",
    roleBadge: "ÖĞRENCİ",
    email: "anil@adviceyed.com",
    password: "Password123!",
    color: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  },
  {
    label: "Harun Teke",
    roleBadge: "YÖNETİCİ",
    email: "harun@adviceyed.com",
    password: "Password123!",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  {
    label: "Recep Özdemir",
    roleBadge: "DANIŞMAN",
    email: "recep@adviceyed.com",
    password: "Password123!",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  {
    label: "İpek Aydın",
    roleBadge: "DANIŞMAN",
    email: "ipek@adviceyed.com",
    password: "Password123!",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  {
    label: "Selim Kaya",
    roleBadge: "MUHASEBE",
    email: "muhasebe@adviceyed.com",
    password: "Password123!",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
];

export function DemoLoginWidget({ onSelectAccount }: DemoLoginWidgetProps) {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const isCorporatePage = pathname === "/kurumsal-giris";

  return (
    <div className="fixed bottom-3 right-3 z-50 font-sans select-none">
      {open ? (
        <div className="w-64 rounded-2xl bg-[#0f172a] text-white p-3 shadow-xl border border-slate-700/80">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
              <FlaskConical className="h-3.5 w-3.5" />
              <span>Geliştirici Demo Giriş</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              title="Küçült"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => onSelectAccount(acc.email, acc.password)}
                className="flex w-full items-center justify-between rounded-lg bg-slate-800/70 hover:bg-slate-700/90 px-2.5 py-1.5 text-left text-xs transition-colors"
              >
                <span className="font-semibold text-slate-100">{acc.label}</span>
                <span
                  className={`rounded border px-1.5 py-0.5 text-[9px] font-mono font-bold ${acc.color}`}
                >
                  {acc.roleBadge}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            {isCorporatePage ? (
              <Link
                href="/login"
                className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-medium"
              >
                <span>Öğrenci Giriş Sayfası</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            ) : (
              <Link
                href="/kurumsal-giris"
                className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-medium"
              >
                <span>Danışman Giriş Sayfası</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
            <span className="text-[9px] text-slate-500 font-mono">DEV ONLY</span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-[#0f172a] hover:bg-slate-800 text-white px-3.5 py-2 text-xs font-bold shadow-lg border border-slate-700"
        >
          <FlaskConical className="h-3.5 w-3.5 text-sky-400" />
          <span>Demo Giriş</span>
          <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
        </button>
      )}
    </div>
  );
}
