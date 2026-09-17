// app/(portal)/odemelerim/page.tsx
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatCurrency, isOverdue } from "@/lib/utils/currency";
import { formatDateShort } from "@/lib/utils/date";
import { CreditCard, CheckCircle2, AlertCircle, Clock, Building2, Copy } from "lucide-react";
import { PAYMENT_STATUS_LABELS } from "@/types/crm";

export const dynamic = "force-dynamic";

export default async function StudentPaymentsPage() {
  const authUser = await requireStudent();

  const student = await prisma.student.findUnique({
    where: { userId: authUser.id },
    include: {
      payments: {
        include: {
          installments: {
            orderBy: { sequence: "asc" },
          },
        },
      },
    },
  });

  if (!student) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        Öğrenci kaydınız bulunamadı.
      </div>
    );
  }

  // Calculate totals
  let totalAmount = 0;
  let paidAmount = 0;
  let currency = "USD";

  student.payments.forEach((payment) => {
    currency = payment.currency;
    totalAmount += parseFloat(payment.totalAmount.toString());
    payment.installments.forEach((inst) => {
      if (inst.isPaid) {
        paidAmount += parseFloat((inst.paidAmount ?? inst.amount).toString());
      }
    });
  });

  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ödemelerim & Taksit Planı</h1>
        <p className="text-xs text-gray-500 mt-1">
          Program ücretinizin ödeme detayları, taksit vadeleri ve banka hesap bilgilerimiz aşağıda yer almaktadır.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Toplam Program Ücreti</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(totalAmount, currency as any)}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 shadow-sm">
          <p className="text-xs font-medium text-emerald-800">Ödenen Tutar</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">
            {formatCurrency(paidAmount, currency as any)}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 shadow-sm">
          <p className="text-xs font-medium text-blue-800">Kalan Bakiye</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            {formatCurrency(remainingAmount, currency as any)}
          </p>
        </div>
      </div>

      {/* Installments Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">Taksit Planı</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Ödemelerinizi vadesinde gerçekleştirip dekontunuzu danışmanınıza iletiniz.
          </p>
        </div>

        {student.payments.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            Kayıtlı ödeme planınız bulunmamaktadır.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {student.payments.map((payment) => (
              <div key={payment.id} className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">{payment.description}</h3>
                    <p className="text-xs text-gray-500">
                      Tutar: {formatCurrency(payment.totalAmount.toString(), payment.currency)}
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                    {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500">
                        <th className="py-2.5 px-4 text-left font-semibold">Taksit</th>
                        <th className="py-2.5 px-4 text-left font-semibold">Tutar</th>
                        <th className="py-2.5 px-4 text-left font-semibold">Vade Tarihi</th>
                        <th className="py-2.5 px-4 text-left font-semibold">Durum</th>
                        <th className="py-2.5 px-4 text-left font-semibold">Ödeme Tarihi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700">
                      {payment.installments.map((inst) => {
                        const overdue = isOverdue(inst.dueDate, inst.isPaid);

                        return (
                          <tr key={inst.id} className="hover:bg-gray-50/50">
                            <td className="py-3 px-4 font-semibold">{inst.sequence}. Taksit</td>
                            <td className="py-3 px-4 font-bold text-gray-900">
                              {formatCurrency(inst.amount.toString(), inst.currency)}
                            </td>
                            <td className="py-3 px-4">{formatDateShort(inst.dueDate)}</td>
                            <td className="py-3 px-4">
                              {inst.isPaid ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                                  <CheckCircle2 className="h-3 w-3" /> Ödendi
                                </span>
                              ) : overdue ? (
                                <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded-full font-semibold">
                                  <AlertCircle className="h-3 w-3" /> Gecikmiş
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold">
                                  <Clock className="h-3 w-3" /> Ödenmedi
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-gray-400">
                              {inst.paidAt ? formatDateShort(inst.paidAt) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Official Bank Account Details / IBAN Box */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-blue-900">
          <Building2 className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-bold">Resmi Banka Hesap Bilgilerimiz</h3>
        </div>
        <p className="text-xs text-blue-800/80 mb-4 leading-relaxed">
          Havale veya EFT açıklamasına mutlaka <strong>Ad Soyad ve Kayıt Numaranızı ({student.id.slice(0, 8).toUpperCase()})</strong> yazınız.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl bg-white p-4 border border-blue-100 shadow-xs">
            <p className="font-semibold text-gray-500">USD Hesabı (Dolar)</p>
            <p className="font-bold text-gray-900 mt-1">Garanti BBVA - Şişli Şubesi</p>
            <p className="text-gray-600 mt-0.5">Alıcı: Advice Yurtdışı Eğitim Ltd. Şti.</p>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-gray-50 p-2 font-mono text-[11px] text-gray-800">
              <span>TR12 0006 2000 0001 2345 6789 01</span>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 border border-blue-100 shadow-xs">
            <p className="font-semibold text-gray-500">TRY Hesabı (Türk Lirası)</p>
            <p className="font-bold text-gray-900 mt-1">Garanti BBVA - Şişli Şubesi</p>
            <p className="text-gray-600 mt-0.5">Alıcı: Advice Yurtdışı Eğitim Ltd. Şti.</p>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-gray-50 p-2 font-mono text-[11px] text-gray-800">
              <span>TR98 0006 2000 0001 2345 6789 02</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
