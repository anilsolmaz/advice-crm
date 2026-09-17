// components/crm/students/modal/tabs/PaymentsTab.tsx
"use client";

import { useTransition } from "react";
import { Check, Clock, AlertCircle } from "lucide-react";
import type { CRMPayment, CRMInstallment } from "@/types/crm";
import { PAYMENT_STATUS_LABELS, CURRENCY_SYMBOLS } from "@/types/crm";
import { toggleInstallmentPaid } from "@/actions/crm/students";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateShort, isOverdue } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

interface Props {
  payments: CRMPayment[];
  studentId: string;
}

export function PaymentsTab({ payments, studentId }: Props) {
  const [isPending, startTransition] = useTransition();

  const totalByCurrency = payments.reduce(
    (acc, p) => {
      acc[p.currency] = (acc[p.currency] ?? 0) + parseFloat(p.totalAmount);
      return acc;
    },
    {} as Record<string, number>,
  );

  function handleToggle(installmentId: string, current: boolean) {
    startTransition(() => {
      toggleInstallmentPaid(installmentId, !current);
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Summary cards ───────────────────────────────────────── */}
      {Object.keys(totalByCurrency).length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(totalByCurrency).map(([currency, total]) => (
            <div key={currency} className="rounded-xl border border-gray-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
              <p className="text-xs font-medium text-gray-500">Toplam ({currency})</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS]}
                {total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Payment plans ───────────────────────────────────────── */}
      {payments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="h-12 w-12 text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">Henüz ödeme planı oluşturulmamış.</p>
        </div>
      )}

      {payments.map((payment) => (
        <div key={payment.id} className="rounded-xl border border-gray-100 bg-white overflow-hidden">
          {/* Payment header */}
          <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">{payment.description}</p>
              <p className="text-xs text-gray-500">
                Toplam: {formatCurrency(payment.totalAmount, payment.currency)}
              </p>
            </div>
            <span className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              payment.status === "PAID" ? "bg-emerald-100 text-emerald-700" :
              payment.status === "OVERDUE" ? "bg-red-100 text-red-700" :
              "bg-amber-100 text-amber-700"
            )}>
              {PAYMENT_STATUS_LABELS[payment.status]}
            </span>
          </div>

          {/* Installments table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">#</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Tutar</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Vade Tarihi</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Durum</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payment.installments.map((inst) => {
                const overdue = isOverdue(inst.dueDate, inst.isPaid);
                return (
                  <tr key={inst.id} className={cn("transition-colors", overdue && "bg-red-50/50")}>
                    <td className="px-4 py-2.5 text-gray-500">{inst.sequence}.</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">
                      {formatCurrency(inst.amount, inst.currency)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {formatDateShort(inst.dueDate)}
                    </td>
                    <td className="px-4 py-2.5">
                      {inst.isPaid ? (
                        <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                          <Check className="h-3.5 w-3.5" /> Ödendi
                        </span>
                      ) : overdue ? (
                        <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
                          <AlertCircle className="h-3.5 w-3.5" /> Gecikmiş
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Beklemede</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => handleToggle(inst.id, inst.isPaid)}
                        disabled={isPending}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                          inst.isPaid
                            ? "border border-gray-200 text-gray-500 hover:bg-gray-50"
                            : "bg-emerald-600 text-white hover:bg-emerald-700",
                        )}
                      >
                        {inst.isPaid ? "Geri Al" : "Ödendi İşaretle"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
