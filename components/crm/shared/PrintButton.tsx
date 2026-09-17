// components/crm/shared/PrintButton.tsx
"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Yazdır / PDF Olarak Kaydet" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-md"
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
